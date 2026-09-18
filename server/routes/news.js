const express = require("express");
const router = express.Router();

const GROUP_LABELS = {
  processor: "處理器",
  network: "網卡模組",
  memory: "記憶體 & 固態硬碟",
  packaging: "封測",
  wafer: "晶圓",
};

// Bing 新聞 RSS 不支援「OR」多關鍵字合併查詢，所以每個關鍵字要分開查，
// 結果合併後再去重
const GROUP_KEYWORDS = {
  processor: ["處理器", "CPU", "英特爾", "AMD", "輝達", "Nvidia", "Intel"],
  network: ["網卡晶片", "網通晶片", "交換器晶片", "光通訊模組", "Marvell", "Broadcom"],
  memory: ["記憶體", "DRAM", "NAND", "固態硬碟", "SK海力士", "美光"],
  packaging: ["半導體封測", "先進封裝", "CoWoS", "日月光", "矽品"],
  wafer: ["晶圓代工", "台積電", "聯電", "三星晶圓"],
};

const NEW_PRODUCT_KEYWORDS = ["發表", "推出", "亮相", "上市", "發布", "問世", "量產", "首發"];
const SUPPLY_DEMAND_KEYWORDS = ["缺貨", "供應", "需求", "庫存", "產能", "缺口", "漲價", "拉貨", "訂單", "稼動率"];
const STOCK_KEYWORDS = [
  "股價", "股票", "股市", "大漲", "大跌", "收盤", "開盤", "盤中", "ADR",
  "台股", "美股", "漲停", "跌停", "市值", "本益比", "法人", "外資",
];

function classifyType(title) {
  if (NEW_PRODUCT_KEYWORDS.some((k) => title.includes(k))) return "new-product";
  if (SUPPLY_DEMAND_KEYWORDS.some((k) => title.includes(k))) return "supply-demand";
  if (STOCK_KEYWORDS.some((k) => title.includes(k))) return "stock-analysis";
  return "market-analysis";
}

// 標題可能同時出現多個群組的關鍵字（例如 Broadcom 的新聞標題也提到輝達），
// 用固定優先順序重新判斷最終歸屬的群組，而不是只看是被哪個群組的查詢抓到的
const GROUP_PRIORITY = ["processor", "wafer", "memory", "packaging", "network"];

function detectFinalGroup(title, originGroup) {
  for (const g of GROUP_PRIORITY) {
    if (GROUP_KEYWORDS[g].some((k) => title.includes(k))) return g;
  }
  return originGroup;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, "");
}

function cleanText(str) {
  return stripHtml(decodeEntities(str || "")).trim();
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = (block.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1];
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [, ""])[1];
    const description = (block.match(/<description>([\s\S]*?)<\/description>/) || [, ""])[1];
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [, ""])[1];
    items.push({ title, link, description, pubDate });
  }
  return items;
}

function extractRealUrl(bingLink) {
  try {
    const linkUrl = new URL(decodeEntities(bingLink));
    const real = linkUrl.searchParams.get("url");
    return real ? decodeURIComponent(real) : bingLink;
  } catch {
    return bingLink;
  }
}

function sourceNameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "未知來源";
  }
}

async function fetchKeywordNews(group, keyword) {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(keyword)}&format=rss&setlang=zh-tw&cc=TW`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Bing 新聞錯誤（${keyword}）：${res.status}`);
  const xml = await res.text();
  const items = parseRssItems(xml);

  return items.map((item) => {
    const title = cleanText(item.title);
    const realUrl = extractRealUrl(item.link);
    const date = item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : "";
    return {
      group,
      type: classifyType(title),
      title,
      summary: cleanText(item.description) || "（Bing 新聞未提供摘要，點擊可查看原始報導全文）",
      date,
      source: `${sourceNameFromUrl(realUrl)}（Bing 新聞，分類為關鍵字比對，可能不完全準確）`,
      url: realUrl,
      isDemo: false,
    };
  });
}

async function fetchGroupNews(group) {
  const keywords = GROUP_KEYWORDS[group];
  const settled = await Promise.allSettled(keywords.map((k) => fetchKeywordNews(group, k)));

  const merged = [];
  settled.forEach((outcome) => {
    if (outcome.status === "fulfilled") merged.push(...outcome.value);
  });
  if (merged.length === 0 && settled.every((s) => s.status === "rejected")) {
    throw settled[0].reason;
  }

  return merged;
}

router.get("/", async (req, res) => {
  const groups = Object.keys(GROUP_LABELS);
  const results = { news: [], errors: [] };

  const settled = await Promise.allSettled(groups.map((group) => fetchGroupNews(group)));
  const allItems = [];
  settled.forEach((outcome, i) => {
    const group = groups[i];
    if (outcome.status === "fulfilled") {
      allItems.push(...outcome.value);
    } else {
      results.errors.push(`${GROUP_LABELS[group]}新聞：${outcome.reason.message}`);
    }
  });

  // 同一篇新聞可能被多個群組/關鍵字查詢重複抓到，且轉址網址常帶有不同的追蹤參數，
  // 光比對網址攔不住重複，改成比對標題（去除空白後）來跨群組去重，
  // 再依標題重新判斷最終該歸屬的群組
  const seen = new Set();
  const deduped = allItems.filter((item) => {
    const key = item.title.replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.forEach((item) => {
    item.group = detectFinalGroup(item.title, item.group);
  });

  deduped.sort((a, b) => (a.date < b.date ? 1 : -1));
  deduped.forEach((item, i) => {
    item.id = `${item.group}-${i}-${Date.now()}`;
  });

  results.news = deduped;
  res.json(results);
});

module.exports = router;

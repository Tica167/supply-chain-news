const express = require("express");
const router = express.Router();

const GROUP_LABELS = {
  processor: "處理器",
  network: "網卡模組",
  memory: "記憶體 & 固態硬碟",
  packaging: "封測",
  wafer: "晶圓",
};

// Google 新聞 RSS 搜尋查詢（中文關鍵字，OR 語法與 Google 搜尋相同）
const GROUP_QUERIES = {
  processor: "處理器 OR CPU OR 英特爾 OR AMD OR 輝達 Nvidia",
  network: "網卡晶片 OR 網通晶片 OR 交換器晶片 OR 光通訊模組 OR Marvell OR Broadcom",
  memory: "記憶體 OR DRAM OR NAND OR 固態硬碟 OR SSD OR 三星記憶體 OR SK海力士 OR 美光",
  packaging: "半導體封測 OR 先進封裝 OR CoWoS OR 日月光 OR 矽品",
  wafer: "晶圓代工 OR 台積電 OR 聯電 OR 三星晶圓",
};

const NEW_PRODUCT_KEYWORDS = ["發表", "推出", "亮相", "上市", "發布", "問世", "量產", "首發"];
const SUPPLY_DEMAND_KEYWORDS = ["缺貨", "供應", "需求", "庫存", "產能", "缺口", "漲價", "拉貨", "訂單", "稼動率"];

function classifyType(title) {
  if (NEW_PRODUCT_KEYWORDS.some((k) => title.includes(k))) return "new-product";
  if (SUPPLY_DEMAND_KEYWORDS.some((k) => title.includes(k))) return "supply-demand";
  return "market-analysis";
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = decodeEntities((block.match(/<title>([\s\S]*?)<\/title>/) || [, ""])[1]);
    const link = (block.match(/<link>([\s\S]*?)<\/link>/) || [, ""])[1];
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [, ""])[1];
    const source = decodeEntities((block.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [, ""])[1]);
    items.push({ title, link, pubDate, source });
  }
  return items;
}

function cleanTitle(title, source) {
  // Google 新聞標題結尾固定是「- 來源」，用已知的來源名稱精確比對移除，
  // 避免用通用規則誤砍標題內文本身就有的「- 」片語
  const suffix = `- ${source}`;
  if (title.endsWith(suffix)) {
    return title.slice(0, -suffix.length).replace(/\s*-\s*$/, "").trim();
  }
  return title.trim();
}

async function fetchGroupNews(group) {
  const query = encodeURIComponent(GROUP_QUERIES[group]);
  const url = `https://news.google.com/rss/search?q=${query}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Google 新聞錯誤：${res.status}`);
  const xml = await res.text();
  const items = parseRssItems(xml).slice(0, 8);

  return items.map((item, i) => {
    const title = cleanTitle(item.title, item.source);
    const date = item.pubDate ? new Date(item.pubDate).toISOString().slice(0, 10) : "";
    return {
      id: `${group}-${i}-${Date.now()}`,
      group,
      type: classifyType(title),
      title,
      summary: "（Google 新聞標題擷取，點擊可查看原始報導全文）",
      date,
      source: `${item.source || "未知來源"}（Google 新聞，分類為關鍵字比對，可能不完全準確）`,
      url: item.link,
      isDemo: false,
    };
  });
}

router.get("/", async (req, res) => {
  const groups = Object.keys(GROUP_LABELS);
  const results = { news: [], errors: [] };

  const settled = await Promise.allSettled(groups.map((group) => fetchGroupNews(group)));
  settled.forEach((outcome, i) => {
    const group = groups[i];
    if (outcome.status === "fulfilled") {
      results.news.push(...outcome.value);
    } else {
      results.errors.push(`${GROUP_LABELS[group]}新聞：${outcome.reason.message}`);
    }
  });

  res.json(results);
});

module.exports = router;

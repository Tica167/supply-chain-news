const express = require("express");
const AdmZip = require("adm-zip");
const https = require("https");
const router = express.Router();

// ws.dgbas.gov.tw 的憑證鏈結不完整，Node 內建 fetch 會嚴格拒絕（UNABLE_TO_VERIFY_LEAF_SIGNATURE），
// 但瀏覽器通常會容忍。這裡只針對這一個政府統計網域關閉憑證驗證，僅用於讀取公開統計數字，
// 不涉及任何帳密或敏感資料
function fetchInsecure(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ ok: res.statusCode < 400, status: res.statusCode, text: async () => Buffer.concat(chunks).toString("utf8") }));
      })
      .on("error", reject);
  });
}

const TW_ECON_URL = "https://apiservice.mol.gov.tw/OdService/download/A17030000J-000016-xC8";
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const NDC_DATASET_META_URL = "https://data.gov.tw/api/v2/rest/dataset/6099";
const DGBAS_GDP_META_URL = "https://data.gov.tw/api/v2/rest/dataset/6799";
const GDP_ITEM_NAME = "經濟成長率(%)";
const LIGHT_ICONS = { 紅: "🔴", 黃紅: "🟠", 綠: "🟢", 黃藍: "🟡", 藍: "🔵" };

function periodFromYyyymm(yyyymm) {
  return `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}`;
}

function trendFromChange(change) {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

// 台灣 CPI / PPI / GDP 成長率（勞動部轉發主計總處月資料，欄位用「陣列順序」讀取，避免中文欄名編碼問題）
function extractLatestNumeric(records, fieldIndex) {
  for (let i = records.length - 1; i >= 0; i--) {
    const raw = Object.values(records[i])[fieldIndex];
    const match = typeof raw === "string" ? raw.match(/-?\d+(\.\d+)?/) : null;
    if (match) {
      return { value: Number(match[0]), period: periodFromYyyymm(Object.values(records[i])[0]) };
    }
  }
  return null;
}

async function fetchTwEconIndicators() {
  const res = await fetch(TW_ECON_URL);
  if (!res.ok) throw new Error(`台灣經濟指標 API 錯誤：${res.status}`);
  const records = await res.json();

  const cpi = extractLatestNumeric(records, 14); // 消費者物價指數-年增率
  const ppi = extractLatestNumeric(records, 12); // 生產者物價指數-年增率

  if (!cpi || !ppi) throw new Error("台灣經濟指標資料欄位解析失敗");

  return [
    {
      id: "cpi-tw",
      region: "TW",
      name: "CPI 消費者物價指數年增率",
      value: `${cpi.value.toFixed(2)}%`,
      trend: trendFromChange(cpi.value),
      period: cpi.period,
      isDemo: false,
    },
    {
      id: "ppi-tw",
      region: "TW",
      name: "PPI 生產者物價指數年增率",
      value: `${ppi.value.toFixed(2)}%`,
      trend: trendFromChange(ppi.value),
      period: ppi.period,
      isDemo: false,
    },
  ];
}

function quarterToPeriod(timePeriod) {
  const m = timePeriod.match(/^(\d{4})Q(\d)$/);
  return m ? `${m[1]}-Q${m[2]}` : timePeriod;
}

// 台灣 GDP 成長率（主計總處官方資料，比勞動部轉發的月資料集更新更即時）
async function fetchTwGdpGrowth() {
  const metaRes = await fetch(DGBAS_GDP_META_URL);
  if (!metaRes.ok) throw new Error(`GDP 中繼資料錯誤：${metaRes.status}`);
  const meta = await metaRes.json();
  const xmlUrl = meta.result.distribution[0].resourceDownloadUrl;

  const res = await fetchInsecure(xmlUrl);
  if (!res.ok) throw new Error(`GDP 資料下載錯誤：${res.status}`);
  const xml = await res.text();

  const obsBlocks = xml.match(/<Obs>[\s\S]*?<\/Obs>/g) || [];
  let latest = null;
  for (const block of obsBlocks) {
    const item = (block.match(/<Item>([^<]*)<\/Item>/) || [, ""])[1];
    if (item !== GDP_ITEM_NAME) continue;
    const period = (block.match(/<TIME_PERIOD>([^<]*)<\/TIME_PERIOD>/) || [, ""])[1];
    const value = (block.match(/<Item_VALUE>([^<]*)<\/Item_VALUE>/) || [, ""])[1];
    if (!value) continue;
    latest = { period, value: Number(value) }; // 檔案內為時間遞增排序，留下最後一筆非空值即為最新
  }
  if (!latest) throw new Error("找不到經濟成長率資料");

  return {
    id: "gdp-tw",
    region: "TW",
    name: "GDP 成長率（年增率）",
    value: `${latest.value.toFixed(2)}%`,
    trend: trendFromChange(latest.value),
    period: quarterToPeriod(latest.period),
    isDemo: false,
  };
}

// 台灣景氣對策信號（國發會，data.gov.tw dataset 6099，資料包成 ZIP，裡面是 CSV）
async function fetchBusinessSignal() {
  const metaRes = await fetch(NDC_DATASET_META_URL);
  if (!metaRes.ok) throw new Error(`景氣對策信號中繼資料錯誤：${metaRes.status}`);
  const meta = await metaRes.json();
  const downloadUrl = meta.result.distribution[0].resourceDownloadUrl;

  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`景氣對策信號下載錯誤：${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const zip = new AdmZip(buf);
  const entry = zip.getEntries().find((e) => e.entryName === "景氣指標與燈號.csv");
  if (!entry) throw new Error("景氣對策信號找不到資料檔案");

  const text = entry.getData().toString("utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  const lastCols = lines[lines.length - 1].split(",").map((v) => v.replace(/^"|"$/g, "").trim());

  const period = lastCols[0];
  const light = lastCols[8];
  if (!/^\d{6}$/.test(period) || !light) throw new Error("景氣對策信號資料格式異常");

  return {
    id: "business-signal-tw",
    region: "TW",
    name: "景氣對策信號",
    value: `${LIGHT_ICONS[light] || ""} ${light}燈`,
    trend: "flat",
    period: periodFromYyyymm(period),
    isDemo: false,
  };
}

// 美國 CPI / PPI / GDP / 聯邦基金利率（FRED，需要金鑰）
async function fetchFredSeries(seriesId, apiKey, { units } = {}) {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: "json",
    sort_order: "desc",
    limit: "2",
  });
  if (units) params.set("units", units);
  const res = await fetch(`${FRED_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`FRED API 錯誤（${seriesId}）：${res.status}`);
  const data = await res.json();
  const obs = (data.observations || []).filter((o) => o.value !== ".");
  if (obs.length === 0) throw new Error(`FRED 沒有回傳可用資料（${seriesId}）`);
  return obs;
}

async function fetchUsEconIndicators(apiKey) {
  const [cpiObs, ppiObs, gdpObs, rateObs] = await Promise.all([
    fetchFredSeries("CPIAUCSL", apiKey, { units: "pc1" }),
    fetchFredSeries("PPIACO", apiKey, { units: "pc1" }),
    fetchFredSeries("A191RL1Q225SBEA", apiKey),
    fetchFredSeries("FEDFUNDS", apiKey),
  ]);

  const build = (id, name, obs, suffix) => {
    const latest = Number(obs[0].value);
    const prev = obs[1] ? Number(obs[1].value) : latest;
    return {
      id,
      region: "US",
      name,
      value: `${latest.toFixed(2)}${suffix}`,
      trend: trendFromChange(latest - prev),
      period: obs[0].date.slice(0, 7),
      isDemo: false,
    };
  };

  return [
    build("cpi-us", "CPI 消費者物價指數年增率", cpiObs, "%"),
    build("ppi-us", "PPI 生產者物價指數年增率", ppiObs, "%"),
    build("gdp-us", "GDP 成長率（年增率）", gdpObs, "%"),
    build("rate-us", "聯邦基金有效利率", rateObs, "%"),
  ];
}

router.get("/", async (req, res) => {
  const fredKey = process.env.FRED_API_KEY;
  const results = { indicators: [], errors: [] };

  const tasks = [
    { label: "台灣經濟指標", run: fetchTwEconIndicators },
    { label: "台灣GDP成長率", run: fetchTwGdpGrowth },
    { label: "景氣對策信號", run: fetchBusinessSignal },
  ];
  if (!fredKey) {
    results.errors.push("美國經濟指標：尚未設定 FRED_API_KEY，請到 server/.env 填入金鑰");
  } else {
    tasks.push({ label: "美國經濟指標", run: () => fetchUsEconIndicators(fredKey) });
  }

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  settled.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      results.indicators.push(...[].concat(outcome.value));
    } else {
      results.errors.push(`${tasks[i].label}：${outcome.reason.message}`);
    }
  });

  res.json(results);
});

module.exports = router;

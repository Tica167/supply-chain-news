const express = require("express");
const router = express.Router();

const TW_ECON_URL = "https://apiservice.mol.gov.tw/OdService/download/A17030000J-000016-xC8";
const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

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
  const gdp = extractLatestNumeric(records, 1); // 經濟成長率（僅季底月份有值）

  if (!cpi || !ppi || !gdp) throw new Error("台灣經濟指標資料欄位解析失敗");

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
    {
      id: "gdp-tw",
      region: "TW",
      name: "GDP 成長率（年增率）",
      value: `${gdp.value.toFixed(2)}%`,
      trend: trendFromChange(gdp.value),
      period: gdp.period,
      isDemo: false,
    },
  ];
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

  const tasks = [{ label: "台灣經濟指標", run: fetchTwEconIndicators }];
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

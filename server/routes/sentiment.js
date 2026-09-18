const express = require("express");
const router = express.Router();

const YAHOO_VIX_URL = "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d";
const CNN_FEAR_GREED_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";

function trendFromChange(change) {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

async function fetchVix() {
  const res = await fetch(YAHOO_VIX_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`VIX 資料來源錯誤：${res.status}`);
  const data = await res.json();
  const result = data.chart.result[0];
  const closes = result.indicators.quote[0].close.filter((v) => v !== null);
  if (closes.length < 1) throw new Error("VIX 沒有可用的收盤價");
  const latest = closes[closes.length - 1];
  const prev = closes.length > 1 ? closes[closes.length - 2] : latest;
  const latestDate = new Date(result.timestamp[result.timestamp.length - 1] * 1000).toISOString().slice(0, 10);
  return {
    id: "vix",
    name: "CBOE 恐慌指數（VIX）",
    value: latest.toFixed(1),
    trend: trendFromChange(latest - prev),
    period: latestDate,
    isDemo: false,
  };
}

async function fetchFearGreed() {
  const res = await fetch(CNN_FEAR_GREED_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Referer: "https://www.cnn.com/markets/fear-and-greed",
    },
  });
  if (!res.ok) throw new Error(`貪婪與恐懼指數資料來源錯誤：${res.status}`);
  const data = await res.json();
  const current = data.fear_and_greed;
  const ratingLabel = { "extreme fear": "極度恐懼", fear: "恐懼", neutral: "中性", greed: "貪婪", "extreme greed": "極度貪婪" };
  return {
    id: "feargreed",
    name: "CNN 貪婪與恐懼指數",
    value: `${Math.round(current.score)}・${ratingLabel[current.rating] || current.rating}`,
    trend: trendFromChange(current.score - current.previous_close),
    period: current.timestamp.slice(0, 10),
    isDemo: false,
  };
}

router.get("/", async (req, res) => {
  const results = { sentiment: [], errors: [] };
  try {
    results.sentiment.push(await fetchVix());
  } catch (err) {
    results.errors.push(`VIX：${err.message}`);
  }
  try {
    results.sentiment.push(await fetchFearGreed());
  } catch (err) {
    results.errors.push(`貪婪與恐懼指數：${err.message}`);
  }
  res.json(results);
});

module.exports = router;

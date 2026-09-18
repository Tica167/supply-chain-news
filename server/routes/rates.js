const express = require("express");
const router = express.Router();

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

function round(n, digits) {
  return Number(n.toFixed(digits));
}

async function fetchQuote(symbol) {
  const res = await fetch(`${YAHOO_BASE}/${symbol}?range=1d&interval=15m`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`匯率 API 錯誤（${symbol}）：${res.status}`);
  const data = await res.json();
  const meta = data.chart.result[0].meta;
  return {
    price: meta.regularMarketPrice,
    prevClose: meta.previousClose ?? meta.chartPreviousClose,
    time: meta.regularMarketTime,
  };
}

router.get("/", async (req, res) => {
  try {
    const [usdTwdQuote, usdJpyQuote] = await Promise.all([fetchQuote("TWD=X"), fetchQuote("JPY=X")]);

    const usdTwd = usdTwdQuote.price;
    const usdJpy = usdJpyQuote.price;
    const jpyTwd = usdTwd / usdJpy;
    const prevJpyTwd = usdTwdQuote.prevClose / usdJpyQuote.prevClose;

    const latestTime = Math.max(usdTwdQuote.time, usdJpyQuote.time);
    const updateDate = new Date(latestTime * 1000).toISOString().slice(0, 16).replace("T", " ");

    const payload = [
      {
        id: "usd-twd",
        pair: "USD/TWD",
        label: "美元／台幣",
        rate: round(usdTwd, 2).toFixed(2),
        change: round(usdTwd - usdTwdQuote.prevClose, 2),
        date: updateDate,
        isDemo: false,
      },
      {
        id: "jpy-twd",
        pair: "JPY/TWD",
        label: "日圓／台幣",
        rate: round(jpyTwd, 3).toFixed(3),
        change: round(jpyTwd - prevJpyTwd, 3),
        date: updateDate,
        isDemo: false,
      },
      {
        id: "usd-jpy",
        pair: "USD/JPY",
        label: "美元／日圓",
        rate: round(usdJpy, 2).toFixed(2),
        change: round(usdJpy - usdJpyQuote.prevClose, 2),
        date: updateDate,
        isDemo: false,
      },
    ];

    res.json({ rates: payload, updatedAt: `${updateDate}（Yahoo Finance，即時盤中報價）` });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;

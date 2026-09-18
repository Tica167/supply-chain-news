const express = require("express");
const router = express.Router();

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

function round(n, digits) {
  return Number(n.toFixed(digits));
}

// Yahoo 回傳的是 UTC 時間戳，這裡轉成台灣時間（UTC+8，無夏令時）再顯示
function formatTaipeiTime(unixSeconds) {
  const taipei = new Date((unixSeconds + 8 * 3600) * 1000);
  return taipei.toISOString().slice(0, 16).replace("T", " ");
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
    const updateDate = formatTaipeiTime(latestTime);

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

    res.json({ rates: payload, updatedAt: `${updateDate} 台灣時間（Yahoo Finance，即時盤中報價）` });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;

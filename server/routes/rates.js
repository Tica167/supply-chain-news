const express = require("express");
const router = express.Router();

const RATES_URL = "https://open.er-api.com/v6/latest/USD";

// 沒有金鑰限制、但只提供「最新一筆」匯率，沒有歷史資料可比對漲跌，
// 所以用伺服器記憶體暫存「上一次查詢結果」來算漲跌幅（代表「距離上次查詢的變化」，不是「較昨日」）
let previousSnapshot = null;

function round(n, digits) {
  return Number(n.toFixed(digits));
}

router.get("/", async (req, res) => {
  try {
    const apiRes = await fetch(RATES_URL);
    if (!apiRes.ok) throw new Error(`匯率 API 錯誤：${apiRes.status}`);
    const data = await apiRes.json();
    if (data.result !== "success") throw new Error("匯率 API 回應異常");

    const usdTwd = data.rates.TWD;
    const usdJpy = data.rates.JPY;
    const jpyTwd = usdTwd / usdJpy;
    const updateDate = new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 16).replace("T", " ");

    const prev = previousSnapshot || { usdTwd, usdJpy, jpyTwd };

    const payload = [
      {
        id: "usd-twd",
        pair: "USD/TWD",
        label: "美元／台幣",
        rate: round(usdTwd, 2).toFixed(2),
        change: round(usdTwd - prev.usdTwd, 2),
        date: updateDate,
        isDemo: false,
      },
      {
        id: "jpy-twd",
        pair: "JPY/TWD",
        label: "日圓／台幣",
        rate: round(jpyTwd, 3).toFixed(3),
        change: round(jpyTwd - prev.jpyTwd, 3),
        date: updateDate,
        isDemo: false,
      },
      {
        id: "usd-jpy",
        pair: "USD/JPY",
        label: "美元／日圓",
        rate: round(usdJpy, 2).toFixed(2),
        change: round(usdJpy - prev.usdJpy, 2),
        date: updateDate,
        isDemo: false,
      },
    ];

    previousSnapshot = { usdTwd, usdJpy, jpyTwd };

    res.json({ rates: payload, updatedAt: `${updateDate}（ExchangeRate-API，每日更新一次）` });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

module.exports = router;

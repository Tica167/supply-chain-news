/* ==========================================================================
   向後端（server/）抓取真實資料，失敗時自動保留 data.js 裡的示範資料當備援
   四個來源平行抓取（不互相等待），減少等待時間
   ========================================================================== */

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} 回應錯誤：${res.status}`);
  return res.json();
}

function replaceById(targetArray, liveItems) {
  liveItems.forEach((item) => {
    const idx = targetArray.findIndex((t) => t.id === item.id);
    if (idx >= 0) targetArray[idx] = item;
    else targetArray.push(item);
  });
}

function replaceNewsForGroups(liveNewsItems) {
  if (!liveNewsItems.length) return;
  const coveredGroups = new Set(liveNewsItems.map((n) => n.group));
  for (let i = NEWS.length - 1; i >= 0; i--) {
    if (coveredGroups.has(NEWS[i].group)) NEWS.splice(i, 1);
  }
  NEWS.push(...liveNewsItems);
}

async function loadRates(notices) {
  try {
    const data = await fetchJson("/api/rates");
    if (data.rates) {
      replaceById(EXCHANGE_RATES, data.rates);
      RATES_META.updatedAt = data.updatedAt;
    }
    if (data.error) notices.push(`匯率：${data.error}（顯示示範資料）`);
  } catch (err) {
    notices.push("匯率：無法連上後端伺服器，顯示示範資料");
  }
}

async function loadIndicators(notices) {
  try {
    const data = await fetchJson("/api/indicators");
    if (data.indicators && data.indicators.length) replaceById(ECONOMIC_INDICATORS, data.indicators);
    (data.errors || []).forEach((msg) => notices.push(`${msg}（該項顯示示範資料）`));
  } catch (err) {
    notices.push("經濟指標：無法連上後端伺服器，顯示示範資料");
  }
}

async function loadSentiment(notices) {
  try {
    const data = await fetchJson("/api/sentiment");
    if (data.sentiment && data.sentiment.length) replaceById(MARKET_SENTIMENT, data.sentiment);
    (data.errors || []).forEach((msg) => notices.push(`${msg}（該項顯示示範資料）`));
  } catch (err) {
    notices.push("市場情緒指標：無法連上後端伺服器，顯示示範資料");
  }
}

async function loadNews(notices) {
  try {
    const data = await fetchJson("/api/news");
    if (data.news && data.news.length) replaceNewsForGroups(data.news);
    (data.errors || []).forEach((msg) => notices.push(`${msg}（該分類顯示示範新聞）`));
  } catch (err) {
    notices.push("新聞：無法連上後端伺服器，顯示示範新聞");
  }
}

async function loadLiveData() {
  const notices = [];
  await Promise.all([loadRates(notices), loadIndicators(notices), loadSentiment(notices), loadNews(notices)]);
  return notices;
}

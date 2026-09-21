/* ==========================================================================
   頁面進入點：依 <body data-page="..."> 分派渲染邏輯
   ========================================================================== */

const CATEGORY_GROUPS = ["processor", "network", "memory", "packaging", "wafer"];

function renderHomeNews() {
  const homeMain = document.getElementById("home-sections");
  homeMain.innerHTML = [
    renderFeaturedSection("processor", 5),
    renderFeaturedSection("network", 5),
    renderFeaturedSection("memory", 5),
    renderFeaturedSection("packaging", 5),
    renderFeaturedSection("wafer", 5),
  ].join("");
}

function renderHomeSidebar() {
  document.getElementById("market-snapshot").innerHTML = renderMarketSnapshot();
}

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  initLayout(page);

  const isHome = page === "home";
  const isCategory = CATEGORY_GROUPS.includes(page);

  // 先用示範資料畫一次，避免等待即時資料時畫面空白
  if (isHome) {
    renderHomeNews();
    renderHomeSidebar();
  } else if (isCategory) {
    initCategoryPage(page);
  }

  // 每一項（匯率/指標/市場情緒/新聞）各自抓完就各自局部重畫，不用等最慢的那個，
  // 且只重畫跟這項資料實際有關的區塊：分類頁的篩選/搜尋/分頁狀態不會被無關的資料
  // 更新（例如匯率）打斷重置
  const notices = await loadLiveData((name) => {
    if (isHome) {
      if (name === "news") renderHomeNews();
      else renderHomeSidebar(); // 匯率/經濟指標/市場情緒都畫在同一個側欄
    } else if (isCategory && name === "news") {
      initCategoryPage(page);
    }
  });

  showDataNotices(notices);
});

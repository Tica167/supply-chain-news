/* ==========================================================================
   頁面進入點：依 <body data-page="..."> 分派渲染邏輯
   ========================================================================== */

function renderPage(page) {
  if (page === "home") {
    const homeMain = document.getElementById("home-sections");
    homeMain.innerHTML = [
      renderFeaturedSection("processor", 5),
      renderFeaturedSection("network", 5),
      renderFeaturedSection("memory", 5),
      renderFeaturedSection("packaging", 5),
      renderFeaturedSection("wafer", 5),
    ].join("");

    const sidebar = document.getElementById("market-snapshot");
    sidebar.innerHTML = renderMarketSnapshot();
    return;
  }

  const categoryGroups = ["processor", "network", "memory", "packaging", "wafer"];
  if (categoryGroups.includes(page)) {
    initCategoryPage(page);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  initLayout(page);

  renderPage(page); // 先用示範資料畫一次畫面，避免等待即時資料時畫面空白

  const notices = await loadLiveData();
  showDataNotices(notices);
  renderPage(page); // 即時資料抓回來後，重新畫一次畫面
});

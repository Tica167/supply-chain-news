/* ==========================================================================
   共用 Header / Footer 動態注入（避免每個 HTML 頁面重複貼導覽列）
   ========================================================================== */

const NAV_ITEMS = [
  { page: "home", href: "index.html", label: "首頁" },
  { page: "processor", href: "processor.html", label: "處理器" },
  { page: "network", href: "network.html", label: "網卡模組" },
  { page: "memory", href: "memory.html", label: "記憶體 & 固態硬碟" },
  { page: "packaging", href: "packaging.html", label: "封測" },
  { page: "wafer", href: "wafer.html", label: "晶圓" },
  { page: "guide", href: "guide.html", label: "使用指南" },
];

function renderNavLinks(activePage) {
  return NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="${item.page === activePage ? "active" : ""}">${item.label}</a>`
  ).join("");
}

function renderHeader(activePage) {
  return `
    <div class="demo-strip">本站串接真實公開資料來源；若來源暫時無法取得，會自動改顯示示範資料並清楚標示「示範資料」</div>
    <div id="data-notice" class="data-notice" hidden></div>
    <div class="header-inner">
      <a href="index.html" class="site-logo">
        供應鏈新聞觀測站
        <span class="logo-sub">SUPPLY CHAIN NEWS WATCH（示範站）</span>
      </a>
      <nav class="nav-list" aria-label="主導覽">${renderNavLinks(activePage)}</nav>
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-label="開啟選單">☰</button>
    </div>
    <nav class="nav-mobile-menu" id="nav-mobile-menu" aria-label="手機主導覽">${renderNavLinks(activePage)}</nav>
  `;
}

function renderFooter() {
  return `
    <div class="container">
      <p class="footer-disclaimer">
        免責聲明：本站新聞、經濟指標、匯率、市場情緒指標串接公開資料來源，僅供參考，可能有時間延遲或資料來源異動；標示「示範資料」的項目為虛構模擬內容。所有內容皆不作為投資或營運決策依據。
      </p>
      <p class="footer-copy">© 2026 供應鏈新聞觀測站（示範站）</p>
    </div>
  `;
}

function showDataNotices(notices) {
  const el = document.getElementById("data-notice");
  if (!el) return;
  if (!notices || notices.length === 0) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML = notices.map((n) => `<div>⚠ ${n}</div>`).join("");
}

function initLayout(activePage) {
  const headerEl = document.getElementById("site-header");
  const footerEl = document.getElementById("site-footer");
  if (headerEl) headerEl.innerHTML = renderHeader(activePage);
  if (footerEl) footerEl.innerHTML = renderFooter();

  const toggleBtn = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("nav-mobile-menu");
  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
    mobileMenu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        mobileMenu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", (e) => {
      if (
        mobileMenu.classList.contains("is-open") &&
        !mobileMenu.contains(e.target) &&
        e.target !== toggleBtn
      ) {
        mobileMenu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
}

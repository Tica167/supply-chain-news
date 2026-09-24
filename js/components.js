/* ==========================================================================
   共用渲染元件
   ========================================================================== */

function renderNewsTitle(item, tag) {
  if (!item.isDemo && item.url) {
    return `<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>`;
  }
  return item.title;
}

function renderNewsCard(item) {
  return `
    <article class="news-card">
      <div class="news-card-tags">
        <span class="tag">${GROUP_LABELS[item.group]}</span>
        <span class="tag">${TYPE_LABELS[item.type]}</span>
        ${item.isDemo ? '<span class="tag tag-demo">示範資料</span>' : ""}
      </div>
      <h3>${renderNewsTitle(item)}</h3>
      <p>${item.summary}</p>
      <div class="news-card-meta">
        <span>${item.source}</span>
        <span>${item.date}</span>
      </div>
    </article>
  `;
}

function renderNewsGrid(items) {
  if (!items.length) {
    return `<p class="empty-state">目前沒有符合條件的新聞</p>`;
  }
  return `<div class="news-grid">${items.map(renderNewsCard).join("")}</div>`;
}

function renderFeaturedRow(item) {
  return `
    <li class="feature-row">
      <div class="feature-row-top">
        <span class="feature-row-title">${renderNewsTitle(item)}</span>
        <span class="feature-row-meta">
          <span class="tag">${TYPE_LABELS[item.type]}</span>
          ${item.isDemo ? '<span class="tag tag-demo">示範資料</span>' : ""}
          <span class="feature-row-date">${item.date}</span>
        </span>
      </div>
      <p class="feature-row-summary">${item.summary}</p>
    </li>
  `;
}

function renderFeaturedList(items) {
  if (!items.length) {
    return `<p class="empty-state">目前沒有符合條件的新聞</p>`;
  }
  return `<ul class="feature-list">${items.map(renderFeaturedRow).join("")}</ul>`;
}

function renderFeaturedSection(group, count) {
  const items = NEWS.filter((n) => n.group === group)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, count);
  const pageHrefMap = {
    processor: "processor.html",
    network: "network.html",
    memory: "memory.html",
    packaging: "packaging.html",
    wafer: "wafer.html",
  };
  return `
    <section class="section">
      <div class="section-head">
        <div>
          <h2>${GROUP_LABELS[group]}</h2>
          <p class="section-desc">精選新聞</p>
        </div>
        <a class="section-link" href="${pageHrefMap[group]}">查看全部 ${GROUP_LABELS[group]} 新聞 →</a>
      </div>
      ${renderFeaturedList(items)}
    </section>
  `;
}

function renderFilterBar(activeType) {
  const options = [
    { type: "all", label: "全部" },
    { type: "market-analysis", label: "市場分析" },
    { type: "stock-analysis", label: "股市分析" },
    { type: "supply-demand", label: "供需" },
    { type: "new-product", label: "新品發表" },
    { type: "patent-dispute", label: "侵權/專利" },
  ];
  return `
    <div class="filter-bar type-filter-bar" role="group" aria-label="新聞類型篩選">
      ${options
        .map(
          (opt) => `
        <button class="filter-btn" data-type="${opt.type}" aria-pressed="${opt.type === activeType}">
          ${opt.label}
        </button>`
        )
        .join("")}
    </div>
  `;
}

function renderDateFilterBar(activeRange) {
  const options = [
    { range: "all", label: "全部" },
    { range: "recent3", label: "近三天" },
  ];
  return `
    <div class="filter-bar date-filter-bar" role="group" aria-label="時間範圍篩選">
      ${options
        .map(
          (opt) => `
        <button class="filter-btn" data-range="${opt.range}" aria-pressed="${opt.range === activeRange}">
          ${opt.label}
        </button>`
        )
        .join("")}
    </div>
  `;
}

function renderSearchBox(term) {
  return `
    <div class="search-box">
      <input type="search" id="news-search" class="search-input" placeholder="搜尋新聞標題關鍵字…" aria-label="搜尋新聞標題" value="${term}" />
    </div>
  `;
}

function renderPagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";
  let buttons = "";
  for (let p = 1; p <= totalPages; p++) {
    buttons += `<button class="page-btn" data-page="${p}" aria-current="${p === currentPage}">${p}</button>`;
  }
  return `<nav class="pagination" aria-label="分頁">${buttons}</nav>`;
}

const CATEGORY_PAGE_SIZE = 9;

// 中英文同義詞，讓搜尋「Intel」也能搜到「英特爾」的新聞（反向也成立）
const SEARCH_SYNONYM_GROUPS = [
  ["intel", "英特爾"],
  ["nvidia", "輝達"],
  ["amd", "超微"],
  ["broadcom", "博通"],
  ["marvell", "邁威爾"],
  ["tsmc", "台積電", "台積"],
  ["samsung", "三星"],
  ["sk hynix", "sk海力士", "海力士"],
  ["micron", "美光"],
  ["umc", "聯電"],
  ["globalfoundries", "格芯"],
  ["ase", "日月光"],
  ["qualcomm", "高通"],
  ["apple", "蘋果"],
];

function expandSearchTerms(term) {
  const lower = term.toLowerCase();
  const expanded = new Set([lower]);
  SEARCH_SYNONYM_GROUPS.forEach((group) => {
    const hit = group.some((w) => {
      const wLower = w.toLowerCase();
      return wLower === lower || wLower.includes(lower) || lower.includes(wLower);
    });
    if (hit) group.forEach((w) => expanded.add(w.toLowerCase()));
  });
  return Array.from(expanded);
}

function initCategoryPage(group) {
  const listEl = document.getElementById("news-list");
  const filterBarEl = document.getElementById("filter-bar");
  const searchBarEl = document.getElementById("search-bar");
  const paginationEl = document.getElementById("pagination");

  let activeType = "all";
  let activeRange = "all";
  let searchTerm = "";
  let currentPage = 1;

  function getFilteredNews() {
    const groupNews = NEWS.filter((n) => n.group === group).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const term = searchTerm.trim();
    const searchTerms = term ? expandSearchTerms(term) : [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return groupNews.filter((n) => {
      const typeMatch = activeType === "all" || n.type === activeType;
      const titleLower = n.title.toLowerCase();
      const searchMatch = !term || searchTerms.some((t) => titleLower.includes(t));
      const dateMatch = activeRange === "all" || (n.date && new Date(n.date) >= threeDaysAgo);
      return typeMatch && searchMatch && dateMatch;
    });
  }

  function render() {
    filterBarEl.innerHTML = renderDateFilterBar(activeRange) + renderFilterBar(activeType);

    const filtered = getFilteredNews();
    const totalPages = Math.max(1, Math.ceil(filtered.length / CATEGORY_PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const pageItems = filtered.slice((currentPage - 1) * CATEGORY_PAGE_SIZE, currentPage * CATEGORY_PAGE_SIZE);

    listEl.innerHTML = renderNewsGrid(pageItems);
    paginationEl.innerHTML = renderPagination(currentPage, totalPages);

    filterBarEl.querySelectorAll(".date-filter-bar .filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeRange = btn.dataset.range;
        currentPage = 1;
        render();
      });
    });

    filterBarEl.querySelectorAll(".type-filter-bar .filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeType = btn.dataset.type;
        currentPage = 1;
        render();
      });
    });

    paginationEl.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        render();
        listEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  searchBarEl.innerHTML = renderSearchBox(searchTerm);
  document.getElementById("news-search").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    currentPage = 1;
    render();
  });

  render();
}

function trendArrow(trend) {
  if (trend === "up") return { arrow: "▲", cls: "change-up" };
  if (trend === "down") return { arrow: "▼", cls: "change-down" };
  return { arrow: "—", cls: "" };
}

function renderSnapshotRateRow(item) {
  const isUp = item.change > 0;
  const isDown = item.change < 0;
  const { arrow, cls } = trendArrow(isUp ? "up" : isDown ? "down" : "flat");
  return `
    <li class="snapshot-row">
      <span class="snapshot-label">${item.label}</span>
      <span class="snapshot-value-wrap">
        <span class="snapshot-value">${item.rate}</span>
        <span class="snapshot-trend ${cls}">${arrow} ${Math.abs(item.change)}</span>
      </span>
    </li>
  `;
}

function renderSnapshotIndicatorRow(item) {
  const { arrow, cls } = trendArrow(item.trend);
  return `
    <li class="indicator-row">
      <div class="snapshot-row">
        <span class="snapshot-label">${item.name}</span>
        <span class="snapshot-value-wrap">
          <span class="snapshot-value">${item.value}</span>
          <span class="snapshot-trend ${cls}">${arrow}</span>
        </span>
      </div>
      <div class="snapshot-period">資料時間：${item.period}</div>
    </li>
  `;
}

function renderMarketSnapshot() {
  const twItems = ECONOMIC_INDICATORS.filter((i) => i.region === "TW");
  const usItems = ECONOMIC_INDICATORS.filter((i) => i.region === "US");
  return `
    <div class="market-snapshot">
      <h2>匯率/指標</h2>
      <p class="snapshot-desc">匯率／經濟指標／市場情緒</p>

      <div class="snapshot-group">
        <h3>今日匯率</h3>
        <span class="snapshot-updated">更新：${RATES_META.updatedAt}</span>
        <ul class="snapshot-list">${EXCHANGE_RATES.map(renderSnapshotRateRow).join("")}</ul>
      </div>

      <div class="snapshot-group">
        <h3>台灣經濟指標</h3>
        <ul class="snapshot-list">${twItems.map(renderSnapshotIndicatorRow).join("")}</ul>
      </div>

      <div class="snapshot-group">
        <h3>美國經濟指標</h3>
        <ul class="snapshot-list">${usItems.map(renderSnapshotIndicatorRow).join("")}</ul>
      </div>

      <div class="snapshot-group">
        <h3>美國市場情緒指標</h3>
        <ul class="snapshot-list">${MARKET_SENTIMENT.map(renderSnapshotIndicatorRow).join("")}</ul>
      </div>
    </div>
  `;
}

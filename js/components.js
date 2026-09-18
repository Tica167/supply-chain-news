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
    { type: "supply-demand", label: "供需" },
    { type: "new-product", label: "新品發表" },
  ];
  return `
    <div class="filter-bar" role="group" aria-label="新聞類型篩選">
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

function initCategoryPage(group) {
  const listEl = document.getElementById("news-list");
  const filterBarEl = document.getElementById("filter-bar");
  const groupNews = NEWS.filter((n) => n.group === group).slice().sort((a, b) => (a.date < b.date ? 1 : -1));

  let activeType = "all";

  function render() {
    filterBarEl.innerHTML = renderFilterBar(activeType);
    const filtered = activeType === "all" ? groupNews : groupNews.filter((n) => n.type === activeType);
    listEl.innerHTML = renderNewsGrid(filtered);

    filterBarEl.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeType = btn.dataset.type;
        render();
      });
    });
  }

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
    <li class="snapshot-row">
      <span class="snapshot-label">${item.name}</span>
      <span class="snapshot-value-wrap">
        <span class="snapshot-value">${item.value}</span>
        <span class="snapshot-trend ${cls}">${arrow}</span>
      </span>
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
        <h3>今日匯率 <span class="snapshot-updated">更新：${RATES_META.updatedAt}</span></h3>
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

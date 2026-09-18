/* ==========================================================================
   示範資料（全部虛構，僅供網站原型展示使用，非真實新聞或即時數據）
   ========================================================================== */

const GROUP_LABELS = {
  processor: "處理器",
  network: "網卡模組",
  memory: "記憶體 & 固態硬碟",
  packaging: "封測",
  wafer: "晶圓",
};

const TYPE_LABELS = {
  "market-analysis": "市場分析",
  "supply-demand": "供需",
  "new-product": "新品發表",
};

const NEWS = [
  // ---------------- 處理器 ----------------
  { id: "n001", group: "processor", type: "market-analysis", title: "AI伺服器需求推升處理器均價，法人上修雲端業者資本支出預估", summary: "示範情境：分析師觀察到雲端服務業者持續加碼AI伺服器採購，帶動高階處理器產品組合佔比提升，法人上修相關業者今年資本支出預估。", date: "2026-09-17", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n002", group: "processor", type: "market-analysis", title: "AMD企業級x86市占持續攀升，分析師關注英特爾代工進度", summary: "示範情境：市場調查機構模擬數據顯示AMD在伺服器處理器市占率連續三季成長，法人同時關注英特爾自有晶圓代工業務的推進時程。", date: "2026-09-15", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n003", group: "processor", type: "market-analysis", title: "Nvidia下一代GPU架構市場預期升溫，供應鏈提前卡位先進封裝產能", summary: "示範情境：供應鏈人士模擬表示，為迎接下一代GPU架構放量，相關封測與基板廠已提前預留產能，反映市場對AI運算需求的樂觀預期。", date: "2026-09-12", source: "示範來源｜科技財經日報（模擬）", isDemo: true },
  { id: "n004", group: "processor", type: "supply-demand", title: "PC品牌廠拉貨動能轉弱，處理器通路庫存水位回升", summary: "示範情境：模擬通路調查顯示，消費型PC處理器庫存周轉天數較上月延長，反映品牌廠在旺季後拉貨力道轉為保守。", date: "2026-09-10", source: "示範來源｜通路觀測站（模擬）", isDemo: true },
  { id: "n005", group: "processor", type: "supply-demand", title: "資料中心處理器交期縮短，顯示供給緊張情況緩解", summary: "示範情境：模擬數據指出主要資料中心處理器交期由16週縮短至10週，供給端產能調度改善為主要因素。", date: "2026-09-07", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n006", group: "processor", type: "supply-demand", title: "車用處理器需求回溫，一線廠商調整產能配置", summary: "示範情境：模擬情境顯示車廠新車型電子化程度提升，帶動車用微控制器與處理器訂單回升，供應商重新分配產能。", date: "2026-09-04", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n007", group: "processor", type: "new-product", title: "英特爾發表新一代桌上型處理器，強調能效比大幅提升", summary: "示範情境：模擬發布會內容顯示新產品線在同等效能下功耗降低約兩成，並針對創作者與遊玩情境優化多核心排程。", date: "2026-09-02", source: "示範來源｜新品快訊（模擬）", isDemo: true },
  { id: "n008", group: "processor", type: "new-product", title: "AMD推出新款資料中心APU，主打AI推論效能", summary: "示範情境：模擬產品資訊顯示新款APU整合CPU與GPU運算單元，針對中小型AI推論工作負載提供更高的每瓦效能。", date: "2026-08-29", source: "示範來源｜新品快訊（模擬）", isDemo: true },

  // ---------------- 網卡模組 ----------------
  { id: "n009", group: "network", type: "market-analysis", title: "800G乙太網路模組需求成長，法人看好資料中心升級週期", summary: "示範情境：模擬產業報告指出資料中心交換器升級至800G規格的比例逐步提高，帶動高速光模組出貨動能。", date: "2026-09-17", source: "示範來源｜網通產業誌（模擬）", isDemo: true },
  { id: "n010", group: "network", type: "market-analysis", title: "Marvell網路晶片營收占比持續提升，市場關注AI交換器成長動能", summary: "示範情境：模擬財報分析顯示網路相關晶片營收占整體比重逐季提升，法人聚焦AI叢集交換器晶片的長線成長性。", date: "2026-09-14", source: "示範來源｜科技財經日報（模擬）", isDemo: true },
  { id: "n011", group: "network", type: "market-analysis", title: "Broadcom客製化網路晶片訂單能見度延伸，分析師調升營收預估", summary: "示範情境：模擬供應鏈訪查顯示雲端業者自研網路晶片合作案持續擴大，帶動相關訂單能見度延伸至下年度。", date: "2026-09-11", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n012", group: "network", type: "supply-demand", title: "資料中心網卡模組交期改善，客戶拉貨力道回穩", summary: "示範情境：模擬數據顯示主要網卡模組交期由過去的12週縮短至8週，反映上游關鍵零件供給改善。", date: "2026-09-09", source: "示範來源｜通路觀測站（模擬）", isDemo: true },
  { id: "n013", group: "network", type: "supply-demand", title: "光模組關鍵零件供給吃緊，模組廠評估替代料源", summary: "示範情境：模擬情境顯示部分雷射元件供給仍偏緊，模組廠正評估導入第二供應商以分散風險。", date: "2026-09-06", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n014", group: "network", type: "supply-demand", title: "企業級網通設備庫存去化接近尾聲，通路商回補訂單", summary: "示範情境：模擬通路調查指出企業級網通設備庫存去化已進入末段，通路商開始重新啟動回補訂單流程。", date: "2026-09-03", source: "示範來源｜通路觀測站（模擬）", isDemo: true },
  { id: "n015", group: "network", type: "new-product", title: "Nvidia發表新一代網路交換晶片，主打AI叢集互連效能", summary: "示範情境：模擬發布內容顯示新款交換晶片支援更高埠數與頻寬密度，針對大規模AI訓練叢集的互連需求設計。", date: "2026-08-31", source: "示範來源｜新品快訊（模擬）", isDemo: true },
  { id: "n016", group: "network", type: "new-product", title: "Marvell推出新款800G光模組DSP晶片", summary: "示範情境：模擬產品資訊顯示新款DSP晶片支援更長傳輸距離與更低功耗，適用於資料中心內部與跨機房連接。", date: "2026-08-28", source: "示範來源｜新品快訊（模擬）", isDemo: true },

  // ---------------- 記憶體 & 固態硬碟 ----------------
  { id: "n017", group: "memory", type: "market-analysis", title: "HBM需求強勁，三大記憶體廠上修今年資本支出計畫", summary: "示範情境：模擬產業報告指出AI加速器對高頻寬記憶體的需求持續超出預期，三大原廠同步上修今年資本支出計畫。", date: "2026-09-18", source: "示範來源｜記憶體產業通訊（模擬）", isDemo: true },
  { id: "n018", group: "memory", type: "market-analysis", title: "DRAM合約價連續兩季上漲，法人關注下游成本轉嫁能力", summary: "示範情境：模擬報價資料顯示主流DRAM合約價連續兩季走揚，法人聚焦品牌廠是否能將成本順利轉嫁至終端售價。", date: "2026-09-13", source: "示範來源｜科技財經日報（模擬）", isDemo: true },
  { id: "n019", group: "memory", type: "market-analysis", title: "企業級SSD需求隨AI伺服器建置擴大，原廠上修出貨預估", summary: "示範情境：模擬市調資料顯示企業級固態硬碟出貨量隨AI伺服器建置放量成長，原廠上修全年出貨預估。", date: "2026-09-08", source: "示範來源｜記憶體產業通訊（模擬）", isDemo: true },
  { id: "n020", group: "memory", type: "supply-demand", title: "NAND Flash廠控制稼動率，市場供需結構逐步改善", summary: "示範情境：模擬產業調查顯示主要NAND廠持續控制稼動率以消化庫存，市場供需結構較上半年明顯改善。", date: "2026-09-05", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n021", group: "memory", type: "supply-demand", title: "消費性DRAM模組現貨價回升，通路商回補庫存", summary: "示範情境：模擬現貨市場資料顯示消費性DRAM模組價格出現回升訊號，通路商評估提前回補庫存以避免後續成本上升。", date: "2026-09-02", source: "示範來源｜通路觀測站（模擬）", isDemo: true },
  { id: "n022", group: "memory", type: "supply-demand", title: "HBM3E產能滿載，客戶交期延長至次季", summary: "示範情境：模擬供應鏈訪查顯示HBM3E產能持續滿載，部分客戶交期已延長至下一季，反映先進封裝端亦為瓶頸之一。", date: "2026-08-30", source: "示範來源｜記憶體產業通訊（模擬）", isDemo: true },
  { id: "n023", group: "memory", type: "new-product", title: "記憶體原廠發表新一代HBM4樣品，主打AI加速器應用", summary: "示範情境：模擬發布內容顯示新一代HBM4樣品已送交客戶驗證，頻寬與容量較前代提升，目標鎖定下一代AI加速器平台。", date: "2026-08-27", source: "示範來源｜新品快訊（模擬）", isDemo: true },
  { id: "n024", group: "memory", type: "new-product", title: "原廠推出新款企業級PCIe 5.0固態硬碟", summary: "示範情境：模擬產品資訊顯示新款企業級SSD採用PCIe 5.0介面，讀寫效能與耐用度較前代大幅提升，主攻資料中心市場。", date: "2026-08-24", source: "示範來源｜新品快訊（模擬）", isDemo: true },

  // ---------------- 封測 ----------------
  { id: "n025", group: "packaging", type: "market-analysis", title: "先進封裝產能供不應求，法人看好相關供應鏈長線動能", summary: "示範情境：模擬產業報告指出先進封裝產能持續吃緊，法人認為此趨勢將延續至明後年，看好相關材料與設備供應鏈。", date: "2026-09-16", source: "示範來源｜封測產業誌（模擬）", isDemo: true },
  { id: "n026", group: "packaging", type: "market-analysis", title: "封測產業稼動率隨AI晶片需求回升，業者上修全年展望", summary: "示範情境：模擬財報分析顯示封測業者整體稼動率隨AI相關晶片訂單增加而回升，管理層上修全年營運展望。", date: "2026-09-12", source: "示範來源｜科技財經日報（模擬）", isDemo: true },
  { id: "n027", group: "packaging", type: "market-analysis", title: "封測廠擴大先進封裝投資，市場關注海外新廠進度", summary: "示範情境：模擬新聞稿內容顯示封測業者持續擴大先進封裝相關資本支出，市場關注海外新廠興建與量產時程。", date: "2026-09-09", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n028", group: "packaging", type: "supply-demand", title: "傳統封測產能利用率緩步回升，通路庫存去化接近完成", summary: "示範情境：模擬產業調查顯示傳統封裝測試產能利用率較前季提升，下游庫存去化已接近尾聲。", date: "2026-09-06", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n029", group: "packaging", type: "supply-demand", title: "先進封裝產能持續擴充，供給緊張狀況預期明年緩解", summary: "示範情境：模擬供應鏈訪查顯示先進封裝相關產能擴充計畫陸續開出，業界預期供給緊張情況將於明年逐步緩解。", date: "2026-09-03", source: "示範來源｜封測產業誌（模擬）", isDemo: true },
  { id: "n030", group: "packaging", type: "supply-demand", title: "測試設備交期縮短，反映終端需求成長趨緩", summary: "示範情境：模擬設備商調查顯示測試機台交期較前期縮短，部分反映終端需求成長速度較先前預期趨緩。", date: "2026-08-31", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n031", group: "packaging", type: "new-product", title: "先進封裝技術再升級，支援下一代高頻寬記憶體整合", summary: "示範情境：模擬技術發布內容顯示新一代先進封裝技術可支援更多層堆疊與更高頻寬記憶體整合，瞄準AI加速器應用。", date: "2026-08-28", source: "示範來源｜新品快訊（模擬）", isDemo: true },
  { id: "n032", group: "packaging", type: "new-product", title: "封測廠發表新一代扇出型封裝解決方案", summary: "示範情境：模擬產品資訊顯示新一代扇出型封裝方案可縮小整體封裝尺寸並提升散熱效率，適用於行動與AI邊緣裝置。", date: "2026-08-25", source: "示範來源｜新品快訊（模擬）", isDemo: true },

  // ---------------- 晶圓 ----------------
  { id: "n033", group: "wafer", type: "market-analysis", title: "3奈米產能持續滿載，先進製程訂單能見度延伸至2026下半年", summary: "示範情境：模擬供應鏈訪查顯示主要晶圓代工廠3奈米產能維持滿載，先進製程訂單能見度已延伸至2026年下半年。", date: "2026-09-17", source: "示範來源｜晶圓代工觀察（模擬）", isDemo: true },
  { id: "n034", group: "wafer", type: "market-analysis", title: "晶圓代工業者資本支出上修，反映AI相關先進製程需求", summary: "示範情境：模擬財報分析顯示主要晶圓代工業者上修今年資本支出計畫，主要反映AI相關晶片對先進製程產能的需求。", date: "2026-09-13", source: "示範來源｜科技財經日報（模擬）", isDemo: true },
  { id: "n035", group: "wafer", type: "market-analysis", title: "成熟製程稼動率回升，法人關注車用與工控訂單動能", summary: "示範情境：模擬產業調查顯示成熟製程晶圓代工稼動率較上季回升，法人聚焦車用電子與工控應用的訂單動能是否延續。", date: "2026-09-10", source: "示範來源｜半導體週報（模擬）", isDemo: true },
  { id: "n036", group: "wafer", type: "supply-demand", title: "成熟製程晶圓代工價格競爭加劇，業者調整報價策略", summary: "示範情境：模擬市場調查顯示成熟製程產能利用率仍未完全回溫，部分業者調整報價策略以爭取訂單。", date: "2026-09-07", source: "示範來源｜晶圓代工觀察（模擬）", isDemo: true },
  { id: "n037", group: "wafer", type: "supply-demand", title: "先進製程產能供不應求，客戶提前預付訂金卡位產能", summary: "示範情境：模擬供應鏈訪查顯示部分大型客戶為確保先進製程產能，提前預付訂金以卡位未來產能配置。", date: "2026-09-04", source: "示範來源｜產業觀察報（模擬）", isDemo: true },
  { id: "n038", group: "wafer", type: "supply-demand", title: "晶圓代工稼動率緩步回升，市場關注先進製程良率改善進度", summary: "示範情境：模擬產業資訊顯示部分晶圓代工業者稼動率緩步回升，市場同時關注其先進製程良率的改善進度。", date: "2026-09-01", source: "示範來源｜晶圓代工觀察（模擬）", isDemo: true },
  { id: "n039", group: "wafer", type: "new-product", title: "台積電宣布2奈米製程量產時間表，強調能效大幅提升", summary: "示範情境：模擬新聞稿內容顯示2奈米製程量產時間表正式公布，相較前代製程在能效與電晶體密度上皆有顯著提升。", date: "2026-08-29", source: "示範來源｜新品快訊（模擬）", isDemo: true },
  { id: "n040", group: "wafer", type: "new-product", title: "晶圓代工廠推出新款車用晶片專用製程平台", summary: "示範情境：模擬產品資訊顯示新款製程平台針對車用晶片的可靠度與耐溫需求優化，目標搶進車用電子供應鏈。", date: "2026-08-26", source: "示範來源｜新品快訊（模擬）", isDemo: true },
];

const ECONOMIC_INDICATORS = [
  { id: "cpi-tw", region: "TW", name: "CPI 消費者物價指數年增率", value: "2.20%", trend: "up", period: "2026-05", isDemo: true },
  { id: "ppi-tw", region: "TW", name: "PPI 生產者物價指數年增率", value: "14.11%", trend: "up", period: "2026-05", isDemo: true },
  { id: "rate-tw", region: "TW", name: "央行重貼現率", value: "2.00%", trend: "flat", period: "2024-03", isDemo: true },
  { id: "gdp-tw", region: "TW", name: "GDP 成長率（年增率）", value: "14.55%", trend: "up", period: "2026-03", isDemo: true },
  { id: "cpi-us", region: "US", name: "CPI 消費者物價指數年增率", value: "2.9%", trend: "flat", period: "2026-08", isDemo: true },
  { id: "ppi-us", region: "US", name: "PPI 生產者物價指數年增率", value: "1.8%", trend: "flat", period: "2026-08", isDemo: true },
  { id: "rate-us", region: "US", name: "聯邦基金有效利率", value: "4.33%", trend: "down", period: "2026-08", isDemo: true },
  { id: "gdp-us", region: "US", name: "GDP 成長率（年增率）", value: "2.4%", trend: "flat", period: "2026-Q2", isDemo: true },
];

const RATES_META = { updatedAt: "2026-09-18 09:15（示範資料）" };

const EXCHANGE_RATES = [
  { id: "usd-twd", pair: "USD/TWD", label: "美元／台幣", rate: "31.92", change: 0.07, date: "2026-09-18", isDemo: true },
  { id: "jpy-twd", pair: "JPY/TWD", label: "日圓／台幣", rate: "0.215", change: -0.001, date: "2026-09-18", isDemo: true },
  { id: "usd-jpy", pair: "USD/JPY", label: "美元／日圓", rate: "147.65", change: 0.35, date: "2026-09-18", isDemo: true },
];

const MARKET_SENTIMENT = [
  { id: "vix", name: "CBOE 恐慌指數（VIX）", value: "15.9", trend: "down", period: "2026-09-18", isDemo: true },
  { id: "feargreed", name: "CNN 貪婪與恐懼指數", value: "65・貪婪", trend: "up", period: "2026-09-18", isDemo: true },
];

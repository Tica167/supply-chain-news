# 供應鏈新聞觀測站 — Handoff 文件

給接手這個專案的人（或未來的 Claude session）看的完整背景說明。這份文件記錄了**為什麼**現在的程式碼長這樣，很多地方是踩過雷之後才改成現在這個寫法，改動前建議先讀完這份文件，避免走回已經證實不通的路。

## 專案是什麼

半導體供應鏈財經新聞觀測站，給供應鏈管理人員（使用者 Tina）內部參考、也會分享給朋友看的網站。追蹤 5 個料件群組（處理器／網卡模組／記憶體 & 固態硬碟／封測／晶圓）的新聞，加上匯率、台美經濟指標、美國市場情緒指標。**非商業用途，個人/工作參考用。**

## 部署資訊

- GitHub repo：https://github.com/Tica167/supply-chain-news （分支 `main`）
- 雲端上線網址：https://supply-chain-news.onrender.com/
- Render 服務名稱：`supply-chain-news`，Auto-Deploy 設定是「On Commit」
- **已知問題**：GitHub webhook 偶爾沒有觸發 Render 自動部署，push 後等 1-2 分鐘網站沒變化時，去 https://dashboard.render.com 找到這個服務，右上角「Manual Deploy」→「Deploy latest commit」手動補一次
- Render 免費方案閒置一段時間會休眠，下一個訪客打開時要等 20-60 秒喚醒（會看到 Render 自己的「WAKING UP」畫面），這是正常現象不是壞掉

## 架構總覽

純前端靜態頁面（vanilla HTML/CSS/JS，沒有框架、沒有 build 流程）+ Node.js/Express 後端。後端**同時**負責 serve 前端靜態檔案跟提供 `/api/*` 資料端點，所以本機測試/雲端部署都只需要跑一個 Node process。

```
D:\新聞網站\
├── index.html / processor.html / network.html / memory.html
│   / packaging.html / wafer.html / guide.html   前端頁面
├── css/style.css        全站唯一樣式表
├── js/
│   ├── data.js          示範資料（所有真實來源都失敗時的備援內容）
│   ├── api.js           向後端 fetch 真實資料，四類各自完成各自更新畫面
│   ├── layout.js        header/footer/導覽列動態注入
│   ├── components.js    渲染函式（新聞卡片、篩選、分頁、市場快照側欄）
│   └── main.js           頁面進入點，依 <body data-page> 分派渲染
└── server/
    ├── server.js         Express 主程式：serve 靜態檔案 + 掛載 /api/* 路由
    ├── .env               FRED_API_KEY 放這裡（不會被 git 追蹤）
    └── routes/
        ├── rates.js       匯率
        ├── indicators.js  台美經濟指標 + 景氣對策信號
        ├── sentiment.js   VIX + CNN 貪婪恐懼指數
        └── news.js        Bing 新聞搜尋（改動最多次的檔案）
```

**本機開發**：
```powershell
cd server
npm install     # 只需要第一次
node server.js  # 監聽 8000 埠，開瀏覽器 http://localhost:8000
```
改 CSS/JS 之後記得同步把 6 個 HTML 頁面裡的 `?v=N` 快取版本號 +1，不然瀏覽器可能吃到舊快取。

## 各資料來源的具體做法與踩過的雷

### 匯率（rates.js）
- **來源**：Yahoo Finance chart API（`query1.finance.yahoo.com/v8/finance/chart/TWD=X` 和 `JPY=X`），不需要金鑰，即時盤中報價。
- 一開始用 ExchangeRate-API（open.er-api.com），但那個**只有每天更新一次**，改用 Yahoo。
- 曾經想改用台灣銀行牌告匯率（rate.bot.com.tw），但**該網站有防機器人的 JS challenge**，一般 fetch 會被擋下來（拿到「請驗證」頁面不是真資料），需要真的瀏覽器才能通過，放棄這條路。
- Yahoo 回傳的時間戳是 UTC，**顯示前要 +8 小時轉成台灣時間**，不然會顯示成「比現在早8小時」的錯誤時間，讓使用者以為資料不即時。

### 台美經濟指標（indicators.js）
- 台灣 CPI/PPI：勞動部轉發主計總處的資料（`apiservice.mol.gov.tw`）。回傳的 JSON 中文欄名在某些環境會有編碼問題，改用**陣列索引位置**（`Object.values(record)[index]`）讀取，不依賴欄名字串比對。
- 台灣 GDP 成長率：原本也用上面同一份資料，但發現**那份資料集更新很慢**（曾經卡在只到5月的資料，跟不上主計總處官方公布進度）。改用主計總處自己的官方季資料（`data.gov.tw` dataset **6799**，XML 格式，`Item`欄位找 `"經濟成長率(%)"`）。
  - 這個來源的網域 `ws.dgbas.gov.tw` **憑證鏈結不完整**，Node 內建 fetch 會嚴格拒絕（`UNABLE_TO_VERIFY_LEAF_SIGNATURE`），瀏覽器通常會容忍但 Node 不會。用 `https.get({rejectUnauthorized:false})` 繞過，**只針對這一個政府統計網域**，不影響其他請求，因為只是讀公開數字沒有敏感資料交換。
- 景氣對策信號：國發會官方資料（`data.gov.tw` dataset **6099**），資料**包成 ZIP**，裡面才是真正的 CSV（`景氣指標與燈號.csv`）。用 `adm-zip` 套件解壓縮讀取。這個 API **常常回傳空內容**（該平台 CDN 快取問題），已加重試機制（3次、每次間隔500ms）。5種燈號對應 emoji：紅🔴／黃紅🟠／綠🟢／黃藍🟡／藍🔵。
- 台灣央行重貼現率：**已經拿掉**。原本用 `cpx.cbc.gov.tw` 的 API，但這個 API 持續不穩定（測試時常常回傳空內容），使用者確認後直接移除這個指標，不留錯誤訊息。
- 美國 CPI/PPI/GDP/聯邦基金利率：FRED（美國聯準會），**需要金鑰**，使用者自己去 https://fredaccount.stlouisfed.org/apikeys 申請免費金鑰，填在 `server/.env` 的 `FRED_API_KEY`。
- **美國 ISM 製造業 PMI 跟台灣 PMI 都沒有收錄**：ISM 從2016年起把資料從 FRED 下架（現在要付費訂閱才能拿到），台灣的 PMI 也沒找到免費即時來源。這是已知且接受的限制，不要再花時間找免費 PMI 來源，已經確認過沒有。

### 美國市場情緒指標（sentiment.js）
- VIX 恐慌指數：Yahoo Finance（`^VIX`，即 `%5EVIX`），跟匯率同一個技術路線。
- CNN 貪婪與恐懼指數：CNN **非官方**端點（`production.dataviz.cnn.io/index/fearandgreed/graphdata`），這是逆向工程找到的，**沒有官方文件**，需要偽裝 `User-Agent` 跟 `Referer` header 才能通過。理論上 CNN 隨時可能改版讓這個端點失效，屆時會自動 fallback 顯示示範資料。

### 新聞（news.js）— 改動最多次、最多坑的部分
- **資料來源演進史**：Google 新聞 RSS → Bing 新聞 RSS（現在用的）。
  - Google 新聞 RSS 的連結是要靠瀏覽器 JS 才能解析的跳轉頁，要拿到真實網址跟摘要，得用一套逆向工程技巧：抓 `data-n-a-sg`/`data-n-a-ts` 簽章 → POST 到 `news.google.com/_/DotsSplashUi/data/batchexecute` → 解析巢狀 JSON 拿到真實網址 → 再抓一次真實網址拿 `og:description` 當摘要。**技術上驗證成功過**，但實測用量一大就會被 Google 回 429 限流，不穩定到不能用，已經放棄。
  - 改用 Bing 新聞 RSS 之後：真實網址直接在轉址連結的 `url=` 參數裡（URL decode 就拿到，不用額外請求），而且 `<description>` 欄位本身就有真的摘要片段（不像 Google 只重複標題），完全不需要上面那套解碼流程。
  - Bing 的版權聲明比 Google 更嚴格（「除了在對應樣式表及網頁中轉譯，不得以任何方式使用/複製/傳輸」），**使用者已經明確確認**：此網站非商業用途，僅個人/工作參考+分享給朋友，接受這個風險，不需要再問。
- Bing 新聞 RSS **不支援 `OR` 多關鍵字合併查詢**（`q=A OR B` 會查不到結果），所以每個群組要把關鍵字拆開分別查詢，再合併去重。
- **一定要加 `qft=sortbydate%3D%221%22%2Binterval%3D%2230%22` 這個參數**，否則 Bing 預設用「相關性」排序，會挖出好幾年前的舊新聞（實測抓到過 2011 年的文章）。這個參數讓結果依時間排序、限制在最近約30天。
- 新聞去重原本用「網址」比對，但同一篇文章透過不同關鍵字查到時，Bing 的轉址參數常常有些微差異（例如追蹤參數不同），改成用「**標題**」（去除空白後）比對去重，比網址可靠。
- **群組分類邏輯**：先讓每個群組各自用自己的關鍵字去查，查到的結果全部合併後，**依標題內容用固定優先順序重新判斷**最終該歸屬哪個群組（`processor > wafer > memory > packaging > network`），不是原始查到時掛的那個群組直接採用。原因：公司名稱常常跨群組出現（例如講 Broadcom 網通晶片的新聞標題也可能提到輝達），如果不重新判斷，輝達/AMD相關新聞就可能被誤歸到網卡模組群組。
- **新聞類型分類**（`classifyType`）：`new-product`(新品發表) > `patent-dispute`(侵權/專利) > `supply-demand`(供需) > `stock-analysis`(股市分析) > 預設 `market-analysis`(市場分析)，這個檢查順序是刻意排的，都是用標題關鍵字比對，不是人工判斷。
- Bing 新聞搜尋結果偶爾會混進「股票公司資訊卡」而不是真新聞（標題只是公司英文法定全名，例如「Marvell Technology, Inc.」，摘要是財務數據免責聲明樣板文字），用正規表達式偵測並過濾掉（`isStockProfileCard`）。
- **時區bug（重要，修過兩次同一類問題）**：`pubDate` 是 UTC 時間，台灣比 UTC 快8小時。如果直接對 UTC 時間戳取日期部分，**台灣時間清晨0-8點發布的新聞會被誤算成前一天**，讓「今天」的新聞量看起來異常稀少、「昨天」異常暴增。已經在 `rates.js`（時間戳顯示）跟 `news.js`（`toTaipeiDate` 函式）都修正過。**以後任何地方要把 pubDate/時間戳轉成日期顯示，都要先 +8小時再取日期部分，不要直接用 UTC。**
- **已知限制，不是bug**：新聞完全依賴 Bing 有沒有收錄該篇文章。剛發布幾小時內的文章、或 Bing 較少收錄的來源網站（某些台灣財經網站），即使關鍵字完全對得上也可能暫時搜不到。已經實際驗證過這個現象（用使用者提供的真實文章連結測試，確認是 Bing 索引延遲，不是我們的邏輯錯誤）。

## 前端行為細節

- **首頁**：5個料件群組各顯示最新5則（橫條清單樣式，`.feature-list`，不做類型篩選），右上角是「市場快照」側欄（今日匯率／台灣經濟指標／美國經濟指標／美國市場情緒指標）。側欄**不是** sticky／固定黏著，使用者明確要求改成跟頁面內容一起正常滾動。
- **分類頁**（processor/network/memory/packaging/wafer.html）：搜尋框（`expandSearchTerms` 支援中英文同義詞比對，例如打 "Intel" 也會比對到「英特爾」）+ 時間篩選（全部／近三天）+ 類型篩選（全部／市場分析／股市分析／供需／新品發表／侵權專利）+ 分頁（每頁9則），三種篩選可以同時組合使用。
- 所有真實資料來源失敗時，會自動 fallback 顯示 `js/data.js` 裡的示範資料（`isDemo:true`，畫面上有「示範資料」標籤），並在頁面上方顯示橘色提示列（`#data-notice`）列出哪些項目失敗、原因是什麼。
- **漸進式更新**（`js/api.js` 的 `loadLiveData(onCategoryDone)`）：匯率／指標／市場情緒／新聞四類資料**各自完成各自觸發畫面更新**，不會互相等待卡住（例如新聞通常最慢，因為要查20-30個關鍵字，但匯率/指標很快，不應該被新聞拖著一起等）。`main.js` 裡有依頁面類型判斷只重畫「跟這項資料實際有關」的區塊：分類頁只有新聞資料完成時才重畫（因為分類頁只顯示新聞，跟匯率/指標/情緒無關），避免使用者正在打搜尋字或已選的篩選/分頁狀態被無關的資料更新打斷重置。

## Git / 部署流程

一般開發完直接：
```bash
git add -A
git commit -m "..."
git push origin main
```
Render 會自動偵測並重新部署（通常1-2分鐘），但**偶爾 webhook 沒觸發**，push 後過一陣子網站沒變化時，去 Render dashboard 手動點「Manual Deploy」→「Deploy latest commit」補一次（詳見「部署資訊」那節）。

## 已知限制 / 曾經考慮過但確認做不到或已放棄的方向

- 台灣、美國的 PMI 都沒有免費即時來源，已確認放棄，不用再找。
- 台灣央行重貼現率已經拿掉（來源 API 不穩定）。
- Google 新聞的真實摘要抓取技術上可行但會被限流，已放棄，改用 Bing。
- 免費方案（Render）的休眠喚醒延遲（20-60秒）是平台限制，要秒開需升級付費方案。
- 新聞的分類（群組/類型）都是關鍵字比對，不是人工編輯，有一定機率不準確；發現有明顯分類錯誤時，通常是「該群組/類型的關鍵字清單缺了某個常見公司名稱或詞彙」，補進 `GROUP_KEYWORDS` 或對應的 `*_KEYWORDS` 陣列即可修正（可以參考本文件「新聞」段落列的排查方式）。

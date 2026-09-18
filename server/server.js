const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");

const ratesRouter = require("./routes/rates");
const indicatorsRouter = require("./routes/indicators");
const sentimentRouter = require("./routes/sentiment");
const newsRouter = require("./routes/news");

const app = express();
const PORT = process.env.PORT || 8000;
const PROJECT_ROOT = path.join(__dirname, "..");

// 擋掉對 /server 目錄的直接存取，避免暴露後端程式碼與設定
app.use((req, res, next) => {
  if (req.path.startsWith("/server")) return res.status(404).end();
  next();
});

app.use("/api/rates", ratesRouter);
app.use("/api/indicators", indicatorsRouter);
app.use("/api/sentiment", sentimentRouter);
app.use("/api/news", newsRouter);

app.use(express.static(PROJECT_ROOT, { dotfiles: "ignore" }));

app.listen(PORT, () => {
  console.log(`供應鏈新聞觀測站伺服器已啟動：http://localhost:${PORT}`);
});

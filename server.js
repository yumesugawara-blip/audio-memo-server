console.log("★★★★ server.js 起動テスト ★★★★");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ================================
// Routes
// ================================

const healthRoutes = require("./routes/health");
console.log("health 読み込み");

const voiceRoutes = require("./routes/voice");
console.log("voice 読み込み");

const soapRoutes = require("./routes/soap");
console.log("soap 読み込み");

const chartRoutes = require("./routes/chart");
console.log("chart 読み込み");

// ================================
// API
// ================================

app.use("/api/health", healthRoutes);
console.log("/api/health 登録");

app.use("/api/voice", voiceRoutes);
console.log("/api/voice 登録");

app.use("/api/soap", soapRoutes);
console.log("/api/soap 登録");

app.use("/api/chart", chartRoutes);
console.log("/api/chart 登録");

// ================================
// Start Server
// ================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {

    console.log("--------------------------------");
    console.log(`${process.env.APP_NAME} を起動しました`);
    console.log(`http://localhost:${PORT}`);
    console.log("--------------------------------");

});

// サーバー情報表示
console.log("server.address() =", server.address());

// サーバーが閉じたら表示
server.on("close", () => {
    console.log("★★★★ server closed ★★★★");
});

// プロセス終了時
process.on("exit", (code) => {
    console.log("★★★★ process exit:", code);
});

// 終了直前
process.on("beforeExit", (code) => {
    console.log("★★★★ beforeExit:", code);
});

// 例外
process.on("uncaughtException", (err) => {
    console.error("★★★★ uncaughtException ★★★★");
    console.error(err);
});

// Promiseエラー
process.on("unhandledRejection", (err) => {
    console.error("★★★★ unhandledRejection ★★★★");
    console.error(err);
});
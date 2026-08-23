const express = require("express");
const router = express.Router();

console.log("① soap.js 読み込み開始");

const soapController = require("../controllers/soapController");

console.log("② soapController 読み込み完了");

router.post("/", soapController.createSOAP);

console.log("③ POST登録完了");

module.exports = router;
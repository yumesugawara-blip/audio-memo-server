const chartService = require("../services/chartService");
const kintoneService = require("../services/kintoneService");

console.log("★★★★ 新しい chartController.js が読み込まれました ★★★★");

exports.createChart = async (req, res) => {

    try {

        console.log("① chartController 開始");

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "音声ファイルがありません。"
            });
        }

        console.log("② Gemini実行");

        const result = await chartService.createChart(req.file);

        console.log("③ Gemini完了");
        console.log(result);

        console.log("④ kintone登録開始");

        await kintoneService.createRecord(result.soap);

        console.log("⑤ kintone登録完了");

        res.json({
            success: true,
            transcript: result.transcript,
            soap: result.soap
        });

    } catch (error) {

        console.error("★★★★ chartController ERROR ★★★★");
        console.error(error);

        if (error.response) {
            console.error("HTTP Status:", error.response.status);
            console.error("Response:", error.response.data);
        }

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
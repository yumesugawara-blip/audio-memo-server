const voiceService = require("../services/voiceService");

exports.transcribe = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "音声ファイルがありません。"
            });
        }

        const soap = await voiceService.transcribe(req.file);

        return res.json({
            success: true,
            soap
        });

    } catch (error) {

        console.error("========== Voice Controller Error ==========");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message || "音声解析に失敗しました。"
        });

    }

};
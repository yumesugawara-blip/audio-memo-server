const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const prompt = fs.readFileSync(
    path.join(__dirname, "../AI_RULES_CHART.md"),
    "utf8"
);

exports.createChart = async (file) => {

    try {

        console.log("========== createChart ==========");
        console.log("ファイル名:", file.originalname);
        console.log("MIME:", file.mimetype);
        console.log("サイズ:", file.size);

        const base64Audio = file.buffer.toString("base64");

        const mimeType =
            file.mimetype === "application/octet-stream"
                ? "audio/webm"
                : file.mimetype;

        console.log("Gemini API 呼び出し開始");

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",

            config: {
                responseMimeType: "application/json"
            },

            contents: [
                {
                    text: prompt
                },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                }
            ]
        });

        console.log("Gemini API 呼び出し完了");

        const text =
            typeof response.text === "function"
                ? response.text()
                : response.text;

        console.log("========== Gemini Response ==========");
        console.log(text);

        const result = JSON.parse(text);

        return {
            transcript: result.transcript || "",
            soap: result.soap || ""
        };

    } catch (error) {

        console.error("========== ERROR ==========");
        console.error(error);

        throw error;
    }

};
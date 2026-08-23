const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

// Gemini SDK クライアント初期化
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/**
 * Prompt Object からテキストを取り出すヘルパー関数
 * @param {string|object} prompt 
 * @returns {string}
 */
function extractPromptText(prompt) {
    if (typeof prompt === "string") return prompt;
    if (!prompt) return "";
    return prompt.soapPrompt || prompt.default || prompt.prompt || JSON.stringify(prompt);
}

/**
 * Gemini API のエラーを解析し、原因別のメッセージを返す
 * @param {Error} error 
 * @returns {string}
 */
function formatGeminiError(error) {
    const msg = error.message || String(error) || "";
    console.error("========== [Gemini API Raw Error Detail] ==========");
    console.error("Status Code:", error.status);
    console.error("Message:", msg);
    console.error("=================================================");

    if (error.status === 429 || msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return "Gemini APIの利用制限に達しました。Google AI Studio または Cloud Console でAPIキーの利用制限（Billing / Quota）をご確認ください。";
    }

    if (error.status === 400 || msg.includes("API key not valid") || msg.includes("API_KEY_INVALID")) {
        return "Gemini APIキーが無効です。.env ファイルの GEMINI_API_KEY を最新のキーに更新してください。";
    }

    if (msg.includes("has not been used in project") || msg.includes("disabled")) {
        return "Google Cloudプロジェクトで Generative Language API が有効化されていません。";
    }

    return `Gemini APIエラー: ${msg}`;
}

/**
 * 現在の API キーで実際に利用可能なモデル一覧を自動取得する
 * @returns {Promise<string[]>}
 */
async function getActiveModels() {
    try {
        console.log("[Gemini Service] 利用可能モデルを自動探索中...");
        const listResponse = await ai.models.list();
        let models = [];

        if (Array.isArray(listResponse)) {
            models = listResponse;
        } else if (listResponse && Array.isArray(listResponse.models)) {
            models = listResponse.models;
        } else if (listResponse && typeof listResponse[Symbol.asyncIterator] === 'function') {
            for await (const m of listResponse) {
                models.push(m);
            }
        }

        // 発見されたモデルから generateContent 対応のモデル名を抽出
        const validModelNames = models
            .map(m => (m.name || m.id || "").replace(/^models\//, ""))
            .filter(name => name.includes("gemini") && !name.includes("embedding"));

        if (validModelNames.length > 0) {
            console.log("[Gemini Service] ★ 発見された有効モデルリスト:", validModelNames.join(", "));
            return validModelNames;
        }
    } catch (err) {
        console.warn("[Gemini Service] モデル自動探索失敗 (既定モデルにフォールバック):", err.message || err);
    }

    // 自動取得ができない場合のフォールバック優先候補
    return [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash",
        "gemini-pro"
    ];
}

exports.generateSOAP = async (prompt) => {
    try {
        const promptText = extractPromptText(prompt);
        const candidateModels = await getActiveModels();
        let errors = [];

        for (const modelName of candidateModels) {
            try {
                console.log(`[Gemini Service] テキスト解析試行中 (モデル: ${modelName})...`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: promptText
                });

                const soap = response.text?.trim();
                if (soap) {
                    console.log(`[Gemini Service] ★ 成功 (使用モデル: ${modelName})`);
                    return soap;
                }
            } catch (err) {
                console.warn(`[Gemini Service] モデル ${modelName} 失敗:`, err.message || err);
                errors.push(`${modelName}: ${err.message || err}`);
            }
        }

        throw new Error(`全モデル試行失敗: ${errors.join(" / ")}`);

    } catch (error) {
        console.error("========== Gemini Service Text Error ==========");
        throw new Error(formatGeminiError(error));
    }
};

exports.generateSOAPFromAudio = async (file, prompt) => {
    try {
        if (!file) {
            throw new Error("音声ファイルが送信されていません。");
        }

        let audioBuffer;
        if (file.buffer && Buffer.isBuffer(file.buffer)) {
            audioBuffer = file.buffer;
        } else if (file.path) {
            audioBuffer = fs.readFileSync(file.path);
        } else {
            throw new Error("音声ファイルのデータバッファを取得できませんでした。");
        }

        const base64Audio = audioBuffer.toString("base64");

        let mimeType = file.mimetype ? file.mimetype.split(';')[0].trim() : 'audio/webm';
        if (mimeType === "application/octet-stream" || !mimeType) {
            const name = (file.originalname || "").toLowerCase();
            if (name.endsWith(".m4a") || name.endsWith(".mp4")) {
                mimeType = "audio/mp4";
            } else if (name.endsWith(".mp3")) {
                mimeType = "audio/mpeg";
            } else if (name.endsWith(".wav")) {
                mimeType = "audio/wav";
            } else if (name.endsWith(".ogg")) {
                mimeType = "audio/ogg";
            } else {
                mimeType = "audio/webm";
            }
        }

        const promptText = extractPromptText(prompt);
        console.log(`[Gemini Service] 音声データ準備完了. MIME: ${mimeType}, サイズ: ${audioBuffer.length} bytes`);

        const requestContents = [
            promptText,
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Audio
                }
            }
        ];

        // APIキーで現在アクティブなモデルを動的検出
        const candidateModels = await getActiveModels();
        let errors = [];

        for (const modelName of candidateModels) {
            try {
                console.log(`[Gemini Service] 音声AI解析中 (試行モデル: ${modelName})...`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: requestContents
                });

                const soap = response.text?.trim();
                if (soap) {
                    console.log(`[Gemini Service] ★ SOAP自動生成成功！ (成功モデル: ${modelName})`);
                    return soap;
                }
            } catch (err) {
                console.warn(`[Gemini Service] モデル ${modelName} 失敗:`, err.message || err);
                errors.push(`${modelName}: ${err.message || err}`);
            }
        }

        throw new Error(`全モデルで生成失敗: ${errors.join(" / ")}`);

    } catch (error) {
        console.error("========== Gemini Audio Service Error ==========");
        throw new Error(formatGeminiError(error));
    }
};
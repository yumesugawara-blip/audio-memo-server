const soapPrompt = require("../prompts/soapPrompt");
const geminiService = require("./geminiService");

exports.createSOAP = async (message) => {

    try {

        if (!message || !message.trim()) {
            throw new Error("入力内容がありません。");
        }

        const prompt = `
${soapPrompt}

----------------------------------------

【施術者メモ】

${message}
`;

        const soap = await geminiService.generateSOAP(prompt);

        return soap;

    } catch (error) {

        console.error("========== SOAP Service Error ==========");
        console.error(error);

        throw new Error("SOAPの生成に失敗しました。");

    }

};
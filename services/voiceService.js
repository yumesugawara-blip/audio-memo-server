const speech = require('@google-cloud/speech');

// Google Speech-to-Text クライアント初期化
let speechClient;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  speechClient = new speech.SpeechClient({ credentials });
} else {
  speechClient = new speech.SpeechClient();
}

/**
 * 医療音声誤認識の自動補正辞書関数
 */
function cleanCommandText(text) {
  if (!text) return '';
  let cleaned = text;

  // 1. コマンドフレーズを除去
  cleaned = cleaned.replace(/メモスタート|スタート|録音開始|メモストップ|ストップ|カルテストップ|録音停止/g, '');

  // 2. 不要な「メモ」「めも」「でも」を除去
  cleaned = cleaned.replace(/^[\s\n]*(メモ|めも|でも)[\s\n]*/g, '');
  cleaned = cleaned.replace(/[\s\n]*(メモ|めも|でも)[\s\n]*$/g, '');
  cleaned = cleaned.replace(/\s(メモ|めも|でも)\s/g, ' ');

  // 3. 医療・施術音声誤認識の補正辞書
  cleaned = cleaned.replace(/23時間|23\s*時間|2[・･、, \s]3時間|にさんじかん/g, '2～3時間');
  cleaned = cleaned.replace(/借り|かえり/g, '帰り');
  cleaned = cleaned.replace(/し\s*生殺で?|生殺で?|しせいさつえい/g, '姿勢撮影');
  cleaned = cleaned.replace(/きょくじょうきん|極上筋/g, '棘上筋');
  cleaned = cleaned.replace(/きょっかきん|極化\s*金|極化金/g, '棘下筋');
  cleaned = cleaned.replace(/ぜんじゅうじじんたい|全十字靭帯/g, '前十字靭帯');
  cleaned = cleaned.replace(/こうじゅうじじんたい|後縦靭帯/g, '後十字靭帯');
  cleaned = cleaned.replace(/充電\s*金|充電金|ちゅうでんきん/g, '中殿筋');
  cleaned = cleaned.replace(/転勤|でんきん/g, '殿筋');
  cleaned = cleaned.replace(/だいたい\s*金額\s*貯金|だいたい金額貯金|大腿金額貯金|だいたいきんまくちょうきん/g, '大腿筋膜張筋');
  cleaned = cleaned.replace(/船長関節|せんちょうかんせつ/g, '仙腸関節');
  cleaned = cleaned.replace(/ハム|はむ/g, 'Ham');
  cleaned = cleaned.replace(/ぶろっくはいぼると|ブロックハイボルト|ブロックハイボル|ぶろはい|BLハイボルト/g, 'BLHV');
  cleaned = cleaned.replace(/ブロック|ぶろっく/g, 'BL');
  cleaned = cleaned.replace(/ハイボルト|ハイボル/g, 'HV');
  cleaned = cleaned.replace(/ショッガン/g, 'ショットガン');
  cleaned = cleaned.replace(/mcr|えむしーあーる/g, 'MCR');
  cleaned = cleaned.replace(/ちゅうないしょう|肘内症|中内症|柱内症/g, '肘内障');
  cleaned = cleaned.replace(/制服|せいふく/g, '整復');
  cleaned = cleaned.replace(/線中|せんちゅう/g, '仙中');
  cleaned = cleaned.replace(/抽選|ちゅうせん/g, '中仙');
  cleaned = cleaned.replace(/延長/g, '炎症');
  cleaned = cleaned.replace(/海鮮|かいせん/g, '回旋');
  cleaned = cleaned.replace(/退屈|体屈|ていくつ|テイク2|テイク２|ていく2|ていく２/g, '底屈');
  cleaned = cleaned.replace(/会内|かいない/g, '回内');
  cleaned = cleaned.replace(/会外|かいがい|海外/g, '回外');
  cleaned = cleaned.replace(/外観|外かん|がいはん/g, '外反');
  cleaned = cleaned.replace(/内観|内かん|ないはん/g, '内反');
  cleaned = cleaned.replace(/くっきょく/g, '屈曲');
  cleaned = cleaned.replace(/進展|しんてん/g, '伸展');
  cleaned = cleaned.replace(/がいてん/g, '外転');
  cleaned = cleaned.replace(/ないてん/g, '内転');
  cleaned = cleaned.replace(/始動/g, '指導');
  cleaned = cleaned.replace(/ロム|ろむ/g, 'ROM');
  cleaned = cleaned.replace(/梅雨\s*流し|つういんうながし/g, '通院促し');
  cleaned = cleaned.replace(/鹿島|かしまに/g, '下肢マニ');
  cleaned = cleaned.replace(/会談/g, '階段');

  return cleaned.trim();
}

/**
 * 音声バイナリからテキストへ文字起こしするサービス関数
 */
exports.transcribe = async (file) => {
  try {
    if (!file || !file.buffer) {
      throw new Error("有効な音声ファイルが受信できませんでした。");
    }

    console.log("【Google Speech-to-Text 解析開始】");
    console.log("ファイル名:", file.originalname || "blob");
    console.log("MIME:", file.mimetype);
    console.log("サイズ:", file.buffer.length, "bytes");

    const audioBytes = file.buffer.toString('base64');

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
        speechContexts: [{
          phrases: [
            '棘上筋', '棘下筋', '前十字靭帯', '後十字靭帯', '仙腸関節', '中殿筋', 
            '大腿筋膜張筋', '下肢マニ', 'BLHV', 'HV', 'MCR', '肘内障', '整復', 
            '底屈', '回旋', '殿筋', 'Ham', '姿勢撮影', '通院促し'
          ]
        }]
      },
    };

    const [response] = await speechClient.recognize(request);
    
    let rawTranscript = "";
    if (response.results && response.results.length > 0) {
      rawTranscript = response.results
        .map(result => result.alternatives[0]?.transcript || '')
        .join('\n');
    }

    const cleanedText = cleanCommandText(rawTranscript);
    console.log("【文字起こし＆補正結果】:", cleanedText);

    return cleanedText;

  } catch (error) {
    console.error("========== Voice Service Error ==========");
    console.error("Error Message:", error.message);
    throw error;
  }
};
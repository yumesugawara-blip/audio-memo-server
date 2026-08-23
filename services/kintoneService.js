const axios = require("axios");

exports.createRecord = async (soap) => {

    console.log("========== kintoneService ==========");
    console.log("SOAP:");
    console.log(soap);

    try {

        const url = `${process.env.KINTONE_DOMAIN}/k/v1/record.json`;

        console.log("URL:", url);
        console.log("APP ID:", process.env.KINTONE_APP_ID);

        const body = {
            app: Number(process.env.KINTONE_APP_ID),
            record: {

                treatment_table: {
                    value: [
                        {
                            value: {
                                treatment_detail: {
                                    value: soap
                                }
                            }
                        }
                    ]
                }

            }
        };

        console.log("送信データ:");
        console.log(JSON.stringify(body, null, 2));

        const response = await axios.post(url, body, {
            headers: {
                "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN,
                "Content-Type": "application/json"
            }
        });

        console.log("========== kintone登録成功 ==========");
        console.log(response.data);

        return response.data;

    } catch (error) {

        console.log("========== kintone登録エラー ==========");

        if (error.response) {
            console.log("HTTP Status:", error.response.status);
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }

        throw error;
    }

};
const soapService = require("../services/soapService");

exports.createSOAP = async (req, res) => {

    try {

        const { message } = req.body;

        const soap = await soapService.createSOAP(message);

        res.json({
            success: true,
            soap
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
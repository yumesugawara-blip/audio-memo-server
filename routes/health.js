const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Voice AI Platform API"
    });
});

module.exports = router;
const express = require("express");
const multer = require("multer");

const router = express.Router();

const chartController = require("../controllers/chartController");

const upload = multer({
    storage: multer.memoryStorage()
});

router.post(
    "/",
    upload.single("audio"),
    (req, res, next) => {

        console.log("★★★★★ routes/chart.js に到達 ★★★★★");

        console.log("chartController =", chartController);
        console.log("createChart =", chartController.createChart);

        next();

    },
    chartController.createChart
);

module.exports = router;
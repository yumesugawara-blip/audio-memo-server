const express = require("express");
const multer = require("multer");

const router = express.Router();

const voiceController = require("../controllers/voiceController");

const upload = multer({

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 30 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowTypes = [
            "audio/mp4",
            "audio/mpeg",
            "audio/wav",
            "audio/x-wav",
            "audio/webm",
            "audio/ogg",
            "application/octet-stream"
        ];

        if (allowTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("対応していない音声形式です。"));
        }

    }

});

router.post(
    "/",
    upload.single("audio"),
    voiceController.transcribe
);

module.exports = router;
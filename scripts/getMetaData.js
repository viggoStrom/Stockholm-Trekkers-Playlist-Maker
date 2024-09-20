const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("node:path")
const raiseError = require("./raiseError.js");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

const getMetaData = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (error, metadata) => {
            if (error) {
                console.log("[ERROR] getMetaData: ", error);
                reject(raiseError("getMetaData", error));
            } else {
                console.log("[INFO] getMetaData: ", metadata);
                resolve(metadata);
            }
        });
    });
};

const setUpHandlers = () => {
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);

    ipcMain.handle("get-meta-data", getMetaData);
};

module.exports = { setUpHandlers };

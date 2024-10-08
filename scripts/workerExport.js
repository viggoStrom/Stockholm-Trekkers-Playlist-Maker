const { parentPort } = require("worker_threads");
const path = require("node:path");
const fs = require("node:fs");
const { copyAllAssets } = require("./export.js");
const raiseError = require("./raiseError.js")

parentPort.on("message", (message) => {
    console.log("[INFO] Worker started working");
    copyAllAssets(message.projectJSON, message.projectFolder);
});

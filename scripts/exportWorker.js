const { parentPort } = require("worker_threads");
const { dialog } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const raiseError = require("./raiseError.js");
const { projectExport } = require("../scripts/export.js");

parentPort.on("message", (id) => {
    projectExport(id);
});
"use strict";
require("../extend/console.js"); // Adds more verbose logging to the console and colors!

const { ipcMain } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");

const openFilePath = (folderPath) => {
    const fullPath = path.resolve(folderPath); // Resolves the absolute path

    if (process.platform === "win32") { // Windows
        spawn("explorer", [fullPath], { shell: true });

    } else if (process.platform === "linux") { // Linux
        spawn("xdg-open", [fullPath]);

    } else if (process.platform === "darwin") { // macOS which I don't build for but why not have it here
        spawn("open", [fullPath]);

    } else {
        console.error("Unsupported platform or error in openFilePath.js");
    }
};

const ipcHandlers = () => {
    ipcMain.handle("open-file-path", (event, folderPath) => {
        openFilePath(folderPath);
    });
};

module.exports = { ipcHandlers };
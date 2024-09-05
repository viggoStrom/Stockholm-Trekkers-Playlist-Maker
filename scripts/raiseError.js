
const { BrowserWindow } = require("electron");

const raiseError = (message) => {
    const windows = BrowserWindow.getAllWindows();

    windows.forEach(window => {
        window.webContents.executeJavaScript(`raiseError("${message}")`);
    });
}; 

module.exports = raiseError;
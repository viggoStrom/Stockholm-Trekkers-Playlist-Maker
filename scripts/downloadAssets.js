const { BrowserWindow, session, ipcMain } = require("electron");
const fs = require("fs");
const path = require("node:path")
const raiseError = require("./raiseError.js");

const logStatus = {
    start: "[STARTED] ",
    end: "[FINISHED] ",
    info: "[INFO] ",
    error: "[ERROR] ",
    download: "[DOWNLOADING] ",
};

const downloadStatus = {
    "fileCount": 0,
    "atFile": 0,
    "status": "",
    "name": "",
    "size": 0,
    "received": 0,
    "percent": 0,
};

const updateStatus = (
    atFile = downloadStatus.atFile,
    status = downloadStatus.status,
    name = downloadStatus.name,
    size = downloadStatus.size,
    received = downloadStatus.received,
    percent = downloadStatus.percent,
    fileCount = downloadStatus.fileCount
) => {
    downloadStatus.atFile = atFile;
    downloadStatus.status = status;
    downloadStatus.name = name;
    downloadStatus.size = size;
    downloadStatus.received = received;
    downloadStatus.percent = percent;
    downloadStatus.fileCount = fileCount;
};

const filesExist = () => {
    const downloadRefs = JSON.parse(fs.readFileSync(path.join(__dirname, "fileIDs.json")));
    const videos = downloadRefs.videos;

    let fileCount = 0;

    videos.forEach(file => {
        if (fs.existsSync(path + file.name)) {
            fileCount++;
        }
    });

    return fileCount === videos.length;
};

const downloadPauses = (force = false) => {
    const videoFolder = path.join(__dirname, "../assets/videos/")

    // updateStatus(status = "setting things up")

    // If force downloading, delete the folder just to make sure
    if (force) {
        console.log(logStatus.info + "force downloading...");
        fs.rmSync(videoFolder, { recursive: true });
    } else {
        console.log(logStatus.info + "looking for files...");
    };

    // Check if the video folder exists and make it if it doesn't
    if (!fs.existsSync(videoFolder)) {
        fs.mkdirSync(videoFolder, { recursive: true });
    };

    const downloadRef = JSON.parse(fs.readFileSync(path.join(__dirname, "fileIDs.json")));
    const fileIDs = downloadRef.videos;
    let index = 0;

    // updateStatus(fileCount = fileIDs.length);

    const browser = new BrowserWindow({
        // show: false,
    });

    const getNextFile = () => {
        index++;

        if (index >= fileIDs.length - 1) {
            console.log(logStatus.end + "all videos downloaded");
            setTimeout(() => { browser.close(); }, 1000);

        } else {
            getFile(fileIDs[index]);
        }
    }

    const getFile = (file) => {
        if (!file) {
            console.error(logStatus.error + "no file");
            return;
        }

        // If the video is already downloaded and we're not forcing, skip it
        if (fs.existsSync(videoFolder + file.name) && !force) {
            console.log(logStatus.info + file.name + " already downloaded");
            getNextFile();
            return;

        } else {
            console.log(logStatus.start + file.name);
        };

        // Sets where the downloaded file will end up and what to do when the download is under way and when it's done
        browser.webContents.session.once("will-download", (event, item, webContents) => {

            item.setSavePath(videoFolder + file.name);

            item.on("updated", (event, state) => {
                if (state === "interrupted") {
                    console.warn(logStatus.error + "download is interrupted but can be resumed");
                    raiseError("download is interrupted");

                } else if (state === "progressing") {
                    if (item.isPaused()) {
                        console.warn(logStatus.error + `download of ${file.name} is paused`);
                        raiseError(`download of ${file.name} is paused`);

                    } else {
                        const received = item.getReceivedBytes();
                        const total = item.getTotalBytes();
                        const percent = (received / total * 100).toFixed(0);
                        const MB = (received / 1024 / 1024).toFixed(0);

                        console.log(logStatus.download + `${file.name} received ${percent}% ${MB} MB`);
                    };
                };
            });

            item.once("done", (event, state) => {
                if (state === "completed") {
                    console.log(logStatus.end + `download of ${file.name} completed successfully`);
                    getNextFile();

                } else {
                    console.error(logStatus.download + `download failed with state: ${state}`);
                    raiseError(`download failed with state: ${state}`);
                };
            });
        });

        setTimeout(() => {
            browser.loadURL(downloadRef.urlTemplate + file.id);
            browser.webContents.on("did-finish-load", () => {
                // Clicks the download button on the loaded page
                // This will break if Google changes how Drive works 
                // Theres a try-catch block in there but that's only gonna do so much
                browser.webContents.executeJavaScript(`try{document.getElementById("uc-download-link").click();} catch (error) {console.error(error); raiseError(error);}`);
            });
        }, 500);
    };

    getFile(fileIDs[index]);
};


const setUpHandlers = () => {
    ipcMain.handle("start-download", () => {
        downloadPauses();
        return;
    });

    ipcMain.handle("get-download-status", () => {
        return downloadStatus;
    });

    ipcMain.handle("check-for-local-files", () => {
        return filesExist();
    });

    console.log(logStatus.info + "handlers set up");
};

module.exports = { setUpHandlers };
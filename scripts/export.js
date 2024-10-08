const { ipcMain, dialog } = require("electron");
const { Worker, parentPort } = require("worker_threads");
const path = require("node:path");
const fs = require("node:fs");
const raiseError = require("./raiseError.js");
const { projectGet, projectFolder: userData } = require("./save/projects.js");

let copyWorker;

const exportStatus = {
    progress: "0%",
    message: "Making folders...",
    exportLocation: "",
};

const copyAllAssets = (projectJSON, exportFolder) => {
    // Copies the pause clips to the output folder
    const pauseFolder = path.join(__dirname, "..", "assets", "videos");

    // Update export status
    exportStatus.type = "status"; // This is added so the parent thread knows how to handle the post
    exportStatus.message = "Copying assets...";
    exportStatus.progress = "15%";
    parentPort.postMessage(exportStatus);

    // Copy the entire pauses folder to the output folder in /pauses
    console.log("[INFO] Copying pauses...");
    fs.mkdirSync(path.join(exportFolder, "pauses"));
    fs.cpSync(pauseFolder, path.join(exportFolder, "pauses"), { recursive: true });

    // Make episodes folder
    fs.mkdirSync(path.join(exportFolder, "episodes"));

    // Update export status
    exportStatus.message = "Copying episodes...";
    exportStatus.progress = "20%";
    parentPort.postMessage(exportStatus);

    // Loop through all the episodes and copy them from their given path to the output folder
    console.log("[INFO] Copying episodes...");
    projectJSON.blocks.forEach((block, blockIndex) => {
        block.episodes.forEach((episode, episodeIndex) => {

            // Update export status
            exportStatus.progress = `${20 + (80 / projectJSON.blocks.length / block.episodes.length) * (blockIndex * block.episodes.length + episodeIndex)}%`; // Gets a percent inbetween 20 and 100 based on which episode and block you are on
            parentPort.postMessage(exportStatus);

            // Check if the file path is missing or if the file is missing
            if (episode.filePath === "") { raiseError("Cannot find " + episode.fileName + ". The file path seems to be missing"); return; };
            if (!fs.existsSync(episode.filePath)) { raiseError("Cannot find " + episode.fileName + ". The file seems to be missing"); return; };

            // If a file with the same name already exists in the output folder, don't copy again
            if (fs.existsSync(path.join(exportFolder, "episodes", episode.fileName))) {
                console.log(`[WARN] A file (${episode.fileName}) wasn't copied due to the project already containing a file with the same name. This should be expected behavior when showing multiples of the same file but it could also be bad if files accidentally were named the same thing.`);
                return;
            };

            // Copy the episode to the output folder
            fs.copyFileSync(episode.filePath, path.join(exportFolder, "episodes", episode.fileName));
        });
    });

    // Copy the save file from user data to the output folder
    console.log("[INFO] Copying save file...");
    fs.mkdirSync(path.join(exportFolder, "projectSaveFile"));
    fs.copyFileSync(path.join(userData, projectJSON.id + ".json"), path.join(exportFolder, "projectSaveFile", projectJSON.id + ".json"));

    // Update export status
    exportStatus.message = "Done!";
    exportStatus.progress = "100%";
    parentPort.postMessage(exportStatus);
};

// Make the ps1 "harness" that runs VLC and runs the correct episodes at the correct times
const makePS1 = (projectJSON, exportFolder) => {
    console.log("[INFO] Making ps1 script...");

    // Update export status
    exportStatus.message = "Making ps1 script...";
    exportStatus.progress = "10%";

    const staticBeginning = `

# 
# This script was generated by the Stockholm Trekkers Playlist Generator program developed by Viggo Ström
# https://github.com/viggoStrom/Stockholm-Trekkers-Playlist-Maker
# 
# To use, simply run the script in PowerShell.
# It will start the playlist at the set start time and play the subsequent episodes at their start times while automatically insetting pauses in between.
#

$VLCpath = 'C:/Program Files/VideoLAN/VLC/vlc.exe'

$mainArgs = @(
    '--one-instance',
    '--fullscreen',

    '--sub-language=swe,eng,any',

    '--deinterlace=0',
    '--embedded-video',
    '--no-loop',
    '--no-play-and-pause',
    '--no-random',
    '--no-repeat',
    '--no-video-title-show',

    '--qt-auto-raise=0',
    '--qt-continue=0',
    '--qt-fullscreen-screennumber=1',
    '--qt-notification=0',
    '--no-qt-fs-controller',
    '--no-qt-name-in-title',
    '--no-qt-recentplay',
    '--no-qt-updates-notif'
)

# Function to wait until a specific time
# Example usage:
# Wait-UntilTime -Hour 10 -Minute 9
function Wait-UntilTime {
    param (
        [int]$Hour,
        [int]$Minute
    )

    $desiredTime = (Get-Date).Date.AddHours($Hour).AddMinutes($Minute)
    while ((Get-Date) -lt $desiredTime) {
        Start-Sleep -Seconds 1
    }
}

# Function to play a video
# Example usage:
# Play-Video -videoPath 'C:/path/to/episode.mkv' -playImmediately $true
function Play-Video {
    param (
        [string]$videoPath,
        [bool]$playImmediately = $false
    )
    
    # Initialize VLC argument list
    $copyOfArgs = @($mainArgs)

    # If not playing immediately, add the enqueue argument
    if (-not $playImmediately) {
        $copyOfArgs += '--playlist-enqueue'
    }

    # Append the video path
    $copyOfArgs += $videoPath

    # Call VLC with the arguments
    & $VLCpath $copyOfArgs

    # Small sleep to allow VLC to start or enqueue the video
    Start-Sleep -Milliseconds 100
}

# Function to insert a pause
# Example usage:
# Insert-Pause -pausePath 'C:/pauses/pause_30_min.mp4' -playImmediately $true
function Insert-Pause {
    param (
        [string]$pausePath,
        [bool]$playImmediately = $false
    )

    Play-Video -videoPath $pausePath -playImmediately $playImmediately
}

# Function to insert a leading clip
# Example usage:
# Insert-LeadingClip -clipPath 'C:/pauses/pause_1_min_countdown.mp4' -playImmediately $true
function Insert-LeadingClip {
    param (
        [string]$clipPath,
        [bool]$playImmediately = $false
    )

    Play-Video -videoPath $clipPath -playImmediately $playImmediately
}



#
# Inform the user that the playlist is "armed"
#
Write-host 'REMINDER: Remember to copy the playlist to the computer and do not run it directly from the USB drive since you will have to take the USB drive home.'

Write-Host 'The playlist is now set up and ready to start when the start time of the first episode comes.'
Write-Host 'The computer can now be left unattended until the end of the day.'

# Play and queue 2 hours of pauses to start the day so it does not start abruptly
Insert-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $true
Insert-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Insert-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Insert-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
`;

    const waitUntil = (hour, minute) => `Wait-UntilTime -Hour ${hour} -Minute ${minute};`;
    const playEpisode = (episodePath, playImmediately = false) => `Play-Video -videoPath '${episodePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const insertPause = (pausePath, playImmediately = false) => `Insert-Pause -pausePath '${pausePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const insertLeadingClip = (clipPath, playImmediately = false) => `Insert-LeadingClip -clipPath '${clipPath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;

    const blocks = [];

    // Each block will set the start time of the block minus eventual leading clips length since they will be played together
    // The first leading clip will play when called on while the rest of the clips and episodes will be queued
    projectJSON.blocks.forEach((block, index) => {
        const blockArray = [];

        // The start time of the block
        let [hour, minute] = block.startTime.split(":");

        // Header denoting the start of the block
        blockArray.push(`#\n# Block ${index + 1} starts here, at ${hour}:${minute} \n#`);

        // Move back the start time by the durations of the clips associated with an option
        block.options.forEach((option) => {
            if (option.checked) {
                minute -= option.duration;

                // Handle rollover
                if (minute < 0) {
                    minute += 60;
                    hour -= 1;
                }
            }
        });

        // Wait until the start time of the block
        blockArray.push(waitUntil(hour, minute));

        // Queue the leading clips
        let first = true;
        block.options.forEach((option) => {
            if (option.checked) {
                const clipPath = "/pauses/" + option.fileName;
                blockArray.push(insertLeadingClip(clipPath, playImmediately = first));
                first = false;
            }
        });

        // Add some margin in the ps1 script for easier readability
        blockArray.push("");

        // Push the episodes in the block
        block.episodes.forEach((episode) => {
            blockArray.push(playEpisode("/episodes/" + episode.fileName, playImmediately = first));
            first = false;
        });

        // Add some margin in the ps1 script for easier readability
        blockArray.push("");

        // Push an hour and a half of pauses at the end of each block
        for (let i = 0; i < 3; i++) {
            blockArray.push(insertPause("/pauses/pause_30_min.mp4"));
        }

        // Push the block to the array of all the blocks
        blocks.push(`\n\n${blockArray.join("\n")} `);
    });

    // Join the beginning and the blocks together
    const script = staticBeginning + blocks.join("\n");

    // Write the script to the project folder
    if (!fs.existsSync(exportFolder)) {
        fs.mkdirSync(exportFolder, { recursive: true });
    };
    fs.writeFileSync(path.join(exportFolder, "play.ps1"), script);
};

// The main export function that is called when the user wants to export a project
const projectExport = (id) => {
    console.log("[INFO] Exporting project with id: " + id);

    // Update export status
    exportStatus.progress = "5%";
    exportStatus.message = "Making folders...";

    // Prompt with information about the export
    dialog.showMessageBoxSync({
        type: "info",
        buttons: ["OK"],
        title: "Good to know about exporting",
        message: `
Your export speed is very dependant on your disk speed so it is advised that you export to a system drive for faster performance. 

After that, you can zip the file, upload it to the cloud, and then transfer it to a USB drive. 

Directly exporting to a USB drive is slow and can cause the program to hang.`
    });

    // Prompt to select the output folder
    const chosenFolder = dialog.showOpenDialogSync({
        properties: ["openDirectory"],
        buttonLabel: "Export here",
        title: "The project folder will end up here",
        message: "The project folder will end up here",
    });

    // If the user cancels the export, return
    if (!chosenFolder) { return; };

    // Get JSON object of the project
    const projectJSON = projectGet(id, userData);

    // The project folder is the folder within the chosen output folder that holds the actual project
    // chosen/projectName
    const exportLocation = path.join(chosenFolder[0], projectJSON.name);
    exportStatus.exportLocation = exportLocation;

    // Creates the project folder in the selected folder.
    // Confirm with the user to overwrite old folder, if not, cancel the export
    if (fs.existsSync(exportLocation)) {
        if (
            dialog.showMessageBoxSync({
                type: "question",
                buttons: ["Yes", "No"],
                title: "Export",
                message: "The project folder already exists. Do you want to overwrite it? \n\n Clicking no will cancel the export.",
                defaultId: 1,
                cancelId: 1,
            })
        ) {
            return;
        }
        // If the user wants to overwrite the folder, delete the old folder
        fs.rmSync(exportLocation, { recursive: true });
    }

    // Make project folder
    fs.mkdirSync(exportLocation);

    // Make the ps1 script
    makePS1(projectJSON, exportLocation);

    // Makes a worker thread to copy all the assets and replay its status to the main thread
    copyWorker = new Worker(path.join(__dirname, "workerExport.js"));
    copyWorker.on("message", (message) => { // This updates the export status in the main scope
        if (message.type === "status") {
            exportStatus.message = message.message;
            exportStatus.progress = message.progress;
        }
    });
    copyWorker.postMessage({ projectJSON, projectFolder: exportLocation }); // This starts the copying
};


const setUpHandlers = () => {
    let currentProjectId;

    ipcMain.handle("start-export", (event, id) => {
        projectExport(id);
        currentProjectId = id;
    });

    ipcMain.handle("get-export-status", (event) => {
        return exportStatus;
    });

    ipcMain.handle("cancel-export", (event) => {
        // Stop the worker thread
        copyWorker.terminate();

        // Remove the exported project folder
        fs.rmSync(exportStatus.exportLocation, { recursive: true });
    });
};

module.exports = { setUpHandlers, copyAllAssets };

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
# Wait-UntilTime -Hour 10 -Minute 9 -Seconds 30
function Wait-UntilTime {
    param (
        [int]$Hour,
        [int]$Minute,
        [int]$Seconds
    )

    $desiredTime = (Get-Date).Date.AddHours($Hour).AddMinutes($Minute).AddSeconds($Seconds)
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

# Function to insert a trailing clip
# Example usage:
# Insert-TrailingClip -clipPath 'C:/pauses/pause_1_min_countdown.mp4' -playImmediately $false
function Insert-TrailingClip {
    param (
        [string]$clipPath,
        [bool]$playImmediately = $false
    )

    Play-Video -videoPath $clipPath -playImmediately $playImmediately
}

#
# Ensure VLC has started
#
Write-Host 'Waiting for VLC to open...'
& $VLCpath $mainArgs # Start VLC
# Wait for VLC to open
$vlcProcess = Get-Process -Name "vlc" -ErrorAction SilentlyContinue
while (-not $vlcProcess) {
    Start-Sleep -Milliseconds 100
    $vlcProcess = Get-Process -Name "vlc" -ErrorAction SilentlyContinue
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

    const waitUntil = (hour, minute, seconds) => `Wait-UntilTime -Hour ${hour} -Minute ${minute} -Seconds ${seconds};`;
    const playEpisode = (episodePath, playImmediately = false) => `Play-Video -videoPath '${episodePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const insertPause = (pausePath, playImmediately = false) => `Insert-Pause -pausePath '${pausePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const insertLeadingClip = (clipPath, playImmediately = false) => `Insert-LeadingClip -clipPath '${clipPath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const insertTrailingClip = (clipPath, playImmediately = false) => `Insert-TrailingClip -clipPath '${clipPath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;

    const blocks = [];

    // Each block will set the start time of the block minus eventual leading clips length since they will be played together
    // The first leading clip will play when called on while the rest of the clips and episodes will be queued
    projectJSON.blocks.forEach((block, index) => {
        const blockArray = [];

        // The start time of the block
        let [hour, minute, seconds] = [...block.startTime.split(":"), 0];

        // Header denoting the start of the block
        blockArray.push(`#\n# Block ${index + 1} starts here, at ${hour}:${minute} \n#`);

        // Move back the start time by the durations of the clips associated with an option
        block.options.forEach((option) => {
            if (option.checked) {
                seconds -= option.duration; // seconds

                // Handle rollover
                if (seconds < 0) {
                    seconds += 60;
                    minute -= 1;
                }
                if (minute < 0) {
                    minute += 60;
                    hour -= 1;
                }
            }
        });

        // Wait until the start time of the block
        blockArray.push(waitUntil(hour, minute, seconds));

        // Queue the leading clips
        let first = true;
        block.options.forEach((option) => {
            if (option.checked && option.id.includes("leading")) {
                const clipPath = "/pauses/" + option.fileName;
                blockArray.push(insertLeadingClip(clipPath, playImmediately = first));
                first = false;
            }
        });

        // Add some margin in the ps1 script for easier readability
        blockArray.push("");

        // Push the episodes in the block
        blockArray.push(`# Episodes in block ${index + 1}`);
        block.episodes.forEach((episode) => {
            blockArray.push(playEpisode("/episodes/" + episode.fileName, playImmediately = first));
            first = false;
        });

        // Add some margin in the ps1 script for easier readability
        blockArray.push("");

        // Add the trailing clips
        block.options.forEach((option) => {
            if (option.checked && option.id.includes("trailing")) {
                const clipPath = "/pauses/" + option.fileName;
                blockArray.push(insertTrailingClip(clipPath, false));
            }
        });

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

module.exports = makePS1;
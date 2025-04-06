const path = require("node:path");
const fs = require("node:fs");

// Make the ps1 "harness" that runs VLC and runs the correct episodes at the correct times
const makePS1 = (exportStatus, projectData, exportLocation) => {
    console.info("Making ps1 script...");

    // Update export status
    exportStatus.message = "Making ps1 script...";
    exportStatus.progress = "10%";

    const staticBeginning = `
#
# This script was generated by the Stockholm Trekkers Playlist Generator program developed by Viggo Ström for Stockholm Trekkers.
# The code is open source and can be found at:
#   https://github.com/viggoStrom/Stockholm-Trekkers-Playlist-Maker
#
# To use, simply run the script in PowerShell. It starts and then it handles the rest.
#

Start-Transcript -Path "play.log" -Append

$VLCPath = "C:/Program Files/VideoLAN/VLC/vlc.exe"

# 
# VLC not found
# 
if (-not (Test-Path $VLCPath)) {
  Write-Host "
  !!!!
  VLC not found at $VLCPath! 
  Please install it https://www.videolan.org/vlc/
  or create a shortcut there to the correct path.
  !!!!
"
  exit
}

$commonArgs = @(
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

# 
# Kill any existing VLC processes
# 
$vlcProcesses = Get-Process -Name "vlc" -ErrorAction SilentlyContinue
if ($vlcProcesses) {
  Write-Host "Killing existing VLC processes...
  "
  foreach ($process in $vlcProcesses) {
    try {
      Stop-Process -Id $process.Id -Force
    } catch {
      Write-Host "Failed to kill process ID $($process.Id): $_
      "
    }
  }
}

#
# Ensure VLC has started
#
Write-Host "Waiting for VLC to open...
"
Start-Process $VLCPath $commonArgs # Start VLC
# Wait for VLC to open with timeout
$timeoutSeconds = 30
$startTime = Get-Date
$vlcProcess = Get-Process -Name "vlc" -ErrorAction SilentlyContinue
while (-not $vlcProcess) {
  if ((Get-Date) -gt $startTime.AddSeconds($timeoutSeconds)) {
    Write-Host "
  Warning: Timed out waiting for VLC to start after $timeoutSeconds seconds.
  Attempting to restart VLC...
  "
    Start-Process $VLCPath $commonArgs
    $startTime = Get-Date  # Reset timer for another attempt
  }
  
  Start-Sleep -Milliseconds 300
  $vlcProcess = Get-Process -Name "vlc" -ErrorAction SilentlyContinue
}
Write-Host "VLC is now running
"
# Allow extra time for VLC to fully initialize
Start-Sleep -Seconds 3


# Function to wait until a specific time
function Wait-Until {
  param ([int]$Hour, [int]$Minute, [int]$Seconds)

  $desiredTime = (Get-Date).Date.AddHours($Hour).AddMinutes($Minute).AddSeconds($Seconds)
  while ((Get-Date) -lt $desiredTime) {
    Start-Sleep -Seconds 1
  }
}

# Function to play a video
function Start-Video {
  param ([string]$videoPath, [bool]$playImmediately = $false)
    
  # Initialize VLC argument list
  $copyOfArgs = @($commonArgs)

  # If not playing immediately, add the enqueue argument
  if (-not $playImmediately) {
    $copyOfArgs += '--playlist-enqueue'
    Write-Host "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") - Enqueuing video: $videoPath"
  }
  else {
    Write-Host "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") - Playing video: $videoPath"
  }

  # Append the video path
  $copyOfArgs += $videoPath

  # Call VLC with the arguments
  & $VLCPath $copyOfArgs

  # Small sleep to allow VLC to start or enqueue the video
  Start-Sleep -Milliseconds 1000
}

# Function to insert a pause
function Add-Pause {
  param ([string]$pausePath, [bool]$playImmediately = $false)

  Start-Video -videoPath $pausePath -playImmediately $playImmediately
}

# Function to insert a leading clip
function Add-LeadingClip {
  param ([string]$clipPath, [bool]$playImmediately = $false)

  Start-Video -videoPath $clipPath -playImmediately $playImmediately
}

# Function to insert a trailing clip
function Add-TrailingClip {
  param (
    [string]$clipPath,
    [bool]$playImmediately = $false
  )

  Start-Video -videoPath $clipPath -playImmediately $playImmediately
}

#
# Inform the user that the playlist is "armed"
#
Write-host "
REMINDER: Copy the playlist to the COMPUTER, and remove and keep the USB drive.

The playlist is now set up and will start when it is scheduled to start. 

You may leave the computer unattended now.

========================LOG========================
"

# Play and queue 3 hours of pauses to start the day so it does not start abruptly
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $true
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
Add-Pause -pausePath '/pauses/pause_30_min.mp4' -playImmediately $false
`;

    // JS aliases for the PowerShell functions
    const waitUntil = (hour, minute, seconds) => `Wait-Until -Hour ${hour} -Minute ${minute} -Seconds ${seconds};`;
    const playEpisode = (episodePath, playImmediately = false) => `Start-Video -videoPath '${episodePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const addPause = (pausePath, playImmediately = false) => `Add-Pause -pausePath '${pausePath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const addLeadingClip = (clipPath, playImmediately = false) => `Add-LeadingClip -clipPath '${clipPath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;
    const addTrailingClip = (clipPath, playImmediately = false) => `Add-TrailingClip -clipPath '${clipPath}' -playImmediately ${playImmediately ? "$true" : "$false"};`;

    const blocks = [];

    // First parts of this function will find the start time of the blocks first episode and the leading clips since they affect each other
    projectData.blocks.forEach((block, index) => {
        const thisBlock = [];

        // The start time of the block
        let [hour, minute, seconds] = [...block.startTime.split(":"), 0];

        // Header denoting the start of the block
        thisBlock.push("#");
        thisBlock.push(`# Block ${index + 1} starts here, at ${hour}:${minute}`);
        thisBlock.push("#");
        thisBlock.push(`Write-Host "$(Get-Date -Format "yyyy-MM-dd HH:mm:ss") - Block ${index + 1} (${hour}:${minute}) starting..."`)

        // Move back the start time by the durations of the clips associated with an option
        block.options.forEach((option) => {
            if (option.checked) {
                seconds -= option.duration;

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

        // Block starts at the correct start time
        thisBlock.push(waitUntil(hour, minute, seconds));

        // Queue the leading clips
        let isFirst = true;
        block.options.forEach((option) => {
            if (option.checked && option.id.includes("leading")) {
                const clipPath = `/pauses/${option.fileName}`;
                thisBlock.push(addLeadingClip(clipPath, isFirst));
                isFirst = false;
            }
        });

        thisBlock.push(""); // Margin in ps1 script

        // Push the episodes in the block
        thisBlock.push(`# Episodes in block ${index + 1}`);
        block.episodes.forEach((episode) => {
            thisBlock.push(playEpisode(`/episodes/${path.basename(episode.filePath)}`, isFirst));
            isFirst = false;
        });

        thisBlock.push(""); // Margin in ps1 script

        // Add the trailing clips
        block.options.forEach((option) => {
            if (option.checked && option.id.includes("trailing")) {
                const clipPath = `/pauses/${option.fileName}`;
                thisBlock.push(addTrailingClip(clipPath, false));
            }
        });

        // Push 4 hours of pauses at the end of each block
        for (let i = 0; i < 8; i++) {
            thisBlock.push(addPause("/pauses/pause_30_min.mp4"));
        }

        // Push the block to the array of all the blocks
        blocks.push(`\n\n${thisBlock.join("\n")}`);
    });

    // Join the beginning and the blocks together
    const scriptContent = staticBeginning + blocks.join("\n");

    // Write the script to the project folder
    if (!fs.existsSync(exportLocation)) {
        fs.mkdirSync(exportLocation, { recursive: true });
    };
    fs.writeFileSync(path.join(exportLocation, "play.ps1"), scriptContent);
};

module.exports = makePS1;
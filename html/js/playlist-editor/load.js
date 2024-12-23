
const id = getID();

// Load project on page load if there is an ID
if (id !== "new") {
    projects.get(id).then((project) => {
        if (!project) {
            console.warn("No project found with id: " + id);
            return;
        }

        // Set the date input and trigger its formatting
        document.querySelector(".date-input input[type='text']").value = project.date;
        document.querySelector(".date-input input[type='text']").dispatchEvent(new Event("blur"));

        // Load all blocks, one at a time
        project.blocks.forEach((blockData, blockIndex) => {
            // Create new blocks if there are not enough
            if (document.querySelectorAll(".block").length <= blockIndex) {
                createBlockDOM();
            }

            const blockDOM = document.querySelectorAll(".block")[blockIndex];

            // Set the start time of this block
            blockDOM.querySelector(".header .time input[type='text']").value = blockData.startTime;
            blockDOM.querySelector(".header .time input[type='text']").dispatchEvent(new Event("blur"));

            // Set the options
            blockData.options.forEach((option, optionIndex) => {
                const optionDOM = blockDOM.querySelector(".options input#" + option.id);
                // If the option still exists, set its checked state
                if (optionDOM) {
                    optionDOM.checked = blockData.options[optionIndex].checked;
                }
            });

            // Update the dots that represent which options are chosen
            updateDots(blockDOM.querySelector(".options"));

            // Load all the episodes of this block, one at a time
            blockData.episodes.forEach((episode, episodeIndex) => {
                // Create new episode DOM if there aren't enough
                if (blockDOM.querySelectorAll(".episode").length <= episodeIndex) {
                    createEpisodeDOM(blockDOM);
                };

                const episodeDOM = blockDOM.querySelectorAll(".episode")[episodeIndex];

                // This seems to be the only way of setting the file input (visually!!)
                // It just makes the input display the file name
                const dataTransfer = new DataTransfer();
                const file = new File([new Blob()], episode.fileName);
                dataTransfer.items.add(file);

                const fileInput = episodeDOM.querySelector(".file input[type='file']");
                fileInput.files = dataTransfer.files;
                fileInput.dataset.filePath = episode.filePath;
                fileInput.dispatchEvent(new Event("change"));

                const timeDOM = episodeDOM.querySelector(".time p");

                timeDOM.textContent = episode.startTime;
                timeDOM.dataset.endTime = episode.endTime;
            });

            // Send events to update the times in the block. See createBlockAndEpisodes.js and setStartTimes.js
            blockDOM.querySelector(".time input[type='text']").dispatchEvent(new Event("blur"));
            blockDOM.dispatchEvent(new Event("change"));
        });

        // Since the block times gets auto focused, we need to blur it to remove the focus. Focusing the back button also places the selection marker at a good place to start tabbing.
        document.querySelector("#back-button").focus();
        document.querySelector("#back-button").blur();
    });
}
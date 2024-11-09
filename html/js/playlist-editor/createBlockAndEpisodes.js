
// These templates are hidden in the HTML <head> tag
const templateEpisode = document.querySelector(".episode-template.hidden");
const templateBlock = document.querySelector(".block-template.hidden");

// The button with the big plus sign
const createBlockButton = document.querySelector(".create-block");

const createEpisodeDOM = (parent) => {
    // Clone the template and clean up the classes
    const episode = templateEpisode.cloneNode(true);
    episode.classList.add("episode");
    episode.classList.remove("episode-template");
    episode.classList.remove("hidden");

    // Hairline
    const hr = document.createElement("hr");

    parent.appendChild(episode);
    parent.appendChild(hr);

    // Make sure there's always at least one empty episode
    episode.querySelector("input[type='file']").addEventListener("change", (event) => {
        const episodes = parent.querySelectorAll(".episode");
        if (episodes[episodes.length - 1] === episode) {
            createEpisodeDOM(parent);
        }

        if (event.target.value) {
            const file = event.target.files[0];
            const filePath = webUtils.getPathForFile(file);
            event.target.setAttribute("data-file-path", filePath);
        }
    });
};

const createBlockDOM = () => {
    // Clone the template and clean up the classes
    const block = templateBlock.cloneNode(true)
    block.classList.add("block");
    block.classList.remove("block-template");
    block.classList.remove("hidden");

    // Update the option dots 
    updateDots(block.querySelector(".options"));

    // Callback functions defined in setStartTimes.js and blockTimeValidator.js
    block.querySelector(".time input[type='text']").addEventListener("change", formatBlockTime);
    block.addEventListener("change", updateEpisodeTimesInBlock);
    block.querySelector(".time input[type='text']").addEventListener("blur", blockTimeValidator);

    // Make two episodes to start off with
    createEpisodeDOM(block);
    createEpisodeDOM(block);

    // Adds block to DOM
    createBlockButton.insertAdjacentElement("beforebegin", block);
};

const deleteBlockDOM = (source) => {
    if (window.confirm("Are you sure you want to delete this block forever?")) {
        source.parentElement.parentElement.remove();
    };
};

// Start off with one block
createBlockDOM();

// Make new block when the "create new block" button is pressed
createBlockButton.addEventListener("click", createBlockDOM);
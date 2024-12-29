"use strict";

// Template:
// <div class="block">
//     <div class="header">
//         <div class="start-time">
//             <p>Block Start:</p>
//             <input type="text" placeholder="hhmm">
//         </div>
// 
//         <div class="options">
//             <div>
//                 <div class="option-dot active"></div>
//                 <div class="option-dot"></div>
//                 <div class="option-dot"></div>
//                 <div class="option-dot"></div>
//             </div>
// 
//             <button>Options<span>▼▲</span></button>
//         </div>
// 
//         <button class="delete" title="Delete this block forever">
//             <img src="../../assets/images/delete_35dp_000000_FILL0_wght700_GRAD0_opsz40.png" alt="Delete block">
//         </button>
//     </div>
// 
//     <div class="options-dropdown">
//         <hr>
// 
//         <div class="leading-options">
//             <p>Leading Clips</p>
//             <div>
//                 <div>
//                     <p>Stuffz:</p><input type="checkbox">
//                 </div>
//                 <div>
//                     <p>Other Stuffz:</p> <input type="checkbox">
//                 </div>
//             </div>
//         </div>
// 
//         <div class="trailing-options">
//             <p>Trailing Clips</p>
//             <div>
//                 <div>
//                     <p>Stuffz:</p><input type="checkbox">
//                 </div>
//             </div>
//         </div>
//     </div>
// 
//     <ul class="main">
// 
//         <li class="episode">
//             <p class="time">--:--</p>
// 
//             <input type="file" title="Click to select a file to add to the playlist">
//         </li>
// 
//         <hr>
// 
//         <li class="episode">
//             <p class="time">--:--</p>
// 
//             <input type="file" title="Click to select a file to add to the playlist">
//         </li>
//     </ul>
// </div>

const stringToHTML = (string) => {
    const htmlLaunderer = document.createElement("div");
    htmlLaunderer.innerHTML = string.trim();

    return htmlLaunderer.firstChild;
};

const createEpisodeDOM = (episodeData = null) => {
    episodeData = episodeData || {
        filePath: null,
        fileName: null,
        startTime: "--:--",
        endTime: null,
    }

    const episodeBody = stringToHTML(`
        <li class="episode">
            <p class="time" title="When this episode will start playing">${episodeData.startTime}</p>
            <input type="file" title="Click to select a file to add to the playlist">
        </li>`);

    if (!episodeData.filePath || !episodeData.fileName) {
        return episodeBody;
    }

    // Visually set the file input 
    const dataTransfer = new DataTransfer();
    const file = new File([new Blob()], episodeData.fileName);
    dataTransfer.items.add(file);
    const fileInput = episodeBody.querySelector("input[type='file']");
    fileInput.files = dataTransfer.files;
    fileInput.dataset.filePath = episodeData.filePath;

    return episodeBody;
};

const createBlockDOM = (blockData = null) => {
    blockData = blockData || {
        startTime: "",
        options: [...blockOptions],
        episodes: [],
    }

    const blockBody = stringToHTML(`<div class="block"></div>`);

    const blockHeader = stringToHTML(`
        <div class="header">
            <div class="start-time">
                <p>Block Start</p>
                <input type="text" placeholder="hhmm" value="${blockData.startTime}">
            </div>

            <div class="options">
                <div>
                    ${blockData.options.map(option => `<div class="option-dot${option.checked ? " active" : ""}"></div>`).join("")}
                </div>

                <button>Options<span>▼▲</span></button>
            </div>

            <button class="delete" title="Delete this block forever">
                <img src="../../assets/images/delete_35dp_000000_FILL0_wght700_GRAD0_opsz40.png" alt="Delete block">
            </button>
        </div>`);

    const makeOptionCategories = (options) => {
        const uniqueCategories = new Set(options.map(option => option.category || "default"));

        return [...uniqueCategories].map(category => {
            // Get only the options in this category
            const optionsInCategory = options.filter(option => option.category === category);

            const makeOptionCheckbox = (option) => {
                return `
                    <div title="${option.description}">
                        <p>${option.name}</p><input data-option-id="${option.id}" type="checkbox"${option.checked ? " checked" : ""}>
                    </div>`;
            };

            // Create the category body
            const categoryBody = `
                <div class="options-category">
                    <p>${blockOptionsCategoryLookup[category]}</p>

                    <div>
                        ${optionsInCategory.map(makeOptionCheckbox).join("")}
                    </div>
                </div>`;

            return categoryBody;
        });
    };

    const optionsDropdown = stringToHTML(`
        <div class="options-dropdown hidden">
            <hr>

            ${makeOptionCategories(blockData.options).join("")}
        </div > `);

    const episodeList = stringToHTML(`<ul class="main"></ul>`);

    blockData.episodes.forEach(episodeData => {
        episodeList.appendChild(createEpisodeDOM(episodeData));
    });
    // Make sure there are at least 2 episodes
    while (episodeList.querySelectorAll(".episode").length < 2) {
        episodeList.appendChild(createEpisodeDOM());
    }

    //
    // Attach event listeners
    //
    // Delete
    blockHeader.querySelector(".delete").addEventListener("click", deleteBlock);
    // Options dropdown
    blockHeader.querySelector(".options").addEventListener("click", openOptionsDropdown);
    // Clicking an options label toggles the checkbox
    optionsDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        // Clicking anywhere on the container toggles the checkbox
        checkbox.parentElement.addEventListener("click", () => checkbox.click());
        checkbox.addEventListener("click", (event) => event.stopPropagation());
    });
    // Update the option dots when the checkboxes are changed
    optionsDropdown.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
        checkbox.addEventListener("click", () => updateOptionDots(blockBody));
    });

    blockBody.appendChild(blockHeader);
    blockBody.appendChild(optionsDropdown);
    blockBody.appendChild(episodeList);

    return blockBody;
};

//
// Event listener callbacks
// 
const deleteBlock = (event) => {
    if (confirm("Are you sure you want to delete this block forever?")) {
        const block = event.target.closest(".block");
        block.remove();
    }
};
const openOptionsDropdown = (event) => {
    const dropdown = event.target.closest(".header").parentElement.querySelector(".options-dropdown");
    dropdown.classList.toggle("hidden");
};
const updateOptionDots = (block) => {
    const optionDots = block.querySelectorAll(".header .options .option-dot");
    const options = block.querySelectorAll(".options-dropdown input[type='checkbox']");

    options.forEach((option, index) => {
        if (option.checked) {
            optionDots[index].classList.add("active");
        }
        else {
            optionDots[index].classList.remove("active");
        }
    });
};

// New block button
document.querySelector(".make-new-block").addEventListener("click", () => {
    const newBlockButton = document.querySelector(".make-new-block");
    newBlockButton.insertAdjacentElement("beforebegin", createBlockDOM());
});

// Initial block
document.querySelector(".make-new-block").click();

const getJSONstruct = () => {
    const name = document.querySelector(".name-input input[type='text']").value;

    const blocks = document.querySelectorAll(".block:not(.hidden)");

    const struct = {
        name: name,
        id: getID(),
        dateModified: new Date().getTime(),
        blocks: [],
    };


    blocks.forEach((block) => {
        // Get the options and set them in the struct
        const options = {};
        block.querySelectorAll(".options input[type='checkbox']").forEach(optionDOM => {
            options[optionDOM.id] = optionDOM.checked;
        });;

        // Loop through and export all the episodes as a list
        const episodes = Array.from(block.querySelectorAll(".episode:not(.hidden)")) // only grab non-hidden episodes
            .filter((episode) => {
                const fileInput = episode.querySelector("input[type='file']");
                if (fileInput.value !== "") {
                    return true;
                };
            }).map((episode) => {
                const fileInput = episode.querySelector("input[type='file']");
                return {
                    filePath: fileInput.value,
                    fileName: fileInput.value.split("\\").at(-1),
                    startTime: episode.querySelector(".time p").textContent, // Should be a string HH:MM
                };
            });

        console.log(episodes);

        struct.blocks.push({
            startTime: block.querySelector(".header .time input[type='text']").value,
            options: options,
            episodes: episodes
        });
    });

    return struct;
};

const saveProject = () => {
    const struct = getJSONstruct();

    projects.save(struct).then((response) => {
        console.log("response after save: " + response);
    });
};


const exportButton = document.querySelector("button.export");
exportButton.addEventListener("click", async () => {
    // console.log(await projects.getAll());
    saveProject();
});



// Ctrl + S to save
document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey && event.key === "s")) { return };

});
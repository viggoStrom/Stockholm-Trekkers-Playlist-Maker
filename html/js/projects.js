const createNewProjectButton = document.querySelector(".make-new-project");

createNewProjectButton.addEventListener("click", () => {
    window.location.href = "./project-editor.html?id=new";
});


const templateProject = document.querySelector(".load-project-template.hidden");

// Populate the, "view old projects" screen
projects.getAll().then((projectList) => {
    if (!projectList) {
        console.warn("No projects found.");
        return;
    }

    projectList.forEach(project => {
        const projectDOM = templateProject.cloneNode(true);
        projectDOM.classList.remove("load-project-template");
        projectDOM.classList.add("load-project");
        projectDOM.classList.remove("hidden")

        // Set the name i.e. the date of the trekdag
        projectDOM.querySelector(".project-header h3").textContent = project.date;

        // The metadata tag shows date modified 
        const metaDataDOM = projectDOM.querySelector(".meta-data");
        metaDataDOM.innerHTML = "";

        const formatTime = (unixTime) => {
            if (!unixTime) {
                return false;
            };

            const date = new Date(unixTime);

            return date.toLocaleDateString("sv", { year: "numeric", weekday: "short", month: "short", day: "numeric" })
        };

        // Make the "last modified" tag and the time next to it
        const modifiedAt = document.createElement("p");
        modifiedAt.textContent = "Last modified: ";
        const modifiedTime = document.createElement("p");
        modifiedTime.textContent = formatTime(project.dateModified);
        metaDataDOM.appendChild(modifiedAt);
        metaDataDOM.appendChild(modifiedTime);

        // Loop through all of the episodes in the blocks and add them to the "load project DOM"
        const episodesDOM = projectDOM.querySelector("ul");
        episodesDOM.innerHTML = "";

        project.blocks.forEach((block, index) => {

            block.episodes.forEach((episode, index) => {
                const episodeDOM = document.createElement("li");

                const startTime = episode.startTime;
                const fileName = episode.fileName;

                const timeDOM = document.createElement("p");
                const fileDOM = document.createElement("p");
                timeDOM.textContent = startTime;
                fileDOM.textContent = fileName;
                episodeDOM.appendChild(timeDOM);
                episodeDOM.appendChild(document.createTextNode("-"));
                episodeDOM.appendChild(fileDOM);

                episodesDOM.appendChild(episodeDOM);

                if (index === 0) {
                    timeDOM.textContent = block.startTime;
                }
            });

            if (index !== project.blocks.length - 1) {
                const hairline = document.createElement("li");
                hairline.classList.add("block-divider");
                episodesDOM.appendChild(hairline);
            }
        });

        // Go to the project in the editor when clicked
        projectDOM.addEventListener("click", (event) => {

            // If the delete button is clicked, delete the project
            if (event.target.classList.contains("delete-project")) {
                if(!confirm("Are you sure you want to delete this project?")) {
                    return;
                }

                projects.delete(project.id).then(() => {
                    projectDOM.remove();
                });
            } else {

                // Go to the project in the editor
                window.location.href = `./project-editor.html?id=${project.id}`;
            }
        });

        createNewProjectButton.insertAdjacentElement("afterend", projectDOM);
    });
});

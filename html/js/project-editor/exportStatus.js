

const startExportStatusGetter = () => {
    document.querySelector(".bottom-sticky-container>.export-progress-window").classList.remove("hidden");

    const bottomStatus = document.querySelectorAll(".bottom-sticky-container>.export-progress-window .status-text")[1];
    const progressBar = document.getElementById("export-progress-bar");

    setInterval(() => {
        exporter.getStatus().then((status) => {

            console.log(status);

            if (status === null) {
                bottomStatus.textContent = "No export in progress";
                progressBar.style.backgroundSize = "0%";
            } else {
                bottomStatus.textContent = status.message;
                progressBar.style.backgroundSize = status.progress;
            };
        });
    }, 100);
};

document.querySelector(".bottom-sticky-container>.export-progress-window button.cancel")
    .addEventListener("click", async (event) => {
        if ((await exporter.getStatus()).message.contains("Done")) {
            event.target.textContent = "Done";

            document.querySelector(".bottom-sticky-container>.export-progress-window").classList.add("hidden");

        } else {
            exporter.cancel();
        }
    });
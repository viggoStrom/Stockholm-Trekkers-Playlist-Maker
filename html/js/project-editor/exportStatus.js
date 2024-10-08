
const startExportStatusGetter = () => {
    document.querySelector(".bottom-sticky-container>.export-progress-window").classList.remove("hidden");

    const bottomStatus = document.querySelectorAll(".bottom-sticky-container>.export-progress-window .status-text")[1];
    const progressBar = document.getElementById("export-progress-bar");

    const statusInterval = setInterval(() => {
        exporter.getStatus().then((status) => {

            console.log(status);

            bottomStatus.textContent = status.message;
            progressBar.style.backgroundSize = status.progress;

            if (status.message.includes("Done")) {
                document.querySelector(".bottom-sticky-container>.export-progress-window button.cancel").textContent = "Done";

                clearInterval(statusInterval);
            }
        });
    }, 100);
};

// Cancellation
const cancelButton = document.querySelector(".bottom-sticky-container>.export-progress-window button.cancel");
cancelButton.addEventListener("click", (event) => {

    // If cancel button is clicked, cancel the export
    if (cancelButton.textContent.includes("Cancel")) {
        exporter.cancel();
    }

    // Reset the button text
    document.querySelector(".bottom-sticky-container>.export-progress-window button.cancel").textContent = "Cancel";

    // Hide the export progress window
    document.querySelector(".bottom-sticky-container>.export-progress-window").classList.add("hidden");
});
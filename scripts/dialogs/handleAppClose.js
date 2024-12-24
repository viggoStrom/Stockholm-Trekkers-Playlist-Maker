"use strict";
const { dialog, BrowserWindow } = require("electron");

// If any of these strings appear in the window title the app will prompt the user to confirm closing
const closeConfirmationStrings = ["*"];

const onClose = (event) => {
    // Check if the window title contains any of the strings that require confirmation
    console.log(event);
    const title = event.sender.getTitle();
    const needsConfirmation = closeConfirmationStrings.some(string => title.includes(string));

    if (!needsConfirmation) return; // Just close

    const quitConfirmation = dialog.showMessageBoxSync({
        type: "question",
        buttons: ["Yes", "No"],
        title: "Confirm",
        message: "Are you sure you want to leave? You may have unsaved changes.",
        defaultId: 1,
    });

    if (quitConfirmation === 1) { // If no, stop from closing
        event.preventDefault();
    }
};

const onClosed = () => {
    BrowserWindow.getAllWindows().forEach(window => {
        window.close();
    });
};

module.exports = { onClose, onClosed };
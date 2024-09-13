
const nameValidatorStatus = document.querySelector(".name-validator-status");
const nameInput = document.querySelector(".name-input>input");
const warningsWindow = document.getElementById("name-validation-popover");
let popoverTimeout;
let statusTimeout;

const nameValidator = (event) => {
    if (event.key !== "Enter") {
        return;
    }

    clearTimeout(popoverTimeout);
    clearTimeout(statusTimeout);

    const name = nameInput.value.trim();
    const nameRegex = /^\d{4}-\d{2}-\d{2}$/;
    const nameRegexNoDash = /^\d{8}$/;

    const warnings = (name) => {
        const date = new Date(name);

        const warnings = [];

        if (date == "Invalid Date") {
            warnings.push("It's not a valid date. ");
        }
        if (!(date.getDay() in [6, 0])) {
            warnings.push("It's not on a weekend. ");
        }
        if (date.getFullYear() !== new Date().getFullYear()) {
            warnings.push("It's not this year. ");
        }
        if (date < new Date()) {
            warnings.push("It's in the past. ");
        }
        if (date.getMonth() > new Date().getMonth() + 2) {
            warnings.push("It's more than 2 months away. ");
        }

        if (warnings.length > 0) {
            nameValidatorStatus.textContent += " But are you sure about: ";

            warningsWindow.innerHTML = "";

            warnings.forEach(warning => {
                const warningTag = document.createElement("p");
                warningTag.textContent = warning;
                warningsWindow.appendChild(warningTag);
            });

            warningsWindow.showPopover();

        }
        
        popoverTimeout = setTimeout(() => {
            warningsWindow.hidePopover();
        }, 5000);
    }

    if (nameRegex.test(name)) {
        nameValidatorStatus.textContent = "Looks good!";
        nameValidatorStatus.classList.remove("invalid");

        nameInput.value = name;
        warnings(name);

    } else if (nameRegexNoDash.test(name)) {
        nameValidatorStatus.textContent = "Looks good!";
        nameValidatorStatus.classList.remove("invalid");

        const formattedName = name.slice(0, 4) + "-" + name.slice(4, 6) + "-" + name.slice(6, 8);
        nameInput.value = formattedName;
        warnings(formattedName);

    } else {
        nameValidatorStatus.textContent = "Invalid";
        nameValidatorStatus.classList.add("invalid");
    }

    if (nameValidatorStatus.textContent === "Looks good!") {
        statusTimeout = setTimeout(() => {
            nameValidatorStatus.textContent = "";
            nameValidatorStatus.classList.remove("invalid");
        }, 5000);
    }
}

nameInput.addEventListener("blur", nameValidator);
nameInput.addEventListener("keydown", nameValidator);
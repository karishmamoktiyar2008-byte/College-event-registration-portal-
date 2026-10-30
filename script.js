const form = document.getElementById("registrationForm");
const searchInput = document.getElementById("searchEvent");

const eventCards = [...document.querySelectorAll(".event-card")];
const filterButtons = [...document.querySelectorAll(".filter")];

let registrations = JSON.parse(
    localStorage.getItem("collegeRegistrations") || "[]"
);

let currentFilter = "all";

const fields = [
    { id: "studentName", error: "nameError", label: "Full name" },
    { id: "studentId", error: "idError", label: "Student ID" },
    { id: "email", error: "emailError", label: "Email address" },
    { id: "phone", error: "phoneError", label: "Phone number" },
    { id: "college", error: "collegeError", label: "College" },
    { id: "department", error: "departmentError", label: "Department" },
    { id: "eventSelect", error: "eventError", label: "Event" },
    { id: "attendees", error: "attendeesError", label: "Attendees" }
];

function saveRegistrations() {
    localStorage.setItem(
        "collegeRegistrations",
        JSON.stringify(registrations)
    );
}

function validateForm() {
    let valid = true;

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const error = document.getElementById(field.error);
        const value = input.value.trim();

        let message = "";

        if (!value) {
            message = field.label + " is required.";
        } else if (
            field.id === "email" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
            message = "Enter a valid email address.";
        } else if (
            field.id === "phone" &&
            !/^[6-9]\d{9}$/.test(value)
        ) {
            message = "Enter a valid 10-digit Indian mobile number.";
        } else if (
            field.id === "attendees" &&
            (!Number.isInteger(Number(value)) ||
                Number(value) < 1 ||
                Number(value) > 10)
        ) {
            message = "Enter a number from 1 to 10.";
        }

        error.textContent = message;
        input.classList.toggle("invalid", Boolean(message));

        if (message) valid = false;
    });

    document.getElementById("errorBanner").hidden = valid;
    return valid;
}

fields.forEach(field => {
    const input = document.getElementById(field.id);

    input.addEventListener("input", () => {
        input.classList.remove("invalid");
        document.getElementById(field.error).textContent = "";
    });

    input.addEventListener("change", () => {
        input.classList.remove("invalid");
        document.getElementById(field.error).textContent = "";
    });
});

function renderRegistrations() {
    const adminRows = document.getElementById("adminRows");
    const myRows = document.getElementById("myRegistrationRows");

    adminRows.replaceChildren();
    myRows.replaceChildren();

    registrations.forEach((reg, index) => {
        const row = document.createElement("tr");

        [
            reg.name,
            reg.studentId,
            reg.email,
            reg.phone,
            reg.event,
            reg.department,
            String(reg.attendees),
            reg.status
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionCell = document.createElement("td");
        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";
        removeButton.className = "btn";
        removeButton.type = "button";

        removeButton.addEventListener("click", () => {
            if (confirm("Remove this registration?")) {
                registrations.splice(index, 1);
                saveRegistrations();
                renderRegistrations();
            }
        });

        actionCell.appendChild(removeButton);
        row.appendChild(actionCell);
        adminRows.appendChild(row);

        const myRow = document.createElement("tr");

        [reg.id, reg.name, reg.event, reg.status].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            myRow.appendChild(cell);
        });

        myRows.appendChild(myRow);
    });

    document.getElementById("totalRegistrations").textContent =
        registrations.length;

    document.getElementById("confirmedRegistrations").textContent =
        registrations.filter(reg => reg.status === "Confirmed").length;
}

form.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateForm()) return;

    const eventName = document.getElementById("eventSelect").value;

    const attendees = Number(
        document.getElementById("attendees").value
    );

    const eventCard = eventCards.find(card =>
        card.querySelector(".register-btn").dataset.event === eventName
    );

    const seatsElement = eventCard?.querySelector(".remaining");
    const seats = Number(seatsElement?.textContent ?? 0);

    if (!eventCard || attendees > seats) {
        alert("Not enough seats are available for this event.");
        return;
    }

    const registration = {
        id: "CER-" + Date.now().toString().slice(-8),
        name: document.getElementById("studentName").value.trim(),
        studentId: document.getElementById("studentId").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        college: document.getElementById("college").value.trim(),
        department: document.getElementById("department").value,
        event: eventName,
        attendees: attendees,
        status: "Confirmed"
    };

    registrations.push(registration);

    saveRegistrations();

    seatsElement.textContent = seats - attendees;

    document.getElementById("registrationId").textContent =
        registration.id;

    document.getElementById("confirmedStudent").textContent =
        registration.name;

    document.getElementById("confirmedEvent").textContent =
        registration.event;

    form.hidden = true;
    document.getElementById("successMessage").hidden = false;

    renderRegistrations();
});

document.getElementById("newRegistration").addEventListener("click", () => {
    form.reset();

    form.hidden = false;

    document.getElementById("successMessage").hidden = true;
    document.getElementById("errorBanner").hidden = true;

    fields.forEach(field => {
        document.getElementById(field.error).textContent = "";
        document.getElementById(field.id).classList.remove("invalid");
    });

    document.getElementById("register").scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelectorAll(".register-btn").forEach(button => {
    button.addEventListener("click", () => {
        document.getElementById("eventSelect").value =
            button.dataset.event;

        document.getElementById("register").scrollIntoView({
            behavior: "smooth"
        });
    });
});

function filterEvents() {
    const query = searchInput.value.toLowerCase();

    eventCards.forEach(card => {
        const matchesSearch = card.textContent.toLowerCase().includes(query);

        const date = new Date(card.dataset.date + "T00:00:00");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysAway = Math.floor(
            (date - today) / (1000 * 60 * 60 * 24)
        );

        const matchesFilter =
            currentFilter === "all" ||
            currentFilter === "campus" ||
            (currentFilter === "week" && daysAway >= 0 && daysAway <= 7);

        card.hidden = !(matchesSearch && matchesFilter);
    });

    document.getElementById("noEvents").hidden =
        eventCards.some(card => !card.hidden);
}

searchInput.addEventListener("input", filterEvents);

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach(item =>
            item.classList.toggle("active", item === button)
        );

        filterEvents();
    });
});

document.getElementById("exportCSV").addEventListener("click", () => {
    const headers = [
        "Registration ID", "Name", "Student ID", "Email",
        "Phone", "College", "Department", "Event",
        "Attendees", "Status"
    ];

    const escapeCSV = value =>
        '"' + String(value).replace(/"/g, '""') + '"';

    const rows = registrations.map(reg => [
        reg.id, reg.name, reg.studentId, reg.email,
        reg.phone, reg.college, reg.department,
        reg.event, reg.attendees, reg.status
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "college-registrations.csv";
    link.click();

    URL.revokeObjectURL(url);
});

renderRegistrations();
filterEvents();

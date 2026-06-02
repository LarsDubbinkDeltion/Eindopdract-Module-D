const events = [
    {
        id: 1,
        naam: "JDM Night Meet",
        locatie: "Amsterdam",
        plekken: 5,
        status: "Open",
        deelnemers: []
    },
    {
        id: 2,
        naam: "German Cars Event",
        locatie: "Rotterdam",
        plekken: 3,
        status: "Open",
        deelnemers: []
    }
];

function renderEvents() {
    const eventContainer = document.getElementById("events");
    eventContainer.innerHTML = "";

    events.forEach(event => {

        let vrijePlekken = event.plekken - event.deelnemers.length;

        eventContainer.innerHTML += `
        <div class="event-card">
            <h3>${event.naam}</h3>
            <p>📍 ${event.locatie}</p>
            <p>Status:
                <span class="${event.status === "Open" ? "open" : "closed"}">
                    ${event.status}
                </span>
            </p>

            <p>Vrije plekken: ${vrijePlekken}</p>

            <input type="text" id="naam-${event.id}" placeholder="Naam bestuurder">
            <input type="text" id="auto-${event.id}" placeholder="Auto model">

            <button onclick="aanmelden(${event.id})">
                Auto aanmelden
            </button>
        </div>
        `;
    });
}

function aanmelden(eventId) {

    const event = events.find(e => e.id === eventId);

    const naam = document.getElementById(`naam-${eventId}`).value;
    const auto = document.getElementById(`auto-${eventId}`).value;

    if (!naam || !auto) {
        alert("Vul alle velden in!");
        return;
    }

    if (event.status === "Gesloten") {
        alert("Dit event is gesloten.");
        return;
    }

    if (event.deelnemers.length >= event.plekken) {
        alert("Geen plekken meer beschikbaar.");
        return;
    }

    event.deelnemers.push({
        naam,
        auto
    });

    alert("Aanmelding succesvol!");

    renderEvents();
    renderAdmin();
}

function renderAdmin() {

    const admin = document.getElementById("admin-panel");
    admin.innerHTML = "";

    events.forEach(event => {

        let deelnemersHTML = "";

        event.deelnemers.forEach(d => {
            deelnemersHTML += `
                <li>${d.naam} - ${d.auto}</li>
            `;
        });

        admin.innerHTML += `
        <div class="event-card">

            <h3>${event.naam}</h3>

            <p>Status:
                <strong>${event.status}</strong>
            </p>

            <button onclick="toggleStatus(${event.id})">
                Status wijzigen
            </button>

            <h4>Deelnemers (${event.deelnemers.length})</h4>

            <ul>
                ${deelnemersHTML || "<li>Geen deelnemers</li>"}
            </ul>

        </div>
        `;
    });
}

function toggleStatus(id) {

    const event = events.find(e => e.id === id);

    event.status =
        event.status === "Open"
        ? "Gesloten"
        : "Open";

    renderEvents();
    renderAdmin();
}

renderEvents();
renderAdmin();
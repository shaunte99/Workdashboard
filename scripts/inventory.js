/* events.js 
   Handles add, edit, delete of events
   Works with the events.html & CSS you have
*/

document.addEventListener("DOMContentLoaded", () => {
    const eventsContainer = document.querySelector(".events-container");
    const addEventBtn = document.querySelector(".add-event-btn");

    // Example events (can come from localStorage later)
    let events = [
        { id: 1, title: "Wedding Setup", details: "Saturday 10 AM, Hall A" },
        { id: 2, title: "Client Meeting", details: "Tuesday 3 PM, Zoom" },
    ];

    // Render all events
    function renderEvents() {
        eventsContainer.innerHTML = ""; // clear
        events.forEach(event => {
            const card = document.createElement("div");
            card.classList.add("event-card");

            card.innerHTML = `
                <div class="event-info">
                    <h3>${event.title}</h3>
                    <p>${event.details}</p>
                </div>
                <div class="event-actions">
                    <button class="edit-btn" data-id="${event.id}">Edit</button>
                    <button class="delete-btn" data-id="${event.id}">Delete</button>
                </div>
            `;
            eventsContainer.appendChild(card);
        });

        // Re-bind actions
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteEvent(btn.dataset.id));
        });

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", () => editEvent(btn.dataset.id));
        });
    }

    // Add new event
    addEventBtn.addEventListener("click", () => {
        const title = prompt("Enter event title:");
        if (!title) return;

        const details = prompt("Enter event details:");
        if (!details) return;

        const newEvent = {
            id: Date.now(),
            title,
            details
        };

        events.push(newEvent);
        renderEvents();
    });

    // Delete event
    function deleteEvent(id) {
        events = events.filter(event => event.id != id);
        renderEvents();
    }

    // Edit event
    function editEvent(id) {
        const event = events.find(e => e.id == id);
        if (!event) return;

        const newTitle = prompt("Edit title:", event.title);
        if (newTitle) event.title = newTitle;

        const newDetails = prompt("Edit details:", event.details);
        if (newDetails) event.details = newDetails;

        renderEvents();
    }

    // Initial render
    renderEvents();
});

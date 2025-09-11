/* ==============================
   Calendar Logic - calendar.js
   ============================== */

document.addEventListener("DOMContentLoaded", () => {
  const calendarDays = document.getElementById("calendar-days");
  const monthYear = document.getElementById("month-year");
  const prevBtn = document.getElementById("prev-month");
  const nextBtn = document.getElementById("next-month");

  const modal = document.getElementById("event-modal");
  const closeModal = document.querySelector(".close-modal");
  const addEventBtn = document.getElementById("add-event-btn");
  const eventForm = document.getElementById("event-form");
  const saveEventBtn = document.querySelector(".save-event");

  let currentDate = new Date();
  let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};

  /* ==============================
     Render Calendar
     ============================== */
  function renderCalendar() {
    calendarDays.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Month name + year
    const options = { month: "long", year: "numeric" };
    monthYear.textContent = currentDate.toLocaleDateString("en-US", options);

    // First + last day
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Blank cells before start
    for (let i = 0; i < firstDay; i++) {
      const blank = document.createElement("div");
      calendarDays.appendChild(blank);
    }

    // Days
    for (let day = 1; day <= lastDate; day++) {
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("day");

      const dateSpan = document.createElement("span");
      dateSpan.classList.add("date");
      dateSpan.textContent = day;

      dayDiv.appendChild(dateSpan);

      // Event dot if exists
      const dateKey = `${year}-${month + 1}-${day}`;
      if (events[dateKey] && events[dateKey].length > 0) {
        const dot = document.createElement("div");
        dot.classList.add("event-dot");
        dayDiv.appendChild(dot);
      }

      // Click to view/add events
      dayDiv.addEventListener("click", () => openEventModal(dateKey));

      calendarDays.appendChild(dayDiv);
    }
  }

  /* ==============================
     Modal Functions
     ============================== */
  function openEventModal(dateKey) {
    modal.style.display = "block";

    // Show date-specific events
    const eventList = document.createElement("div");
    eventList.innerHTML = "";

    if (events[dateKey] && events[dateKey].length > 0) {
      eventList.innerHTML = `<h4>Events for ${dateKey}</h4>`;
      events[dateKey].forEach((evt, i) => {
        const evtDiv = document.createElement("div");
        evtDiv.style.marginBottom = "10px";
        evtDiv.innerHTML = `
          <strong>${evt.title}</strong><br/>
          ${evt.time ? evt.time + " - " : ""}${evt.description || ""}
        `;

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.style.marginTop = "5px";
        delBtn.style.background = "#dc3545";
        delBtn.style.color = "#fff";
        delBtn.style.border = "none";
        delBtn.style.borderRadius = "6px";
        delBtn.style.padding = "5px 8px";
        delBtn.style.cursor = "pointer";

        delBtn.addEventListener("click", () => {
          events[dateKey].splice(i, 1);
          if (events[dateKey].length === 0) delete events[dateKey];
          saveEvents();
          renderCalendar();
          openEventModal(dateKey); // refresh modal
        });

        evtDiv.appendChild(delBtn);
        eventList.appendChild(evtDiv);
      });
    } else {
      eventList.innerHTML = `<p>No events yet. Add one below 👇</p>`;
    }

    // Insert into modal before form
    const existingList = modal.querySelector("#event-list");
    if (existingList) existingList.remove();

    eventList.id = "event-list";
    modal.querySelector(".modal-content").insertBefore(eventList, eventForm);

    // Pre-fill hidden date field
    document.getElementById("event-date").value = dateKey;
  }

  function closeEventModal() {
    modal.style.display = "none";
    eventForm.reset();
  }

  /* ==============================
     Save Events
     ============================== */
  function saveEvents() {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }

  eventForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("event-title").value;
    const dateKey = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const description = document.getElementById("event-description").value;

    if (!title) {
      alert("Event title is required!");
      return;
    }

    if (!events[dateKey]) events[dateKey] = [];

    events[dateKey].push({ title, time, description });
    saveEvents();

    renderCalendar();
    closeEventModal();
  });

  /* ==============================
     Navigation
     ============================== */
  prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  // Close modal events
  closeModal.addEventListener("click", closeEventModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeEventModal();
  });

  addEventBtn.addEventListener("click", () => openEventModal(getTodayKey()));

  /* ==============================
     Helpers
     ============================== */
  function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  /* ==============================
     Init
     ============================== */
  renderCalendar();
});

/* -------------------------
   POPPIE OPS DASHBOARD JS
   -------------------------
   Covers:
   - Clock-in/out
   - Task management
   - Calendar (FullCalendar.js)
   - Moodboard templates
   - Reports
   ------------------------- */

const STORAGE_KEY = 'poppie_ops_data';
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    workers: [],
    tasks: [],
    events: [],
    moodboard: null
};

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

/* -------------------------
   1. Clock-in / Clock-out
------------------------- */
function renderWorkers() {
    const workerList = document.getElementById("workerList");
    workerList.innerHTML = "";

    appData.workers.forEach((w, idx) => {
        const row = document.createElement("div");
        row.className = "worker-row";
        row.innerHTML = `
            <span>${w.name}</span>
            <span>${w.clockedIn ? "🟢 Clocked In" : "🔴 Clocked Out"}</span>
            <button onclick="toggleClock(${idx})">${w.clockedIn ? "Clock Out" : "Clock In"}</button>
        `;
        workerList.appendChild(row);
    });
}

function addWorker(name) {
    appData.workers.push({ name, clockedIn: false, logs: [] });
    saveData();
    renderWorkers();
}

function toggleClock(idx) {
    const w = appData.workers[idx];
    const time = new Date().toLocaleString();
    if (w.clockedIn) {
        w.logs.push(`Clocked OUT at ${time}`);
    } else {
        w.logs.push(`Clocked IN at ${time}`);
    }
    w.clockedIn = !w.clockedIn;
    saveData();
    renderWorkers();
}

/* -------------------------
   2. Task Management
------------------------- */
function renderTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    appData.tasks.forEach((t, idx) => {
        const row = document.createElement("div");
        row.className = "task-row";
        row.innerHTML = `
            <span>${t.title} - ${t.assignee}</span>
            <span>${t.done ? "✅ Done" : "⏳ Pending"}</span>
            <button onclick="toggleTask(${idx})">${t.done ? "Undo" : "Complete"}</button>
        `;
        taskList.appendChild(row);
    });
}

function addTask(title, assignee) {
    appData.tasks.push({ title, assignee, done: false });
    saveData();
    renderTasks();
}

function toggleTask(idx) {
    appData.tasks[idx].done = !appData.tasks[idx].done;
    saveData();
    renderTasks();
}

/* -------------------------
   3. Calendar (FullCalendar.js)
------------------------- */
function initCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        editable: true,
        selectable: true,
        events: appData.events,
        dateClick: function(info) {
            const title = prompt("Enter event title:");
            if (title) {
                const event = { title, start: info.dateStr };
                calendar.addEvent(event);
                appData.events.push(event);
                saveData();
            }
        },
        eventChange: function(info) {
            appData.events = calendar.getEvents().map(e => ({
                title: e.title,
                start: e.startStr,
                end: e.endStr
            }));
            saveData();
        }
    });

    calendar.render();
}

/* -------------------------
   4. Moodboard Templates
------------------------- */
const templates = [
    { id: "classic", name: "Classic Layout", bg: "#fff0f5", text: "Classic elegance" },
    { id: "modern", name: "Modern Layout", bg: "#e0f7fa", text: "Sleek & clean" },
    { id: "bold", name: "Bold Layout", bg: "#fbe9e7", text: "Bright & bold" }
];

function renderMoodboard() {
    const board = document.getElementById("moodboard");
    const templateList = document.getElementById("templateList");

    templateList.innerHTML = "";
    templates.forEach(t => {
        const card = document.createElement("div");
        card.className = "template-card";
        card.style.background = t.bg;
        card.innerHTML = `<h4>${t.name}</h4><p>${t.text}</p>`;
        card.onclick = () => applyTemplate(t.id);
        templateList.appendChild(card);
    });

    if (appData.moodboard) {
        const chosen = templates.find(t => t.id === appData.moodboard);
        board.style.background = chosen.bg;
        board.innerHTML = `<h2>${chosen.name}</h2><p>${chosen.text}</p>`;
    }
}

function applyTemplate(id) {
    appData.moodboard = id;
    saveData();
    renderMoodboard();
}

/* -------------------------
   5. Reports
------------------------- */
function downloadReport() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "poppie_ops_report.json";
    a.click();
    URL.revokeObjectURL(url);
}

/* -------------------------
   Init everything
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    renderWorkers();
    renderTasks();
    renderMoodboard();
    initCalendar();

    document.getElementById("addWorkerBtn").onclick = () => {
        const name = prompt("Enter worker name:");
        if (name) addWorker(name);
    };

    document.getElementById("addTaskBtn").onclick = () => {
        const title = prompt("Task title:");
        const assignee = prompt("Assign to:");
        if (title && assignee) addTask(title, assignee);
    };

    document.getElementById("downloadReportBtn").onclick = downloadReport;
});

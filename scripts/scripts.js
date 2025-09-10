/* ========================
   EVENT DASHBOARD JS
   Fully functional, stacked
======================== */

/* ---------- LocalStorage Helpers ---------- */
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

/* ========================
   1. Clock-In / Clock-Out
======================== */
const workers = [
    { name: "Worker 1", status: "out", hours: 0 },
    { name: "Worker 2", status: "out", hours: 0 },
    { name: "Worker 3", status: "out", hours: 0 },
    { name: "Worker 4", status: "out", hours: 0 },
    { name: "Worker 5", status: "out", hours: 0 },
];

function renderWorkers() {
    const container = document.getElementById("workerList");
    container.innerHTML = "";
    workers.forEach((worker, idx) => {
        const card = document.createElement("div");
        card.className = "worker-card";
        card.innerHTML = `
            <p>${worker.name}</p>
            <p>Status: <span class="status">${worker.status}</span></p>
            <p>Hours Worked: <span class="hours">${worker.hours.toFixed(2)}</span></p>
            <div>
                <button class="clock-btn clock-in">Clock In</button>
                <button class="clock-btn clock-out">Clock Out</button>
            </div>
        `;
        container.appendChild(card);

        const inBtn = card.querySelector(".clock-in");
        const outBtn = card.querySelector(".clock-out");

        inBtn.addEventListener("click", () => clockIn(idx));
        outBtn.addEventListener("click", () => clockOut(idx));
    });
}

function clockIn(index) {
    workers[index].status = "in";
    workers[index].startTime = Date.now();
    renderWorkers();
}

function clockOut(index) {
    const worker = workers[index];
    if(worker.status === "in") {
        const diff = (Date.now() - worker.startTime) / (1000 * 60 * 60); // hours
        worker.hours += diff;
        worker.status = "out";
        delete worker.startTime;
        saveData("workers", workers);
        renderWorkers();
    } else {
        alert("Worker is not clocked in.");
    }
}

function loadWorkers() {
    const saved = loadData("workers");
    if(saved.length === workers.length) {
        saved.forEach((w, i) => {
            workers[i].status = w.status;
            workers[i].hours = w.hours;
        });
    }
}
loadWorkers();
renderWorkers();

/* ========================
   2. Tasks
======================== */
let tasks = loadData("tasks");

function renderTasks() {
    const container = document.getElementById("taskList");
    container.innerHTML = "";
    tasks.forEach((task, idx) => {
        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
            <div class="task-details">
                <div class="task-title">${task.title} (${task.priority})</div>
                <div>${task.description}</div>
                <div>Due: ${task.due}</div>
                <div class="task-progress"><div class="task-progress-bar" style="width:${task.completed ? 100 : 0}%"></div></div>
            </div>
            <div>
                <button onclick="toggleTask(${idx})">Toggle Done</button>
                <button onclick="deleteTask(${idx})">Delete</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function addTask(title, description, priority, due) {
    tasks.push({ title, description, priority, due, completed: false });
    saveData("tasks", tasks);
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveData("tasks", tasks);
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index,1);
    saveData("tasks", tasks);
    renderTasks();
}

renderTasks();

/* ========================
   3. Quotes (Excel-like)
======================== */
let quotes = loadData("quotes");

function renderQuotes() {
    const tbody = document.getElementById("quotesBody");
    tbody.innerHTML = "";
    quotes.forEach((quote, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" value="${quote.item}" onchange="updateQuote(${idx}, 'item', this.value)"></td>
            <td><input type="number" value="${quote.qty}" onchange="updateQuote(${idx}, 'qty', this.value)"></td>
            <td><input type="number" value="${quote.unit}" onchange="updateQuote(${idx}, 'unit', this.value)"></td>
            <td>${(quote.qty*quote.unit).toFixed(2)}</td>
            <td><button onclick="deleteQuote(${idx})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
    calculateTotal();
}

function updateQuote(index, field, value) {
    if(field==="qty" || field==="unit") value = parseFloat(value) || 0;
    quotes[index][field] = value;
    saveData("quotes", quotes);
    renderQuotes();
}

function addQuote() {
    quotes.push({item:"", qty:0, unit:0});
    saveData("quotes", quotes);
    renderQuotes();
}

function deleteQuote(index) {
    quotes.splice(index,1);
    saveData("quotes", quotes);
    renderQuotes();
}

function calculateTotal() {
    let total = quotes.reduce((sum,q)=>sum+q.qty*q.unit,0);
    document.getElementById("grandTotal").innerText = total.toFixed(2);
}

renderQuotes();

/* ========================
   4. Calendar (Simple Interactive)
======================== */
let events = loadData("events");

function renderCalendar() {
    const calContainer = document.getElementById("calendar");
    calContainer.innerHTML = "";
    const today = new Date();
    const yearStart = 2025;
    const yearEnd = 2026;

    for(let y=yearStart; y<=yearEnd; y++){
        for(let m=0; m<12; m++){
            const monthDiv = document.createElement("div");
            monthDiv.className = "calendar-month";
            const monthName = new Date(y, m).toLocaleString('default',{month:'long'});
            monthDiv.innerHTML = `<h3>${monthName} ${y}</h3><div class="days"></div>`;
            const daysDiv = monthDiv.querySelector(".days");
            const daysInMonth = new Date(y, m+1,0).getDate();
            for(let d=1; d<=daysInMonth; d++){
                const dayDiv = document.createElement("div");
                dayDiv.className = "day";
                dayDiv.innerText = d;
                const eventForDay = events.find(ev => ev.date === `${y}-${m+1}-${d}`);
                if(eventForDay){
                    const evSpan = document.createElement("span");
                    evSpan.className = "event";
                    evSpan.innerText = eventForDay.title;
                    dayDiv.appendChild(evSpan);
                }
                daysDiv.appendChild(dayDiv);
            }
            calContainer.appendChild(monthDiv);
        }
    }
}

function addEvent(title, date){
    events.push({title,date});
    saveData("events", events);
    renderCalendar();
}

renderCalendar();

/* ========================
   5. Tracking
======================== */
let tracking = loadData("tracking");

function renderTracking() {
    const container = document.getElementById("trackingList");
    container.innerHTML = "";
    tracking.forEach((tr,idx)=>{
        const card = document.createElement("div");
        card.className = "tracking-card";
        card.innerHTML = `
            <p>${tr.title}</p>
            <p>Status: ${tr.status}</p>
            <div class="tracking-progress"><div class="tracking-progress-bar" style="width:${tr.progress}%"></div></div>
            <button onclick="updateTracking(${idx})">Update</button>
        `;
        container.appendChild(card);
    });
}

function addTracking(title, status, progress){
    tracking.push({title,status,progress});
    saveData("tracking", tracking);
    renderTracking();
}

function updateTracking(idx){
    let tr = tracking[idx];
    tr.progress = Math.min(tr.progress+10,100);
    if(tr.progress===100) tr.status="Complete";
    saveData("tracking", tracking);
    renderTracking();
}

renderTracking();

/* ========================
   6. Moodboard Templates
======================== */
const templates = ["Wedding 5-Photo","Pinterest","Normal Grid"];
let moodboardImages = loadData("moodboard") || [];

function renderMoodboardTemplates(){
    const container = document.getElementById("templateList");
    container.innerHTML = "";
    templates.forEach((tmp, idx)=>{
        const card = document.createElement("div");
        card.className="template-card";
        card.innerText=tmp;
        card.onclick=()=>selectTemplate(idx);
        container.appendChild(card);
    });
}

function selectTemplate(idx){
    const preview = document.getElementById("moodboardPreview");
    preview.innerHTML = "";
    moodboardImages.forEach(imgSrc=>{
        const img = document.createElement("img");
        img.src=imgSrc;
        img.style.width=idx===0 ? "18%" : (idx===1 ? "30%" : "30%");
        img.style.margin="5px";
        preview.appendChild(img);
    });
}

function addMoodboardImage(src){
    moodboardImages.push(src);
    saveData("moodboard", moodboardImages);
    renderMoodboardTemplates();
    selectTemplate(0);
}

renderMoodboardTemplates();
selectTemplate(0);

/* ========================
   7. Inventory
======================== */
let inventory = loadData("inventory");

function renderInventory(){
    const container = document.getElementById("inventoryList");
    container.innerHTML="";
    inventory.forEach((item,idx)=>{
        const card=document.createElement("div");
        card.className="inventory-card";
        card.innerHTML=`<p>${item.name}</p>
                        <p>Quantity: ${item.qty}</p>
                        <div class="inventory-progress"><div style="width:${item.qty}%"></div></div>
                        <button onclick="updateInventory(${idx})">Update</button>`;
        container.appendChild(card);
    });
}

function addInventory(name, qty){
    inventory.push({name,qty});
    saveData("inventory",inventory);
    renderInventory();
}

function updateInventory(idx){
    let item=inventory[idx];
    item.qty = Math.min(item.qty + 5,100);
    saveData("inventory",inventory);
    renderInventory();
}

renderInventory();

/* ========================
   8. Email / Inbox
======================== */
let inbox = loadData("inbox");

function renderInbox(){
    const container=document.getElementById("inboxList");
    container.innerHTML="";
    inbox.forEach((mail,idx)=>{
        const card=document.createElement("div");
        card.className="inbox-card";
        card.innerHTML=`<p>From: ${mail.from}</p><p>Subject: ${mail.subject}</p><p>${mail.body}</p>`;
        container.appendChild(card);
    });
}

function addEmail(from, subject, body){
    inbox.push({from,subject,body});
    saveData("inbox",inbox);
    renderInbox();
}

renderInbox();

/* ========================
   9. Reports
======================== */
let reports = loadData("reports");

function renderReports(){
    const container=document.getElementById("reportList");
    container.innerHTML="";
    reports.forEach((rep,idx)=>{
        const card=document.createElement("div");
        card.className="report-card";
        card.innerHTML=`<p>${rep.title}</p><p>${rep.content}</p><button onclick="downloadReport(${idx})">Download</button>`;
        container.appendChild(card);
    });
}

function addReport(title,content){
    reports.push({title,content});
    saveData("reports",reports);
    renderReports();
}

function downloadReport(idx){
    const rep=reports[idx];
    const blob=new Blob([rep.content],{type:"text/plain"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=`${rep.title}.txt`;
    link.click();
}

renderReports();

/* ========================
   END OF JS
======================== */


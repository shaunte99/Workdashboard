// ===== Clock-In System =====

// Worker data
const workers = [
    { name: 'Poppie', clockIn: null, clockOut: null },
    { name: 'Worker 1', clockIn: null, clockOut: null },
    { name: 'Worker 2', clockIn: null, clockOut: null },
    { name: 'Worker 3', clockIn: null, clockOut: null },
    { name: 'Worker 4', clockIn: null, clockOut: null },
    { name: 'Worker 5', clockIn: null, clockOut: null },
];

// DOM elements
const workerSelect = document.getElementById('workerSelect');
const clockInBtn = document.getElementById('clockInBtn');
const clockOutBtn = document.getElementById('clockOutBtn');
const clockTableBody = document.querySelector('#clockTable tbody');

// Populate table on load
function renderTable() {
    clockTableBody.innerHTML = '';
    workers.forEach(worker => {
        const row = document.createElement('tr');

        const nameTd = document.createElement('td');
        nameTd.textContent = worker.name;

        const clockInTd = document.createElement('td');
        clockInTd.textContent = worker.clockIn ? formatTime(worker.clockIn) : '-';

        const clockOutTd = document.createElement('td');
        clockOutTd.textContent = worker.clockOut ? formatTime(worker.clockOut) : '-';

        const totalTd = document.createElement('td');
        totalTd.textContent = calculateHours(worker);

        const statusTd = document.createElement('td');
        if(worker.clockIn && !worker.clockOut) {
            statusTd.textContent = 'Clocked In';
            statusTd.classList.add('status-clockin');
        } else {
            statusTd.textContent = 'Clocked Out';
            statusTd.classList.add('status-clockout');
        }

        row.appendChild(nameTd);
        row.appendChild(clockInTd);
        row.appendChild(clockOutTd);
        row.appendChild(totalTd);
        row.appendChild(statusTd);

        clockTableBody.appendChild(row);
    });
}

// Format date to HH:MM
function formatTime(date) {
    const d = new Date(date);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

// Calculate total hours today
function calculateHours(worker) {
    if(worker.clockIn && worker.clockOut) {
        const diffMs = new Date(worker.clockOut) - new Date(worker.clockIn);
        const diffHrs = diffMs / (1000 * 60 * 60);
        return diffHrs.toFixed(2) + ' h';
    } else if(worker.clockIn && !worker.clockOut) {
        const diffMs = new Date() - new Date(worker.clockIn);
        const diffHrs = diffMs / (1000 * 60 * 60);
        return diffHrs.toFixed(2) + ' h';
    } else {
        return '0 h';
    }
}

// Clock-In Event
clockInBtn.addEventListener('click', () => {
    const selectedWorker = workerSelect.value;
    const worker = workers.find(w => w.name === selectedWorker);
    if(worker.clockIn && !worker.clockOut) {
        alert(`${worker.name} is already clocked in!`);
        return;
    }
    worker.clockIn = new Date();
    worker.clockOut = null; // reset if previously clocked out
    renderTable();
});

// Clock-Out Event
clockOutBtn.addEventListener('click', () => {
    const selectedWorker = workerSelect.value;
    const worker = workers.find(w => w.name === selectedWorker);
    if(!worker.clockIn) {
        alert(`${worker.name} hasn't clocked in yet!`);
        return;
    }
    if(worker.clockOut) {
        alert(`${worker.name} is already clocked out!`);
        return;
    }
    worker.clockOut = new Date();
    renderTable();
});

// Update table every minute to refresh total hours dynamically
setInterval(renderTable, 60000);

// Initial render
renderTable();

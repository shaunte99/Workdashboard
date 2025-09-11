// ===== Calendar JS =====

// DOM Elements
const calendarDays = document.querySelector('.calendar-days');
const monthYear = document.querySelector('.calendar-header h2');
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const modal = document.querySelector('.modal');
const modalClose = document.querySelector('.close-btn');
const eventForm = document.querySelector('#eventForm');
const eventDateInput = document.querySelector('#eventDate');
const eventDescInput = document.querySelector('#eventDesc');

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// Store events
let events = {}; // { 'YYYY-MM-DD': ['Event 1', 'Event 2'] }

// Month names
const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Render Calendar
function renderCalendar(month, year) {
    calendarDays.innerHTML = '';
    monthYear.textContent = `${months[month]} ${year}`;

    let firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    firstDay = (firstDay + 6) % 7; // Shift so Monday = 0

    const lastDate = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before first of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        calendarDays.appendChild(emptyDiv);
    }

    // Add days
    for (let day = 1; day <= lastDate; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.textContent = day;

        const fullDate = `${year}-${(month + 1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;

        // Highlight today
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        // Add event indicator
        if (events[fullDate]) {
            const eventDot = document.createElement('div');
            eventDot.style.width = '6px';
            eventDot.style.height = '6px';
            eventDot.style.borderRadius = '50%';
            eventDot.style.backgroundColor = '#3a3a5c';
            eventDot.style.margin = '3px auto 0';
            dayDiv.appendChild(eventDot);
        }

        // Click to open modal
        dayDiv.addEventListener('click', () => openModal(fullDate));

        calendarDays.appendChild(dayDiv);
    }
}

// Navigation
prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
});

nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
});

// Modal functions
function openModal(date) {
    modal.style.display = 'block';
    eventDateInput.value = date;
    eventDescInput.value = '';
}

modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Submit Event
eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = eventDateInput.value;
    const desc = eventDescInput.value.trim();

    if (!desc) return;

    if (!events[date]) events[date] = [];
    events[date].push(desc);

    modal.style.display = 'none';
    renderCalendar(currentMonth, currentYear);
});

// Initial render
renderCalendar(currentMonth, currentYear);

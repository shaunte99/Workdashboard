// ===== Tasks Page System =====

// Check if tasks exist in localStorage or start with empty array
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// DOM Elements
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueDate = document.getElementById('taskDueDate');
const taskPriority = document.getElementById('taskPriority');
const taskTableBody = document.querySelector('#taskTable tbody');

// ===== Render Tasks Table =====
function renderTasks() {
    taskTableBody.innerHTML = '';

    tasks.forEach((task, index) => {
        const row = document.createElement('tr');

        // Task Title
        const titleTd = document.createElement('td');
        titleTd.textContent = task.title;
        row.appendChild(titleTd);

        // Due Date
        const dueTd = document.createElement('td');
        dueTd.textContent = task.dueDate ? task.dueDate : '-';
        row.appendChild(dueTd);

        // Priority
        const priorityTd = document.createElement('td');
        priorityTd.textContent = task.priority;
        priorityTd.classList.add(`priority-${task.priority.toLowerCase()}`);
        row.appendChild(priorityTd);

        // Status
        const statusTd = document.createElement('td');
        statusTd.textContent = task.status;
        statusTd.classList.add(task.status === 'Complete' ? 'status-complete' : 'status-pending');
        row.appendChild(statusTd);

        // Actions
        const actionsTd = document.createElement('td');

        // Complete Button
        const completeBtn = document.createElement('button');
        completeBtn.textContent = 'Complete';
        completeBtn.classList.add('action-btn', 'complete-btn');
        completeBtn.disabled = task.status === 'Complete'; // disable if already complete
        completeBtn.addEventListener('click', () => {
            tasks[index].status = 'Complete';
            saveTasks();
            renderTasks();
        });
        actionsTd.appendChild(completeBtn);

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.classList.add('action-btn', 'edit-btn');
        editBtn.addEventListener('click', () => {
            editTask(index);
        });
        actionsTd.appendChild(editBtn);

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('action-btn', 'delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete task "${task.title}"?`)) {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
            }
        });
        actionsTd.appendChild(deleteBtn);

        row.appendChild(actionsTd);

        taskTableBody.appendChild(row);
    });
}

// ===== Save tasks to localStorage =====
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ===== Add Task =====
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitle.value.trim();
    if (!title) {
        alert('Task title is required!');
        return;
    }

    const newTask = {
        title: title,
        description: taskDescription.value.trim(),
        dueDate: taskDueDate.value,
        priority: taskPriority.value,
        status: 'Pending'
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    // Reset form
    taskForm.reset();
});

// ===== Edit Task =====
function editTask(index) {
    const task = tasks[index];
    const newTitle = prompt('Edit Task Title:', task.title);
    if (newTitle === null) return; // cancel
    const newDesc = prompt('Edit Task Description:', task.description);
    if (newDesc === null) return;
    const newDue = prompt('Edit Due Date (YYYY-MM-DD):', task.dueDate);
    if (newDue === null) return;
    const newPriority = prompt('Edit Priority (High, Medium, Low):', task.priority);
    if (newPriority === null) return;

    tasks[index] = {
        ...task,
        title: newTitle.trim(),
        description: newDesc.trim(),
        dueDate: newDue.trim(),
        priority: newPriority.trim()
    };

    saveTasks();
    renderTasks();
}

// ===== Initial Render =====
renderTasks();

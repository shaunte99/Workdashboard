/* app.js - professional dashboard prototype
   LocalStorage-backed. Replace storage functions with API calls for production.
*/

const STORAGE_KEY = 'poppie_corp_dashboard_v1';

/* ---------- Utilities ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const now = () => Date.now();
const todayDate = d => (new Date(d)).toISOString().slice(0,10);

/* ---------- Initial Data ---------- */
const DEFAULT_WORKERS = [
  {id:1, name:'Name of Worker 1'},
  {id:2, name:'Name of Worker 2'},
  {id:3, name:'Name of Worker 3'},
  {id:4, name:'Name of Worker 4'},
  {id:5, name:'Name of Worker 5'},
];

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return seed();
    return JSON.parse(raw);
  }catch(e){ return seed(); }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

function seed(){
  const s = {
    workers: DEFAULT_WORKERS.slice(),
    records: [], // {id, workerId or 'Poppie', date, inTS, outTS}
    tasks: [], // {id, text, scope: 'today'|'week', done:false}
  };
  saveState(s);
  return s;
}

let STATE = loadState();

/* ---------- Navigation ---------- */
$$('.menu-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.menu-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    $$('.view').forEach(v=>v.classList.remove('visible'));
    const el = document.getElementById('view-' + (view === 'overview' ? 'overview' : view));
    if(el) el.classList.add('visible');
    refreshAll();
  });
});

/* ---------- Worker UI ---------- */
function buildWorkersTable(){
  const tbody = $('#workersTbody');
  tbody.innerHTML = '';
  STATE.workers.forEach(w=>{
    const recToday = lastRecord(w.id, todayDate(Date.now()));
    const lastIn = recToday && recToday.inTS ? formatTime(recToday.inTS) : '-';
    const lastOut = recToday && recToday.outTS ? formatTime(recToday.outTS) : '-';
    const status = recToday && recToday.inTS && !recToday.outTS ? 'IN' : 'OUT';
    const hoursToday = computeHoursForDay(w.id, todayDate(Date.now()));

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><div class="worker-name" contenteditable="true" data-id="${w.id}">${escapeHtml(w.name)}</div></td>
      <td><strong>${status}</strong></td>
      <td>${lastIn}</td>
      <td>${lastOut}</td>
      <td>${hoursToday}</td>
      <td>
        <button class="ghost small" data-act="in" data-id="${w.id}">Clock In</button>
        <button class="secondary small" data-act="out" data-id="${w.id}">Clock Out</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // events: inline edits
  tbody.querySelectorAll('.worker-name').forEach(d=>{
    d.addEventListener('blur', e=>{
      const id = +d.dataset.id;
      const w = STATE.workers.find(x=>x.id===id);
      if(w){ w.name = d.textContent.trim() || `Name of Worker ${id}`; saveState(STATE); refreshWeeklyTotals(); }
    });
    d.addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); d.blur(); } });
  });

  // action buttons
  tbody.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = +b.dataset.id;
      const act = b.dataset.act;
      if(act === 'in') workerClockIn(id);
      if(act === 'out') workerClockOut(id);
    });
  });
}

/* ---------- Records (clock in/out) ---------- */
function newRecord(subject, dateStr, inTS=null, outTS=null){
  return { id: Math.floor(Math.random()*1e9), subject, date: dateStr, inTS, outTS };
}
function lastRecord(subjectIdOrName, dateStr){
  // subject is 'Poppie' or numeric workerId
  const recs = STATE.records.filter(r => r.subject === subjectIdOrName && r.date === dateStr);
  return recs.slice(-1)[0];
}

function workerClockIn(workerId){
  const date = todayDate(Date.now());
  let rec = STATE.records.find(r => r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(rec){ alert('Worker already clocked in'); return; }
  STATE.records.push(newRecord(workerId, date, Date.now(), null));
  saveState(STATE); refreshAll();
}
function workerClockOut(workerId){
  const date = todayDate(Date.now());
  let rec = STATE.records.find(r => r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in found'); return; }
  rec.outTS = Date.now();
  saveState(STATE); refreshAll();
}

/* Poppie clock */
function poppieClockIn(){ 
  const date = todayDate(Date.now());
  let rec = STATE.records.find(r => r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(rec){ alert('You are already clocked in'); return; }
  STATE.records.push(newRecord('Poppie', date, Date.now(), null));
  saveState(STATE); refreshAll();
}
function poppieClockOut(){
  const date = todayDate(Date.now());
  let rec = STATE.records.find(r => r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in found for Poppie'); return; }
  rec.outTS = Date.now();
  saveState(STATE); refreshAll();
}

/* ---------- Calculations ---------- */
function computeHoursForDay(subject, dateStr){
  // sum all full in/out for the date; if in and no out, count until now
  const recs = STATE.records.filter(r => r.subject === subject && r.date === dateStr);
  let totalMs = 0;
  recs.forEach(r => {
    if(r.inTS && r.outTS) totalMs += Math.max(0, r.outTS - r.inTS);
    else if(r.inTS && !r.outTS) totalMs += Math.max(0, Date.now() - r.inTS);
  });
  if(totalMs === 0) return '-';
  const hours = totalMs / 3600000;
  return hours.toFixed(2) + ' h';
}

function weeklyTotalsForWorker(workerId){
  // simple week bucket: Monday-Sunday of current date
  const start = weekStart(new Date());
  const end = new Date(start); end.setDate(end.getDate() + 7);
  let totalMs = 0;
  STATE.records.forEach(r => {
    if(r.subject === workerId){
      const d = new Date(r.date + 'T00:00:00');
      if(d >= start && d < end && r.inTS && r.outTS) totalMs += Math.max(0, r.outTS - r.inTS);
    }
  });
  return (totalMs / 3600000).toFixed(2);
}

function weekStart(d){
  const dt = new Date(d);
  const day = dt.getDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7; // shift so Monday = 0
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0,0,0,0);
  return dt;
}

/* ---------- UI Renders ---------- */
function refreshAll(){
  buildWorkersTable();
  renderPoppieLog();
  refreshSummaries();
  renderWeeklyTotals();
  renderTaskSection();
}

function renderPoppieLog(){
  const tbody = $('#poppieLog');
  tbody.innerHTML = '';
  const recs = STATE.records.filter(r=> r.subject === 'Poppie').sort((a,b)=> b.inTS - a.inTS);
  recs.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(r.date)}</td>
      <td>${r.inTS ? formatTime(r.inTS) : '-'}</td>
      <td>${r.outTS ? formatTime(r.outTS) : '-'}</td>
      <td>${(r.inTS && r.outTS) ? (((r.outTS - r.inTS)/3600000).toFixed(2) + ' h') : (r.inTS && !r.outTS ? computeHoursForDay('Poppie', r.date) : '-')}</td>
    `;
    tbody.appendChild(tr);
  });

  // status
  const active = STATE.records.some(r => r.subject === 'Poppie' && r.inTS && !r.outTS);
  $('#poppieStatusText').textContent = active ? 'IN' : 'OUT';
}

function refreshSummaries(){
  // totals today & week across workers
  let totalTodayMs = 0, totalWeekMs = 0;
  STATE.workers.forEach(w => {
    const tdRecs = STATE.records.filter(r => r.subject === w.id && r.date === todayDate(Date.now()));
    tdRecs.forEach(r => { if(r.inTS && r.outTS) totalTodayMs += (r.outTS - r.inTS); else if(r.inTS && !r.outTS) totalTodayMs += (Date.now() - r.inTS); });

    // week
    const start = weekStart(new Date());
    const end = new Date(start); end.setDate(end.getDate()+7);
    STATE.records.forEach(r => {
      if(r.subject === w.id){
        const d = new Date(r.date + 'T00:00:00');
        if(d >= start && d < end && r.inTS && r.outTS) totalWeekMs += (r.outTS - r.inTS);
      }
    });
  });
  $('#totalToday').textContent = (totalTodayMs/3600000).toFixed(2) + ' h';
  $('#totalWeek').textContent = (totalWeekMs/3600000).toFixed(2) + ' h';
  $('#workerCount').textContent = STATE.workers.length;
}

function renderWeeklyTotals(){
  const tbody = $('#weeklyTotals');
  tbody.innerHTML = '';
  STATE.workers.forEach(w=>{
    const hrs = weeklyTotalsForWorker(w.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(w.name)}</td><td>${hrs}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- Tasks ---------- */
function renderTaskSection(){
  const tasksToday = STATE.tasks.filter(t => t.scope === 'today');
  $('#taskCount').textContent = `(${tasksToday.length})`;
  const ul = $('#taskList'); ul.innerHTML = '';
  tasksToday.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}/> <div style="flex:1">${escapeHtml(t.text)}</div> <button class="ghost small" data-del="${t.id}">Delete</button>`;
    ul.appendChild(li);
  });

  // handlers
  $$('#taskList input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change', e=>{
      const id = +cb.dataset.id;
      const t = STATE.tasks.find(x=>x.id===id); if(t) t.done = cb.checked; saveState(STATE); renderTaskSection(); updateProgress();
    });
  });
  $$('#taskList [data-del]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = +b.dataset.del;
      STATE.tasks = STATE.tasks.filter(x=> x.id !== id);
      saveState(STATE); renderTaskSection(); updateProgress();
    });
  });

  updateProgress();
  // All tasks view
  const all = $('#allTasks'); if(all) {
    all.innerHTML = '';
    STATE.tasks.forEach(t => { const li = document.createElement('li'); li.textContent = `${t.scope === 'today' ? '[Today] ' : '[Week] '} ${t.text}`; all.appendChild(li); });
  }
}

/* ---------- Task actions ---------- */
function addTask(){
  const text = $('#taskText').value.trim();
  const scope = $('#taskScope').value;
  if(!text) return;
  STATE.tasks.push({ id: Date.now(), text, scope, done:false });
  saveState(STATE); $('#taskText').value = ''; renderTaskSection();
}
function clearCompleted(){ STATE.tasks = STATE.tasks.filter(t => !t.done); saveState(STATE); renderTaskSection(); }
function markAllDone(){ STATE.tasks.forEach(t=> t.done = true); saveState(STATE); renderTaskSection(); }

/* ---------- Progress bar ---------- */
function updateProgress(){
  const tasksToday = STATE.tasks.filter(t => t.scope === 'today');
  const total = tasksToday.length;
  const done = tasksToday.filter(t => t.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  $('#progressFill').style.width = pct + '%';
  $('#progressMeta').textContent = `${done} / ${total} tasks • ${pct}%`;
}

/* ---------- CSV Export ---------- */
function exportCSV(){
  // collect records
  const rows = [['Subject','Date','Clock In','Clock Out','Hours(h)']];
  STATE.records.forEach(r=>{
    const inS = r.inTS ? new Date(r.inTS).toLocaleString() : '';
    const outS = r.outTS ? new Date(r.outTS).toLocaleString() : '';
    const hours = (r.inTS && r.outTS) ? ((r.outTS - r.inTS)/3600000).toFixed(2) : '';
    const subj = (r.subject === 'Poppie') ? 'Poppie' : (STATE.workers.find(w=>w.id===r.subject)?.name || `Worker ${r.subject}`);
    rows.push([subj, r.date, inS, outS, hours]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'poppie_records.csv'; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- Helpers ---------- */
function formatTime(ts){ return new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---------- Init wiring ---------- */
$('#addWorkerBtn')?.addEventListener('click', ()=>{
  const nextId = STATE.workers.length ? Math.max(...STATE.workers.map(w=>w.id))+1 : 1;
  STATE.workers.push({id: nextId, name: `Name of Worker ${nextId}`});
  saveState(STATE); refreshAll();
});
$('#addWorkerBtn2')?.addEventListener('click', ()=> $('#addWorkerBtn').click());
$('#removeEmpty')?.addEventListener('click', ()=>{
  STATE.workers = STATE.workers.filter(w => w.name && w.name.trim());
  saveState(STATE); refreshAll();
});
$('#resetWorkers')?.addEventListener('click', ()=>{
  if(!confirm('Reset workers to defaults?')) return;
  STATE.workers = DEFAULT_WORKERS.slice(); STATE.records = STATE.records.filter(r => r.subject === 'Poppie'); saveState(STATE); refreshAll();
});

$('#poppieClockIn')?.addEventListener('click', poppieClockIn);
$('#poppieClockOut')?.addEventListener('click', poppieClockOut);

$('#addTask')?.addEventListener('click', addTask);
$('#clearCompleted')?.addEventListener('click', clearCompleted);
$('#markAllDone')?.addEventListener('click', markAllDone);

$('#exportCsv')?.addEventListener('click', exportCSV);
$('#resetData')?.addEventListener('click', ()=>{
  if(!confirm('Reset all data?')) return;
  STATE = seed(); refreshAll();
});

/* ---------- start ---------- */
refreshAll();

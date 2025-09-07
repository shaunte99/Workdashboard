/* app.js — Events-enabled professional dashboard
   Single-file local prototype. localStorage for persistence.
   Features added: Events pipeline, per-event tasks, financials, orders, plus existing workers and Poppie clocks.
*/

const STORAGE_KEY = 'poppie_corp_dashboard_v2';

/* -------------------- Utilities -------------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const now = () => Date.now();
const todayDate = ts => (new Date(ts)).toISOString().slice(0,10);
const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-';
const escapeHtml = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* -------------------- Seed / State -------------------- */
const DEFAULT_WORKERS = [
  {id:1,name:'Name of Worker 1'},
  {id:2,name:'Name of Worker 2'},
  {id:3,name:'Name of Worker 3'},
  {id:4,name:'Name of Worker 4'},
  {id:5,name:'Name of Worker 5'}
];

function seed(){
  const s = {
    workers: DEFAULT_WORKERS.slice(),
    records: [], // {id, subject ('Poppie' or workerId), date, inTS, outTS}
    tasks: [],   // {id, text, scope:'today'|'week'|'event', eventId:null, done:false}
    events: [],  // {id, title, type, date, budget, status, cost:0}
    orders: []   // {id, eventId, item, supplier, cost, status}
  };
  saveState(s);
  return s;
}

function loadState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : seed(); }catch(e){ return seed(); }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let STATE = loadState();

/* -------------------- Navigation -------------------- */
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

/* -------------------- Workers UI & Clock -------------------- */
function buildWorkersTable(){
  const tbody = $('#workersTbody'); tbody.innerHTML = '';
  STATE.workers.forEach(w=>{
    const rec = lastRecord(w.id, todayDate(Date.now()));
    const lastIn = rec && rec.inTS ? formatTime(rec.inTS) : '-';
    const lastOut = rec && rec.outTS ? formatTime(rec.outTS) : '-';
    const status = rec && rec.inTS && !rec.outTS ? 'IN' : 'OUT';
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

  tbody.querySelectorAll('.worker-name').forEach(d=>{
    d.addEventListener('blur', ()=>{
      const id = +d.dataset.id; const w = STATE.workers.find(x=>x.id===id);
      if(w){ w.name = d.textContent.trim() || `Name of Worker ${id}`; saveState(STATE); refreshAll(); }
    });
    d.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); d.blur(); } });
  });

  tbody.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=> {
      const id = +b.dataset.id; const act = b.dataset.act;
      if(act==='in') workerClockIn(id);
      if(act==='out') workerClockOut(id);
    });
  });
}

function workerClockIn(workerId){
  const date = todayDate(Date.now());
  const exists = STATE.records.find(r => r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(exists){ alert('Worker already clocked in for today'); return; }
  STATE.records.push({ id:Math.floor(Math.random()*1e9), subject: workerId, date, inTS: Date.now(), outTS: null });
  saveState(STATE); refreshAll();
}
function workerClockOut(workerId){
  const date = todayDate(Date.now());
  const rec = STATE.records.find(r => r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in found'); return; }
  rec.outTS = Date.now(); saveState(STATE); refreshAll();
}

/* -------------------- Poppie clock -------------------- */
function poppieClockIn(){
  const date = todayDate(Date.now());
  const exists = STATE.records.find(r => r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(exists){ alert('Already clocked in'); return; }
  STATE.records.push({ id:Math.floor(Math.random()*1e9), subject:'Poppie', date, inTS: Date.now(), outTS: null });
  saveState(STATE); refreshAll();
}
function poppieClockOut(){
  const date = todayDate(Date.now());
  const rec = STATE.records.find(r => r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in'); return; }
  rec.outTS = Date.now(); saveState(STATE); refreshAll();
}

/* -------------------- Records & calculations -------------------- */
function lastRecord(subject, dateStr){
  const list = STATE.records.filter(r => r.subject === subject && r.date === dateStr);
  return list.slice(-1)[0];
}
function computeHoursForDay(subject, dateStr){
  const recs = STATE.records.filter(r => r.subject === subject && r.date === dateStr);
  let totalMs = 0;
  recs.forEach(r => {
    if(r.inTS && r.outTS) totalMs += Math.max(0, r.outTS - r.inTS);
    else if(r.inTS && !r.outTS) totalMs += Math.max(0, Date.now() - r.inTS);
  });
  if(totalMs === 0) return '-';
  return (totalMs/3600000).toFixed(2) + ' h';
}
function weekStart(d){ const dt = new Date(d); const day = dt.getDay(); const diff = (day + 6) % 7; dt.setDate(dt.getDate() - diff); dt.setHours(0,0,0,0); return dt; }
function weeklyTotalsForWorker(workerId){
  const start = weekStart(new Date()); const end = new Date(start); end.setDate(end.getDate()+7);
  let totalMs = 0;
  STATE.records.forEach(r=>{
    if(r.subject === workerId){
      const d = new Date(r.date + 'T00:00:00');
      if(d >= start && d < end && r.inTS && r.outTS) totalMs += Math.max(0, r.outTS - r.inTS);
    }
  });
  return (totalMs/3600000).toFixed(2);
}

/* -------------------- Events -------------------- */
function addEvent(){
  const title = $('#evtTitle').value.trim();
  if(!title){ alert('Add event title'); return; }
  const type = $('#evtType').value;
  const date = $('#evtDate').value || todayDate(Date.now());
  const budget = parseFloat($('#evtBudget').value || 0);
  const status = $('#evtStatus').value;
  const id = Math.floor(Math.random()*1e9);
  STATE.events.push({id, title, type, date, budget, status, cost:0});
  saveState(STATE); $('#evtTitle').value=''; $('#evtBudget').value=''; refreshEventsUI();
}
function updateEventStatus(eventId, status){
  const e = STATE.events.find(x=>x.id===eventId); if(e){ e.status = status; saveState(STATE); refreshEventsUI(); }
}
function deleteEvent(eventId){
  if(!confirm('Delete event and linked tasks/orders?')) return;
  STATE.events = STATE.events.filter(e=>e.id!==eventId);
  STATE.tasks = STATE.tasks.filter(t=> t.eventId !== eventId);
  STATE.orders = STATE.orders.filter(o=> o.eventId !== eventId);
  saveState(STATE); refreshEventsUI(); refreshAll();
}
function recalcEventCosts(){
  // cost = sum of orders for event
  STATE.events.forEach(e=>{
    const orders = STATE.orders.filter(o=> o.eventId===e.id && o.cost).map(x=>+x.cost||0);
    e.cost = orders.reduce((a,b)=>a+b,0);
  });
  saveState(STATE);
}

/* -------------------- Orders -------------------- */
function addOrder(){
  const eventId = +$('#orderEventSelect').value;
  if(!eventId){ alert('Select event'); return; }
  const item = $('#orderItem').value.trim(); if(!item){ alert('Add item name'); return; }
  const supplier = $('#orderSupplier').value.trim();
  const cost = parseFloat($('#orderCost').value || 0);
  const status = $('#orderStatus').value;
  const id = Math.floor(Math.random()*1e9);
  STATE.orders.push({id, eventId, item, supplier, cost, status});
  saveState(STATE); $('#orderItem').value=''; $('#orderSupplier').value=''; $('#orderCost').value=''; refreshOrdersUI(); recalcEventCosts(); refreshAll();
}
function updateOrderStatus(orderId, status){
  const o = STATE.orders.find(x=>x.id===orderId); if(o){ o.status = status; saveState(STATE); refreshOrdersUI(); recalcEventCosts(); refreshAll(); }
}
function deleteOrder(orderId){
  STATE.orders = STATE.orders.filter(o=> o.id!==orderId); saveState(STATE); refreshOrdersUI(); recalcEventCosts(); refreshAll();
}
function ordersProgress(){
  const total = STATE.orders.length;
  const delivered = STATE.orders.filter(o=> o.status === 'Delivered').length;
  return {total, delivered};
}

/* -------------------- Tasks -------------------- */
function addTaskUI(){
  const text = $('#taskText').value.trim(); const scope = $('#taskScope').value;
  if(!text) return;
  STATE.tasks.push({id:Math.floor(Math.random()*1e9), text, scope, eventId:null, done:false});
  saveState(STATE); $('#taskText').value=''; renderTaskSection(); renderAllTasks();
}
function addEventTask(eventId, text){
  if(!text) return;
  STATE.tasks.push({id:Math.floor(Math.random()*1e9), text, scope:'event', eventId, done:false});
  saveState(STATE);
}
function toggleTask(taskId, done){
  const t = STATE.tasks.find(x=>x.id===taskId); if(t){ t.done = !!done; saveState(STATE); renderTaskSection(); renderAllTasks(); }
}
function clearCompletedTasks(){ STATE.tasks = STATE.tasks.filter(t=> !t.done); saveState(STATE); renderTaskSection(); }

/* -------------------- Rendering UI -------------------- */
function renderPoppieLog(){
  const tbody = $('#poppieLog'); tbody.innerHTML = '';
  const recs = STATE.records.filter(r=> r.subject === 'Poppie').sort((a,b)=> b.inTS - a.inTS);
  recs.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.date)}</td><td>${r.inTS?formatTime(r.inTS):'-'}</td><td>${r.outTS?formatTime(r.outTS):'-'}</td><td>${r.inTS && r.outTS ? ((r.outTS - r.inTS)/3600000).toFixed(2) + ' h' : (r.inTS && !r.outTS ? computeHoursForDay('Poppie', r.date) : '-') }</td>`;
    tbody.appendChild(tr);
  });
  const active = STATE.records.some(r=> r.subject === 'Poppie' && r.inTS && !r.outTS);
  $('#poppieStatusText').textContent = active ? 'IN' : 'OUT';
}

function refreshSummaries(){
  // Totals for workers today & week
  let totalTodayMs = 0, totalWeekMs = 0;
  STATE.workers.forEach(w=>{
    const td = STATE.records.filter(r=> r.subject === w.id && r.date === todayDate(Date.now()));
    td.forEach(r=> { if(r.inTS && r.outTS) totalTodayMs += (r.outTS - r.inTS); else if(r.inTS && !r.outTS) totalTodayMs += Date.now() - r.inTS; });
    // week
    const start = weekStart(new Date()); const end = new Date(start); end.setDate(end.getDate()+7);
    STATE.records.forEach(r=>{
      if(r.subject === w.id && r.inTS && r.outTS){
        const d = new Date(r.date + 'T00:00:00');
        if(d >= start && d < end) totalWeekMs += (r.outTS - r.inTS);
      }
    });
  });
  $('#totalToday').textContent = (totalTodayMs/3600000).toFixed(2) + ' h';
  $('#totalWeek').textContent = (totalWeekMs/3600000).toFixed(2) + ' h';
  $('#workerCount').textContent = STATE.workers.length;
}

function renderWeeklyTotals(){
  const tbody = $('#weeklyTotals'); if(!tbody) return; tbody.innerHTML = '';
  STATE.workers.forEach(w=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(w.name)}</td><td>${weeklyTotalsForWorker(w.id)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderTaskSection(){
  const tasksToday = STATE.tasks.filter(t=> t.scope === 'today');
  $('#taskCount').textContent = `(${tasksToday.length})`;
  const ul = $('#taskList'); ul.innerHTML = '';
  tasksToday.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}/> <div style="flex:1">${escapeHtml(t.text)}</div> <button class="ghost small" data-del="${t.id}">Delete</button>`;
    ul.appendChild(li);
  });
  // handlers
  $$('#taskList input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', ()=> toggleTask(+cb.dataset.id, cb.checked) ));
  $$('#taskList [data-del]').forEach(b=> b.addEventListener('click', ()=> { STATE.tasks = STATE.tasks.filter(t=> t.id !== +b.dataset.del); saveState(STATE); renderTaskSection(); } ));
  updateProgress();
  renderAllTasks();
}
function renderAllTasks(){
  const all = $('#allTasks'); if(!all) return; all.innerHTML = '';
  STATE.tasks.forEach(t => {
    const label = t.scope === 'today' ? '[Today]' : t.scope === 'week' ? '[Week]' : `[Event:${t.eventId}]`;
    const li = document.createElement('li'); li.textContent = `${label} ${t.text}`; all.appendChild(li);
  });
}

/* -------------------- Events UI -------------------- */
function refreshEventsUI(){
  const tbody = $('#eventsTbody'); tbody.innerHTML = '';
  STATE.events.forEach(e=>{
    const profit = (e.budget || 0) - (e.cost || 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.type)}</td><td>${escapeHtml(e.date)}</td><td><select data-event="${e.id}" class="evt-status"><option${e.status==='Inquiry'?' selected':''}>Inquiry</option><option${e.status==='Quoting'?' selected':''}>Quoting</option><option${e.status==='Confirmed'?' selected':''}>Confirmed</option><option${e.status==='Planning'?' selected':''}>Planning</option><option${e.status==='Completed'?' selected':''}>Completed</option></select></td><td>R ${Number(e.budget||0).toFixed(2)}</td><td>R ${Number(e.cost||0).toFixed(2)}</td><td>R ${Number(profit).toFixed(2)}</td><td><button class="ghost small" data-act="open" data-id="${e.id}">Open</button> <button class="ghost small" data-act="del" data-id="${e.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  // status change handlers
  $$('.evt-status').forEach(s=>{
    s.addEventListener('change', ()=> updateEventStatus(+s.dataset.event, s.value));
  });
  // open/delete
  $$('#eventsTbody button').forEach(b=>{
    b.addEventListener('click', ()=>{
      const id = +b.dataset.id; const act = b.dataset.act;
      if(act==='open') selectEvent(id);
      if(act==='del') deleteEvent(id);
    });
  });
  refreshEventSelect();
  recalcEventCosts();
  renderEventManagementList();
}

function renderEventManagementList(){
  const tbody = $('#eventsManageTbody'); if(!tbody) return; tbody.innerHTML = '';
  STATE.events.forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(e.title)} <div class="muted" style="font-size:12px">${e.type} • ${e.date}</div></td><td><button class="ghost small" data-id="${e.id}" data-act="open">Open</button></td>`;
    tbody.appendChild(tr);
  });
  $$('#eventsManageTbody button').forEach(b=> b.addEventListener('click', ()=> selectEvent(+b.dataset.id) ));
}

function selectEvent(id){
  const e = STATE.events.find(x=>x.id===id); if(!e) return;
  const panel = $('#selectedEventPanel');
  panel.innerHTML = `
    <div style="font-weight:700">${escapeHtml(e.title)}</div>
    <div class="muted">${escapeHtml(e.type)} • ${escapeHtml(e.date)}</div>
    <div style="margin-top:8px">Budget: R ${Number(e.budget||0).toFixed(2)}</div>
    <div>Cost: R ${Number(e.cost||0).toFixed(2)}</div>
    <div>Profit: R ${(Number(e.budget||0) - Number(e.cost||0)).toFixed(2)}</div>
    <div style="margin-top:8px">
      <button class="ghost small" id="addEventTaskBtn">+ Add Event Task</button>
      <button class="ghost small" id="viewEventOrdersBtn">View Orders</button>
    </div>
  `;
  // handlers
  $('#addEventTaskBtn').addEventListener('click', ()=>{
    const txt = prompt('Task for this event:');
    if(txt) addEventTask(e.id, txt);
    renderTaskSection();
  });
  $('#viewEventOrdersBtn').addEventListener('click', ()=> {
    // open orders view and filter by event
    $$('.menu-btn').forEach(b=>b.classList.remove('active')); $$('.menu-btn')[4].classList.add('active'); // orders button index
    $$('.view').forEach(v=>v.classList.remove('visible'));
    $('#view-orders').classList.add('visible');
    $('#orderEventSelect').value = e.id; refreshOrdersUI();
  });
}

/* -------------------- Orders UI -------------------- */
function refreshOrdersUI(){
  const tbody = $('#ordersTbody'); tbody.innerHTML = '';
  STATE.orders.forEach(o=>{
    const evt = STATE.events.find(e=> e.id === o.eventId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${evt?escapeHtml(evt.title):'—'}</td><td>${escapeHtml(o.item)}</td><td>${escapeHtml(o.supplier||'—')}</td><td>R ${Number(o.cost||0).toFixed(2)}</td><td>${escapeHtml(o.status)}</td><td><button class="ghost small" data-act="del" data-id="${o.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  $$('#ordersTbody button[data-act="del"]').forEach(b=> b.addEventListener('click', ()=> deleteOrder(+b.dataset.id) ));
  // fill event select
  refreshEventSelect();
  updateOrdersProgressUI();
}

function refreshEventSelect(){
  const sel = $('#orderEventSelect'); if(!sel) return;
  sel.innerHTML = '<option value="">— Select Event —</option>';
  STATE.events.forEach(e=> sel.innerHTML += `<option value="${e.id}">${escapeHtml(e.title)} • ${escapeHtml(e.date)}</option>`);
}

/* -------------------- Progress UI -------------------- */
function updateProgress(){
  const tasksToday = STATE.tasks.filter(t=> t.scope === 'today');
  const total = tasksToday.length; const done = tasksToday.filter(t=> t.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  $('#progressFill').style.width = pct + '%';
  $('#progressMeta').textContent = `${done} / ${total} tasks • ${pct}%`;
}

function updateOrdersProgressUI(){
  const {total, delivered} = ordersProgress();
  const pct = total ? Math.round((delivered/total)*100) : 0;
  $('#ordersProgressFill').style.width = pct + '%';
  $('#ordersProgressMeta').textContent = `${delivered} / ${total} delivered`;
}

/* -------------------- Reports & CSV -------------------- */
function exportCSV(){
  const rows = [['Subject','Date','Clock In','Clock Out','Hours(h)']];
  STATE.records.forEach(r=>{
    const inS = r.inTS ? new Date(r.inTS).toLocaleString() : '';
    const outS = r.outTS ? new Date(r.outTS).toLocaleString() : '';
    const hours = (r.inTS && r.outTS) ? ((r.outTS - r.inTS)/3600000).toFixed(2) : '';
    const subj = r.subject === 'Poppie' ? 'Poppie' : (STATE.workers.find(w=>w.id===r.subject)?.name || `Worker ${r.subject}`);
    rows.push([subj, r.date, inS, outS, hours]);
  });
  const csv = rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'poppie_records.csv'; document.body.appendChild(a); a.click(); a.remove();
}

/* -------------------- Misc UI helpers -------------------- */
function renderAllTasksAndEvents(){
  renderTaskSection(); refreshEventsUI(); refreshOrdersUI(); renderAllTasks();
}

function refreshAll(){
  buildWorkersTable();
  renderPoppieLog();
  refreshSummaries();
  renderWeeklyTotals();
  renderTaskSection();
  refreshEventsUI();
  refreshOrdersUI();
}

/* -------------------- Wiring UI actions -------------------- */
$('#poppieClockIn')?.addEventListener('click', poppieClockIn);
$('#poppieClockOut')?.addEventListener('click', poppieClockOut);

$('#addWorkerBtn')?.addEventListener('click', ()=>{ const next = STATE.workers.length ? Math.max(...STATE.workers.map(w=>w.id))+1 : 1; STATE.workers.push({id:next, name:`Name of Worker ${next}`}); saveState(STATE); refreshAll(); });
$('#addWorkerBtn2')?.addEventListener('click', ()=> $('#addWorkerBtn').click());
$('#removeEmpty')?.addEventListener('click', ()=>{ STATE.workers = STATE.workers.filter(w=> w.name && w.name.trim()); saveState(STATE); refreshAll(); });

$('#addTask')?.addEventListener('click', addTaskUI);
$('#clearCompleted')?.addEventListener('click', ()=>{ clearCompletedTasks(); renderTaskSection(); });
$('#markAllDone')?.addEventListener('click', ()=>{ STATE.tasks.forEach(t=> t.done = true); saveState(STATE); renderTaskSection(); });

$('#addEvent')?.addEventListener('click', addEvent);
$('#addOrderBtn')?.addEventListener('click', addOrder);

$('#exportCsv')?.addEventListener('click', exportCSV);
$('#resetData')?.addEventListener('click', ()=>{ if(!confirm('Reset all data?')) return; STATE = seed(); refreshAll(); });

/* -------------------- Init -------------------- */
refreshAll();

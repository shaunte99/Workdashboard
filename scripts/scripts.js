/* scripts.js
   Offline-first event ops dashboard.
   Modules: storage, navigation, workers (Poppie+crew), tasks, events, orders, reports.
*/

const STORAGE_KEY = 'poppie_ops_offline_v1';

/* ---------- DOM helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const timeStr = ts => ts ? new Date(ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '-';
const todayDate = (ts = Date.now()) => (new Date(ts)).toISOString().slice(0,10);
const uid = () => Math.floor(Math.random()*1e9);
const escapeHtml = s => String(s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Storage ---------- */
function seedState(){
  return {
    workers: [
      {id:1,name:'Name of Worker 1'},
      {id:2,name:'Name of Worker 2'},
      {id:3,name:'Name of Worker 3'},
      {id:4,name:'Name of Worker 4'},
      {id:5,name:'Name of Worker 5'},
    ],
    records: [], // {id, subject ('Poppie' or workerId), date, inTS, outTS}
    tasks: [],   // {id, text, scope:'today'|'week'|'event', eventId:null, done:false}
    events: [],  // {id, title, type, date, budget, status, cost}
    orders: []   // {id, eventId, item, supplier, cost, status}
  };
}

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedState();
  } catch(e) {
    return seedState();
  }
}
function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
let STATE = loadState();

/* ---------- NAV / UI helpers ---------- */
$$('.menu-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> {
    $$('.menu-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    $$('.view').forEach(v=>v.classList.remove('visible'));
    const el = document.getElementById('view-' + view);
    if(el) el.classList.add('visible');
    sidebarClose();
    refreshAll();
  });
});

const menuToggle = $('#menuToggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('overlay');

function sidebarOpen(){ sidebar.classList.add('active'); overlay.classList.add('active'); }
function sidebarClose(){ sidebar.classList.remove('active'); overlay.classList.remove('active'); }

if(menuToggle) menuToggle.addEventListener('click', ()=> sidebar.classList.contains('active') ? sidebarClose() : sidebarOpen());
if(overlay) overlay.addEventListener('click', sidebarClose);

/* ---------- Time / Records ---------- */
function lastRecord(subject, dateStr){
  const list = STATE.records.filter(r => r.subject === subject && r.date === dateStr);
  return list.slice(-1)[0];
}

function computeHoursForDay(subject, dateStr){
  const recs = STATE.records.filter(r => r.subject === subject && r.date === dateStr);
  let totalMs = 0;
  recs.forEach(r=>{
    if(r.inTS && r.outTS) totalMs += Math.max(0, r.outTS - r.inTS);
    else if(r.inTS && !r.outTS) totalMs += Math.max(0, Date.now() - r.inTS);
  });
  return totalMs === 0 ? '-' : (totalMs/3600000).toFixed(2) + ' h';
}

/* ---------- Workers UI & actions ---------- */
function buildWorkersTable(){
  const tbody = $('#workersTbody'); if(!tbody) return;
  tbody.innerHTML = '';
  STATE.workers.forEach(w=>{
    const rec = lastRecord(w.id, todayDate());
    const lastIn = rec && rec.inTS ? timeStr(rec.inTS) : '-';
    const lastOut = rec && rec.outTS ? timeStr(rec.outTS) : '-';
    const status = rec && rec.inTS && !rec.outTS ? 'IN' : 'OUT';
    const hoursToday = computeHoursForDay(w.id, todayDate());
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

  // name editing
  tbody.querySelectorAll('.worker-name').forEach(el=>{
    el.addEventListener('blur', ()=>{
      const id = +el.dataset.id; const w = STATE.workers.find(x=>x.id===id);
      if(w){ w.name = el.textContent.trim() || `Name of Worker ${id}`; saveState(STATE); refreshAll(); }
    });
    el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
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
  const date = todayDate();
  const exists = STATE.records.find(r=> r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(exists){ alert('Worker already clocked in'); return; }
  STATE.records.push({id:uid(), subject:workerId, date, inTS: Date.now(), outTS: null});
  saveState(STATE); refreshAll();
}
function workerClockOut(workerId){
  const date = todayDate();
  const rec = STATE.records.find(r=> r.subject === workerId && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in'); return; }
  rec.outTS = Date.now(); saveState(STATE); refreshAll();
}

/* Poppie clock */
$('#poppieClockIn')?.addEventListener('click', ()=>{
  const date = todayDate();
  const exists = STATE.records.find(r=> r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(exists){ alert('Already clocked in'); return; }
  STATE.records.push({id:uid(), subject:'Poppie', date, inTS: Date.now(), outTS: null});
  saveState(STATE); refreshAll();
});
$('#poppieClockOut')?.addEventListener('click', ()=>{
  const date = todayDate();
  const rec = STATE.records.find(r=> r.subject === 'Poppie' && r.date === date && r.inTS && !r.outTS);
  if(!rec){ alert('No active clock-in'); return; }
  rec.outTS = Date.now(); saveState(STATE); refreshAll();
});

/* Poppie log */
function renderPoppieLog(){
  const tbody = $('#poppieLog'); if(!tbody) return;
  tbody.innerHTML = '';
  const recs = STATE.records.filter(r=> r.subject === 'Poppie').sort((a,b)=>(b.inTS||0)-(a.inTS||0));
  recs.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.date)}</td><td>${r.inTS?timeStr(r.inTS):'-'}</td><td>${r.outTS?timeStr(r.outTS):'-'}</td><td>${r.inTS && r.outTS ? ((r.outTS - r.inTS)/3600000).toFixed(2)+' h' : (r.inTS && !r.outTS ? computeHoursForDay('Poppie', r.date) : '-') }</td>`;
    tbody.appendChild(tr);
  });
  const active = STATE.records.some(r=> r.subject === 'Poppie' && r.inTS && !r.outTS);
  $('#poppieStatusText').textContent = active ? 'IN' : 'OUT';
}

/* ---------- Summaries ---------- */
function weekStart(d){ const dt = new Date(d); const day = dt.getDay(); const diff = (day + 6) % 7; dt.setDate(dt.getDate() - diff); dt.setHours(0,0,0,0); return dt; }

function refreshSummaries(){
  let totalTodayMs = 0, totalWeekMs = 0;
  STATE.workers.forEach(w=>{
    // today
    const td = STATE.records.filter(r=> r.subject === w.id && r.date === todayDate());
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

/* ---------- Tasks ---------- */
function renderTaskSection(){
  const ul = $('#taskList'); if(!ul) return;
  const tasksToday = STATE.tasks.filter(t=> t.scope === 'today');
  $('#taskCount').textContent = `(${tasksToday.length})`;
  ul.innerHTML = '';
  tasksToday.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<input type="checkbox" data-id="${t.id}" ${t.done ? 'checked' : ''}/> <div style="flex:1">${escapeHtml(t.text)}</div> <button class="ghost small" data-del="${t.id}">Delete</button>`;
    ul.appendChild(li);
  });

  $$('#taskList input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', ()=> toggleTask(+cb.dataset.id, cb.checked)));
  $$('#taskList [data-del]').forEach(b=> b.addEventListener('click', ()=> { STATE.tasks = STATE.tasks.filter(t=> t.id !== +b.dataset.del); saveState(STATE); renderTaskSection(); }));

  updateProgress();
  renderAllTasks();
}

function renderAllTasks(){
  const all = $('#allTasks'); if(!all) return; all.innerHTML = '';
  STATE.tasks.forEach(t=>{
    const label = t.scope === 'today' ? '[Today]' : t.scope === 'week' ? '[Week]' : `[Event:${t.eventId}]`;
    const li = document.createElement('li'); li.textContent = `${label} ${t.text}`; all.appendChild(li);
  });
}

function addTaskUI(){
  const text = $('#taskText').value.trim(); const scope = $('#taskScope').value;
  if(!text) return;
  STATE.tasks.push({id:uid(), text, scope, eventId:null, done:false});
  saveState(STATE); $('#taskText').value=''; renderTaskSection();
}
$('#addTask')?.addEventListener('click', addTaskUI);
$('#clearCompleted')?.addEventListener('click', ()=> { STATE.tasks = STATE.tasks.filter(t=> !t.done); saveState(STATE); renderTaskSection(); });
$('#markAllDone')?.addEventListener('click', ()=> { STATE.tasks.forEach(t=> t.done = true); saveState(STATE); renderTaskSection(); });

function toggleTask(taskId, done){
  const t = STATE.tasks.find(x=>x.id===taskId); if(t){ t.done = !!done; saveState(STATE); renderTaskSection(); renderAllTasks(); }
}

function renderAllTasksAndEvents(){ renderTaskSection(); refreshEventsUI(); refreshOrdersUI(); renderAllTasks(); }

/* ---------- Events ---------- */
function refreshEventsUI(){
  const tbody = $('#eventsTbody'); if(!tbody) return; tbody.innerHTML = '';
  STATE.events.forEach(e=>{
    const profit = (Number(e.budget||0) - Number(e.cost||0));
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.type)}</td><td>${escapeHtml(e.date)}</td><td><select data-event="${e.id}" class="evt-status"><option${e.status==='Inquiry'?' selected':''}>Inquiry</option><option${e.status==='Quoting'?' selected':''}>Quoting</option><option${e.status==='Confirmed'?' selected':''}>Confirmed</option><option${e.status==='Planning'?' selected':''}>Planning</option><option${e.status==='Completed'?' selected':''}>Completed</option></select></td><td>R ${Number(e.budget||0).toFixed(2)}</td><td>R ${Number(e.cost||0).toFixed(2)}</td><td>R ${Number(profit).toFixed(2)}</td><td><button class="ghost small" data-act="open" data-id="${e.id}">Open</button> <button class="ghost small" data-act="del" data-id="${e.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });

  // handlers
  $$('.evt-status').forEach(s=> s.addEventListener('change', ()=> { updateEventStatus(+s.dataset.event, s.value); }));
  $$('#eventsTbody button').forEach(b=> b.addEventListener('click', ()=> { const id = +b.dataset.id; const act = b.dataset.act; if(act==='open') selectEvent(id); if(act==='del') deleteEvent(id); }));

  refreshEventSelect();
  recalcEventCosts();
  renderEventManagementList();
}

function renderEventManagementList(){
  const tbody = $('#eventsManageTbody'); if(!tbody) return; tbody.innerHTML = '';
  STATE.events.forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(e.title)} <div class="muted" style="font-size:12px">${escapeHtml(e.type)} • ${escapeHtml(e.date)}</div></td><td><button class="ghost small" data-id="${e.id}" data-act="open">Open</button></td>`;
    tbody.appendChild(tr);
  });
  $$('#eventsManageTbody button').forEach(b=> b.addEventListener('click', ()=> selectEvent(+b.dataset.id)));
}

function addEvent(){
  const title = $('#evtTitle').value.trim(); if(!title){ alert('Add event title'); return; }
  const type = $('#evtType').value; const date = $('#evtDate').value || todayDate();
  const budget = parseFloat($('#evtBudget').value || 0); const status = $('#evtStatus').value; const id = uid();
  STATE.events.push({id, title, type, date, budget, status, cost:0});
  saveState(STATE); $('#evtTitle').value=''; $('#evtBudget').value=''; refreshEventsUI(); refreshAll();
}
$('#addEvent')?.addEventListener('click', addEvent);

function selectEvent(id){
  const e = STATE.events.find(x=>x.id===id); if(!e) return;
  const panel = $('#selectedEventPanel');
  panel.innerHTML = `
    <div style="font-weight:700">${escapeHtml(e.title)}</div>
    <div class="muted">${escapeHtml(e.type)} • ${escapeHtml(e.date)}</div>
    <div style="margin-top:8px">Budget: R ${Number(e.budget||0).toFixed(2)}</div>
    <div>Cost: R ${Number(e.cost||0).toFixed(2)}</div>
    <div>Profit: R ${(Number(e.budget||0)-Number(e.cost||0)).toFixed(2)}</div>
    <div style="margin-top:8px">
      <button class="ghost small" id="addEventTaskBtn">+ Add Event Task</button>
      <button class="ghost small" id="viewEventOrdersBtn">View Orders</button>
    </div>
  `;
  $('#addEventTaskBtn').addEventListener('click', ()=> {
    const txt = prompt('Task for this event:');
    if(txt) { STATE.tasks.push({id:uid(), text:txt, scope:'event', eventId:id, done:false}); saveState(STATE); renderTaskSection(); }
  });
  $('#viewEventOrdersBtn').addEventListener('click', ()=> {
    $$('.menu-btn').forEach(b=>b.classList.remove('active'));
    $$('.menu-btn').find(b=>b.dataset.view==='orders')?.classList?.add('active');
    $$('.view').forEach(v=>v.classList.remove('visible'));
    $('#view-orders').classList.add('visible');
    $('#orderEventSelect').value = e.id;
    refreshOrdersUI();
  });
}

function updateEventStatus(eventId, status){
  const e = STATE.events.find(x=>x.id===eventId); if(e){ e.status = status; saveState(STATE); refreshEventsUI(); }
}
function deleteEvent(eventId){
  if(!confirm('Delete event and linked tasks/orders?')) return;
  STATE.events = STATE.events.filter(e=> e.id !== eventId);
  STATE.tasks = STATE.tasks.filter(t=> t.eventId !== eventId);
  STATE.orders = STATE.orders.filter(o=> o.eventId !== eventId);
  saveState(STATE); refreshEventsUI(); refreshAll();
}

function recalcEventCosts(){
  STATE.events.forEach(e=>{
    const orders = STATE.orders.filter(o=> o.eventId===e.id && o.cost).map(x=> +x.cost || 0);
    e.cost = orders.reduce((a,b)=>a+b, 0);
  });
  saveState(STATE);
}

/* ---------- Orders ---------- */
function refreshEventSelect(){
  const sel = $('#orderEventSelect'); if(!sel) return;
  sel.innerHTML = '<option value="">— Select Event —</option>';
  STATE.events.forEach(e=> sel.innerHTML += `<option value="${e.id}">${escapeHtml(e.title)} • ${escapeHtml(e.date)}</option>`);
}

function refreshOrdersUI(){
  const tbody = $('#ordersTbody'); if(!tbody) return; tbody.innerHTML = '';
  STATE.orders.forEach(o=>{
    const evt = STATE.events.find(e=> e.id === o.eventId);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${evt?escapeHtml(evt.title):'—'}</td><td>${escapeHtml(o.item)}</td><td>${escapeHtml(o.supplier||'—')}</td><td>R ${Number(o.cost||0).toFixed(2)}</td><td>${escapeHtml(o.status)}</td><td><button class="ghost small" data-act="del" data-id="${o.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  $$('#ordersTbody button[data-act="del"]').forEach(b=> b.addEventListener('click', ()=> deleteOrder(+b.dataset.id)));
  refreshEventSelect();
  updateOrdersProgressUI();
}

function addOrder(){
  const eventId = +$('#orderEventSelect').value; if(!eventId){ alert('Select event'); return; }
  const item = $('#orderItem').value.trim(); if(!item){ alert('Add item name'); return; }
  const supplier = $('#orderSupplier').value.trim(); const cost = parseFloat($('#orderCost').value || 0); const status = $('#orderStatus').value; const id = uid();
  STATE.orders.push({id, eventId, item, supplier, cost, status});
  saveState(STATE); $('#orderItem').value=''; $('#orderSupplier').value=''; $('#orderCost').value=''; refreshOrdersUI(); recalcEventCosts(); refreshAll();
}
$('#addOrderBtn')?.addEventListener('click', addOrder);

function deleteOrder(orderId){
  STATE.orders = STATE.orders.filter(o=> o.id !== orderId); saveState(STATE); refreshOrdersUI(); recalcEventCosts(); refreshAll();
}

/* ---------- Progress UI ---------- */
function updateProgress(){
  const tasksToday = STATE.tasks.filter(t=> t.scope === 'today');
  const total = tasksToday.length; const done = tasksToday.filter(t=> t.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  $('#progressFill').style.width = pct + '%';
  $('#progressMeta').textContent = `${done} / ${total} • ${pct}%`;
}

function ordersProgress(){
  const total = STATE.orders.length;
  const delivered = STATE.orders.filter(o=> o.status === 'Delivered' || o.status === 'delivered').length;
  return {total, delivered};
}
function updateOrdersProgressUI(){
  const {total, delivered} = ordersProgress();
  const pct = total ? Math.round((delivered/total)*100) : 0;
  $('#ordersProgressFill').style.width = pct + '%';
  $('#ordersProgressMeta').textContent = `${delivered} / ${total} delivered`;
}

/* ---------- Reports / CSV ---------- */
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
$('#exportCsv')?.addEventListener('click', exportCSV);

/* Reset */
$('#resetData')?.addEventListener('click', ()=> {
  if(!confirm('Reset demo data?')) return;
  STATE = seedState(); saveState(STATE); refreshAll();
});

/* ---------- Utilities ---------- */
function renderEventManagementList(){
  const tbody = $('#eventsManageTbody'); if(!tbody) return; tbody.innerHTML = '';
  STATE.events.forEach(e=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(e.title)} <div class="muted" style="font-size:12px">${escapeHtml(e.type)} • ${escapeHtml(e.date)}</div></td><td><button class="ghost small" data-id="${e.id}" data-act="open">Open</button></td>`;
    tbody.appendChild(tr);
  });
  $$('#eventsManageTbody button').forEach(b=> b.addEventListener('click', ()=> selectEvent(+b.dataset.id)));
}

/* ---------- Worker add/remove controls ---------- */
$('#addWorkerBtn')?.addEventListener('click', ()=> {
  const next = STATE.workers.length ? Math.max(...STATE.workers.map(w=>w.id))+1 : 1;
  STATE.workers.push({id:next, name:`Name of Worker ${next}`});
  saveState(STATE); refreshAll();
});
$('#addWorkerBtn2')?.addEventListener('click', ()=> $('#addWorkerBtn')?.click());
$('#removeEmpty')?.addEventListener('click', ()=> { STATE.workers = STATE.workers.filter(w=> w.name && w.name.trim()); saveState(STATE); refreshAll(); });

/* ---------- Init ---------- */
function refreshAll(){
  buildWorkersTable();
  renderPoppieLog();
  refreshSummaries();
  renderTaskSection();
  refreshEventsUI();
  refreshOrdersUI();
  updateProgress();
  updateOrdersProgressUI();
  renderAllTasks();
  renderEventManagementList();
}

refreshAll();

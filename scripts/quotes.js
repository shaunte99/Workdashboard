/* ================================
   Quotes Page Logic
   ================================ */

const STORAGE_KEY = "event_quotes_v1";

/* ---------- DOM Elements ---------- */
const clientNameEl = document.getElementById("clientName");
const clientEmailEl = document.getElementById("clientEmail");
const eventDateEl = document.getElementById("eventDate");

const quotesTable = document.getElementById("quotesTable").getElementsByTagName("tbody")[0];
const addRowBtn = document.getElementById("addRowBtn");

const subtotalEl = document.getElementById("subtotal");
const vatEl = document.getElementById("vat");
const discountEl = document.getElementById("discount");
const totalEl = document.getElementById("total");

const saveBtn = document.getElementById("saveQuoteBtn");
const downloadBtn = document.getElementById("downloadQuoteBtn");
const clearBtn = document.getElementById("clearQuoteBtn");

/* ---------- Helpers ---------- */
// Convert number to currency string
function formatCurrency(num) {
  return "R " + num.toFixed(2);
}

// Calculate totals from table
function calculateTotals() {
  let subtotal = 0;

  [...quotesTable.rows].forEach(row => {
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const lineTotal = qty * price;

    row.cells[3].querySelector("input").value = lineTotal ? formatCurrency(lineTotal) : "";

    subtotal += lineTotal;
  });

  let vat = subtotal * 0.15; // Example: 15% VAT
  let discount = 0; // We can add a discount feature later
  let total = subtotal + vat - discount;

  subtotalEl.textContent = formatCurrency(subtotal);
  vatEl.textContent = formatCurrency(vat);
  discountEl.textContent = formatCurrency(discount);
  totalEl.textContent = formatCurrency(total);
}

// Add a new row
function addRow(item = "", qty = "", price = "") {
  const row = quotesTable.insertRow();

  // Item column
  let cell1 = row.insertCell(0);
  cell1.innerHTML = `<input type="text" value="${item}" placeholder="Item / Service">`;

  // Quantity column
  let cell2 = row.insertCell(1);
  cell2.innerHTML = `<input type="number" value="${qty}" placeholder="0">`;

  // Price column
  let cell3 = row.insertCell(2);
  cell3.innerHTML = `<input type="number" value="${price}" placeholder="0.00" step="0.01">`;

  // Total column (auto-calculated)
  let cell4 = row.insertCell(3);
  cell4.innerHTML = `<input type="text" readonly>`;

  // Remove button
  let cell5 = row.insertCell(4);
  cell5.innerHTML = `<button class="removeRowBtn">✖</button>`;

  // Events
  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", calculateTotals);
  });

  row.querySelector(".removeRowBtn").addEventListener("click", () => {
    row.remove();
    calculateTotals();
  });

  calculateTotals();
}

// Save quote to localStorage
function saveQuote() {
  const clientInfo = {
    name: clientNameEl.value,
    email: clientEmailEl.value,
    eventDate: eventDateEl.value
  };

  const items = [...quotesTable.rows].map(row => ({
    item: row.cells[0].querySelector("input").value,
    qty: row.cells[1].querySelector("input").value,
    price: row.cells[2].querySelector("input").value
  }));

  const data = { clientInfo, items };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  alert("Quote saved successfully ✅");
}

// Load saved quote if exists
function loadQuote() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!data) return;

  clientNameEl.value = data.clientInfo.name;
  clientEmailEl.value = data.clientInfo.email;
  eventDateEl.value = data.clientInfo.eventDate;

  quotesTable.innerHTML = ""; // clear existing rows
  data.items.forEach(item => addRow(item.item, item.qty, item.price));
}

// Clear all data
function clearQuote() {
  if (confirm("Are you sure you want to clear this quote?")) {
    clientNameEl.value = "";
    clientEmailEl.value = "";
    eventDateEl.value = "";
    quotesTable.innerHTML = "";
    calculateTotals();
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Download as PDF (using jsPDF)
function downloadQuote() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Event Quote", 14, 20);

  doc.setFontSize(12);
  doc.text(`Client: ${clientNameEl.value}`, 14, 30);
  doc.text(`Email: ${clientEmailEl.value}`, 14, 37);
  doc.text(`Event Date: ${eventDateEl.value}`, 14, 44);

  let startY = 55;
  doc.autoTable({
    startY,
    head: [["Item", "Qty", "Price", "Total"]],
    body: [...quotesTable.rows].map(row => [
      row.cells[0].querySelector("input").value,
      row.cells[1].querySelector("input").value,
      row.cells[2].querySelector("input").value,
      row.cells[3].querySelector("input").value
    ]),
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.text(`Subtotal: ${subtotalEl.textContent}`, 14, finalY);
  doc.text(`VAT: ${vatEl.textContent}`, 14, finalY + 7);
  doc.text(`Discount: ${discountEl.textContent}`, 14, finalY + 14);
  doc.text(`Total: ${totalEl.textContent}`, 14, finalY + 21);

  doc.save(`Quote_${clientNameEl.value || "client"}.pdf`);
}

/* ---------- Event Listeners ---------- */
addRowBtn.addEventListener("click", () => addRow());
saveBtn.addEventListener("click", saveQuote);
clearBtn.addEventListener("click", clearQuote);
downloadBtn.addEventListener("click", downloadQuote);

/* ---------- Init ---------- */
loadQuote();
calculateTotals();

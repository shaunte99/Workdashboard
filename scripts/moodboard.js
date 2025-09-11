// ===== Moodboard JS =====

// Select all slots
const slots = document.querySelectorAll('.slot');
const downloadBtn = document.getElementById('downloadBoard');
const moodboard = document.querySelector('.moodboard-template');

// Hidden file input (reused for all slots)
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

let activeSlot = null;

// Handle slot click
slots.forEach(slot => {
  slot.addEventListener('click', () => {
    activeSlot = slot;
    fileInput.click();
  });
});

// Handle file input
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file || !activeSlot) return;

  const reader = new FileReader();
  reader.onload = e => {
    // Remove placeholder text
    activeSlot.innerHTML = "";

    // Insert uploaded image
    const img = document.createElement('img');
    img.src = e.target.result;
    activeSlot.appendChild(img);
  };
  reader.readAsDataURL(file);

  // Reset input
  fileInput.value = "";
});

// Download moodboard
downloadBtn.addEventListener('click', () => {
  if (!moodboard) return;

  html2canvas(moodboard, {
    backgroundColor: '#ffffff',
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'moodboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});


// ===== Moodboard JS =====

// Get all template cards
const moodboardCards = document.querySelectorAll('.moodboard-card');

// Function to handle image uploads and preview
moodboardCards.forEach(card => {
    const imageSlots = card.querySelectorAll('.image-slot');

    imageSlots.forEach(slot => {
        const input = slot.querySelector('.upload-input');
        const preview = slot.querySelector('.preview');

        // When user selects an image
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                preview.src = reader.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    });

    // Download template
    const downloadBtn = card.querySelector('.download-btn');
    downloadBtn.addEventListener('click', () => {
        // Use html2canvas to capture the card
        html2canvas(card).then(canvas => {
            const link = document.createElement('a');
            link.download = `${card.querySelector('h2').textContent.replace(/\s/g, '_')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });
});

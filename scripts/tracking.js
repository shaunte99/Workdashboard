// ===== tracking.js =====

// Select all tracking cards
const trackingCards = document.querySelectorAll('.tracking-cards .card');

trackingCards.forEach(card => {
    // Extract the progress percentage from the text
    const progressText = card.querySelector('p strong').textContent;
    const progress = parseInt(progressText.replace('%', ''));

    // Create a progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.classList.add('progress-container');

    // Create the actual progress bar
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    // Append bar to container
    progressContainer.appendChild(progressBar);

    // Append container to card
    card.appendChild(progressContainer);

    // Animate the progress bar
    setTimeout(() => {
        progressBar.style.width = progress + '%';
    }, 100); // small delay for smooth animation
});

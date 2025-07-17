document.addEventListener('DOMContentLoaded', function() {
    // Initialize any general site functionality here
    console.log('Site loaded successfully');
    
    // Update footer year dynamically
    updateFooterYear();
});

function updateFooterYear() {
    const currentYear = new Date().getFullYear();
    const footerElements = document.querySelectorAll('footer p');
    
    footerElements.forEach(footer => {
        footer.textContent = `© ${currentYear} - Data Engineer & Developer Portfolio`;
    });
}

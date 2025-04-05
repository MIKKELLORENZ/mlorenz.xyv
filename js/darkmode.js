document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '🌙';
    }
    
    // Theme toggle click handler
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        if (document.body.classList.contains('dark-mode')) {
            themeToggle.innerHTML = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.innerHTML = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });
});

function initDarkModeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            
            // Update icon based on current mode
            if (document.body.classList.contains('dark-mode')) {
                themeToggle.textContent = '🌙';
                localStorage.setItem('theme', 'dark');
            } else {
                themeToggle.textContent = '☀️';
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', initDarkModeToggle);

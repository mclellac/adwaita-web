document.addEventListener('DOMContentLoaded', function () {
    const sidebarToggle = document.querySelector('.app-sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar'); // Using ID for specificity
    const backdrop = document.querySelector('.app-sidebar-backdrop');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            const isOpen = sidebar.classList.toggle('sidebar-open');
            sidebarToggle.setAttribute('aria-expanded', isOpen);
            if (backdrop) {
                backdrop.classList.toggle('active', isOpen);
            }
        });
    }

    if (backdrop && sidebar) {
        backdrop.addEventListener('click', function () {
            sidebar.classList.remove('sidebar-open');
            // Ensure sidebarToggle is defined before using it
            if (sidebarToggle) {
                sidebarToggle.setAttribute('aria-expanded', 'false');
            }
            backdrop.classList.remove('active');
        });
    }

    // Optional: Close sidebar when a nav link is clicked (if sidebar contains direct links)
    if (sidebar) {
        const sidebarLinks = sidebar.querySelectorAll('.sidebar-nav a.adw-action-row');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Only close if sidebar is in overlay mode (i.e., sidebar-open class would be present)
                // And if the click is not on something that opens a submenu (not applicable here yet)
                if (sidebar.classList.contains('sidebar-open')) { // Check if it's in overlay mode
                   if (window.innerWidth < 768) { // Match the SCSS breakpoint (consider making this a JS var or data-attr)
                        sidebar.classList.remove('sidebar-open');
                        if (sidebarToggle) { // Ensure sidebarToggle is defined
                            sidebarToggle.setAttribute('aria-expanded', 'false');
                        }
                        if (backdrop) { // Ensure backdrop is defined
                            backdrop.classList.remove('active');
                        }
                   }
                }
            });
        });
    }
});

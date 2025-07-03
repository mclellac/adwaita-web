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

    // Active state for sidebar navigation links
    const currentPath = window.location.pathname;
    const sidebarNav = document.querySelector('.app-sidebar .sidebar-nav');

    if (sidebarNav) {
        const navLinks = sidebarNav.querySelectorAll('a.adw-action-row');
        let bestMatch = null;
        let longestMatchLength = 0;

        navLinks.forEach(link => {
            link.classList.remove('active'); // Clear any existing active states
            const linkPath = new URL(link.href).pathname;

            // Exact match or if current path starts with link path (for parent section highlighting)
            if (currentPath === linkPath) {
                // Exact match is highest priority
                bestMatch = link;
                longestMatchLength = linkPath.length + 1000; // Prioritize exact match heavily
            } else if (currentPath.startsWith(linkPath) && linkPath !== '/') { // Avoid '/' matching everything
                 // Check if this is a better parent match than previous
                if (linkPath.length > longestMatchLength) {
                    bestMatch = link;
                    longestMatchLength = linkPath.length;
                }
            } else if (linkPath === '/' && currentPath.startsWith('/index')) {
                // Special case: if link is '/' and current path is effectively home (e.g. /index or /index.html)
                // This might need adjustment based on actual Flask routing for index
                if (linkPath.length > longestMatchLength) {
                    bestMatch = link;
                    longestMatchLength = linkPath.length;
                }
            }
        });

        if (bestMatch) {
            bestMatch.classList.add('active');
        } else {
            // Fallback: if no other match, and there's a plain "/" link (Home), make it active if on homepage.
            // This logic might be redundant if currentPath === '/' already handled it.
            // Check specific case for index.html or default route.
            // The Flask url_for('index') usually generates just '/', so currentPath === linkPath should handle it.
            // If Flask index is e.g. /index.html, the startsWith logic might be more complex.
            // For now, rely on exact match or startsWith for typical Flask routing.
            // If on true root "/" and no other match, find the home link specifically.
            if (currentPath === '/') {
                const homeLink = sidebarNav.querySelector('a[href="/"]'); // Assuming home link href is exactly "/"
                if (homeLink) {
                    homeLink.classList.add('active');
                }
            }
        }
    }
});

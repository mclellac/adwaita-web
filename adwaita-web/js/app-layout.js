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

    // --- Dialog Handlers ---

    // Post Deletion Dialog (from post.html)
    const deletePostDialogEl = document.getElementById('delete-confirm-dialog');
    const openDeletePostDialogBtn = document.getElementById('open-delete-dialog-btn');
    const cancelDeletePostBtn = deletePostDialogEl ? deletePostDialogEl.querySelector('#cancel-delete-btn') : null;
    // Note: The confirm button is type="submit" within a form, so direct JS handling for submission isn't strictly needed here.
    // Dialog opening/closing is the main concern.

    if (openDeletePostDialogBtn && deletePostDialogEl) {
        openDeletePostDialogBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof deletePostDialogEl.open === 'function') {
                deletePostDialogEl.open();
            } else {
                console.warn('deletePostDialogEl.open() is not a function. Ensure <adw-dialog> is correctly defined and registered.');
            }
        });
    }

    if (cancelDeletePostBtn && deletePostDialogEl) {
        cancelDeletePostBtn.addEventListener('click', () => {
            if (typeof deletePostDialogEl.close === 'function') {
                deletePostDialogEl.close();
            }
        });
    }
    // If deletePostDialogEl itself is an <adw-dialog>, it should handle ESC key to close.

    // Comment Deletion Dialogs (from post.html, using template)
    const commentDeleteDialogTemplate = document.getElementById('delete-comment-dialog-template');
    if (commentDeleteDialogTemplate) { // Check if template exists before adding listeners
        document.querySelectorAll('.open-delete-comment-dialog-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                const commentId = this.dataset.commentId;
                const formToSubmit = document.querySelector(`.delete-comment-form[data-comment-id="${commentId}"]`);

                if (!formToSubmit) {
                    console.error('Could not find delete form for comment ID:', commentId);
                    return;
                }

                const dialogClone = commentDeleteDialogTemplate.content.firstElementChild.cloneNode(true);
                document.body.appendChild(dialogClone); // Append to body to ensure it's interactable and visible over everything

                const cancelBtnClone = dialogClone.querySelector('.dialog-cancel-btn');
                const confirmBtnClone = dialogClone.querySelector('.dialog-confirm-delete-comment-btn');

                if (cancelBtnClone) {
                    cancelBtnClone.addEventListener('click', () => {
                        if (typeof dialogClone.close === 'function') dialogClone.close();
                        // dialogClone.remove(); // Handled by 'close' event listener on dialogClone
                    });
                }
                if (confirmBtnClone) {
                    confirmBtnClone.addEventListener('click', () => {
                        formToSubmit.submit();
                        if (typeof dialogClone.close === 'function') dialogClone.close();
                        // dialogClone.remove(); // Handled by 'close' event listener on dialogClone
                    });
                }

                // Ensure dialog is removed from DOM after it's closed (e.g., by ESC key or programmatically)
                dialogClone.addEventListener('close', () => {
                     if (dialogClone.parentElement) {
                        dialogClone.remove();
                    }
                }, { once: true });

                if (typeof dialogClone.open === 'function') {
                    dialogClone.open();
                } else {
                    console.warn('Cloned comment delete dialog .open() is not a function.');
                    dialogClone.remove(); // Clean up if it can't be opened
                }
            });
        });
    }


    // Post Deletion Dialog (from edit_post.html)
    const editDeletePostDialogEl = document.getElementById('edit-delete-post-confirm-dialog');
    const openEditDeletePostDialogBtn = document.getElementById('open-edit-delete-post-dialog-btn');
    const cancelEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#cancel-edit-delete-post-btn') : null;
    const confirmEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#confirm-edit-delete-post-btn') : null;
    // The form ID is dynamic based on post.id, so we need to handle this carefully if we want to get it here.
    // However, the form ID is `delete-post-form-{{ post.id }}`.
    // This script is global, so it can't directly use Jinja.
    // The logic below assumes the form is findable if the dialog is present.

    if (openEditDeletePostDialogBtn && editDeletePostDialogEl) {
        openEditDeletePostDialogBtn.addEventListener('click', (event) => {
            event.preventDefault();
            if (typeof editDeletePostDialogEl.open === 'function') {
                editDeletePostDialogEl.open();
            } else {
                console.warn('editDeletePostDialogEl.open() is not a function.');
            }
        });
    }

    if (cancelEditDeletePostBtn && editDeletePostDialogEl) {
        cancelEditDeletePostBtn.addEventListener('click', () => {
            if (typeof editDeletePostDialogEl.close === 'function') {
                editDeletePostDialogEl.close();
            }
        });
    }

    if (confirmEditDeletePostBtn && editDeletePostDialogEl) {
        confirmEditDeletePostBtn.addEventListener('click', () => {
            // Try to find the form associated with this dialog.
            // This assumes the form is somewhat uniquely identifiable if multiple delete forms could exist on admin pages.
            // For edit_post.html, there's only one such form.
            // The form ID is 'delete-post-form-{{ post.id }}'. We need to extract post.id if possible or find a more robust way.
            // A simple way for edit_post page: assume the first form with 'delete-post-form-' in its ID.
            // This is brittle. A better way would be to add a data-form-id to the dialog trigger or dialog itself.
            // For now, let's assume there's a unique enough form ID on the page or use a class.
            // The form was: <form method="POST" action="..." id="delete-post-form-{{ post.id }}" style="display: none;">
            // Let's assume the ID of the open button can give us a hint or the form is globally unique enough with a generic ID.
            // Given the template structure, `delete-post-form-{{ post.id }}` is specific.
            // We can find the post ID from the URL if necessary, or rely on a fixed part of the ID if only one such form is on the page.
            // The trigger button is `open-edit-delete-post-dialog-btn`. The form is `delete-post-form-${postId}`.
            // This is tricky without passing the post ID to the global JS.
            // A quick fix for edit_post.html assuming only one such form:
            const deleteForm = document.querySelector('form[id^="delete-post-form-"]');
            if (deleteForm) {
                deleteForm.submit();
            } else {
                console.error('Could not find the delete form for edit_post.html dialog.');
            }
            if (typeof editDeletePostDialogEl.close === 'function') {
                editDeletePostDialogEl.close();
            }
        });
    }
    // editDeletePostDialogEl should also handle ESC to close.
});

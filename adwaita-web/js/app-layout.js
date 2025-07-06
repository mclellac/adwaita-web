document.addEventListener('DOMContentLoaded', function () {
    const sidebarToggle = document.querySelector('.app-sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.querySelector('.app-sidebar-backdrop');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            const isOpen = sidebar.classList.toggle('sidebar-open');
            sidebarToggle.setAttribute('aria-expanded', isOpen.toString());
            if (backdrop) {
                backdrop.classList.toggle('active', isOpen);
            }
        });
    }

    if (backdrop && sidebar) {
        backdrop.addEventListener('click', function () {
            sidebar.classList.remove('sidebar-open');
            if (sidebarToggle) {
                sidebarToggle.setAttribute('aria-expanded', 'false');
            }
            backdrop.classList.remove('active');
        });
    }

    if (sidebar) {
        const sidebarLinks = sidebar.querySelectorAll('.sidebar-nav a.adw-action-row');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                // Close sidebar on link click for mobile view
                if (sidebar.classList.contains('sidebar-open') && window.innerWidth < 768) {
                    sidebar.classList.remove('sidebar-open');
                    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
                    if (backdrop) backdrop.classList.remove('active');
                }
            });
        });
    }

    // Active sidebar link highlighting
    const currentPath = window.location.pathname;
    const sidebarNav = document.querySelector('.app-sidebar .sidebar-nav');
    if (sidebarNav) {
        const navLinks = sidebarNav.querySelectorAll('a.adw-action-row');
        let bestMatch = null;
        let longestMatchLength = 0;

        navLinks.forEach(link => {
            link.classList.remove('active'); // Ensure no link is pre-marked active
            const linkPath = new URL(link.href).pathname;
            if (currentPath.startsWith(linkPath)) {
                if (linkPath.length > longestMatchLength) {
                    longestMatchLength = linkPath.length;
                    bestMatch = link;
                }
            }
        });

        if (bestMatch) {
            bestMatch.classList.add('active');
        } else if (currentPath === '/') {
            // Fallback for home page if no other specific match
            const homeLink = sidebarNav.querySelector('a[href="/"]');
            if (homeLink) {
                homeLink.classList.add('active');
            }
        }
    }

    customElements.whenDefined('adw-dialog').then(() => {
        // --- Dialog Initialization ---

        // Post Deletion Dialog (from post.html)
        const deletePostDialogEl = document.getElementById('delete-confirm-dialog');
        const openDeletePostDialogBtn = document.getElementById('open-delete-dialog-btn');

        if (openDeletePostDialogBtn && deletePostDialogEl) {
            openDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                deletePostDialogEl.open();
            });
        }
        const cancelDeletePostBtn = deletePostDialogEl ? deletePostDialogEl.querySelector('#cancel-delete-btn') : null;
        if (cancelDeletePostBtn && deletePostDialogEl) {
            cancelDeletePostBtn.addEventListener('click', () => {
                deletePostDialogEl.close();
            });
        }

        // Comment Deletion Dialog (from post.html)
        const deleteCommentDialogEl = document.getElementById('delete-comment-confirm-dialog');
        const confirmDeleteCommentFormActual = document.getElementById('confirm-delete-comment-form-actual');

        if (deleteCommentDialogEl) {
            document.querySelectorAll('.comment-delete-button').forEach(button => {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    const formId = this.dataset.formId;
                    const originalForm = document.getElementById(formId);
                    if (originalForm && confirmDeleteCommentFormActual) {
                        confirmDeleteCommentFormActual.action = originalForm.action;
                        deleteCommentDialogEl.open();
                    } else {
                        console.error('app-layout.js: Comment Deletion - Could not find original form or dialog form.');
                    }
                });
            });

            const cancelCommentDeleteBtn = deleteCommentDialogEl.querySelector('#cancel-comment-delete-btn');
            if (cancelCommentDeleteBtn) {
                cancelCommentDeleteBtn.addEventListener('click', () => {
                    deleteCommentDialogEl.close();
                });
            }
        }

        // Post Deletion Dialog (from edit_post.html)
        const editDeletePostDialogEl = document.getElementById('edit-delete-post-confirm-dialog');
        const openEditDeletePostDialogBtn = document.getElementById('open-edit-delete-post-dialog-btn');

        if (openEditDeletePostDialogBtn && editDeletePostDialogEl) {
            openEditDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                editDeletePostDialogEl.open();
            });
        }
        const cancelEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#cancel-edit-delete-post-btn') : null;
        if (cancelEditDeletePostBtn && editDeletePostDialogEl) {
            cancelEditDeletePostBtn.addEventListener('click', () => {
                editDeletePostDialogEl.close();
            });
        }
        const confirmEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#confirm-edit-delete-post-btn') : null;
        if (confirmEditDeletePostBtn && editDeletePostDialogEl) {
            confirmEditDeletePostBtn.addEventListener('click', () => {
                const deleteForm = document.querySelector('form[id^="delete-post-form-"]'); // Assumes only one on edit page
                if (deleteForm) {
                    deleteForm.submit();
                } else {
                    console.error('app-layout.js: Edit Post Deletion - Could not find the delete form.');
                    editDeletePostDialogEl.close();
                }
            });
        }
        // --- End of Dialog Initialization ---

    }).catch(error => {
        console.error("app-layout.js: Failed to initialize dialogs; adw-dialog definition not found or other error.", error);
    });
});

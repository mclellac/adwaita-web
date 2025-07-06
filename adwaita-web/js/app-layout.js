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
                if (sidebar.classList.contains('sidebar-open')) {
                   if (window.innerWidth < 768) {
                        sidebar.classList.remove('sidebar-open');
                        if (sidebarToggle) {
                            sidebarToggle.setAttribute('aria-expanded', 'false');
                        }
                        if (backdrop) {
                            backdrop.classList.remove('active');
                        }
                   }
                }
            });
        });
    }

    const currentPath = window.location.pathname;
    const sidebarNav = document.querySelector('.app-sidebar .sidebar-nav');
    if (sidebarNav) {
        const navLinks = sidebarNav.querySelectorAll('a.adw-action-row');
        let bestMatch = null;
        let longestMatchLength = 0;

        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath) {
                bestMatch = link;
                longestMatchLength = linkPath.length + 1000;
            } else if (currentPath.startsWith(linkPath) && linkPath !== '/') {
                if (linkPath.length > longestMatchLength) {
                    bestMatch = link;
                    longestMatchLength = linkPath.length;
                }
            } else if (linkPath === '/' && currentPath.startsWith('/index')) {
                if (linkPath.length > longestMatchLength) {
                    bestMatch = link;
                    longestMatchLength = linkPath.length;
                }
            }
        });

        if (bestMatch) {
            bestMatch.classList.add('active');
        } else {
            if (currentPath === '/') {
                const homeLink = sidebarNav.querySelector('a[href="/"]');
                if (homeLink) {
                    homeLink.classList.add('active');
                }
            }
        }
    }

    // --- Dialog Handlers ---
    // Ensure adw-dialog custom element is defined before interacting with dialogs
    customElements.whenDefined('adw-dialog').then(() => {
        // Post Deletion Dialog (from post.html)
        const deletePostDialogEl = document.getElementById('delete-confirm-dialog');
        const openDeletePostDialogBtn = document.getElementById('open-delete-dialog-btn');
        // The cancel button inside this specific dialog is #cancel-delete-btn
        // The confirm button is type="submit" in a form, so it's handled by form submission.
        // We only need to handle opening and the explicit cancel button.

        if (openDeletePostDialogBtn && deletePostDialogEl) {
            openDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                deletePostDialogEl.open();
            });
        }
        // The 'cancel-delete-btn' is inside the <adw-dialog id="delete-confirm-dialog">
        // Its click should make the dialog close itself if it's set up correctly.
        // AdwDialogElement should handle its own internal cancel buttons if they are simple (e.g. close on click).
        // Or, if the button has a specific ID and needs to be handled by this global script:
        const cancelDeletePostBtn = deletePostDialogEl ? deletePostDialogEl.querySelector('#cancel-delete-btn') : null;
        if (cancelDeletePostBtn && deletePostDialogEl) {
            cancelDeletePostBtn.addEventListener('click', () => {
                deletePostDialogEl.close();
            });
        }


        // Comment Deletion Dialog (from post.html, uses #delete-comment-confirm-dialog which is a single dialog instance)
        // This dialog is re-used; its form action is updated dynamically.
        const deleteCommentDialogEl = document.getElementById('delete-comment-confirm-dialog');
        const confirmDeleteCommentFormActual = document.getElementById('confirm-delete-comment-form-actual'); // The form inside the dialog

        if (deleteCommentDialogEl) { // Check if the main dialog exists
            document.querySelectorAll('.comment-delete-button').forEach(button => {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    const formId = this.dataset.formId; // e.g., delete-comment-form-{{comment.id}}
                    const originalForm = document.getElementById(formId); // The small form next to each comment

                    if (originalForm && confirmDeleteCommentFormActual) {
                        // Set the action for the dialog's form from the per-comment hidden form
                        confirmDeleteCommentFormActual.action = originalForm.action;
                        deleteCommentDialogEl.open();
                    } else {
                        console.error('Could not find original form or dialog form for comment deletion.');
                    }
                });
            });

            const cancelBtnClone = deleteCommentDialogEl.querySelector('#cancel-comment-delete-btn'); // ID of cancel button in this dialog
            if (cancelBtnClone) {
                cancelBtnClone.addEventListener('click', () => {
                    deleteCommentDialogEl.close();
                });
            }
            // The confirm button is a submit button for 'confirm-delete-comment-form-actual'.
            // No special JS needed for its click if it submits the form, dialog will close on navigation/page update.
            // If we need to close it manually after AJAX submit, that would be added here.
        }


        // Post Deletion Dialog (from edit_post.html)
        const editDeletePostDialogEl = document.getElementById('edit-delete-post-confirm-dialog');
        const openEditDeletePostDialogBtn = document.getElementById('open-edit-delete-post-dialog-btn');
        const cancelEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#cancel-edit-delete-post-btn') : null;
        const confirmEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#confirm-edit-delete-post-btn') : null;

        if (openEditDeletePostDialogBtn && editDeletePostDialogEl) {
            openEditDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                editDeletePostDialogEl.open();
            });
        }

        if (cancelEditDeletePostBtn && editDeletePostDialogEl) {
            cancelEditDeletePostBtn.addEventListener('click', () => {
                editDeletePostDialogEl.close();
            });
        }

        if (confirmEditDeletePostBtn && editDeletePostDialogEl) {
            confirmEditDeletePostBtn.addEventListener('click', () => {
                // The form ID is 'delete-post-form-{{ post.id }}' but post.id is not known here.
                // Assuming there's only one form matching 'form[id^="delete-post-form-"]' on edit_post.html page
                const deleteForm = document.querySelector('form[id^="delete-post-form-"]');
                if (deleteForm) {
                    deleteForm.submit();
                    // Dialog will close on page navigation or can be closed manually if submission is AJAX
                    // editDeletePostDialogEl.close();
                } else {
                    console.error('Could not find the delete form for edit_post.html dialog.');
                    editDeletePostDialogEl.close(); // Close dialog if form not found to prevent being stuck
                }
            });
        }
    }).catch(error => {
        console.error("Failed to initialize dialogs; adw-dialog definition not found.", error);
    });
});

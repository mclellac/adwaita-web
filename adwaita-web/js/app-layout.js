let appLayoutDOMContentLoadedCount = 0;
let appLayoutWhenDefinedResolvedCount = 0;

document.addEventListener('DOMContentLoaded', function () {
    appLayoutDOMContentLoadedCount++;
    console.log(`app-layout.js: DOMContentLoaded event #${appLayoutDOMContentLoadedCount}`);

    const sidebarToggle = document.querySelector('.app-sidebar-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.querySelector('.app-sidebar-backdrop');

    if (sidebarToggle && sidebar) {
        console.log('app-layout.js: Sidebar toggle and sidebar found.');
        sidebarToggle.addEventListener('click', function () {
            console.log('app-layout.js: Sidebar toggle clicked.');
            const isOpen = sidebar.classList.toggle('sidebar-open');
            sidebarToggle.setAttribute('aria-expanded', isOpen.toString());
            if (backdrop) {
                backdrop.classList.toggle('active', isOpen);
            }
        });
    }

    if (backdrop && sidebar) {
        console.log('app-layout.js: Backdrop and sidebar found for backdrop click listener.');
        backdrop.addEventListener('click', function () {
            console.log('app-layout.js: Backdrop clicked.');
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
                if (sidebar.classList.contains('sidebar-open') && window.innerWidth < 768) {
                    console.log('app-layout.js: Sidebar link clicked, closing mobile sidebar.');
                    sidebar.classList.remove('sidebar-open');
                    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
                    if (backdrop) backdrop.classList.remove('active');
                }
            });
        });
    }

    const currentPath = window.location.pathname;
    const sidebarNav = document.querySelector('.app-sidebar .sidebar-nav');
    if (sidebarNav) {
        // ... (active link logic - can keep as is, assumed not related to dialog issue)
        const navLinks = sidebarNav.querySelectorAll('a.adw-action-row');
        let bestMatch = null;
        let longestMatchLength = 0;
        navLinks.forEach(link => { /* ... */ });
        if (bestMatch) bestMatch.classList.add('active');
        else if (currentPath === '/') { /* ... */ }
    }

    console.log('app-layout.js: Waiting for adw-dialog custom element to be defined...');
    customElements.whenDefined('adw-dialog').then(() => {
        appLayoutWhenDefinedResolvedCount++;
        console.log(`app-layout.js: adw-dialog is defined. Call #${appLayoutWhenDefinedResolvedCount}. Dialog init TEMPORARILY COMMENTED OUT for diagnosing flashing.`);

        /*
        // --- Temporarily Commented Out for Flashing Diagnosis ---

        // Post Deletion Dialog (from post.html)
        const deletePostDialogEl = document.getElementById('delete-confirm-dialog');
        const openDeletePostDialogBtn = document.getElementById('open-delete-dialog-btn');
        console.log('app-layout.js: Post Deletion - deletePostDialogEl:', deletePostDialogEl, 'openDeletePostDialogBtn:', openDeletePostDialogBtn);

        if (openDeletePostDialogBtn && deletePostDialogEl) {
            openDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('app-layout.js: open-delete-dialog-btn clicked. Opening dialog:', deletePostDialogEl.id);
                deletePostDialogEl.open();
            });
        }
        const cancelDeletePostBtn = deletePostDialogEl ? deletePostDialogEl.querySelector('#cancel-delete-btn') : null;
        if (cancelDeletePostBtn && deletePostDialogEl) {
            cancelDeletePostBtn.addEventListener('click', () => {
                console.log('app-layout.js: cancel-delete-btn clicked. Closing dialog:', deletePostDialogEl.id);
                deletePostDialogEl.close();
            });
        }

        // Comment Deletion Dialog (from post.html)
        const deleteCommentDialogEl = document.getElementById('delete-comment-confirm-dialog');
        const confirmDeleteCommentFormActual = document.getElementById('confirm-delete-comment-form-actual');
        console.log('app-layout.js: Comment Deletion - deleteCommentDialogEl:', deleteCommentDialogEl, 'form:', confirmDeleteCommentFormActual);

        if (deleteCommentDialogEl) {
            document.querySelectorAll('.comment-delete-button').forEach(button => {
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    const formId = this.dataset.formId;
                    const originalForm = document.getElementById(formId);
                    console.log(`app-layout.js: .comment-delete-button clicked for formId: ${formId}. Original form:`, originalForm);
                    if (originalForm && confirmDeleteCommentFormActual) {
                        confirmDeleteCommentFormActual.action = originalForm.action;
                        console.log(`app-layout.js: Set action for #confirm-delete-comment-form-actual to: ${originalForm.action}. Opening dialog:`, deleteCommentDialogEl.id);
                        deleteCommentDialogEl.open();
                    } else {
                        console.error('app-layout.js: Comment Deletion - Could not find original form or dialog form. originalForm:', originalForm, 'confirmDeleteCommentFormActual:', confirmDeleteCommentFormActual);
                    }
                });
            });

            const cancelCommentDeleteBtn = deleteCommentDialogEl.querySelector('#cancel-comment-delete-btn');
            if (cancelCommentDeleteBtn) {
                cancelCommentDeleteBtn.addEventListener('click', () => {
                    console.log('app-layout.js: cancel-comment-delete-btn clicked. Closing dialog:', deleteCommentDialogEl.id);
                    deleteCommentDialogEl.close();
                });
            }
        }

        // Post Deletion Dialog (from edit_post.html)
        const editDeletePostDialogEl = document.getElementById('edit-delete-post-confirm-dialog');
        const openEditDeletePostDialogBtn = document.getElementById('open-edit-delete-post-dialog-btn');
        console.log('app-layout.js: Edit Post Deletion - editDeletePostDialogEl:', editDeletePostDialogEl, 'openEditDeletePostDialogBtn:', openEditDeletePostDialogBtn);

        if (openEditDeletePostDialogBtn && editDeletePostDialogEl) {
            openEditDeletePostDialogBtn.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('app-layout.js: open-edit-delete-post-dialog-btn clicked. Opening dialog:', editDeletePostDialogEl.id);
                editDeletePostDialogEl.open();
            });
        }
        const cancelEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#cancel-edit-delete-post-btn') : null;
        if (cancelEditDeletePostBtn && editDeletePostDialogEl) {
            cancelEditDeletePostBtn.addEventListener('click', () => {
                console.log('app-layout.js: cancel-edit-delete-post-btn clicked. Closing dialog:', editDeletePostDialogEl.id);
                editDeletePostDialogEl.close();
            });
        }
        const confirmEditDeletePostBtn = editDeletePostDialogEl ? editDeletePostDialogEl.querySelector('#confirm-edit-delete-post-btn') : null;
        if (confirmEditDeletePostBtn && editDeletePostDialogEl) {
            confirmEditDeletePostBtn.addEventListener('click', () => {
                console.log('app-layout.js: confirm-edit-delete-post-btn clicked for dialog:', editDeletePostDialogEl.id);
                const deleteForm = document.querySelector('form[id^="delete-post-form-"]'); // Assumes only one on edit page
                if (deleteForm) {
                    console.log('app-layout.js: Submitting delete form:', deleteForm);
                    deleteForm.submit();
                } else {
                    console.error('app-layout.js: Edit Post Deletion - Could not find the delete form.');
                    editDeletePostDialogEl.close();
                }
            });
        }
        console.log('app-layout.js: All dialog handlers initialized (commented out section).');

        // --- End of Temporarily Commented Out Block ---
        */

    }).catch(error => {
        console.error("app-layout.js: Failed to initialize dialogs (potentially); adw-dialog definition not found or other error.", error);
    });
});

document.addEventListener('DOMContentLoaded', function () {

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

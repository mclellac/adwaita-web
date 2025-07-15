// adwaita-web/js/toast.js

// Ensure Adw namespace exists
window.Adw = window.Adw || {};

(function(Adw) {
    'use strict';

    const DEFAULT_TIMEOUT = 3000; // 3 seconds
    const TOAST_ANIMATION_DURATION = 200; // Should match SCSS transition duration for hiding

    let toastOverlay = null;

    /**
     * Initializes the ToastManager and finds the overlay.
     * Should be called on DOMContentLoaded.
     */
    function _initializeToastManager() {
        if (!toastOverlay) {
            toastOverlay = document.getElementById('adw-toast-overlay');
            if (!toastOverlay) {
                console.warn('Adw.ToastManager: Toast overlay element (#adw-toast-overlay) not found. Toasts will not be displayed.');
            }
        }
    }

    /**
     * Creates and displays a toast notification.
     *
     * @param {string} title - The main message to display in the toast.
     * @param {object} [options={}] - Configuration options for the toast.
     * @param {number} [options.timeout=3000] - Duration in milliseconds before the toast automatically dismisses.
     *                                          Set to 0 or a negative number for a persistent toast (manual dismiss only).
     * @param {string} [options.actionName] - If provided, an action button with this label is added.
     * @param {function} [options.onAction] - Callback executed when the action button is clicked. Receives the toast element as an argument.
     * @param {string} [options.id] - A specific ID to set on the toast element.
     * @param {string} [options.type='info'] - Type of toast, e.g., 'info', 'success', 'warning', 'error'. (Currently informational, future styling hook)
     * @returns {HTMLElement|null} The created toast element, or null if the overlay is not found.
     */
    Adw.createToast = function(title, options = {}) {
        if (!toastOverlay) {
            _initializeToastManager(); // Attempt to initialize if not already
            if (!toastOverlay) return null; // Still not found, cannot proceed
        }

        const toast = document.createElement('div');
        toast.classList.add('adw-toast');
        if (options.id) {
            toast.id = options.id;
        }
        // Future: toast.classList.add(`adw-toast-${options.type || 'info'}`);

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('adw-toast-content-wrapper');

        const titleEl = document.createElement('span');
        titleEl.classList.add('adw-toast-title');
        titleEl.textContent = title;
        contentWrapper.appendChild(titleEl);
        toast.appendChild(contentWrapper);

        let actionButton = null;
        if (options.actionName && typeof options.onAction === 'function') {
            actionButton = document.createElement('button');
            actionButton.classList.add('adw-button', 'flat', 'compact', 'adw-toast-action-button');
            actionButton.textContent = options.actionName;
            actionButton.addEventListener('click', (e) => {
                e.stopPropagation();
                options.onAction(toast);
            });
            toast.appendChild(actionButton);
        }

        const closeButton = document.createElement('button');
        closeButton.classList.add('adw-button', 'circular', 'flat', 'compact', 'adw-toast-close-button');
        closeButton.setAttribute('aria-label', 'Close notification');

        const icon = document.createElement('span');
        icon.classList.add('adw-icon', 'icon-window-close-symbolic'); // Corrected class
        // icon.innerHTML = '&times;'; // Fallback if icon class not present or SVG not used
        closeButton.appendChild(icon);

        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            Adw.dismissToast(toast);
        });
        toast.appendChild(closeButton);

        toastOverlay.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('visible');
        }, 10);

        const timeoutDuration = options.timeout === undefined ? DEFAULT_TIMEOUT : options.timeout;
        if (timeoutDuration > 0) {
            toast._dismissTimer = setTimeout(() => {
                Adw.dismissToast(toast);
            }, timeoutDuration);
        }

        toast.addEventListener('click', (event) => { // Use event parameter
            if (event.target.closest('button')) {
                return;
            }
            Adw.dismissToast(toast);
        });
        return toast;
    };

    /**
     * Dismisses a given toast notification.
     * @param {HTMLElement} toastElement - The toast element to dismiss.
     */
    Adw.dismissToast = function(toastElement) {
        if (!toastElement || !toastElement.parentNode) {
            return;
        }

        if (toastElement._dismissTimer) {
            clearTimeout(toastElement._dismissTimer);
            toastElement._dismissTimer = null;
        }

        toastElement.classList.remove('visible');
        toastElement.classList.add('hiding');

        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, TOAST_ANIMATION_DURATION);
    };

    document.addEventListener('DOMContentLoaded', _initializeToastManager);

})(window.Adw);

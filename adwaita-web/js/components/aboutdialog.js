// adwaita-web/js/components/aboutdialog.js

if (!window.Adw) {
    window.Adw = {};
}

class AdwAboutDialogElement extends HTMLElement {
    constructor() {
        super();
        this._boundOnKeydown = this._onKeydown.bind(this); // For Escape key
        this._boundCloseButtonClick = this.close.bind(this);
        this._boundHandleFocusTrap = this._handleFocusTrap.bind(this); // For focus trapping

        this.classList.add('adw-dialog', 'adw-about-dialog'); // Inherits .adw-dialog styles
        this.setAttribute('role', 'dialog');
        this.setAttribute('aria-modal', 'true');
        this._initialized = false;
        this._focusableElements = [];
        this._previouslyFocusedElement = null;
    }

    static get observedAttributes() {
        return ['open', 'app-name', 'version', 'copyright', 'logo', 'comments', 'website', 'website-label', 'license-type'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'open') {
            if (this.hasAttribute('open')) {
                this._doOpen();
            } else {
                this._doClose();
            }
        } else {
            // Re-render if attributes change and component is initialized and connected
            if (this.isConnected && this._initialized) {
                this._render();
            }
        }
    }

    connectedCallback() {
        if (!this._initialized) {
            this._render(); // Initial render of content
            this._initialized = true;
        }
        // CSS :not([open]) { display: none; } handles initial hidden state.
        // setAttribute('hidden') is good for semantics and as a fallback.
        if (!this.hasAttribute('open')) {
            this.setAttribute('hidden', '');
        } else {
            // If 'open' is already present on connection, ensure _doOpen is called.
            this._doOpen();
        }
    }

    disconnectedCallback() {
        document.removeEventListener('keydown', this._boundOnKeydown);
        this.removeEventListener('keydown', this._boundHandleFocusTrap);
        // Backdrop cleanup is handled by AdwDialogElement's static property or a shared mechanism.
    }

    _render() {
        this.innerHTML = ''; // Clear existing content for re-render

        const appName = this.getAttribute('app-name') || 'Application';
        const version = this.getAttribute('version');
        const copyright = this.getAttribute('copyright');
        const logoSrc = this.getAttribute('logo');
        const commentsText = this.getAttribute('comments');
        const websiteUrl = this.getAttribute('website');
        const websiteLabel = this.getAttribute('website-label') || websiteUrl;
        // Future: license-type, developers, artists, documenters, license-text etc.

        const header = document.createElement('header');
        header.classList.add('adw-header-bar', 'adw-dialog__header');
        const titleEl = document.createElement('h2');
        titleEl.classList.add('adw-header-bar__title');
        titleEl.id = 'about-dialog-title-' + (this.id || Math.random().toString(36).substring(2,7));
        titleEl.textContent = `About ${appName}`;
        this.setAttribute('aria-labelledby', titleEl.id);
        header.appendChild(titleEl);

        const closeButton = document.createElement('button');
        closeButton.type = 'button'; // CRITICAL: Prevent form submission
        closeButton.classList.add('adw-button', 'circular', 'flat', 'adw-dialog-close-button');
        closeButton.setAttribute('aria-label', 'Close dialog');
        const closeIcon = document.createElement('span');
        closeIcon.classList.add('adw-icon', 'icon-window-close-symbolic'); // Ensure this class provides the icon
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener('click', this._boundCloseButtonClick);
        header.appendChild(closeButton);
        this.appendChild(header);

        const contentArea = document.createElement('div');
        contentArea.classList.add('adw-dialog__content'); // This class should be styled by _dialog.scss

        const contentWrapper = document.createElement('div'); // Specific wrapper for about dialog content
        contentWrapper.classList.add('adw-about-dialog__content-wrapper'); // Styled in _dialog.scss for centering etc.

        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc; logoImg.alt = `${appName} Logo`; logoImg.classList.add('adw-about-dialog-logo');
            contentWrapper.appendChild(logoImg);
        }
        const appNameEl = document.createElement('h1'); // Use h1 for app name, styled by .adw-about-dialog-application-name
        appNameEl.classList.add('adw-about-dialog-application-name');
        appNameEl.textContent = appName;
        contentWrapper.appendChild(appNameEl);

        if (version) {
            const versionEl = document.createElement('p');
            versionEl.classList.add('adw-about-dialog-version'); versionEl.textContent = `Version ${version}`;
            contentWrapper.appendChild(versionEl);
        }
        if (commentsText) {
            const commentsEl = document.createElement('p');
            commentsEl.classList.add('adw-about-dialog-comments'); commentsEl.textContent = commentsText;
            contentWrapper.appendChild(commentsEl);
        }

        const linksContainer = document.createElement('div');
        linksContainer.classList.add('adw-about-dialog__links');
        if (websiteUrl) {
            const websiteLink = document.createElement('a');
            websiteLink.href = websiteUrl; websiteLink.textContent = websiteLabel || 'Website';
            websiteLink.classList.add('adw-button', 'pill'); // Style as a pill button
            websiteLink.target = '_blank'; websiteLink.rel = 'noopener noreferrer';
            linksContainer.appendChild(websiteLink);
        }
        // Future: Add more links (e.g., documentation, source code) here as pill buttons
        if (linksContainer.hasChildNodes()) {
            contentWrapper.appendChild(linksContainer);
        }

        // Placeholder for other sections like credits, license
        // Example: this.appendSection(contentWrapper, 'Developers', this.getAttribute('developers'));

        if (copyright) {
            const copyrightEl = document.createElement('p');
            copyrightEl.classList.add('adw-about-dialog-copyright'); copyrightEl.textContent = copyright;
            contentWrapper.appendChild(copyrightEl);
        }
        contentArea.appendChild(contentWrapper);
        this.appendChild(contentArea);
    }

    _createBackdrop() {
        // Use the shared backdrop logic from AdwDialogElement
        const GenericDialog = customElements.get('adw-dialog');
        if (GenericDialog && typeof GenericDialog._createBackdrop === 'function') {
            // Ensure this component has a static reference to the backdrop if it's shared
            AdwAboutDialogElement._backdropElement = GenericDialog._createBackdrop();
            return AdwAboutDialogElement._backdropElement;
        }
        // Fallback to creating its own if AdwDialogElement's mechanism isn't available/compatible
        if (!AdwAboutDialogElement._backdropElement) {
            AdwAboutDialogElement._backdropElement = document.createElement('div');
            AdwAboutDialogElement._backdropElement.classList.add('adw-dialog-backdrop');
            Object.assign(AdwAboutDialogElement._backdropElement.style, {
                display: 'none', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'var(--dialog-backdrop-color, rgba(0,0,0,0.4))',
                zIndex: 'calc(var(--z-index-dialog, 1050) - 1)',
                opacity: '0',
                transition: 'opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease)'
            });
            document.body.appendChild(AdwAboutDialogElement._backdropElement);
        }
        return AdwAboutDialogElement._backdropElement;
    }

    _onKeydown(event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }

    _doOpen() {
        if (!this._initialized) this._render();

        this.removeAttribute('hidden');
        // CSS handles display via [open]

        const backdrop = this._createBackdrop();
        if (backdrop) backdrop.style.display = 'block';

        requestAnimationFrame(() => {
            if (backdrop) backdrop.style.opacity = '1';
        });

        document.addEventListener('keydown', this._boundOnKeydown);

        // Focus management for AboutDialog (simpler, usually just close button)
        this._previouslyFocusedElement = document.activeElement;
        this._focusableElements = Array.from(
            this.querySelectorAll('.adw-dialog-close-button, a[href]') // Close button and any links
        );

        if (this._focusableElements.length > 0) {
            this._focusableElements[0].focus();
        } else {
            // Fallback: make dialog focusable if no elements (e.g. close button) found
            this.setAttribute('tabindex', '-1');
            this.focus();
        }
        this.addEventListener('keydown', this._boundHandleFocusTrap);

        this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
    }

    _handleFocusTrap(event) { // Copied from AdwDialogElement, can be DRYer
        if (event.key !== 'Tab' || !this._focusableElements.length) {
            return;
        }
        const firstFocusableElement = this._focusableElements[0];
        const lastFocusableElement = this._focusableElements[this._focusableElements.length - 1];
        if (event.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                lastFocusableElement.focus(); event.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                firstFocusableElement.focus(); event.preventDefault();
            }
        }
    }

    _doClose() {
        const backdrop = AdwAboutDialogElement._backdropElement;
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        // CSS handles opacity/transform transitions via :not([open])

        this.removeEventListener('keydown', this._boundHandleFocusTrap);

        const onTransitionEnd = (event) => {
            if (event.target === this && event.propertyName === 'opacity' && !this.hasAttribute('open')) {
                this.setAttribute('hidden', '');
                this.removeEventListener('transitionend', onTransitionEnd);
                if (backdrop) {
                    const anyOtherDialogOpen = document.querySelector('adw-dialog[open]:not([hidden]), adw-about-dialog[open]:not([hidden])');
                    if (!anyOtherDialogOpen) {
                        backdrop.style.display = 'none';
                    }
                }
            }
        };
        this.addEventListener('transitionend', onTransitionEnd);

        document.removeEventListener('keydown', this._boundOnKeydown);
        if (this._previouslyFocusedElement && typeof this._previouslyFocusedElement.focus === 'function') {
            this._previouslyFocusedElement.focus();
        }
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }
}
AdwAboutDialogElement._backdropElement = null; // Static property for its own backdrop if not sharing

customElements.define('adw-about-dialog', AdwAboutDialogElement);

Adw.AboutDialog = Adw.AboutDialog || {};
Adw.AboutDialog.factory = (options = {}) => {
    const dialog = document.createElement('adw-about-dialog');
    if (options.appName) dialog.setAttribute('app-name', options.appName);
    if (options.version) dialog.setAttribute('version', options.version);
    if (options.copyright) dialog.setAttribute('copyright', options.copyright);
    if (options.logo) dialog.setAttribute('logo', options.logo);
    if (options.comments) dialog.setAttribute('comments', options.comments);
    if (options.website) dialog.setAttribute('website', options.website);
    if (options.websiteLabel) dialog.setAttribute('website-label', options.websiteLabel);
    if (options.licenseType) dialog.setAttribute('license-type', options.licenseType);

    if (typeof options.onClose === 'function') {
        dialog.addEventListener('close', options.onClose);
    }
    console.log('Adw.AboutDialog.factory: created dialog instance:', dialog);
    return dialog;
};
window.createAdwAboutDialog = Adw.AboutDialog.factory;

console.log("AdwAboutDialogElement defined and registered.");

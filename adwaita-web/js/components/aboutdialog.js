// adwaita-web/js/components/aboutdialog.js

if (!window.Adw) {
    window.Adw = {};
}

// Use the same shared backdrop logic as AdwDialogElement for consistency
// This assumes AdwDialogElement's static _backdropElement is accessible or re-implemented here.
// For simplicity, let's make it self-contained for now, but sharing would be better.

class AdwAboutDialogElement extends HTMLElement {
    constructor() {
        super();
        this._boundOnKeydown = this._onKeydown.bind(this);
        this._boundCloseButtonClick = this.close.bind(this); // For close button in header

        // This component will also use Light DOM for easier styling with adwaita-skin.css
        this.classList.add('adw-dialog', 'adw-about-dialog'); // Host is the dialog
        this.setAttribute('role', 'dialog');
        this.setAttribute('aria-modal', 'true');
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
            // For other attributes, re-render if the component is already connected
            if (this.isConnected) {
                this._render();
            }
        }
    }

    connectedCallback() {
        if (!this._initialized) {
            this._render();
            this._initialized = true;
        }
        // Default to hidden if not explicitly open
        if (!this.hasAttribute('open')) {
            this.setAttribute('hidden', '');
            this.style.display = 'none';
        } else {
            this._doOpen(); // Ensure it's properly opened if 'open' is set on connect
        }
    }

    _render() {
        // Clear existing content before re-rendering
        this.innerHTML = '';

        const appName = this.getAttribute('app-name') || 'Application';
        const version = this.getAttribute('version');
        const copyright = this.getAttribute('copyright');
        const logoSrc = this.getAttribute('logo');
        const commentsText = this.getAttribute('comments');
        const websiteUrl = this.getAttribute('website');
        const websiteLabel = this.getAttribute('website-label') || websiteUrl;
        // LicenseType, developers, etc., can be added similarly

        // Header
        const header = document.createElement('header');
        header.classList.add('adw-header-bar', 'adw-dialog__header');

        const titleEl = document.createElement('h2');
        titleEl.classList.add('adw-header-bar__title');
        titleEl.id = 'about-dialog-title-' + (this.id || Math.random().toString(36).substring(2,7));
        titleEl.textContent = `About ${appName}`;
        this.setAttribute('aria-labelledby', titleEl.id);
        header.appendChild(titleEl);

        const closeButton = document.createElement('button');
        closeButton.classList.add('adw-button', 'circular', 'flat', 'adw-dialog-close-button');
        closeButton.setAttribute('aria-label', 'Close dialog');
        const closeIcon = document.createElement('span');
        closeIcon.classList.add('adw-icon', 'icon-window-close-symbolic');
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener('click', this._boundCloseButtonClick);
        header.appendChild(closeButton);
        this.appendChild(header);

        // Content Area
        const contentArea = document.createElement('div');
        contentArea.classList.add('adw-dialog__content'); // Standard dialog content class

        // AboutDialog specific layout within contentArea
        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc;
            logoImg.alt = `${appName} Logo`;
            logoImg.classList.add('adw-about-dialog-logo');
            contentArea.appendChild(logoImg);
        }

        const appNameEl = document.createElement('p');
        appNameEl.classList.add('adw-label', 'application-name', 'title-1'); // title-1 for prominence
        appNameEl.textContent = appName;
        contentArea.appendChild(appNameEl);

        if (version) {
            const versionEl = document.createElement('p');
            versionEl.classList.add('adw-label', 'version', 'body-2');
            versionEl.textContent = `Version ${version}`;
            contentArea.appendChild(versionEl);
        }

        if (commentsText) {
            const commentsEl = document.createElement('p');
            commentsEl.classList.add('adw-label', 'comments');
            commentsEl.textContent = commentsText;
            contentArea.appendChild(commentsEl);
        }

        if (websiteUrl) {
            const websiteLink = document.createElement('a');
            websiteLink.href = websiteUrl;
            websiteLink.textContent = websiteLabel || websiteUrl;
            websiteLink.classList.add('adw-link');
            websiteLink.target = '_blank';
            websiteLink.rel = 'noopener noreferrer';
            const websiteP = document.createElement('p');
            websiteP.appendChild(websiteLink);
            contentArea.appendChild(websiteP);
        }

        if (copyright) {
            const copyrightEl = document.createElement('p');
            copyrightEl.classList.add('adw-label', 'copyright', 'caption');
            copyrightEl.textContent = copyright;
            contentArea.appendChild(copyrightEl);
        }

        // TODO: Add sections for developers, license, etc. as per full AdwAboutDialog spec
        // This might involve more complex slotted content or attributes.

        this.appendChild(contentArea);
    }

    _createBackdrop() { // Simplified backdrop creation, could share with AdwDialogElement
        if (!AdwAboutDialogElement._backdropElement) {
            AdwAboutDialogElement._backdropElement = document.createElement('div');
            AdwAboutDialogElement._backdropElement.classList.add('adw-dialog-backdrop'); // Global class
            Object.assign(AdwAboutDialogElement._backdropElement.style, {
                display: 'none', position: 'fixed', top: '0', left: '0',
                width: '100%', height: '100%',
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
        this.removeAttribute('hidden');
        this.style.display = 'flex';

        const backdrop = this._createBackdrop();
        backdrop.style.display = 'block';
        // Force reflow before starting animation
        void backdrop.offsetWidth;
        void this.offsetWidth;

        backdrop.style.opacity = '1';
        this.style.opacity = '1';
        this.style.transform = 'scale(1)';

        // No backdrop click to close for AboutDialog by default, per GNOME HIG
        document.addEventListener('keydown', this._boundOnKeydown);

        const firstFocusable = this.querySelector('.adw-dialog-close-button, button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        this.dispatchEvent(new CustomEvent('open'));
    }

    _doClose() {
        if (AdwAboutDialogElement._backdropElement) {
            AdwAboutDialogElement._backdropElement.style.opacity = '0';
        }
        this.style.opacity = '0';
        this.style.transform = 'scale(0.95)';

        setTimeout(() => {
            this.setAttribute('hidden', '');
            this.style.display = 'none';
            if (AdwAboutDialogElement._backdropElement) {
                AdwAboutDialogElement._backdropElement.style.display = 'none';
            }
        }, 150); // Match animation duration

        document.removeEventListener('keydown', this._boundOnKeydown);
        this.dispatchEvent(new CustomEvent('close'));
    }

    open() {
        this.setAttribute('open', '');
    }

    close() {
        this.removeAttribute('open');
    }
}
AdwAboutDialogElement._backdropElement = null; // Shared backdrop instance

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
    // Note: Does not handle complex slotted content like developers list from JS factory yet.

    if (typeof options.onClose === 'function') {
        dialog.addEventListener('close', options.onClose);
    }
    return dialog;
};
window.createAdwAboutDialog = Adw.AboutDialog.factory;

console.log("AdwAboutDialogElement defined and registered.");

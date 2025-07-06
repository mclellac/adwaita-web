// adwaita-web/js/components/aboutdialog.js
console.log('AdwAboutDialogElement: script loading.');

if (!window.Adw) {
    window.Adw = {};
    console.log('AdwAboutDialogElement: Adw global namespace created.');
}

class AdwAboutDialogElement extends HTMLElement {
    constructor() {
        super();
        console.log(`AdwAboutDialogElement: constructor called for ID: ${this.id || 'N/A'}`);
        this._boundOnKeydown = this._onKeydown.bind(this);
        this._boundCloseButtonClick = this.close.bind(this);

        this.classList.add('adw-dialog', 'adw-about-dialog');
        this.setAttribute('role', 'dialog');
        this.setAttribute('aria-modal', 'true');
        this._initialized = false; // Ensure render happens on first connect
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} basic setup complete.`);
    }

    static get observedAttributes() {
        console.log('AdwAboutDialogElement: observedAttributes getter called.');
        return ['open', 'app-name', 'version', 'copyright', 'logo', 'comments', 'website', 'website-label', 'license-type'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} attributeChangedCallback - Name: ${name}, Old: ${oldValue}, New: ${newValue}`);
        if (name === 'open') {
            if (this.hasAttribute('open')) {
                console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} 'open' attribute added, calling _doOpen.`);
                this._doOpen();
            } else {
                console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} 'open' attribute removed, calling _doClose.`);
                this._doClose();
            }
        } else {
            if (this.isConnected && this._initialized) { // Only re-render if connected and initialized
                console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} attribute ${name} changed, calling _render.`);
                this._render();
            }
        }
    }

    connectedCallback() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} connectedCallback. Initialized: ${this._initialized}`);
        if (!this._initialized) {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} first connection, calling _render.`);
            this._render();
            this._initialized = true;
        }
        if (!this.hasAttribute('open')) {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} initially not open, setting hidden attribute and display:none.`);
            this.setAttribute('hidden', '');
            this.style.display = 'none';
        } else {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} connected with 'open' attribute, ensuring _doOpen.`);
            // If already open, ensure visibility and transitions are correctly applied
            this._doOpen();
        }
    }

    disconnectedCallback() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} disconnectedCallback.`);
        // Clean up global event listeners if removed from DOM while open
        document.removeEventListener('keydown', this._boundOnKeydown);
        // Note: backdrop cleanup might need care if shared across dialog types
        if (AdwAboutDialogElement._backdropElement && AdwAboutDialogElement._backdropElement.style.display !== 'none') {
            // If this was the only dialog, hide backdrop. Complex if shared with AdwDialog.
        }
    }

    _render() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _render called.`);
        this.innerHTML = ''; // Clear existing content

        const appName = this.getAttribute('app-name') || 'Application';
        // ... (rest of the attribute fetching remains the same)
        const version = this.getAttribute('version');
        const copyright = this.getAttribute('copyright');
        const logoSrc = this.getAttribute('logo');
        const commentsText = this.getAttribute('comments');
        const websiteUrl = this.getAttribute('website');
        const websiteLabel = this.getAttribute('website-label') || websiteUrl;

        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} rendering with appName: ${appName}`);

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
        closeIcon.classList.add('adw-icon', 'icon-window-close-symbolic'); // Ensure this class provides the icon
        closeButton.appendChild(closeIcon);
        closeButton.addEventListener('click', this._boundCloseButtonClick);
        header.appendChild(closeButton);
        this.appendChild(header);

        const contentArea = document.createElement('div');
        contentArea.classList.add('adw-dialog__content');
        // ... (rest of contentArea population is the same as original)
        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc; logoImg.alt = `${appName} Logo`; logoImg.classList.add('adw-about-dialog-logo');
            contentArea.appendChild(logoImg);
        }
        const appNameEl = document.createElement('p');
        appNameEl.classList.add('adw-label', 'application-name', 'title-1'); appNameEl.textContent = appName;
        contentArea.appendChild(appNameEl);
        if (version) {
            const versionEl = document.createElement('p');
            versionEl.classList.add('adw-label', 'version', 'body-2'); versionEl.textContent = `Version ${version}`;
            contentArea.appendChild(versionEl);
        }
        if (commentsText) {
            const commentsEl = document.createElement('p');
            commentsEl.classList.add('adw-label', 'comments'); commentsEl.textContent = commentsText;
            contentArea.appendChild(commentsEl);
        }
        if (websiteUrl) {
            const websiteLink = document.createElement('a');
            websiteLink.href = websiteUrl; websiteLink.textContent = websiteLabel || websiteUrl;
            websiteLink.classList.add('adw-link'); websiteLink.target = '_blank'; websiteLink.rel = 'noopener noreferrer';
            const websiteP = document.createElement('p'); websiteP.appendChild(websiteLink);
            contentArea.appendChild(websiteP);
        }
        if (copyright) {
            const copyrightEl = document.createElement('p');
            copyrightEl.classList.add('adw-label', 'copyright', 'caption'); copyrightEl.textContent = copyright;
            contentArea.appendChild(copyrightEl);
        }
        this.appendChild(contentArea);
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _render completed.`);
    }

    _createBackdrop() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _createBackdrop called.`);
        // For now, assume AdwDialogElement's static backdrop logic is primary if available.
        // This component might need its own static _backdropElement if fully independent.
        // Let's use AdwDialogElement's static one if it exists for better sharing.
        const GenericDialog = customElements.get('adw-dialog');
        if (GenericDialog && GenericDialog._backdropElement) {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} using existing shared backdrop from AdwDialogElement.`);
             AdwAboutDialogElement._backdropElement = GenericDialog._backdropElement; // Link to it
        } else if (!AdwAboutDialogElement._backdropElement) {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} creating its own backdrop element.`);
            AdwAboutDialogElement._backdropElement = document.createElement('div');
            AdwAboutDialogElement._backdropElement.classList.add('adw-dialog-backdrop');
            Object.assign(AdwAboutDialogElement._backdropElement.style, {
                display: 'none', position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: 'var(--dialog-backdrop-color, rgba(0,0,0,0.4))',
                zIndex: 'calc(var(--z-index-dialog, 1050) - 1)', // Ensure z-index is less than dialog
                opacity: '0',
                transition: 'opacity var(--animation-duration-short, 150ms) var(--animation-ease-out-cubic, ease)'
            });
            document.body.appendChild(AdwAboutDialogElement._backdropElement);
        }
        return AdwAboutDialogElement._backdropElement;
    }

    _onKeydown(event) {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _onKeydown, key: ${event.key}`);
        if (event.key === 'Escape') {
            this.close();
        }
    }

    _doOpen() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _doOpen executing.`);
        if (!this._initialized) this._render(); // Ensure rendered if opened programmatically before connect

        this.removeAttribute('hidden');
        this.classList.add('open'); // Add .open class for CSS transitions
        this.style.display = ''; // Clear direct display style if any was set by hidden logic

        const backdrop = this._createBackdrop();
        if (backdrop) { // Backdrop might be null if AdwDialogElement's one isn't ready
            backdrop.classList.add('open'); // Add .open class for CSS transitions
            backdrop.style.display = ''; // Clear direct display style
        }
        // Style changes for opacity/transform are now handled by CSS via .open class

        document.addEventListener('keydown', this._boundOnKeydown);

        const firstFocusable = this.querySelector('.adw-dialog-close-button');
        if (firstFocusable) {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} focusing close button.`);
            firstFocusable.focus();
        } else {
            this.setAttribute('tabindex', '-1'); this.focus(); // Fallback to dialog itself
             console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} no close button found to focus, focusing dialog.`);
        }
        this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} 'open' event dispatched.`);
    }

    _doClose() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _doClose executing.`);
        this.classList.remove('open'); // Remove .open class for CSS transitions
        const backdrop = AdwAboutDialogElement._backdropElement; // Use the static ref for this component
        if (backdrop) {
            backdrop.classList.remove('open'); // Remove .open class
        }

        // CSS transitions will handle opacity, transform, and visibility.
        // JS needs to set 'hidden' and 'display:none' after transition.
        setTimeout(() => {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} timeout for close, setting hidden attribute and display:none if needed.`);
            if (!this.hasAttribute('open')) { // Ensure it's still meant to be closed
                this.setAttribute('hidden', '');
                this.style.display = 'none'; // Fallback

                if (backdrop) {
                    // Check if other dialogs (adw-dialog or adw-about-dialog) are .open
                    const anyOtherDialogOpen = document.querySelector('adw-dialog.open, adw-about-dialog.open');
                    if (!anyOtherDialogOpen) {
                        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} No other dialogs .open, setting backdrop display:none.`);
                        backdrop.style.display = 'none';
                    } else {
                        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} Other dialogs still .open, not changing backdrop display.`);
                    }
                }
            }
        }, 150); // Match CSS transition duration

        document.removeEventListener('keydown', this._boundOnKeydown);
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} 'close' event dispatched.`);
    }

    open() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} open() method called. Setting 'open' attribute.`);
        this.setAttribute('open', '');
    }

    close() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} close() method called. Removing 'open' attribute.`);
        this.removeAttribute('open');
    }
}
AdwAboutDialogElement._backdropElement = null;

customElements.define('adw-about-dialog', AdwAboutDialogElement);

Adw.AboutDialog = Adw.AboutDialog || {};
Adw.AboutDialog.factory = (options = {}) => {
    console.log('Adw.AboutDialog.factory called with options:', options);
    const dialog = document.createElement('adw-about-dialog');
    // ... (attribute setting remains the same)
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

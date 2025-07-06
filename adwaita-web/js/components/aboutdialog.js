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
        return [
            'open', 'app-name', 'application-name', 'version', 'copyright', 'logo', 'application-icon',
            'comments', 'website', 'website-label', 'license-type', 'license',
            'developer-name', // Keep for potential single developer case
            'developers', 'designers', 'artists', 'documenters', 'translator-credits',
            'issue-url', 'support-url',
            'release-notes', 'release-notes-version',
            'system-information'
            // Note: 'logo-icon-name' is less direct for web, prefer 'logo' (URL) or 'application-icon' (CSS class/SVG name)
        ];
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
            // Re-render if the attribute is not 'open' and the component is connected and initialized.
            if (this.isConnected && this._initialized) {
                console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} attribute '${name}' changed from '${oldValue}' to '${newValue}', calling _render.`);
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

    _parseStringArray(attributeValue) {
        if (!attributeValue) return [];
        return attributeValue.split(',').map(item => item.trim()).filter(item => item);
    }

    _render() {
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _render called.`);
        this.innerHTML = ''; // Clear existing content

        // Get all attributes
        const appName = this.getAttribute('application-name') || this.getAttribute('app-name') || 'Application';
        const version = this.getAttribute('version');
        const copyright = this.getAttribute('copyright');
        const logoSrc = this.getAttribute('logo') || this.getAttribute('application-icon'); // application-icon could be a path too
        const commentsText = this.getAttribute('comments');
        const websiteUrl = this.getAttribute('website');
        const websiteLabel = this.getAttribute('website-label') || websiteUrl;
        const issueUrl = this.getAttribute('issue-url');
        const supportUrl = this.getAttribute('support-url');
        const licenseType = this.getAttribute('license-type');
        const licenseText = this.getAttribute('license'); // Full license text

        const developers = this._parseStringArray(this.getAttribute('developers'));
        const developerName = this.getAttribute('developer-name'); // Fallback if developers is empty
        const designers = this._parseStringArray(this.getAttribute('designers'));
        const artists = this._parseStringArray(this.getAttribute('artists'));
        const documenters = this._parseStringArray(this.getAttribute('documenters'));
        const translatorCredits = this.getAttribute('translator-credits'); // Often a block of text

        const releaseNotes = this.getAttribute('release-notes');
        const releaseNotesVersion = this.getAttribute('release-notes-version');
        const systemInformation = this.getAttribute('system-information');

        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} rendering with appName: ${appName}`);

        // 1. Header (standard dialog header)
        const header = document.createElement('header');
        header.classList.add('adw-header-bar', 'adw-dialog__header');
        const titleEl = document.createElement('h2');
        titleEl.classList.add('adw-header-bar__title');
        titleEl.id = `about-dialog-title-${this.id || Math.random().toString(36).substring(2, 9)}`;
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

        // 2. Main Content Area
        const contentArea = document.createElement('div');
        contentArea.classList.add('adw-dialog__content', 'adw-about-dialog__content-wrapper'); // Specific wrapper for about dialog styling

        // Application Info Section
        const appInfoSection = document.createElement('section');
        appInfoSection.classList.add('adw-about-dialog__app-info');
        if (logoSrc) {
            const logoImg = document.createElement('img');
            logoImg.src = logoSrc;
            logoImg.alt = `${appName} Logo`;
            logoImg.classList.add('adw-about-dialog-logo');
            appInfoSection.appendChild(logoImg);
        }
        const appNameEl = document.createElement('h3'); // Was p, h3 more semantic for app name here
        appNameEl.classList.add('adw-about-dialog-application-name'); // Use more specific class
        appNameEl.textContent = appName;
        appInfoSection.appendChild(appNameEl);

        if (version) {
            const versionEl = document.createElement('p');
            versionEl.classList.add('adw-about-dialog-version');
            versionEl.textContent = `Version ${version}`;
            appInfoSection.appendChild(versionEl);
        }
        if (commentsText) {
            const commentsEl = document.createElement('p');
            commentsEl.classList.add('adw-about-dialog-comments');
            commentsEl.innerHTML = commentsText.replace(/\n/g, '<br>'); // Support multi-line comments
            appInfoSection.appendChild(commentsEl);
        }
        contentArea.appendChild(appInfoSection);

        // Links Section (Website, Support, Issues)
        const linksSection = document.createElement('section');
        linksSection.classList.add('adw-about-dialog__links');
        if (websiteUrl) {
            const websiteLink = document.createElement('a');
            websiteLink.href = websiteUrl;
            websiteLink.textContent = websiteLabel || 'Visit Website';
            websiteLink.classList.add('adw-button', 'pill'); // Style as a pill button
            websiteLink.target = '_blank';
            websiteLink.rel = 'noopener noreferrer';
            linksSection.appendChild(websiteLink);
        }
        if (supportUrl) {
            const supportLink = document.createElement('a');
            supportLink.href = supportUrl;
            supportLink.textContent = 'Get Support';
            supportLink.classList.add('adw-button', 'pill');
            supportLink.target = '_blank';
            supportLink.rel = 'noopener noreferrer';
            linksSection.appendChild(supportLink);
        }
        if (issueUrl) {
            const issueLink = document.createElement('a');
            issueLink.href = issueUrl;
            issueLink.textContent = 'Report an Issue';
            issueLink.classList.add('adw-button', 'pill');
            issueLink.target = '_blank';
            issueLink.rel = 'noopener noreferrer';
            linksSection.appendChild(issueLink);
        }
        if (linksSection.hasChildNodes()) {
            contentArea.appendChild(linksSection);
        }


        // Credits Section
        const credits = [];
        if (developers.length > 0) {
            credits.push({ title: 'Developed by', names: developers });
        } else if (developerName) {
            credits.push({ title: 'Developed by', names: [developerName] });
        }
        if (designers.length > 0) credits.push({ title: 'Designed by', names: designers });
        if (artists.length > 0) credits.push({ title: 'Artwork by', names: artists });
        if (documenters.length > 0) credits.push({ title: 'Documentation by', names: documenters });

        if (credits.length > 0) {
            const creditsSection = document.createElement('section');
            creditsSection.classList.add('adw-about-dialog__credits');
            credits.forEach(creditGroup => {
                const groupEl = document.createElement('div');
                groupEl.classList.add('adw-about-dialog-credit-group');
                const titleEl = document.createElement('h4');
                titleEl.classList.add('adw-about-dialog-credit-title');
                titleEl.textContent = creditGroup.title;
                groupEl.appendChild(titleEl);
                const listEl = document.createElement('ul');
                listEl.classList.add('adw-about-dialog-credit-list');
                creditGroup.names.forEach(name => {
                    const listItemEl = document.createElement('li');
                    listItemEl.textContent = name;
                    listEl.appendChild(listItemEl);
                });
                groupEl.appendChild(listEl);
                creditsSection.appendChild(groupEl);
            });
            contentArea.appendChild(creditsSection);
        }

        if (translatorCredits) { // Often a single block of text
            const translatorsSection = document.createElement('section');
            translatorsSection.classList.add('adw-about-dialog__translators');
            const titleEl = document.createElement('h4');
            titleEl.classList.add('adw-about-dialog-credit-title');
            titleEl.textContent = 'Translated by';
            translatorsSection.appendChild(titleEl);
            const textEl = document.createElement('p');
            textEl.classList.add('adw-about-dialog-translator-text');
            textEl.innerHTML = translatorCredits.replace(/\n/g, '<br>');
            translatorsSection.appendChild(textEl);
            contentArea.appendChild(translatorsSection);
        }

        // Release Notes Section (optional)
        if (releaseNotes) {
            const releaseNotesSection = document.createElement('section');
            releaseNotesSection.classList.add('adw-about-dialog__release-notes');
            const rnTitle = document.createElement('h4');
            rnTitle.classList.add('adw-about-dialog-section-title');
            rnTitle.textContent = releaseNotesVersion ? `Release Notes: ${releaseNotesVersion}` : 'Release Notes';
            releaseNotesSection.appendChild(rnTitle);
            const rnContent = document.createElement('div'); // Use a div for potentially complex HTML
            rnContent.classList.add('adw-about-dialog-prose');
            rnContent.innerHTML = releaseNotes; // Assume HTML or Markdown processed to HTML
            releaseNotesSection.appendChild(rnContent);
            contentArea.appendChild(releaseNotesSection);
        }

        // License Section
        if (licenseType || licenseText) {
            const licenseSection = document.createElement('section');
            licenseSection.classList.add('adw-about-dialog__license');
            const licenseTitle = document.createElement('h4');
            licenseTitle.classList.add('adw-about-dialog-section-title');
            licenseTitle.textContent = 'License';
            licenseSection.appendChild(licenseTitle);

            if (licenseType) {
                const typeEl = document.createElement('p');
                typeEl.classList.add('adw-about-dialog-license-type');
                typeEl.textContent = this._getLicenseDisplayName(licenseType);
                licenseSection.appendChild(typeEl);
            }
            if (licenseText) {
                const textEl = document.createElement('pre'); // Use <pre> for preformatted license text
                textEl.classList.add('adw-about-dialog-license-text');
                textEl.textContent = licenseText;
                licenseSection.appendChild(textEl);
            }
            contentArea.appendChild(licenseSection);
        }

        // System Information (optional)
        if (systemInformation) {
            const sysInfoSection = document.createElement('section');
            sysInfoSection.classList.add('adw-about-dialog__system-information');
            const siTitle = document.createElement('h4');
            siTitle.classList.add('adw-about-dialog-section-title');
            siTitle.textContent = 'System Information';
            sysInfoSection.appendChild(siTitle);
            const siContent = document.createElement('pre');
            siContent.classList.add('adw-about-dialog-prose');
            siContent.textContent = systemInformation;
            sysInfoSection.appendChild(siContent);
            contentArea.appendChild(sysInfoSection);
        }


        // Copyright (usually last)
        if (copyright) {
            const copyrightEl = document.createElement('p');
            copyrightEl.classList.add('adw-about-dialog-copyright');
            copyrightEl.textContent = copyright;
            contentArea.appendChild(copyrightEl); // Should be last in contentArea
        }

        this.appendChild(contentArea);
        console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} _render completed with new structure.`);
    }

    _getLicenseDisplayName(licenseTypeAttr) {
        const types = {
            'CUSTOM': 'Custom License',
            'GPL_2_0_ONLY': 'GNU GPL v2.0 only',
            'GPL_3_0_ONLY': 'GNU GPL v3.0 only',
            'LGPL_2_1_ONLY': 'GNU LGPL v2.1 only',
            'LGPL_3_0_ONLY': 'GNU LGPL v3.0 only',
            'BSD': 'BSD License',
            'MIT_X11': 'MIT/X11 License',
            'ARTISTIC': 'Artistic License',
            'APACHE_2_0': 'Apache License 2.0'
        };
        return types[licenseTypeAttr.toUpperCase()] || licenseTypeAttr;
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
        this.style.display = 'flex'; // Should be handled by CSS for :host([open])
        this.style.opacity = '0'; // Start transparent for transition
        this.style.transform = 'scale(0.95)'; // Start small for transition

        const backdrop = this._createBackdrop();
        backdrop.style.display = 'block';

        requestAnimationFrame(() => {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} RAF for open transition.`);
            backdrop.style.opacity = '1';
            this.style.opacity = '1';
            this.style.transform = 'scale(1)';
        });

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
        const backdrop = AdwAboutDialogElement._backdropElement; // Use the static ref
        if (backdrop) {
            backdrop.style.opacity = '0';
        }
        this.style.opacity = '0';
        this.style.transform = 'scale(0.95)';

        setTimeout(() => {
            console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} timeout for close, setting display:none and hidden attribute.`);
            this.setAttribute('hidden', '');
            this.style.display = 'none';
            if (backdrop) {
                 // Check if other dialogs (adw-dialog or adw-about-dialog) are open
                const anyOtherAdwDialogOpen = document.querySelector('adw-dialog[open]:not([hidden]), adw-about-dialog[open]:not([hidden])');
                if (!anyOtherAdwDialogOpen) { // If this was the last one
                    console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} No other dialogs open, hiding backdrop.`);
                    backdrop.style.display = 'none';
                } else {
                    console.log(`AdwAboutDialogElement: ${this.id || 'N/A'} Other dialogs may be open, not hiding backdrop globally here.`);
                }
            }
        }, 150);

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

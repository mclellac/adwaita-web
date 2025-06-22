import { adwGenerateId } from './utils.js';
import { createAdwButton, AdwButton } from './button.js';
import { createAdwToggleButton, AdwToggleButton } from './controls.js';
// Assuming createAdwToggleGroup is not directly used by view components, but by apps
// import { createAdwToggleGroup, AdwToggleGroup } from './controls.js';
import { createAdwHeaderBar, AdwHeaderBar } from './header_bar.js';

// Helper for SVG content
function _appendSVGStringToElement(svgString, parentElement) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (svgElement) {
        Array.from(svgElement.querySelectorAll('script')).forEach(s => s.remove()); // Basic sanitization
        parentElement.appendChild(svgElement);
    } else {
        console.warn("Could not parse SVG string:", svgString);
    }
}


/**
 * Creates an Adwaita-style ViewSwitcher.
 */
export function createAdwViewSwitcher(options = {}) {
    const opts = options || {};
    const viewSwitcherRoot = document.createElement('div');
    viewSwitcherRoot.classList.add('adw-view-switcher');

    const viewSwitcherBar = document.createElement('div');
    viewSwitcherBar.classList.add('adw-view-switcher-bar');
    if(opts.isInline) viewSwitcherBar.classList.add('inline-switcher');
    viewSwitcherRoot.appendChild(viewSwitcherBar);

    viewSwitcherBar.setAttribute('role', 'tablist');
    if(opts.label) viewSwitcherBar.setAttribute('aria-label', opts.label);

    const buttons = [];
    let currentActiveButton = null;
    let currentActiveViewName = opts.activeViewName;

    function setActiveButton(buttonToActivate, viewName) {
        if (currentActiveButton) currentActiveButton.active = false;
        buttonToActivate.active = true;
        currentActiveButton = buttonToActivate;
        currentActiveViewName = viewName;
        if(typeof opts.onViewChanged === 'function') {
            opts.onViewChanged(viewName, buttonToActivate.id, viewName);
        }
    }

    (opts.views || []).forEach(view => {
        const buttonId = view.buttonId || adwGenerateId('adw-view-switcher-btn');
        const button = createAdwToggleButton(view.buttonOptions?.text || view.title || view.name, {
            value: view.name,
            active: view.name === currentActiveViewName,
            icon: view.buttonOptions?.icon,
        });
        button.id = buttonId;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', view.name);

        if(view.name === currentActiveViewName) currentActiveButton = button;

        button.addEventListener('click', () => {
            if (currentActiveViewName !== view.name && !button.disabled) {
                 setActiveButton(button, view.name);
            } else if (currentActiveViewName === view.name && !button.active) {
                button.active = true;
            }
        });
        buttons.push(button);
        viewSwitcherBar.appendChild(button);
    });

    if(!currentActiveButton && buttons.length > 0) {
        setActiveButton(buttons[0], buttons[0].value);
    }

    viewSwitcherRoot.setActiveView = (viewName) => {
        const buttonToActivate = buttons.find(b => b.value === viewName);
        if(buttonToActivate && currentActiveViewName !== viewName) {
            setActiveButton(buttonToActivate, viewName);
        } else if (buttonToActivate && !buttonToActivate.active) {
            buttonToActivate.active = true;
        }
    };
    return viewSwitcherRoot;
}
export class AdwViewSwitcher extends HTMLElement {
    static get observedAttributes() { return ['label', 'active-view', 'is-inline']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._viewSwitcherInstance = null; this._observer = null; }
    connectedCallback() { this._render(); this._observer = new MutationObserver(() => this._render()); this._observer.observe(this, { childList: true, subtree: false }); }
    disconnectedCallback() { if (this._observer) this._observer.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) { if (name === 'active-view' && this._viewSwitcherInstance) this._viewSwitcherInstance.setActiveView(newValue); else this._render(); }}
    _parseViews() { return Array.from(this.children).map(child => { if (child.hasAttribute('view-name') || child.dataset.viewName) { const viewName = child.getAttribute('view-name') || child.dataset.viewName; return { name: viewName, title: child.getAttribute('view-title') || child.dataset.viewTitle || viewName, content: child, id: child.id || undefined, buttonOptions: { text: child.getAttribute('view-title') || child.dataset.viewTitle || viewName } }; } console.warn("AdwViewSwitcher: Child element missing 'view-name' or 'data-view-name'", child); return null; }).filter(v => v); }
    _render() {
        const childrenToPreserve = Array.from(this.children);
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) { this.shadowRoot.removeChild(this.shadowRoot.lastChild); }
        const views = childrenToPreserve.map(child => { if (child.hasAttribute('view-name') || child.dataset.viewName) { const viewName = child.getAttribute('view-name') || child.dataset.viewName; return { name: viewName, title: child.getAttribute('view-title') || child.dataset.viewTitle || viewName, content: child, id: child.id || undefined, buttonOptions: { text: child.getAttribute('view-title') || child.dataset.viewTitle || viewName } }; } return null; }).filter(v => v);
        const options = { views: views, label: this.getAttribute('label') || undefined, activeViewName: this.getAttribute('active-view') || (views.length > 0 ? views[0].name : undefined), isInline: this.hasAttribute('is-inline'), onViewChanged: (viewName, buttonId, panelId) => { this.setAttribute('active-view', viewName); this.dispatchEvent(new CustomEvent('view-changed', { detail: { viewName, buttonId, panelId }, bubbles: true, composed: true })); }};
        const factory = (typeof Adw !== 'undefined' && Adw.createViewSwitcher) ? Adw.createViewSwitcher : createAdwViewSwitcher;
        this._viewSwitcherInstance = factory(options);
        this.shadowRoot.appendChild(this._viewSwitcherInstance); this._updateSlottedContentVisibility();
    }
    _updateSlottedContentVisibility() { const activeView = this.getAttribute('active-view'); Array.from(this.children).forEach(child => { if(child.nodeType === Node.ELEMENT_NODE) { const viewName = child.getAttribute('view-name') || child.dataset.viewName; child.style.display = viewName === activeView ? '' : 'none'; }});}
    setActiveView(viewName) { if (this._viewSwitcherInstance) this._viewSwitcherInstance.setActiveView(viewName); else this.setAttribute('active-view', viewName); this._updateSlottedContentVisibility(); }
}


/** Creates an AdwTabButton element. */
export function createAdwTabButton(options = {}) {
    const opts = options || {}; if (!opts.pageName) { console.error("AdwTabButton: options.pageName is required."); return document.createElement('div'); }
    const tabButton = document.createElement('div'); tabButton.classList.add('adw-tab-button'); tabButton.dataset.pageName = opts.pageName; tabButton.setAttribute('role', 'tab'); tabButton.setAttribute('aria-selected', opts.isActive ? 'true' : 'false'); tabButton.setAttribute('tabindex', opts.isActive ? '0' : '-1');
    if (opts.isActive) tabButton.classList.add('active');
    const contentWrapper = document.createElement('div'); contentWrapper.classList.add('adw-tab-button-content-wrapper');
    if (opts.iconHTML) {
        const iconSpan = document.createElement('span'); iconSpan.classList.add('adw-tab-button-icon');
        _appendSVGStringToElement(opts.iconHTML, iconSpan);
        contentWrapper.appendChild(iconSpan);
    }
    const labelSpan = document.createElement('span'); labelSpan.classList.add('adw-tab-button-label'); labelSpan.textContent = opts.label || 'Tab'; contentWrapper.appendChild(labelSpan); tabButton.appendChild(contentWrapper);
    if (opts.isClosable !== false) {
        const closeButton = createAdwButton('', {
            icon: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>',
            flat: true,
            isCircular: true,
            ariaLabel: 'Close tab ' + (opts.label || opts.pageName || 'unnamed tab'),
            onClick: (e) => { e.stopPropagation(); if (typeof opts.onClose === 'function') opts.onClose(opts.pageName); }
        });
        closeButton.classList.add('adw-tab-button-close');
        tabButton.appendChild(closeButton);
    }
    tabButton.addEventListener('click', () => { if (typeof opts.onSelect === 'function') opts.onSelect(opts.pageName); });
    tabButton.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (typeof opts.onSelect === 'function') opts.onSelect(opts.pageName); }});
    return tabButton;
}
export class AdwTabButton extends HTMLElement {
    static get observedAttributes() { return ['label', 'page-name', 'active', 'closable', 'icon']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._tabButtonElement = null; }
    connectedCallback() { this._render(); if (this._tabButtonElement) { this._tabButtonElement.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.adw-tab-button-close')) return; this.dispatchEvent(new CustomEvent('select', { detail: { pageName: this.pageName }})); }); const closeBtn = this._tabButtonElement.querySelector('.adw-tab-button-close'); if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('close', { detail: { pageName: this.pageName }})); }); }}
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const iconSlot = this.querySelector('[slot="icon"]');
        let iconHTMLContent = this.getAttribute('icon');
        if (iconSlot && iconSlot.innerHTML.trim() !== '') {
            iconHTMLContent = iconSlot.innerHTML.trim();
        }
        const options = { label: this.getAttribute('label') || this.textContent.trim() || 'Tab', pageName: this.pageName, isActive: this.active, isClosable: this.closable, iconHTML: iconHTMLContent, };
        if (!options.pageName) { console.warn("adw-tab-button requires a 'page-name' attribute."); return; }
        const factory = (typeof Adw !== 'undefined' && Adw.createTabButton) ? Adw.createTabButton : createAdwTabButton;
        this._tabButtonElement = factory(options); this.shadowRoot.appendChild(this._tabButtonElement);
    }
    get pageName() { return this.getAttribute('page-name'); } set pageName(value) { this.setAttribute('page-name', value); }
    get active() { return this.hasAttribute('active'); } set active(value) { if (value) this.setAttribute('active', ''); else this.removeAttribute('active'); }
    get closable() { return !this.hasAttribute('closable') || this.getAttribute('closable') !== 'false'; } set closable(value) { if (value) this.removeAttribute('closable'); else this.setAttribute('closable', 'false'); }
}

/** Creates an AdwTabBar element. */
export function createAdwTabBar(options = {}) {
    const opts = options || {}; const tabBar = document.createElement('div'); tabBar.classList.add('adw-tab-bar'); tabBar.setAttribute('role', 'tablist');
    const tabButtonContainer = document.createElement('div'); tabButtonContainer.classList.add('adw-tab-bar-button-container'); tabBar.appendChild(tabButtonContainer);
    let currentActiveTabName = opts.activeTabName;
    function _updateTabStates(newActivePageName) { currentActiveTabName = newActivePageName; Array.from(tabButtonContainer.children).forEach(btn => { const isActive = btn.dataset.pageName === currentActiveTabName; btn.classList.toggle('active', isActive); btn.setAttribute('aria-selected', isActive ? 'true' : 'false'); btn.setAttribute('tabindex', isActive ? '0' : '-1'); }); }
    function _handleTabSelect(pageName) { _updateTabStates(pageName); if (typeof opts.onTabSelect === 'function') opts.onTabSelect(pageName); }
    function _handleTabClose(pageName) { if (typeof opts.onTabClose === 'function') opts.onTabClose(pageName); }
    tabBar.addTab = (tabData, makeActive = false) => { const tabButton = createAdwTabButton({ label: tabData.label, iconHTML: tabData.iconHTML, pageName: tabData.pageName, isClosable: tabData.isClosable, isActive: makeActive || (tabData.pageName === currentActiveTabName), onSelect: _handleTabSelect, onClose: _handleTabClose }); tabButtonContainer.appendChild(tabButton); if (makeActive) _updateTabStates(tabData.pageName); else if (!currentActiveTabName && tabButtonContainer.children.length === 1) { _updateTabStates(tabData.pageName); if (typeof opts.onTabSelect === 'function') opts.onTabSelect(tabData.pageName); } return tabButton; };
    tabBar.removeTab = (pageName) => { const tabButtonToRemove = tabButtonContainer.querySelector(`.adw-tab-button[data-page-name="${pageName}"]`); if (tabButtonToRemove) { const wasActive = tabButtonToRemove.classList.contains('active'); const siblings = Array.from(tabButtonContainer.children); const index = siblings.indexOf(tabButtonToRemove); tabButtonToRemove.remove(); if (wasActive && tabButtonContainer.children.length > 0) { const newActiveIndex = Math.max(0, index -1); const newActiveButton = tabButtonContainer.children[newActiveIndex]; if(newActiveButton) _handleTabSelect(newActiveButton.dataset.pageName); } else if (tabButtonContainer.children.length === 0) currentActiveTabName = null; }};
    tabBar.setActiveTab = (pageName) => { _updateTabStates(pageName); };
    (opts.tabsData || []).forEach(tabData => { tabBar.addTab(tabData, tabData.pageName === currentActiveTabName); });
    if(currentActiveTabName && tabButtonContainer.children.length > 0) _updateTabStates(currentActiveTabName); else if (!currentActiveTabName && tabButtonContainer.children.length > 0) { const firstTabName = tabButtonContainer.children[0].dataset.pageName; _updateTabStates(firstTabName); }
    if (opts.showNewTabButton) { const newTabButton = createAdwButton('', { icon: '<svg viewBox="0 0 16 16" fill="currentColor" style="width:1em;height:1em;"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>', flat: true, isCircular: true, ariaLabel: 'New tab', onClick: () => { if (typeof opts.onNewTabRequested === 'function') opts.onNewTabRequested(); }}); newTabButton.classList.add('adw-tab-bar-new-tab-button'); tabBar.appendChild(newTabButton); }
    tabBar.addEventListener('keydown', (e) => { /* ... (keyboard nav) ... */ });
    return tabBar;
}
export class AdwTabBar extends HTMLElement {
    static get observedAttributes() { return ['active-tab-name', 'show-new-tab-button']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._tabBarElement = null; this._slotObserver = new MutationObserver(() => this._rebuildTabsFromSlotted());}
    connectedCallback() { this._render(); this._slotObserver.observe(this, { childList: true }); this._rebuildTabsFromSlotted(); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue) return; if (name === 'active-tab-name' && this._tabBarElement) { this._tabBarElement.setActiveTab(newValue); Array.from(this.children).forEach(child => { if (child.matches('adw-tab-button')) child.active = child.getAttribute('page-name') === newValue; }); } else if (name === 'show-new-tab-button') { this._render(); this._rebuildTabsFromSlotted(); }}
    _rebuildTabsFromSlotted() { if (!this._tabBarElement) return; const tabButtonContainer = this._tabBarElement.querySelector('.adw-tab-bar-button-container'); if(tabButtonContainer) { while(tabButtonContainer.firstChild) tabButtonContainer.removeChild(tabButtonContainer.firstChild); } const tabsData = Array.from(this.children).filter(child => child.matches('adw-tab-button')).map(tb => ({ label: tb.getAttribute('label') || tb.textContent.trim(), iconHTML: tb.hasAttribute('icon') ? tb.getAttribute('icon') : (tb.querySelector('[slot="icon"]') ? tb.querySelector('[slot="icon"]').innerHTML : undefined), pageName: tb.getAttribute('page-name'), isClosable: !tb.hasAttribute('closable') || tb.getAttribute('closable') !== 'false', })); tabsData.forEach(td => { if(td.pageName) this._tabBarElement.addTab(td, td.pageName === this.getAttribute('active-tab-name')); }); const activeName = this.getAttribute('active-tab-name'); if (activeName) this._tabBarElement.setActiveTab(activeName); else if (tabsData.length > 0 && tabsData[0].pageName) this._tabBarElement.setActiveTab(tabsData[0].pageName); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const options = { activeTabName: this.getAttribute('active-tab-name') || undefined, showNewTabButton: this.hasAttribute('show-new-tab-button'),
            onTabSelect: (pageName) => { if (this.getAttribute('active-tab-name') !== pageName) this.setAttribute('active-tab-name', pageName); this.dispatchEvent(new CustomEvent('tab-select', { detail: { pageName }, bubbles: true, composed: true })); },
            onTabClose: (pageName) => { this.dispatchEvent(new CustomEvent('tab-close', { detail: { pageName }, bubbles: true, composed: true })); },
            onNewTabRequested: () => { this.dispatchEvent(new CustomEvent('new-tab-requested', { bubbles: true, composed: true })); }
        };
        const factory = (typeof Adw !== 'undefined' && Adw.createTabBar) ? Adw.createTabBar : createAdwTabBar;
        this._tabBarElement = factory(options); this.shadowRoot.appendChild(this._tabBarElement);
    }
    addSlottedTab(tabButtonElement) { if (tabButtonElement && tabButtonElement.matches('adw-tab-button')) this.appendChild(tabButtonElement); else console.error("AdwTabBar.addSlottedTab: Argument must be an adw-tab-button element."); }
    removeSlottedTab(pageName) { const slottedTab = this.querySelector(`adw-tab-button[page-name="${pageName}"]`); if (slottedTab) slottedTab.remove(); }
    setActiveTab(pageName) { this.setAttribute('active-tab-name', pageName); }
}

/** Creates an AdwTabPage container. */
export function createAdwTabPage(options = {}) {
    const opts = options || {}; if (!opts.pageName) { console.error("AdwTabPage: options.pageName is required."); return document.createElement('div'); }
    const tabPage = document.createElement('div'); tabPage.classList.add('adw-tab-page'); tabPage.dataset.pageName = opts.pageName; tabPage.setAttribute('role', 'tabpanel'); tabPage.setAttribute('tabindex', '0'); tabPage.style.display = 'none';
    if (opts.content instanceof Node) {
        tabPage.appendChild(opts.content);
    } else if (typeof opts.content === 'string') {
        tabPage.textContent = opts.content;
    } else if (opts.content) {
        console.warn("AdwTabPage: options.content should be a Node or string.");
    }
    return tabPage;
}
export class AdwTabPage extends HTMLElement {
    static get observedAttributes() { return ['page-name', 'label']; }
    constructor() { super(); this.attachShadow({mode:'open'}); const styleLink = document.createElement('link'); styleLink.rel='stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ const slot = document.createElement('slot'); this._wrapper = document.createElement('div'); this._wrapper.classList.add('adw-tab-page'); this._wrapper.setAttribute('role', 'tabpanel'); this._wrapper.appendChild(slot); this.shadowRoot.append(styleLink, this._wrapper);}
    connectedCallback(){ if(!this.hasAttribute('page-name')) { const generatedName = `page-${[...this.parentElement.children].indexOf(this)}`; this.setAttribute('page-name', generatedName); console.warn(`adw-tab-page missing 'page-name', assigned '${generatedName}'.`);} if(this.id) this._wrapper.setAttribute('aria-labelledby', this.id + '-tab');}
}

/** Creates an AdwTabView element */
export function createAdwTabView(options = {}) {
    const opts = options || {}; const tabView = document.createElement('div'); tabView.classList.add('adw-tab-view');
    const pagesContainer = document.createElement('div'); pagesContainer.classList.add('adw-tab-view-pages-container');
    let pageMap = new Map(); let currentActivePageName = opts.activePageName || null;
    const tabBar = createAdwTabBar({ activeTabName: currentActivePageName, showNewTabButton: opts.showNewTabButton, onNewTabRequested: () => { if (typeof opts.onNewTabRequested === 'function') opts.onNewTabRequested(); }, onTabSelect: (pageName) => { tabView.setActivePage(pageName, false); }, onTabClose: (pageName) => { if (typeof opts.onBeforePageClose === 'function') { if (opts.onBeforePageClose(pageName) === false) return; } tabView.removePage(pageName); if (typeof opts.onPageClosed === 'function') opts.onPageClosed(pageName); }});
    tabView.appendChild(tabBar); tabView.appendChild(pagesContainer);
    tabView.addPage = (pageData, makeActive = false) => { if (!pageData || !pageData.name || !pageData.title || !pageData.content) { console.error("AdwTabView.addPage: Invalid pageData.", pageData); return; } if (pageMap.has(pageData.name)) { tabView.setActivePage(pageData.name); return; } const tabPage = createAdwTabPage({ content: pageData.content, pageName: pageData.name }); pagesContainer.appendChild(tabPage); const tabButton = tabBar.addTab({ label: pageData.title, pageName: pageData.name, isClosable: pageData.isClosable, iconHTML: pageData.iconHTML }, makeActive); const buttonId = tabButton.id || adwGenerateId('adw-tab-btn'); const panelId = tabPage.id || adwGenerateId('adw-tab-panel'); tabButton.id = buttonId; tabPage.id = panelId; tabButton.setAttribute('aria-controls', panelId); tabPage.setAttribute('aria-labelledby', buttonId); pageMap.set(pageData.name, { button: tabButton, page: tabPage }); if (makeActive || pageMap.size === 1) tabView.setActivePage(pageData.name); else if(currentActivePageName) tabBar.setActiveTab(currentActivePageName); };
    tabView.removePage = (pageName) => { if (pageMap.has(pageName)) { const { page } = pageMap.get(pageName); page.remove(); pageMap.delete(pageName); tabBar.removeTab(pageName); const activeTabButton = tabBar.querySelector('.adw-tab-button.active'); const newActivePageName = activeTabButton ? activeTabButton.dataset.pageName : null; if (newActivePageName !== currentActivePageName) { currentActivePageName = newActivePageName; pageMap.forEach((p, name) => p.page.style.display = (name === currentActivePageName) ? '' : 'none'); if (typeof opts.onPageChanged === 'function' && currentActivePageName) opts.onPageChanged(currentActivePageName); } else if (!newActivePageName && currentActivePageName) currentActivePageName = null; }};
    tabView.setActivePage = (pageName, fireEvent = true) => { if (pageMap.has(pageName)) { const oldActivePageName = currentActivePageName; currentActivePageName = pageName; tabBar.setActiveTab(pageName); pageMap.forEach((p, name) => p.page.style.display = (name === pageName) ? '' : 'none'); if (fireEvent && typeof opts.onPageChanged === 'function' && oldActivePageName !== pageName) opts.onPageChanged(pageName); }};
    tabView.getActivePageName = () => currentActivePageName;
    (opts.pages || []).forEach(pageData => tabView.addPage(pageData, pageData.name === currentActivePageName));
    if (currentActivePageName && !pageMap.has(currentActivePageName) && pageMap.size > 0) currentActivePageName = pageMap.keys().next().value; if (!currentActivePageName && pageMap.size > 0) currentActivePageName = pageMap.keys().next().value; if (currentActivePageName) tabView.setActivePage(currentActivePageName, true);
    return tabView;
}
export class AdwTabView extends HTMLElement {
    static get observedAttributes() { return ['active-page-name', 'show-new-tab-button']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._tabViewFactoryInstance = null; this._pagesSlot = document.createElement('slot'); this.shadowRoot.appendChild(this._pagesSlot);  this._slotObserver = new MutationObserver(() => this._rebuildFactoryPages()); }
    connectedCallback() {  this._renderFactoryInstance(); this._slotObserver.observe(this, { childList: true, attributes: true, subtree: false }); this._rebuildFactoryPages(); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue === newValue || !this._tabViewFactoryInstance) return; if (name === 'active-page-name') { this._tabViewFactoryInstance.setActivePage(newValue); this._updateSlottedPageDisplay(newValue); } else if (name === 'show-new-tab-button') { this._renderFactoryInstance(); this._rebuildFactoryPages(); }}
    _updateSlottedPageDisplay(activePageName) { const slottedElements = this._pagesSlot.assignedNodes({ flatten: true }); slottedElements.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-tab-page') || node.dataset.adwTabPage)) { const isPageActive = node.getAttribute('page-name') === activePageName; node.style.display = isPageActive ? '' : 'none'; if(isPageActive) node.setAttribute('active',''); else node.removeAttribute('active'); }});}
    _rebuildFactoryPages() { if (!this._tabViewFactoryInstance) this._renderFactoryInstance(); const slottedElements = this._pagesSlot.assignedNodes({ flatten: true }); const pagesDataForFactory = []; slottedElements.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-tab-page') || node.dataset.adwTabPage)) { let pageName = node.getAttribute('page-name'); if (!pageName) { pageName = adwGenerateId('dyn-page'); node.setAttribute('page-name', pageName); } pagesDataForFactory.push({ name: pageName, title: node.getAttribute('label') || pageName, content: node, isClosable: !node.hasAttribute('non-closable') }); }}); this._renderFactoryInstance(pagesDataForFactory, this.getAttribute('active-page-name')); }
    _renderFactoryInstance(pagesData = [], activePageNameOverride = null) { if (this._tabViewFactoryInstance && this._tabViewFactoryInstance.parentElement) this._tabViewFactoryInstance.remove(); const effectiveActivePageName = activePageNameOverride || this.getAttribute('active-page-name'); const options = { pages: pagesData, activePageName: effectiveActivePageName || undefined, showNewTabButton: this.hasAttribute('show-new-tab-button'), onNewTabRequested: () => { this.dispatchEvent(new CustomEvent('new-tab-requested', {bubbles: true, composed: true})); }, onPageChanged: (pageName) => { if(this.getAttribute('active-page-name') !== pageName) this.setAttribute('active-page-name', pageName); else this._updateSlottedPageDisplay(pageName); this.dispatchEvent(new CustomEvent('page-changed', {detail: {pageName}, bubbles:true, composed: true})); }, onBeforePageClose: (pageName) => { const event = new CustomEvent('before-page-close', {detail: {pageName}, cancelable: true, bubbles:true, composed: true}); this.dispatchEvent(event); return !event.defaultPrevented; }, onPageClosed: (pageName) => { const pageElement = this.querySelector(`adw-tab-page[page-name="${pageName}"], [data-adw-tab-page][page-name="${pageName}"]`); if (pageElement) pageElement.remove(); this.dispatchEvent(new CustomEvent('page-closed', {detail: {pageName}, bubbles:true, composed: true})); }}; const factory = (typeof Adw !== 'undefined' && Adw.createTabView) ? Adw.createTabView : createAdwTabView; this._tabViewFactoryInstance = factory(options); this.shadowRoot.insertBefore(this._tabViewFactoryInstance, this._pagesSlot); if (this._tabViewFactoryInstance.getActivePageName()) this._updateSlottedPageDisplay(this._tabViewFactoryInstance.getActivePageName()); else if (pagesData.length > 0) this._updateSlottedPageDisplay(pagesData[0].name); }
    addPage(pageElement, makeActive = false) { if (pageElement && (pageElement.matches('adw-tab-page') || pageElement.dataset.adwTabPage)) { let pageName = pageElement.getAttribute('page-name'); if(!pageName){ pageName = adwGenerateId('dyn-page-added'); pageElement.setAttribute('page-name', pageName); } this.appendChild(pageElement); if (makeActive) this.setActivePage(pageName); } else console.error("AdwTabView.addPage: argument must be an adw-tab-page or [data-adw-tab-page] element."); }
    removePage(pageName) { if (this._tabViewFactoryInstance) this._tabViewFactoryInstance.removePage(pageName); }
    setActivePage(pageName) { this.setAttribute('active-page-name', pageName); }
    getActivePageName() { return this.getAttribute('active-page-name'); }
}

/** Creates an AdwNavigationView element. */
export function createAdwNavigationView(options = {}) {
    const opts = options || {}; const navigationView = document.createElement('div'); navigationView.classList.add('adw-navigation-view');
    const headerBar = createAdwHeaderBar({ title: "" }); navigationView.appendChild(headerBar);
    const pagesContainer = document.createElement('div'); pagesContainer.classList.add('adw-navigation-view-pages-container'); navigationView.appendChild(pagesContainer);
    const pageStack = [];
    function _updateHeaderBar() {
        if (pageStack.length === 0) { headerBar.updateTitleSubtitle(); headerBar.setStartWidgets([]); headerBar.setEndWidgets([]); return; }
        const currentPageData = pageStack[pageStack.length - 1]; const headerData = currentPageData.header || {}; headerBar.updateTitleSubtitle(headerData.title || currentPageData.name, headerData.subtitle);
        const startWidgets = []; if (pageStack.length > 1) { const backButton = createAdwButton('', { iconName: 'actions/go-previous-symbolic', flat: true, ariaLabel: 'Back', onClick: () => navigationView.pop() }); startWidgets.push(backButton); } // Using iconName and ariaLabel
        if (headerData.start && Array.isArray(headerData.start)) startWidgets.push(...headerData.start);
        const startBox = headerBar.querySelector('.adw-header-bar-start'); if(startBox) { while(startBox.firstChild) startBox.removeChild(startBox.firstChild); startWidgets.forEach(w => startBox.appendChild(w)); }
        const endBox = headerBar.querySelector('.adw-header-bar-end'); if(endBox) { while(endBox.firstChild) endBox.removeChild(endBox.firstChild); (headerData.end || []).forEach(w => endBox.appendChild(w)); }
    }
    if(!headerBar.updateTitleSubtitle) headerBar.updateTitleSubtitle = (title, subtitle) => { const t=headerBar.querySelector('.adw-header-bar-title'); if(t)t.textContent=title||''; const s=headerBar.querySelector('.adw-header-bar-subtitle'); if(s){s.textContent=subtitle||''; s.style.display=subtitle?'':'none';} else if(subtitle&&t&&t.parentElement){const ns=document.createElement("h2");ns.classList.add("adw-header-bar-subtitle");ns.textContent=subtitle;t.parentElement.appendChild(ns);}};

    navigationView.push = (pageData) => {
        if (!pageData || !pageData.name || !pageData.element) return; if (pageStack.length > 0) { const cp = pageStack[pageStack.length - 1]; cp.element.classList.remove('adw-navigation-page-active'); cp.element.classList.add('adw-navigation-page-exiting-left'); }
        pageData.element.classList.add('adw-navigation-page'); pageData.element.style.display = ''; pagesContainer.appendChild(pageData.element); void pageData.element.offsetWidth; pageData.element.classList.add('adw-navigation-page-entering-right'); pageData.element.classList.add('adw-navigation-page-active');
        pageStack.push(pageData); _updateHeaderBar(); setTimeout(() => { if (pageStack.length > 1) { const pp = pageStack[pageStack.length - 2]; if(pp) pp.element.classList.remove('adw-navigation-page-exiting-left');} pageData.element.classList.remove('adw-navigation-page-entering-right'); }, 300); navigationView.dispatchEvent(new CustomEvent('pushed', {detail: {pageName: pageData.name}}));
    };
    navigationView.pop = () => {
        if (pageStack.length <= 1) return; const poppedPageData = pageStack.pop(); poppedPageData.element.classList.remove('adw-navigation-page-active'); poppedPageData.element.classList.add('adw-navigation-page-exiting-right');
        if (pageStack.length > 0) { const newCp = pageStack[pageStack.length - 1]; newCp.element.style.display = ''; newCp.element.classList.remove('adw-navigation-page-exiting-left'); newCp.element.classList.add('adw-navigation-page-entering-left'); newCp.element.classList.add('adw-navigation-page-active'); setTimeout(() => { poppedPageData.element.remove(); newCp.element.classList.remove('adw-navigation-page-entering-left'); }, 300); }
        else { setTimeout(() => { poppedPageData.element.remove(); }, 300); } _updateHeaderBar(); navigationView.dispatchEvent(new CustomEvent('popped', {detail: {pageName: poppedPageData.name}}));
    };
    navigationView.getVisiblePageName = () => pageStack.length > 0 ? pageStack[pageStack.length - 1].name : null;
    (opts.initialPages || []).forEach((pageData, index) => { pageData.element.classList.add('adw-navigation-page'); pagesContainer.appendChild(pageData.element); pageStack.push(pageData); if (index === 0) { pageData.element.classList.add('adw-navigation-page-active'); pageData.element.style.display = ''; } else pageData.element.style.display = 'none'; }); if(pageStack.length > 0) _updateHeaderBar();
    return navigationView;
}
export class AdwNavigationView extends HTMLElement {
    static get observedAttributes() { return []; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._navigationViewFactoryInstance = null; this._pagesSlot = document.createElement('slot'); this.shadowRoot.appendChild(this._pagesSlot);  this._slotObserver = new MutationObserver(() => this._rebuildFactoryPagesFromSlotted()); }
    connectedCallback() {  this._renderFactoryInstance(); this._slotObserver.observe(this, { childList: true, attributes: true, subtree: true }); this._rebuildFactoryPagesFromSlotted(); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    _getPageDataFromElement(element) { if (!element || !element.matches || (!element.matches('adw-navigation-page, [data-page-name]') && !element.dataset.adwNavigationPage )) return null; const pageName = element.getAttribute('data-page-name') || element.getAttribute('page-name') || adwGenerateId('nav-page'); if (!element.hasAttribute('data-page-name') && !element.hasAttribute('page-name')) element.setAttribute('data-page-name', pageName); const header = {}; const titleEl = element.querySelector('[slot="header-title"]'); if (titleEl) header.title = titleEl.textContent; const subtitleEl = element.querySelector('[slot="header-subtitle"]'); if (subtitleEl) header.subtitle = subtitleEl.textContent; const startElements = element.querySelectorAll('[slot="header-start"] > *'); if (startElements.length > 0) header.start = Array.from(startElements).map(el => el.cloneNode(true)); const endElements = element.querySelectorAll('[slot="header-end"] > *'); if (endElements.length > 0) header.end = Array.from(endElements).map(el => el.cloneNode(true)); return { name: pageName, element: element, header: Object.keys(header).length > 0 ? header : undefined }; }
    _rebuildFactoryPagesFromSlotted() { if (!this._navigationViewFactoryInstance) this._renderFactoryInstance(); const initialPagesData = []; const slottedElements = this._pagesSlot.assignedNodes({ flatten: true }); slottedElements.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) { const pageData = this._getPageDataFromElement(node); if(pageData) initialPagesData.push(pageData); }}); this._renderFactoryInstance(initialPagesData); }
    _renderFactoryInstance(initialPagesData = []) { if (this._navigationViewFactoryInstance && this._navigationViewFactoryInstance.parentElement) this._navigationViewFactoryInstance.remove(); const options = { initialPages: initialPagesData, }; const factory = (typeof Adw !== 'undefined' && Adw.createNavigationView) ? Adw.createNavigationView : createAdwNavigationView; this._navigationViewFactoryInstance = factory(options); this.shadowRoot.insertBefore(this._navigationViewFactoryInstance, this._pagesSlot); this._navigationViewFactoryInstance.addEventListener('pushed', (e) => { this.dispatchEvent(new CustomEvent('pushed', { detail: e.detail })); this._updateSlottedPageDisplay(); }); this._navigationViewFactoryInstance.addEventListener('popped', (e) => { this.dispatchEvent(new CustomEvent('popped', { detail: e.detail })); this._updateSlottedPageDisplay(); }); this._updateSlottedPageDisplay(); }
    _updateSlottedPageDisplay() { if(!this._navigationViewFactoryInstance) return; const visiblePageName = this._navigationViewFactoryInstance.getVisiblePageName(); const slottedElements = this._pagesSlot.assignedNodes({ flatten: true }); slottedElements.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE && (node.matches('adw-navigation-page, [data-page-name]') || node.dataset.adwNavigationPage)) { if (node.getAttribute('data-page-name') === visiblePageName || node.getAttribute('page-name') === visiblePageName) { /* factory handles display */ } else { /* factory handles display */ }}});}
    pop() { if (this._navigationViewFactoryInstance) this._navigationViewFactoryInstance.pop(); }
    getVisiblePageName(){ if(this._navigationViewFactoryInstance) return this._navigationViewFactoryInstance.getVisiblePageName(); return null; }
    push(pageArg) {
        let pageDataToPush = null;
        if (typeof pageArg === 'string') {
            const pageName = pageArg;
            const element = this.querySelector(`[data-page-name="${pageName}"], [page-name="${pageName}"]`);
            if (element) {
                pageDataToPush = this._getPageDataFromElement(element);
            } else {
                console.error(`AdwNavigationView: Page with name "${pageName}" not found in light DOM.`);
                return;
            }
        } else if (pageArg instanceof HTMLElement) {
            pageDataToPush = this._getPageDataFromElement(pageArg);
            if (pageDataToPush && (!pageArg.parentElement || pageArg.parentElement !== this)) {
                let alreadySlotted = false;
                const slot = this.shadowRoot.querySelector('slot');
                if (slot) {
                    const assignedNodes = slot.assignedNodes({ flatten: true });
                    if (assignedNodes.includes(pageArg)) {
                        alreadySlotted = true;
                    }
                }
                if (!alreadySlotted) {
                    this.appendChild(pageArg);
                }
            }
        } else if (typeof pageArg === 'object' && pageArg !== null && pageArg.name && pageArg.element instanceof HTMLElement) {
            pageDataToPush = pageArg;
            if (!pageDataToPush.element.parentElement || pageDataToPush.element.parentElement !== this) {
                 let alreadySlotted = false;
                 const slot = this.shadowRoot.querySelector('slot');
                 if (slot) {
                     const assignedNodes = slot.assignedNodes({ flatten: true });
                     if (assignedNodes.includes(pageDataToPush.element)) {
                         alreadySlotted = true;
                     }
                 }
                 if (!alreadySlotted) {
                    this.appendChild(pageDataToPush.element);
                 }
            }
        } else {
            console.error(`AdwNavigationView.push: Argument must be page name (string), HTMLElement, or a pageData object {name, element, header?}. Received type: ${typeof pageArg}, value:`, pageArg);
            return;
        }

        if (pageDataToPush && this._navigationViewFactoryInstance) {
            this._navigationViewFactoryInstance.push(pageDataToPush);
        } else if (!pageDataToPush) {
            console.error("AdwNavigationView.push: Could not derive valid page data from argument.", pageArg);
        } else if (!this._navigationViewFactoryInstance) {
            console.error("AdwNavigationView.push: Factory instance not available.");
        }
    }
}

/** Creates an AdwToolbarView layout container. */
export function createAdwToolbarView(options = {}) {
    const opts = options || {}; const toolbarView = document.createElement('div'); toolbarView.classList.add('adw-toolbar-view');
    const topBarSlot = document.createElement('div'); topBarSlot.classList.add('adw-toolbar-view-top-bar'); if (opts.topBar instanceof Node) topBarSlot.appendChild(opts.topBar); if (opts.topBarRevealed !== false) topBarSlot.classList.add('revealed'); topBarSlot.style.display = (opts.topBarRevealed !== false && (opts.topBar || topBarSlot.textContent.trim() !== '')) ? '' : 'none';
    const contentSlot = document.createElement('div'); contentSlot.classList.add('adw-toolbar-view-content'); if (opts.content instanceof Node) contentSlot.appendChild(opts.content);
    const bottomBarSlot = document.createElement('div'); bottomBarSlot.classList.add('adw-toolbar-view-bottom-bar'); if (opts.bottomBar instanceof Node) bottomBarSlot.appendChild(opts.bottomBar); if (opts.bottomBarRevealed !== false) bottomBarSlot.classList.add('revealed'); bottomBarSlot.style.display = (opts.bottomBarRevealed !== false && (opts.bottomBar || bottomBarSlot.textContent.trim() !== '')) ? '' : 'none';
    toolbarView.appendChild(topBarSlot); toolbarView.appendChild(contentSlot); toolbarView.appendChild(bottomBarSlot);
    toolbarView.setTopBar = (element) => { while(topBarSlot.firstChild) topBarSlot.removeChild(topBarSlot.firstChild); if (element instanceof Node) { topBarSlot.appendChild(element); topBarSlot.style.display = opts.topBarRevealed !== false ? '' : 'none'; if(opts.topBarRevealed !== false) topBarSlot.classList.add('revealed'); else topBarSlot.classList.remove('revealed'); } else { topBarSlot.style.display = 'none'; topBarSlot.classList.remove('revealed'); }};
    toolbarView.setBottomBar = (element) => { while(bottomBarSlot.firstChild) bottomBarSlot.removeChild(bottomBarSlot.firstChild); if (element instanceof Node) { bottomBarSlot.appendChild(element); bottomBarSlot.style.display = opts.bottomBarRevealed !== false ? '' : 'none'; if(opts.bottomBarRevealed !== false) bottomBarSlot.classList.add('revealed'); else bottomBarSlot.classList.remove('revealed'); } else { bottomBarSlot.style.display = 'none'; bottomBarSlot.classList.remove('revealed'); }};
    toolbarView.showTopBar = () => { opts.topBarRevealed = true; if (topBarSlot.firstChild || topBarSlot.textContent.trim() !== '') { topBarSlot.style.display = ''; topBarSlot.classList.add('revealed'); }};
    toolbarView.hideTopBar = () => { opts.topBarRevealed = false; topBarSlot.style.display = 'none'; topBarSlot.classList.remove('revealed'); };
    toolbarView.showBottomBar = () => { opts.bottomBarRevealed = true; if (bottomBarSlot.firstChild || bottomBarSlot.textContent.trim() !== '') { bottomBarSlot.style.display = ''; bottomBarSlot.classList.add('revealed'); }};
    toolbarView.hideBottomBar = () => { opts.bottomBarRevealed = false; bottomBarSlot.style.display = 'none'; bottomBarSlot.classList.remove('revealed'); };
    Object.defineProperty(toolbarView, 'topBarRevealed', { get: () => opts.topBarRevealed !== false && topBarSlot.style.display !== 'none', set: (value) => value ? toolbarView.showTopBar() : toolbarView.hideTopBar() });
    Object.defineProperty(toolbarView, 'bottomBarRevealed', { get: () => opts.bottomBarRevealed !== false && bottomBarSlot.style.display !== 'none', set: (value) => value ? toolbarView.showBottomBar() : toolbarView.hideBottomBar() });
    return toolbarView;
}
export class AdwToolbarView extends HTMLElement {
    static get observedAttributes() { return ['top-bar-revealed', 'bottom-bar-revealed']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this._toolbarViewElement = document.createElement('div'); this._toolbarViewElement.classList.add('adw-toolbar-view'); this._topBarSlotContainer = document.createElement('div'); this._topBarSlotContainer.classList.add('adw-toolbar-view-top-bar'); this._topBarSlot = document.createElement('slot'); this._topBarSlot.name = 'top-bar'; this._topBarSlotContainer.appendChild(this._topBarSlot); this._contentSlotContainer = document.createElement('div'); this._contentSlotContainer.classList.add('adw-toolbar-view-content'); this._contentSlot = document.createElement('slot'); this._contentSlotContainer.appendChild(this._contentSlot); this._bottomBarSlotContainer = document.createElement('div'); this._bottomBarSlotContainer.classList.add('adw-toolbar-view-bottom-bar'); this._bottomBarSlot = document.createElement('slot'); this._bottomBarSlot.name = 'bottom-bar'; this._bottomBarSlotContainer.appendChild(this._bottomBarSlot); this._toolbarViewElement.append(this._topBarSlotContainer, this._contentSlotContainer, this._bottomBarSlotContainer); this.shadowRoot.append(styleLink, this._toolbarViewElement); this._slotObserver = new MutationObserver(() => this._updateBarVisibility()); }
    connectedCallback() { this._updateBarVisibility(); this._slotObserver.observe(this._topBarSlot, { childList: true, subtree: true }); this._slotObserver.observe(this._bottomBarSlot, { childList: true, subtree: true }); }
    disconnectedCallback() { this._slotObserver.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._updateBarVisibility(); }
    _hasSlottedContent(slot) { return slot.assignedNodes({flatten: true}).some(node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')); }
    _updateBarVisibility() { const topBarRevealedByAttr = !this.hasAttribute('top-bar-revealed') || this.getAttribute('top-bar-revealed') !== 'false'; const bottomBarRevealedByAttr = !this.hasAttribute('bottom-bar-revealed') || this.getAttribute('bottom-bar-revealed') !== 'false'; const hasTopContent = this._hasSlottedContent(this._topBarSlot); const hasBottomContent = this._hasSlottedContent(this._bottomBarSlot); const showTopBar = topBarRevealedByAttr && hasTopContent; const showBottomBar = bottomBarRevealedByAttr && hasBottomContent; this._topBarSlotContainer.style.display = showTopBar ? '' : 'none'; this._topBarSlotContainer.classList.toggle('revealed', showTopBar); this._bottomBarSlotContainer.style.display = showBottomBar ? '' : 'none'; this._bottomBarSlotContainer.classList.toggle('revealed', showBottomBar); }
    showTopBar() { this.setAttribute('top-bar-revealed', ''); } hideTopBar() { this.setAttribute('top-bar-revealed', 'false'); }
    showBottomBar() { this.setAttribute('bottom-bar-revealed', ''); } hideBottomBar() { this.setAttribute('bottom-bar-revealed', 'false'); }
}

/** Creates an AdwCarousel widget. */
export function createAdwCarousel(options = {}) {
    const opts = Object.assign({ showIndicators: true, showNavButtons: false, loop: true, autoplay: false, autoplayInterval: 5000, indicatorStyle: 'dots' }, options);
    const carousel = document.createElement('div'); carousel.classList.add('adw-carousel');
    carousel.setAttribute('role', 'region'); carousel.setAttribute('aria-roledescription', 'carousel');
    if (opts.loop) carousel.classList.add('looping'); if (opts.autoplay) carousel.classList.add('autoplay'); if (opts.indicatorStyle === 'thumbnails') carousel.classList.add('thumbnail-indicators');
    const contentArea = document.createElement('div'); contentArea.classList.add('adw-carousel-content-area'); carousel.appendChild(contentArea);
    let slideElements = []; let slideThumbnails = [];
    (opts.slides || []).forEach((slideInput, index) => {
        const slide = document.createElement('div'); slide.classList.add('adw-carousel-slide');
        slide.setAttribute('role', 'group'); // Or tabpanel
        slide.setAttribute('aria-label', `Slide ${index + 1} of ${(opts.slides || []).length}`);
        slide.id = adwGenerateId('adw-carousel-slide');
        if (slideInput instanceof HTMLElement) { slide.appendChild(slideInput); slideThumbnails.push(null); }
        else if (typeof slideInput === 'object' && slideInput.content instanceof HTMLElement) { slide.appendChild(slideInput.content); slideThumbnails.push(slideInput.thumbnail || null); }
        else { console.warn("AdwCarousel: Invalid slide data", slideInput); slide.textContent="Invalid Slide"; }
        contentArea.appendChild(slide); slideElements.push(slide);
    });
    if (slideElements.length === 0) { const emptySlide = document.createElement('div'); emptySlide.classList.add('adw-carousel-slide'); emptySlide.textContent = "No slides"; emptySlide.setAttribute('role','group'); emptySlide.setAttribute('aria-label', 'Slide 1 of 1'); contentArea.appendChild(emptySlide); slideElements.push(emptySlide); }
    let currentIndex = 0; let autoplayTimer = null; const indicatorsContainer = opts.showIndicators ? document.createElement('div') : null;
    if (indicatorsContainer) { indicatorsContainer.classList.add('adw-carousel-indicators'); carousel.appendChild(indicatorsContainer); }
    function updateIndicators() { if (!indicatorsContainer) return; while(indicatorsContainer.firstChild) indicatorsContainer.removeChild(indicatorsContainer.firstChild); slideElements.forEach((slideEl, i) => { const indicator = document.createElement('button'); indicator.classList.add('adw-carousel-indicator'); indicator.setAttribute('aria-label', `Go to slide ${i + 1}`); if (i === currentIndex) { indicator.classList.add('active'); indicator.setAttribute('aria-current', 'true'); } if (opts.indicatorStyle === 'thumbnails' && slideThumbnails[i]) { indicator.style.backgroundImage = `url('${slideThumbnails[i]}')`; } indicator.addEventListener('click', () => { goToSlide(i); resetAutoplay(); }); indicatorsContainer.appendChild(indicator); });}
    function goToSlide(index, isAutoplayNext = false) { if (!opts.loop && !isAutoplayNext) { if (index < 0 || index >= slideElements.length) { if (index < 0) index = 0; if (index >= slideElements.length) index = slideElements.length -1; }} if (opts.loop) { if (index < 0) index = slideElements.length - 1; else if (index >= slideElements.length) index = 0; } else { index = Math.max(0, Math.min(index, slideElements.length - 1)); } currentIndex = index; const offset = -currentIndex * 100; contentArea.style.transform = `translateX(${offset}%)`; updateIndicators(); if(opts.showNavButtons && !opts.loop){ prevButton.disabled = currentIndex === 0; nextButton.disabled = currentIndex === slideElements.length - 1; } carousel.dispatchEvent(new CustomEvent('slide-changed', { detail: { currentIndex } })); }
    let prevButton, nextButton;
    if (opts.showNavButtons) {
        prevButton = createAdwButton('', {
            icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06z"/></svg>',
            onClick: () => { goToSlide(currentIndex - 1); resetAutoplay(); },
            isCircular: true,
            flat: true,
            ariaLabel: 'Previous slide' // This was already correct
        });
        prevButton.classList.add('adw-carousel-nav-button', 'prev');
        carousel.appendChild(prevButton);

        nextButton = createAdwButton('', {
            icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z"/></svg>',
            onClick: () => { goToSlide(currentIndex + 1); resetAutoplay(); },
            isCircular: true,
            flat: true,
            ariaLabel: 'Next slide' // This was also already correct
        });
        nextButton.classList.add('adw-carousel-nav-button', 'next');
        carousel.appendChild(nextButton);
        if(!opts.loop){
            prevButton.disabled = currentIndex === 0;
            nextButton.disabled = currentIndex === slideElements.length - 1;
        }
    }
    function startAutoplay() { if (!opts.autoplay || slideElements.length <= 1) return; stopAutoplay(); autoplayTimer = setInterval(() => { goToSlide(currentIndex + 1, true); }, opts.autoplayInterval); }
    function stopAutoplay() { clearInterval(autoplayTimer); autoplayTimer = null; }
    function resetAutoplay() { if (opts.autoplay) { stopAutoplay(); startAutoplay(); }}
    carousel.addEventListener('mouseenter', stopAutoplay); carousel.addEventListener('mouseleave', startAutoplay); carousel.addEventListener('focusin', stopAutoplay); carousel.addEventListener('focusout', startAutoplay);
    goToSlide(0); if (opts.autoplay) startAutoplay(); carousel.goTo = (index) => { goToSlide(index); resetAutoplay(); }; carousel.next = () => { goToSlide(currentIndex + 1); resetAutoplay(); }; carousel.prev = () => { goToSlide(currentIndex - 1); resetAutoplay(); }; carousel.getCurrentIndex = () => currentIndex; carousel.stopAutoplay = stopAutoplay; carousel.startAutoplay = startAutoplay;
    return carousel;
}
export class AdwCarousel extends HTMLElement {
    static get observedAttributes() { return ['show-indicators', 'show-nav-buttons', 'loop', 'autoplay', 'autoplay-interval', 'indicator-style']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._carouselInstance = null; this._slotObserver = new MutationObserver(() => this._rebuildSlides()); }
    connectedCallback() { this._render(); this._slotObserver.observe(this, { childList: true, subtree: false }); }
    disconnectedCallback() { this._slotObserver.disconnect(); if (this._carouselInstance && this._carouselInstance.stopAutoplay) this._carouselInstance.stopAutoplay(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _getSlottedSlides() { return Array.from(this.children).map(child => ({ content: child.cloneNode(true), thumbnail: child.dataset.thumbnail || undefined })); }
    _rebuildSlides() { this._render(); }
    _render() { if (this._carouselInstance && this._carouselInstance.parentElement === this.shadowRoot) this._carouselInstance.remove(); if (this._carouselInstance && this._carouselInstance.stopAutoplay) this._carouselInstance.stopAutoplay(); const options = { slides: this._getSlottedSlides(), showIndicators: !this.hasAttribute('show-indicators') || this.getAttribute('show-indicators') !== 'false', showNavButtons: this.hasAttribute('show-nav-buttons') && this.getAttribute('show-nav-buttons') !== 'false', loop: !this.hasAttribute('loop') || this.getAttribute('loop') !== 'false', autoplay: this.hasAttribute('autoplay') && this.getAttribute('autoplay') !== 'false', autoplayInterval: this.hasAttribute('autoplay-interval') ? parseInt(this.getAttribute('autoplay-interval'), 10) : 5000, indicatorStyle: this.getAttribute('indicator-style') || 'dots', }; const factory = (typeof Adw !== 'undefined' && Adw.createCarousel) ? Adw.createCarousel : createAdwCarousel; this._carouselInstance = factory(options); this.shadowRoot.appendChild(this._carouselInstance); this._carouselInstance.addEventListener('slide-changed', (e) => this.dispatchEvent(new CustomEvent('slide-changed', { detail: e.detail, bubbles: true, composed: true }))); }
    goTo(index) { if (this._carouselInstance) this._carouselInstance.goTo(index); } next() { if (this._carouselInstance) this._carouselInstance.next(); } prev() { if (this._carouselInstance) this._carouselInstance.prev(); } getCurrentIndex() { return this._carouselInstance ? this._carouselInstance.getCurrentIndex() : -1; } stopAutoplay() { if (this._carouselInstance) this._carouselInstance.stopAutoplay(); } startAutoplay() { if (this._carouselInstance) this._carouselInstance.startAutoplay(); }
}

/** Creates an AdwNavigationSplitView widget. */
export function createAdwNavigationSplitView(options = {}) {
    const opts = { showSidebar: true, canCollapse: true, collapseThreshold: 768, sidebarWidth: "300px", ...options };
    const splitView = document.createElement('div'); splitView.classList.add('adw-navigation-split-view');
    const sidebarPane = document.createElement('aside'); sidebarPane.classList.add('adw-navigation-split-view-sidebar'); sidebarPane.style.width = opts.sidebarWidth; if (opts.sidebar instanceof Node) sidebarPane.appendChild(opts.sidebar);
    const contentPane = document.createElement('div'); contentPane.classList.add('adw-navigation-split-view-content'); if (opts.content instanceof Node) contentPane.appendChild(opts.content);
    const backdrop = document.createElement('div'); backdrop.classList.add('adw-navigation-split-view-backdrop'); backdrop.addEventListener('click', () => toggleSidebar(false));
    splitView.appendChild(sidebarPane); splitView.appendChild(contentPane); splitView.appendChild(backdrop);
    let isSidebarVisible = opts.showSidebar; let isOverlayMode = false;
    function updateViewMode() { const currentWidth = splitView.offsetWidth; const newIsOverlayMode = opts.canCollapse && currentWidth < opts.collapseThreshold; if (newIsOverlayMode !== isOverlayMode) { isOverlayMode = newIsOverlayMode; splitView.classList.toggle('sidebar-overlay', isOverlayMode); if (isOverlayMode) { if(isSidebarVisible) { sidebarPane.classList.add('revealed'); backdrop.classList.add('visible'); } else { sidebarPane.classList.remove('revealed'); backdrop.classList.remove('visible');}} else { sidebarPane.classList.remove('revealed'); backdrop.classList.remove('visible'); sidebarPane.style.transform = ''; sidebarPane.style.visibility = ''; if (isSidebarVisible) sidebarPane.classList.remove('collapsed'); else sidebarPane.classList.add('collapsed');}} applySidebarVisibility(); }
    function applySidebarVisibility() { if (isOverlayMode) { sidebarPane.classList.toggle('revealed', isSidebarVisible); backdrop.classList.toggle('visible', isSidebarVisible); if(isSidebarVisible) { sidebarPane.style.transform = 'translateX(0)'; sidebarPane.style.visibility = 'visible';} else { sidebarPane.style.transform = 'translateX(-100%)'; setTimeout(() => { if(!sidebarPane.classList.contains('revealed')) sidebarPane.style.visibility = 'hidden';}, 250);}} else { sidebarPane.classList.toggle('collapsed', !isSidebarVisible); sidebarPane.style.transform = ''; sidebarPane.style.visibility = ''; backdrop.classList.remove('visible');}}
    function toggleSidebar(explicitShow) { if (!opts.canCollapse && typeof explicitShow === 'undefined') return; isSidebarVisible = (typeof explicitShow === 'boolean') ? explicitShow : !isSidebarVisible; applySidebarVisibility(); splitView.dispatchEvent(new CustomEvent('sidebar-toggled', { detail: { isVisible: isSidebarVisible, isOverlay: isOverlayMode } })); }
    let resizeObserver; if (typeof ResizeObserver !== 'undefined') resizeObserver = new ResizeObserver(updateViewMode);
    splitView.showSidebar = () => toggleSidebar(true); splitView.hideSidebar = () => toggleSidebar(false); splitView.toggleSidebar = () => toggleSidebar(); splitView.isSidebarVisible = () => isSidebarVisible; splitView.isOverlayMode = () => isOverlayMode;
    splitView.connectObserver = () => { if (resizeObserver && opts.canCollapse) { resizeObserver.observe(splitView); updateViewMode(); } else if (!opts.canCollapse) { sidebarPane.classList.remove('collapsed'); isSidebarVisible = true; applySidebarVisibility(); }};
    splitView.disconnectObserver = () => { if (resizeObserver) resizeObserver.disconnect(); };
    if (!opts.showSidebar && opts.canCollapse) sidebarPane.classList.add('collapsed');
    return splitView;
}
export class AdwNavigationSplitView extends HTMLElement {
    static get observedAttributes() { return ['show-sidebar', 'can-collapse', 'collapse-threshold', 'sidebar-width']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._splitViewInstance = null; this._slotObserver = null; }
    connectedCallback() {
        this._render();
        if (this.isConnected && this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') requestAnimationFrame(() => {
            if (this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') this._splitViewInstance.connectObserver();
        });
        this._observer = new MutationObserver((mutations) => {
            let needsReRender = false;
            for (const mutation of mutations)
                if (mutation.type === 'childList') {
                    const relevantNodes = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)];
                    if (relevantNodes.some(node => (node.nodeType === Node.ELEMENT_NODE && (node.slot === 'sidebar' || node.slot === 'content')) || !node.slot)) {
                        needsReRender = true; break;
                    }
                }
            if (needsReRender) {
                this._render();
                if (this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') requestAnimationFrame(() => {
                    if (this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') this._splitViewInstance.connectObserver();
                });
            }
        });
        this._observer.observe(this, { childList: true, subtree: false });
    }
    disconnectedCallback() { if (this._splitViewInstance && typeof this._splitViewInstance.disconnectObserver === 'function') this._splitViewInstance.disconnectObserver(); if(this._observer) this._observer.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) { this._render(); if (this.isConnected && this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') requestAnimationFrame(() => { if (this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') this._splitViewInstance.connectObserver(); }); }}
    _getSlottedContent(slotName) { const slotted = this.querySelector(`:scope > [slot="${slotName}"]`); return slotted ? slotted.cloneNode(true) : document.createElement('div'); }
    _render() {
        if (this._splitViewInstance && typeof this._splitViewInstance.disconnectObserver === 'function') this._splitViewInstance.disconnectObserver();
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild.nodeName !== 'LINK') this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const sidebarContent = this._getSlottedContent('sidebar');
        const mainContent = this._getSlottedContent('content');
        const options = {
            sidebar: sidebarContent,
            content: mainContent,
            showSidebar: !this.hasAttribute('show-sidebar') || this.getAttribute('show-sidebar') !== 'false',
            canCollapse: !this.hasAttribute('can-collapse') || this.getAttribute('can-collapse') !== 'false',
            collapseThreshold: this.hasAttribute('collapse-threshold') ? parseInt(this.getAttribute('collapse-threshold'), 10) : 768,
            sidebarWidth: this.getAttribute('sidebar-width') || "300px",
        };
        const factory = (typeof Adw !== 'undefined' && Adw.createNavigationSplitView) ? Adw.createNavigationSplitView : createAdwNavigationSplitView;
        this._splitViewInstance = factory(options);
        this.shadowRoot.appendChild(this._splitViewInstance);
        if (this.isConnected && this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') requestAnimationFrame(() => {
            if (this._splitViewInstance && typeof this._splitViewInstance.connectObserver === 'function') this._splitViewInstance.connectObserver();
        });
        this._splitViewInstance.addEventListener('sidebar-toggled', (e) => {
            this.dispatchEvent(new CustomEvent('sidebar-toggled', { detail: e.detail, bubbles: true, composed: true }));
            if (e.detail.isVisible) this.setAttribute('show-sidebar', '');
            else this.removeAttribute('show-sidebar');
        });
    }
    showSidebar() { if (this._splitViewInstance) this._splitViewInstance.showSidebar(); } hideSidebar() { if (this._splitViewInstance) this._splitViewInstance.hideSidebar(); } toggleSidebar() { if (this._splitViewInstance) this._splitViewInstance.toggleSidebar(); } isSidebarVisible() { return this._splitViewInstance ? this._splitViewInstance.isSidebarVisible() : (this.hasAttribute('show-sidebar') ? this.getAttribute('show-sidebar') !== 'false' : true); } isOverlayMode() { return this._splitViewInstance ? this._splitViewInstance.isOverlayMode() : false; }
}

/** Creates an AdwOverlaySplitView widget. */
export function createAdwOverlaySplitView(options = {}) {
    const opts = { showSidebar: false, canCollapse: true, sidebarPosition: "start", sidebarWidth: "300px", ...options };
    const splitView = document.createElement('div'); splitView.classList.add('adw-overlay-split-view'); if (opts.sidebarPosition === 'end') splitView.classList.add('sidebar-end');
    const sidebarPane = document.createElement('aside'); sidebarPane.classList.add('adw-overlay-split-view-sidebar'); sidebarPane.style.width = opts.sidebarWidth; if (opts.sidebar instanceof Node) sidebarPane.appendChild(opts.sidebar);
    const contentPane = document.createElement('div'); contentPane.classList.add('adw-overlay-split-view-content'); if (opts.content instanceof Node) contentPane.appendChild(opts.content);
    const backdrop = document.createElement('div'); backdrop.classList.add('adw-overlay-split-view-backdrop'); backdrop.addEventListener('click', () => { if(opts.canCollapse) toggleSidebar(false); });
    if (opts.sidebarPosition === 'end') { splitView.appendChild(contentPane); splitView.appendChild(sidebarPane); } else { splitView.appendChild(sidebarPane); splitView.appendChild(contentPane); } splitView.appendChild(backdrop);
    let isSidebarVisible = opts.showSidebar;
    function applySidebarVisibility() { sidebarPane.classList.toggle('revealed', isSidebarVisible); backdrop.classList.toggle('visible', isSidebarVisible && opts.canCollapse); if (isSidebarVisible) { sidebarPane.style.transform = 'translateX(0)'; sidebarPane.style.visibility = 'visible'; } else { const translateDir = opts.sidebarPosition === 'end' ? '100%' : '-100%'; sidebarPane.style.transform = `translateX(${translateDir})`; setTimeout(() => { if(!sidebarPane.classList.contains('revealed')) sidebarPane.style.visibility = 'hidden';}, 250);}}
    function toggleSidebar(explicitShow) { if (!opts.canCollapse && typeof explicitShow === 'boolean' && !explicitShow) { if(!isSidebarVisible && explicitShow) isSidebarVisible = true; else return; } else if (!opts.canCollapse && typeof explicitShow === 'undefined') { if (!isSidebarVisible) isSidebarVisible = true; else return; } else { isSidebarVisible = (typeof explicitShow === 'boolean') ? explicitShow : !isSidebarVisible; } applySidebarVisibility(); splitView.dispatchEvent(new CustomEvent('sidebar-toggled', { detail: { isVisible: isSidebarVisible } })); }
    splitView.showSidebar = () => toggleSidebar(true); splitView.hideSidebar = () => { if(opts.canCollapse) toggleSidebar(false); }; splitView.toggleSidebar = () => toggleSidebar(); splitView.isSidebarVisible = () => isSidebarVisible;
    if (!opts.canCollapse) { isSidebarVisible = true; splitView.classList.add('not-collapsible'); } applySidebarVisibility();
    return splitView;
}
export class AdwOverlaySplitView extends HTMLElement {
    static get observedAttributes() { return ['show-sidebar', 'can-collapse', 'sidebar-position', 'sidebar-width']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); const styleLink = document.createElement('link'); styleLink.rel = 'stylesheet'; styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : ''; /* Expect Adw.config.cssPath to be set */ this.shadowRoot.appendChild(styleLink); this._splitViewInstance = null; this._slotObserver = null; }
    connectedCallback() { this._render(); this._observer = new MutationObserver((mutations) => { let needsReRender = false; for (const mutation of mutations) if (mutation.type === 'childList') { const relevantNodes = [...Array.from(mutation.addedNodes), ...Array.from(mutation.removedNodes)]; if (relevantNodes.some(node => (node.nodeType === Node.ELEMENT_NODE && (node.slot === 'sidebar' || node.slot === 'content')) || !node.slot)) { needsReRender = true; break; }} if (needsReRender) this._render(); }); this._observer.observe(this, { childList: true, subtree: false });}
    disconnectedCallback() { if(this._observer) this._observer.disconnect(); }
    attributeChangedCallback(name, oldValue, newValue) { if (oldValue !== newValue) this._render(); }
    _getSlottedContent(slotName) { const slotted = this.querySelector(`:scope > [slot="${slotName}"]`); return slotted ? slotted.cloneNode(true) : document.createElement('div'); }
    _render() { while (this.shadowRoot.lastChild && this.shadowRoot.lastChild.nodeName !== 'LINK') this.shadowRoot.removeChild(this.shadowRoot.lastChild); const sidebarContent = this._getSlottedContent('sidebar'); const mainContent = this._getSlottedContent('content'); const options = { sidebar: sidebarContent, content: mainContent, showSidebar: this.hasAttribute('show-sidebar') && this.getAttribute('show-sidebar') !== 'false', canCollapse: !this.hasAttribute('can-collapse') || this.getAttribute('can-collapse') !== 'false', sidebarPosition: this.getAttribute('sidebar-position') || "start", sidebarWidth: this.getAttribute('sidebar-width') || "300px", }; const factory = (typeof Adw !== 'undefined' && Adw.createOverlaySplitView) ? Adw.createOverlaySplitView : createAdwOverlaySplitView; this._splitViewInstance = factory(options); this.shadowRoot.appendChild(this._splitViewInstance); this._splitViewInstance.addEventListener('sidebar-toggled', (e) => { this.dispatchEvent(new CustomEvent('sidebar-toggled', { detail: e.detail, bubbles: true, composed: true })); if (e.detail.isVisible) this.setAttribute('show-sidebar', ''); else this.removeAttribute('show-sidebar'); }); }
    showSidebar() { if (this._splitViewInstance) this._splitViewInstance.showSidebar(); } hideSidebar() { if (this._splitViewInstance) this._splitViewInstance.hideSidebar(); } toggleSidebar() { if (this._splitViewInstance) this._splitViewInstance.toggleSidebar(); } isSidebarVisible() { return this._splitViewInstance ? this._splitViewInstance.isSidebarVisible() : (this.hasAttribute('show-sidebar') ? this.getAttribute('show-sidebar') !== 'false' : false); }
}

// No customElements.define here

[end of adwaita-web/js/components/views.js]

[end of adwaita-web/js/components/views.js]

[end of adwaita-web/js/components/views.js]

[end of adwaita-web/js/components/views.js]

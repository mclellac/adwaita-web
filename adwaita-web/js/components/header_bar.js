// import { adwGenerateId } from './utils.js'; // Not directly used here

/**
 * Creates an Adwaita-style header bar.
 * @param {object} [options={}] - Configuration options.
 * @param {string} [options.title] - Main title text for the header bar.
 * @param {string} [options.subtitle] - Subtitle text.
 * @param {HTMLElement[]} [options.start] - Array of elements to place at the start (left).
 * @param {HTMLElement[]} [options.end] - Array of elements to place at the end (right).
 * @returns {HTMLElement} The created header bar element.
 */
export function createAdwHeaderBar(options = {}) {
  const opts = options || {};
  const headerBar = document.createElement("header");
  headerBar.classList.add("adw-header-bar");

  const startBox = document.createElement("div");
  startBox.classList.add("adw-header-bar-start");
  opts.start?.forEach((el) => {
    if (el instanceof Node) startBox.appendChild(el);
  });

  const centerBox = document.createElement("div");
  centerBox.classList.add("adw-header-bar-center-box");

  if (opts.title) {
    const title = document.createElement("h1");
    title.classList.add("adw-header-bar-title");
    title.textContent = opts.title;
    centerBox.appendChild(title);
  }
  if (opts.subtitle) {
    const subtitle = document.createElement("h2");
    subtitle.classList.add("adw-header-bar-subtitle");
    subtitle.textContent = opts.subtitle;
    centerBox.appendChild(subtitle);
  }

  const endBox = document.createElement("div");
  endBox.classList.add("adw-header-bar-end");
  opts.end?.forEach((el) => {
    if (el instanceof Node) endBox.appendChild(el);
  });

  headerBar.appendChild(startBox);
  headerBar.appendChild(centerBox);
  headerBar.appendChild(endBox);

  // Methods for dynamic updates, useful for AdwNavigationView
  headerBar.updateTitleSubtitle = (title, subtitle) => {
      const titleEl = centerBox.querySelector('.adw-header-bar-title');
      const subtitleEl = centerBox.querySelector('.adw-header-bar-subtitle');
      if (titleEl) titleEl.textContent = title || '';
      if (subtitleEl) {
          subtitleEl.textContent = subtitle || '';
          subtitleEl.style.display = subtitle ? '' : 'none';
      } else if (subtitle && centerBox) { // Create subtitle if it doesn't exist and centerBox exists
          const newSubtitleEl = document.createElement("h2");
          newSubtitleEl.classList.add("adw-header-bar-subtitle");
          newSubtitleEl.textContent = subtitle;
          centerBox.appendChild(newSubtitleEl);
      }
  };
  headerBar.setStartWidgets = (widgets) => {
      while (startBox.firstChild) startBox.removeChild(startBox.firstChild); // Clear
      widgets.forEach(w => { if (w instanceof Node) startBox.appendChild(w); });
  };
  headerBar.setEndWidgets = (widgets) => {
      while (endBox.firstChild) endBox.removeChild(endBox.firstChild); // Clear
      widgets.forEach(w => { if (w instanceof Node) endBox.appendChild(w); });
  };

  return headerBar;
}

export class AdwWindowTitle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const h1 = document.createElement('h1'); h1.classList.add('adw-header-bar-title');
        h1.appendChild(document.createElement('slot')); this.shadowRoot.appendChild(h1);
    }
}

export class AdwHeaderBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '/static/css/adwaita-web.css';
        this.shadowRoot.appendChild(styleLink);
    }
    connectedCallback() { this._render(); }
    _render() {
        while (this.shadowRoot.lastChild && this.shadowRoot.lastChild !== this.shadowRoot.querySelector('link')) this.shadowRoot.removeChild(this.shadowRoot.lastChild);
        const header = document.createElement('header'); header.classList.add('adw-header-bar');

        const startBox = document.createElement('div'); startBox.classList.add('adw-header-bar-start');
        const startSlot = document.createElement('slot'); startSlot.name = 'start'; startBox.appendChild(startSlot);

        const centerBox = document.createElement('div'); centerBox.classList.add('adw-header-bar-center-box');
        const titleSlot = document.createElement('slot'); titleSlot.name = 'title'; // For adw-window-title or direct text
        const subtitleSlot = document.createElement('slot'); subtitleSlot.name = 'subtitle';
        centerBox.append(titleSlot, subtitleSlot);

        const endBox = document.createElement('div'); endBox.classList.add('adw-header-bar-end');
        const endSlot = document.createElement('slot'); endSlot.name = 'end'; endBox.appendChild(endSlot);

        header.append(startBox, centerBox, endBox); this.shadowRoot.appendChild(header);
    }
}

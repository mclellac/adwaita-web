/**
 * AdwListBox Component
 *
 * A container for rows, implementing Libadwaita's ListBox patterns.
 * It can display a list of AdwRow (or row-like) elements, grouped visually.
 */

import { adwGenerateId } from './utils.js';

const LISTBOX_BASE_CLASS = 'adw-list-box';

/**
 * Creates an Adwaita-styled listbox container.
 *
 * @param {object} options - Configuration options.
 * @param {Array<HTMLElement>} [options.children] - An array of row elements to populate the listbox.
 * @param {boolean} [options.isFlat=false] - If true, removes the default box-shadow/card appearance.
 * @param {boolean} [options.selectable=false] - If true, indicates rows can be selected (sets ARIA role).
 * @returns {HTMLDivElement} The created <div> element representing the listbox.
 */
export function createAdwListBox(options = {}) {
    const { children = [], isFlat = false, selectable = false } = options;

    const listBox = document.createElement('div');
    listBox.classList.add(LISTBOX_BASE_CLASS);
    listBox.id = adwGenerateId(LISTBOX_BASE_CLASS);

    if (isFlat) {
        listBox.classList.add(`${LISTBOX_BASE_CLASS}-flat`); // SCSS expects a class
    }

    if (selectable) {
        listBox.setAttribute('role', 'listbox');
    }

    children.forEach(child => {
        if (child instanceof HTMLElement) {
            listBox.appendChild(child);
        } else {
            console.warn('Adw.createListBox: Provided child is not an HTMLElement and will be ignored.', child);
        }
    });

    return listBox;
}

/**
 * <adw-list-box> Web Component
 *
 * A declarative way to create Adwaita listboxes.
 *
 * @example
 * <adw-list-box selectable>
 *   <adw-action-row title="Appearance"></adw-action-row>
 *   <adw-entry-row title="Device Name"></adw-entry-row>
 * </adw-list-box>
 */
export class AdwListBox extends HTMLElement {
    constructor() {
        super();
        // No shadow DOM, manages light DOM children (rows) via <slot>
    }

    static get observedAttributes() {
        return ['flat', 'selectable'];
    }

    connectedCallback() {
        this.classList.add(LISTBOX_BASE_CLASS);
        if (!this.id) {
            this.id = adwGenerateId(LISTBOX_BASE_CLASS);
        }

        // Initial attribute handling
        this._updateFlat();
        this._updateSelectable();

        // Ensure a slot exists if not already there (e.g. if created via JS new AdwListBox())
        // If created declaratively, slot content will be projected automatically.
        // This is more for robustness if the component is manipulated dynamically.
        if (!this.querySelector('slot')) {
            const slot = document.createElement('slot');
            // Prepending might be better if there's any internal structure later
            this.appendChild(slot);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case 'flat':
                this._updateFlat();
                break;
            case 'selectable':
                this._updateSelectable();
                break;
        }
    }

    _updateFlat() {
        // The presence of the 'flat' attribute itself drives the styling via CSS attribute selector .adw-list-box[flat]
        // No class manipulation needed here if SCSS is updated.
        // Forcing a style recalc or reflecting to a class might be needed if CSS alone isn't enough.
        // However, the current SCSS uses .adw-list-box.flat, so we'll stick to class for now.
        if (this.hasAttribute('flat')) {
            this.classList.add(`${LISTBOX_BASE_CLASS}-flat`);
        } else {
            this.classList.remove(`${LISTBOX_BASE_CLASS}-flat`);
        }
    }

    _updateSelectable() {
        if (this.hasAttribute('selectable')) {
            this.setAttribute('role', 'listbox');
        } else {
            this.removeAttribute('role');
        }
    }

    /**
     * Adds a row element to the list box.
     * @param {HTMLElement} rowElement - The row element to add.
     */
    addRow(rowElement) {
        if (rowElement instanceof HTMLElement) {
            this.appendChild(rowElement);
        } else {
            console.warn('AdwListBox.addRow: Provided element is not an HTMLElement.', rowElement);
        }
    }

    /**
     * Removes a row element from the list box.
     * @param {HTMLElement} rowElement - The row element to remove.
     */
    removeRow(rowElement) {
        if (rowElement instanceof HTMLElement && rowElement.parentElement === this) {
            this.removeChild(rowElement);
        } else {
            console.warn('AdwListBox.removeRow: Provided element is not a child of this list box or not an HTMLElement.', rowElement);
        }
    }

    /**
     * Gets all row elements in the list box.
     * This will return all direct children. Specific filtering for `adw-row` etc. could be added if needed.
     * @returns {HTMLCollection}
     */
    getRows() {
        // If using Shadow DOM and a slot:
        // const slot = this.shadowRoot.querySelector('slot');
        // if (slot) {
        //     return slot.assignedElements();
        // }
        // return [];

        // If using Light DOM (as implied by current setup and docs):
        // Filter out any <slot> elements if they were manually added by connectedCallback,
        // though typically projected content doesn't make the <slot> element a "row".
        return Array.from(this.children).filter(el => el.tagName !== 'SLOT');
    }
}

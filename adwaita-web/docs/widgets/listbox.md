# ListBox CSS Styling (Adwaita Skin)

A ListBox is a container used to display a list of rows. Adwaita Skin provides CSS classes to style a `<div>` (or other suitable block element) as a listbox, and classes to style its child elements as various types of Adwaita rows.

## HTML Structure and CSS Classes

To create a listbox, apply the `adw-list-box` class to a container element. Inside, place elements that will serve as rows, each with its appropriate Adwaita row class (e.g., `adw-row`, `adw-action-row`).

**Basic ListBox Structure (Default Appearance):**
By default, an `adw-list-box` has a subtle border and uses the view background color.
```html
<div class="adw-list-box">
  <div class="adw-row"><span>Simple Row 1</span></div>
  <div class="adw-action-row">
    <span class="adw-row-title">Action Row Title</span>
  </div>
</div>
```

## ListBox Modifier Classes

*   `.boxed-list`: Apply to `adw-list-box` for the standard Adwaita "boxed list" appearance, which looks like a single card containing the rows with separators. This is often used in preferences or sidebars.
    ```html
    <div class="adw-list-box boxed-list">
      <div class="adw-action-row">Action Row in Boxed List</div>
      <div class="adw-entry-row">
        <label class="adw-row-title" for="bx-entry">Label:</label>
        <input type="text" id="bx-entry" class="adw-entry" placeholder="Value">
      </div>
    </div>
    ```
*   `.boxed-list-separate`: Apply to `adw-list-box` to make each row appear as an individual, separate card.
    ```html
    <div class="adw-list-box boxed-list-separate">
      <div class="adw-row">Row as Card 1</div>
      <div class="adw-row">Row as Card 2</div>
    </div>
    ```
*   `.flat`: Apply to `adw-list-box` to remove its background, border, and shadow. It will appear as a simple sequence of rows. Separators between rows are still present unless rows are also styled as flat.
    ```html
    <div class="adw-list-box flat">
      <div class="adw-row">Row A</div>
      <div class="adw-row">Row B</div>
    </div>
    ```
*   DEPRECATED: `.content` was an old alias for `.boxed-list`. Use `.boxed-list` instead.

## Row Types within a ListBox

Various types of rows can be placed inside an `adw-list-box`. Each has its own styling:
*   **`.adw-row`**: A generic base row.
*   **`.adw-action-row`**: For navigation or actions, often with a title, subtitle, and icons.
*   **`.adw-entry-row`**: Combines a label with an text input.
*   **`.adw-switch-row`**: Combines a label with a switch.
*   **`.adw-expander-row`**: A row that can expand/collapse (requires JavaScript).
*   See individual row documentation for more details.

**Example with Boxed List and Various Rows:**
```html
<div class="adw-list-box boxed-list" style="max-width: 450px;">
  <div class="adw-action-row interactive">
    <span class="adw-row-title">Appearance</span>
    <span class="adw-row-subtitle">Themes, Fonts, Backgrounds</span>
  </div>
  <div class="adw-entry-row">
    <label class="adw-row-title" for="deviceName">Device Name</label>
    <input type="text" id="deviceName" class="adw-entry" value="My Laptop">
  </div>
  <div class="adw-switch-row">
    <span class="adw-row-title">Automatic Updates</span>
    <input type="checkbox" class="adw-switch" checked aria-label="Automatic Updates">
  </div>
</div>
```

## Styling & Theming

*   **SCSS Source:** `scss/_listbox.scss`, `scss/_row_types.scss` (and individual row SCSS).
*   **CSS Variables:**
    *   **Default ListBox:** Uses `var(--view-bg-color)` for background, `var(--border-color)` for border. Row separators use `var(--list-separator-color)`.
    *   **`.boxed-list`:** Uses `var(--card-bg-color)`, `var(--card-fg-color)`, and `var(--card-shade-color)` for its "inner border" shadow effect and row separators.
    *   **Selected/Active Rows:** Typically use `var(--accent-bg-color)` and `var(--accent-fg-color)`.
    *   **Row Hover:** `var(--list-row-hover-bg-color)`.

Refer to the [Theming Reference](../general/theming.md) and relevant SCSS files for more details.

## Interactivity

All interactivity, such as handling clicks on rows (add `.interactive` class to rows), selection logic, managing switch states, or expand/collapse behavior, must be implemented with your own JavaScript. Adwaita Skin provides styling for states like `:hover`, `:active`, and a `.selected` class (which your JS would add/remove).

---
Next: See documentation for specific row types like [ActionRow](./actionrow.md), [EntryRow](./entryrow.md), etc.

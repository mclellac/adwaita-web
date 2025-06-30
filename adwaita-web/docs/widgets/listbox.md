# ListBox CSS Styling (Adwaita Skin)

A ListBox is a container used to display a list of rows. Adwaita Skin provides CSS classes to style a `<div>` (or other suitable block element) as a listbox, and classes to style its child elements as various types of Adwaita rows (e.g., action rows, entry rows).

## HTML Structure and CSS Classes

To create a listbox, apply the `adw-list-box` class to a container element (typically a `<div>`). Inside this container, place elements that will serve as rows. Each row should have its own Adwaita row class (e.g., `adw-row`, `adw-action-row`).

**Basic ListBox Structure:**

```html
<div class="adw-list-box">
  <div class="adw-row">
    <!-- Content for first row -->
    <span>Simple Row 1</span>
  </div>
  <div class="adw-action-row">
    <!-- Content for an action row -->
    <span class="adw-row-title">Action Row Title</span>
    <span class="adw-row-subtitle">With a subtitle</span>
  </div>
  <div class="adw-entry-row">
    <!-- Content for an entry row -->
    <label for="lb-entry">Label:</label>
    <input type="text" id="lb-entry" class="adw-entry" placeholder="Value">
  </div>
  <!-- Add more rows as needed -->
</div>
```

## ListBox Modifier Classes

*   `.flat`: Apply to the `adw-list-box` element to remove the default card-like appearance (background, border/shadow). It will appear as a simple sequence of rows, usually with separators.
    ```html
    <div class="adw-list-box flat">
      <div class="adw-row">Row A</div>
      <div class="adw-row">Row B</div>
    </div>
    ```
*   `.selectable`: If rows within the listbox are meant to be selectable by the user (e.g., via JavaScript), you can add this class to `adw-list-box`. This might add visual cues or ARIA attributes depending on the CSS implementation. The selection logic itself needs to be handled by your JavaScript.
    ```html
    <div class="adw-list-box selectable">
      <div class="adw-row interactive">Selectable Row 1</div>
      <div class="adw-row interactive">Selectable Row 2</div>
    </div>
    ```
    *Note: Individual rows might also need an `.interactive` class or similar to indicate they respond to clicks.*

## Row Types within a ListBox

Various types of rows can be placed inside an `adw-list-box`. Each has its own styling and expected structure:

*   **`.adw-row`**: A generic row.
*   **`.adw-action-row`**: Typically for navigation or actions, often includes a title, subtitle, and optional icons/widgets.
*   **`.adw-entry-row`**: Combines a label with an `<input class="adw-entry">`.
*   **`.adw-switch-row`**: Combines a label with a switch (styled `<input type="checkbox" class="adw-switch">`).
*   **`.adw-expander-row`**: A row that can be expanded to show more content (requires JavaScript for expand/collapse logic).
*   ... and others. Refer to specific row documentation or `scss/_row_types.scss`, `scss/_listbox.scss`.

**Example with Various Row Types:**

```html
<div class="adw-list-box" style="max-width: 450px;">
  <div class="adw-action-row interactive">
    <span class="adw-row-title">Appearance</span>
    <span class="adw-row-subtitle">Themes, Fonts, Backgrounds</span>
    <!-- Optional: <span class="adw-icon adw-icon-go-next-symbolic"></span> -->
  </div>

  <div class="adw-entry-row">
    <label class="adw-row-title" for="deviceName">Device Name</label>
    <input type="text" id="deviceName" class="adw-entry" value="My Laptop">
  </div>

  <div class="adw-switch-row">
    <span class="adw-row-title">Automatic Updates</span>
    <input type="checkbox" class="adw-switch" checked aria-labelledby="autoUpdateTitle">
    <span id="autoUpdateTitle" hidden>Automatic Updates</span> <!-- For ARIA -->
  </div>
</div>
```

## Styling & Theming

*   **SCSS Source:** `scss/_listbox.scss`, `scss/_row_types.scss` (and individual row component SCSS files).
*   **CSS Variables:**
    *   The listbox background might use `--list-box-bg-color` or fall back to `--view-bg-color` or `--card-bg-color` depending on whether it's `flat` or not.
    *   Borders/shadows are controlled by variables like `--list-box-border-color`, `--card-border-color`, `--card-shadow`.
    *   Row separators typically use `--list-row-separator-color` or a general `--borders-color`.
    *   Individual rows will use their own sets of variables for text colors, spacing, etc.

Refer to the relevant SCSS files for a full list of CSS variables.

## Interactivity

All interactivity, such as:
*   Handling clicks on rows (`.interactive` rows).
*   Implementing selection logic for `.selectable` listboxes.
*   Managing the state of switches in `.adw-switch-row`.
*   Expanding/collapsing `.adw-expander-row`.

...must be implemented using your own JavaScript. Adwaita Skin provides the styling for these elements and their states (e.g., `:hover`, `:active`, a `.selected` class you might add via JS).

---
Next: See documentation for specific row types like [ActionRow](./actionrow.md), [EntryRow](./entryrow.md), etc.

# ExpanderRow

An ExpanderRow is a row that can be expanded or collapsed to reveal or hide additional content. It typically displays a title, an optional subtitle, and an expander icon (chevron).

## JavaScript Factory: `Adw.createExpanderRow()`

Creates an Adwaita-styled expander row.

**Signature:**

```javascript
Adw.createExpanderRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, required): The main title text of the row.
    *   `subtitle` (String, optional): Additional descriptive text displayed below the title.
    *   `content` (HTMLElement, optional): The HTML element to be revealed when the row is expanded. *Security: Ensure content is trusted/sanitized.*
    *   `expanded` (Boolean, optional): If `true`, the row is initially expanded. Defaults to `false`.
    *   `onToggled` (Function, optional): Callback function executed when the row's expanded state changes. Receives a boolean argument indicating the new `expanded` state.
    *   `disabled` (Boolean, optional): If `true`, disables the row, preventing expansion/collapse.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the expander row. It will have methods like `setExpanded(boolean)` and `isExpanded()` if not part of the base HTMLElement prototype.

**Example:**

```html
<div id="js-expanderrow-listbox" style="max-width: 450px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-expanderrow-listbox');

  // Create content for the expander
  const detailsContent = document.createElement('div');
  // Indent content for visual hierarchy
  detailsContent.style.padding = "var(--spacing-s) 0 0 var(--spacing-l)";
  detailsContent.innerHTML = `
    <p>This is the detailed content that was hidden.</p>
    <adw-entry placeholder="Enter detail..."></adw-entry>
  `;

  const expanderRow = Adw.createExpanderRow({
    title: "Advanced Settings",
    subtitle: "Click to see more options",
    content: detailsContent,
    expanded: false,
    onToggled: (isExpanded) => {
      Adw.createToast(`Expander is now ${isExpanded ? 'open' : 'closed'}`);
    }
  });
  container.appendChild(expanderRow);

  // Initially expanded row
  const initiallyExpandedContent = Adw.createLabel("This content is visible by default.");
  initiallyExpandedContent.style.padding = "var(--spacing-s) 0 0 var(--spacing-l)";
  const autoExpandedRow = Adw.createExpanderRow({
    title: "Visible Details",
    content: initiallyExpandedContent,
    expanded: true
  });
  container.appendChild(autoExpandedRow);
</script>
```

## Web Component: `<adw-expander-row>`

A declarative way to define Adwaita expander rows.

**HTML Tag:** `<adw-expander-row>`

**Attributes:**

*   `title` (String, required): The main title text.
*   `subtitle` (String, optional): Subtitle text.
*   `expanded` (Boolean, optional): If present, the row is initially expanded.
*   `disabled` (Boolean, optional): If present, disables the row.

**Slots:**

*   `content` (or default slot if not named `content`): The content to be shown/hidden when the row is expanded/collapsed.

**Events:**

*   `toggled`: Fired when the expanded state changes. `event.detail` might contain an `isExpanded` boolean. (Verify specific event name and detail structure from implementation).
    Alternatively, listen for `change` or a custom event like `expanded-changed`.

**Properties:**
*   `expanded` (Boolean): Gets or sets the expanded state of the row.

**Methods:**
*   `toggle()`: Toggles the expanded state.
*   `setExpanded(boolean)`: Sets the expanded state. (Verify method names from implementation).

**Example:**

```html
<adw-list-box style="max-width: 500px;">
  <adw-expander-row title="User Profile"
                      subtitle="Edit your personal information">
    <div slot="content"
         style="padding: var(--spacing-m); border-top: 1px solid var(--borders-color);">
      <adw-entry-row title="Name" placeholder="Your Name"></adw-entry-row>
      <adw-entry-row title="Email" placeholder="Your Email"></adw-entry-row>
    </div>
  </adw-expander-row>

  <adw-expander-row title="Application Logs" expanded>
    <pre slot="content"
         style="padding: var(--spacing-m); background-color: var(--shade-color);
                max-height: 100px; overflow-y: auto;">Log entry 1...
Log entry 2...
Log entry 3...</pre>
  </adw-expander-row>

  <adw-expander-row title="Disabled Expander" disabled>
    <p slot="content">This content will not be shown.</p>
  </adw-expander-row>
</adw-list-box>

<script>
  const userProfileExpander = document.querySelector('adw-expander-row[title="User Profile"]');
  userProfileExpander.addEventListener('toggled', (event) => { // Assuming 'toggled' event
    // For a generic 'change' or other event, check event.target.expanded
    const isNowExpanded = userProfileExpander.hasAttribute('expanded'); // Check attribute for state
    Adw.createToast(`User Profile expander is ${isNowExpanded ? 'open' : 'closed'}.`);
  });
</script>
```

## Styling

*   **SCSS Sources:** `scss/_expander_row.scss` and `scss/_row_types.scss` (for `AdwExpanderRow` sections).
*   **Key Classes and Structure:**
    *   `.adw-expander-row`: The main container for the expander row.
        *   An inner element, typically an `<div class="adw-action-row activatable">`, serves as the clickable header.
        *   Inside the header, an icon element (e.g., `<span class="adw-icon adw-expander-row-chevron"></span>`) displays the chevron. The chevron uses `pan-down-symbolic.svg` and rotates.
            *   Default state (collapsed): Rotated -90 degrees (points right in LTR).
            *   When `.adw-expander-row.expanded` or its header part has an `.expanded` class: Rotated 0 degrees (points down).
    *   `.adw-expander-row-content`: The container for the collapsible content.
        *   Hidden by default (e.g., `display: none` or `max-height: 0` with `overflow: hidden` and `opacity: 0`).
        *   When the row is expanded (e.g., by adding an `.expanded` class to this element or its parent `.adw-expander-row`), it becomes visible (e.g., `display: block` or `max-height` increased, `opacity: 1`).
        *   Styled with padding and a top border to separate it from the header.
*   **CSS-Only Variant (`<details>`/`<summary>`):**
    *   `_expander_row.scss` also includes styles for a CSS-only expander using the `<details>` HTML element with class `.adw-css-expander-row`.
    *   The `<summary>` element is styled with `.adw-action-row` and gets a custom chevron via its `::after` pseudo-element.
    *   The content within the `<details>` element (not the summary) should be wrapped in a `div` with class `.adw-expander-row-content` to pick up the correct styling.
    ```html
    <details class="adw-css-expander-row">
      <summary class="adw-action-row activatable">
        <span class="adw-action-row-title">CSS Expander Title</span>
        <!-- The ::after pseudo-element on summary creates the chevron -->
      </summary>
      <div class="adw-expander-row-content">
        <p>This content is revealed by the CSS-only expander.</p>
      </div>
    </details>
    ```
*   **Theming:**
    *   `--expander-content-bg-color`: Background for the content area (defaults to `--window-bg-color`).
    *   Chevron icon color is `currentColor` (inherited text color), opacity from `--icon-opacity`.
    *   Animation uses `--animation-duration-short` and `--animation-ease-out-sine` or `--animation-ease-out-cubic`.

---
Next: [SwitchRow](./switchrow.md) (as it's another common row type)

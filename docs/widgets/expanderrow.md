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
  detailsContent.style.padding = "var(--spacing-s) 0 0 var(--spacing-l)"; // Indent content
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
  <adw-expander-row title="User Profile" subtitle="Edit your personal information">
    <div slot="content" style="padding: var(--spacing-m); border-top: 1px solid var(--borders-color);">
      <adw-entry-row title="Name" placeholder="Your Name"></adw-entry-row>
      <adw-entry-row title="Email" placeholder="Your Email"></adw-entry-row>
    </div>
  </adw-expander-row>

  <adw-expander-row title="Application Logs" expanded>
    <pre slot="content" style="padding: var(--spacing-m); background-color: var(--shade-color); max-height: 100px; overflow-y: auto;">Log entry 1...
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

*   Primary SCSS: `scss/_expander_row.scss` (and inherits from `_listbox.scss` / `_row_types.scss`).
*   Includes styling for the header part (title, subtitle, chevron icon) and the collapsible content area.
*   The chevron icon rotates to indicate the expanded/collapsed state.
*   The content area is typically hidden/shown using `display: none/block` or by adjusting `max-height` for CSS transitions.

---
Next: [SwitchRow](./switchrow.md) (as it's another common row type)

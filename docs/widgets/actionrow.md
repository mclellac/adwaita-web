# ActionRow

An ActionRow is a specialized type of `AdwRow` designed for presenting an action or navigation item, often with a title, subtitle, and an optional icon or chevron. It's commonly used within an `AdwListBox`.

## JavaScript Factory: `Adw.createActionRow()`

Creates an Adwaita-styled action row.

**Signature:**

```javascript
Adw.createActionRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, required): The main title text of the row.
    *   `subtitle` (String, optional): Additional descriptive text displayed below the title.
    *   `iconHTML` (String, optional): HTML string for an SVG icon or an icon font class to be displayed at the start of the row. *Security: Ensure trusted/sanitized HTML if user-supplied.*
    *   `onClick` (Function, optional): Callback function executed when the row is clicked. Makes the row interactive.
    *   `showChevron` (Boolean, optional): If `true`, displays a chevron (navigation arrow) at the end of the row, indicating it leads to another view. Defaults to `false` but might be implied if `onClick` is present and it's a navigation action.
    *   `suffix` (HTMLElement, optional): An element to place at the end of the row, before any chevron (e.g., a switch, a small button, a spinner).
    *   `disabled` (Boolean, optional): If `true`, disables the row, making it non-interactive and visually muted.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the action row.

**Example:**

```html
<div id="js-actionrow-listbox" style="max-width: 400px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-actionrow-listbox');

  // ActionRow for navigation
  const networkRow = Adw.createActionRow({
    title: "Network",
    subtitle: "Wi-Fi, Ethernet, VPN",
    iconHTML: '<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M8 0C3.582 0 0 3.582 0 8s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8Zm0 1c3.866 0 7 3.134 7 7s-3.134 7-7 7-7-3.134-7-7 3.134-7 7-7Z"/><path d="M7.5 4.5h1v3h-1v-3Zm0 4h1v3h-1v-3Z"/></svg>', // Example icon
    showChevron: true,
    onClick: () => Adw.createToast("Navigate to Network Settings")
  });
  container.appendChild(networkRow);

  // ActionRow with a suffix (e.g., a spinner)
  const updateSpinner = Adw.createSpinner({ active: true, size: 'small' }); // Assuming AdwSpinner exists
  const updatesRow = Adw.createActionRow({
    title: "Software Updates",
    subtitle: "Checking for updates...",
    suffix: updateSpinner,
    onClick: () => Adw.createToast("Checking for updates action...")
  });
  container.appendChild(updatesRow);

  // Disabled ActionRow
  const disabledRow = Adw.createActionRow({
    title: "Advanced Settings",
    subtitle: "Requires admin privileges",
    disabled: true,
    showChevron: true
  });
  container.appendChild(disabledRow);
</script>
```

## Web Component: `<adw-action-row>`

A declarative way to define Adwaita action rows.

**HTML Tag:** `<adw-action-row>`

**Attributes:**

*   `title` (String, required): The main title text.
*   `subtitle` (String, optional): Subtitle text.
*   `icon` (String, optional): HTML string for an SVG icon or an icon font class for the start icon.
*   `show-chevron` (Boolean, optional): If present, displays a navigation chevron at the end.
*   `disabled` (Boolean, optional): If present, disables the row.

**Slots:**

*   Default slot (for `iconHTML` if not using `icon` attribute, or for main content if `title`/`subtitle` are not used): Primarily for the icon if complex HTML is needed.
*   `prefix`: Content placed at the very start of the row, before the icon (if any) and text content.
*   `suffix`: Content placed at the end of the row, before the chevron (if any). Useful for switches, spinners, or secondary buttons.
*   The title and subtitle can also be provided by slotted `<h1>`/`<h2>` or similar elements if not using attributes.

**Events:**
*   `click`: Standard click event. The row is automatically interactive.

**Example:**

```html
<adw-list-box style="max-width: 450px;">
  <adw-action-row title="Display" subtitle="Resolution, Brightness, Night Light" show-chevron>
    <!-- You can also put an icon via attribute or slot="prefix" -->
    <span slot="prefix" style="font-size: 20px; margin-right: var(--spacing-s);">🖥️</span>
  </adw-action-row>

  <adw-action-row title="Sound" show-chevron>
    <adw-spinner slot="suffix" active size="small"></adw-spinner>
  </adw-action-row>

  <adw-action-row title="Privacy" subtitle="Location Services, Camera Access" icon="<svg viewBox='0 0 16 16'><!-- lock icon --><path d='M8 1a2 2 0 00-2 2v2H5a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1V6a1 1 0 00-1-1H9V3a2 2 0 00-2-2zm0 1a1 1 0 011 1v2H7V3a1 1 0 011-1z'/></svg>" show-chevron>
  </adw-action-row>

  <adw-action-row title="Disabled Action" subtitle="This action is not available" disabled show-chevron>
  </adw-action-row>
</adw-list-box>

<script>
  document.querySelector('adw-action-row[title="Display"]').addEventListener('click', () => {
    Adw.createToast("Display settings clicked!");
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_action_row.scss` (and inherits from `_listbox.scss` / `_row_types.scss`).
*   The layout uses flexbox to arrange icon, title/subtitle block, suffix, and chevron.
*   The `disabled` state will typically reduce opacity and disable pointer events.
*   Interactive states (hover, active) are styled for visual feedback.

---
Next: [EntryRow](./entryrow.md)

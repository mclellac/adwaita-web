# SplitButton

An AdwSplitButton is a composite button that combines a main action button with an attached dropdown arrow button. Clicking the main part triggers a default action, while clicking the arrow part typically reveals a menu or more options.

## JavaScript Factory: `Adw.createSplitButton()`

Creates an Adwaita-styled split button.

**Signature:**

```javascript
Adw.createSplitButton(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `actionText` (String, optional): Text for the main action part of the button. Can be empty if using an icon.
    *   `actionIconHTML` (String, optional): HTML for an icon in the main action part.
    *   `actionHref` (String, optional): If provided, the main action part becomes an `<a>` tag. *Security: Ensure trusted URL.*
    *   `onActionClick` (Function, optional): Callback for when the main action part is clicked.
    *   `onDropdownClick` (Function, optional): Callback for when the dropdown arrow part is clicked. This function is responsible for showing a menu or popover.
    *   `suggested` (Boolean, optional): If `true`, applies 'suggested-action' styling to the main action part. Defaults to `false`.
    *   `disabled` (Boolean, optional): If `true`, disables the entire split button. Defaults to `false`.
    *   `dropdownAriaLabel` (String, optional): ARIA label for the dropdown arrow button. Defaults to "More actions".

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` container for the split button.

**Example:**

```html
<div id="js-splitbutton-container" style="padding: 10px;"></div>
<script>
  const container = document.getElementById('js-splitbutton-container');

  const saveSplitButton = Adw.createSplitButton({
    actionText: "Save",
    actionIconHTML: '<svg viewBox="0 0 16 16"><path d="M2 2v12h12V2H2z"/></svg>', // Save icon (shortened)
    suggested: true,
    onActionClick: () => {
      Adw.createToast("Default Save action!");
    },
    onDropdownClick: (event) => {
      // In a real app, you'd show a popover/menu here
      Adw.createToast("Dropdown clicked! Show menu (e.g., Save As, Export).");
      console.log("Dropdown event target:", event.target); // The arrow button
    }
  });
  container.appendChild(saveSplitButton);

  const downloadSplitButton = Adw.createSplitButton({
    actionText: "Download",
    disabled: false,
    onActionClick: () => { Adw.createToast("Download started."); },
    onDropdownClick: () => { Adw.createToast("Show download options (PDF, CSV, etc.)"); }
  });
  container.appendChild(document.createElement('br'));
  container.appendChild(document.createElement('br'));
  container.appendChild(downloadSplitButton);
</script>
```

## Web Component: `<adw-split-button>`

A declarative way to define Adwaita split buttons.

**HTML Tag:** `<adw-split-button>`

**Attributes:**

*   `action-text` (String, optional): Text for the main action part.
*   `action-href` (String, optional): If present, makes the main action part a link.
*   `suggested` (Boolean, optional): Applies suggested styling to the main action.
*   `disabled` (Boolean, optional): Disables the entire button.
*   `dropdown-aria-label` (String, optional): ARIA label for the dropdown arrow.

**Slots:**
*   `action-icon`: Place HTML for an icon in the main action part here.
*   Default slot: Can be used for `action-text` if `action-text` attribute is not provided.

**Events:**

*   `action-click`: Fired when the main action part is clicked. `event.detail` may contain `{originalEvent: MouseEvent}`.
*   `dropdown-click`: Fired when the dropdown arrow part is clicked. `event.detail` may contain `{originalEvent: MouseEvent}`. The user of the component is responsible for displaying a menu/popover.

**Example:**

```html
<adw-split-button
  action-text="Run"
  suggested
  dropdown-aria-label="Run options"
  id="run-split-btn">
  <span slot="action-icon"><svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M4.5 12.5v-9l7 4.5-7 4.5z"/></svg></span> <!-- Play icon -->
</adw-split-button>

<br/><br/>

<adw-split-button action-text="Export Data" id="export-split-btn"></adw-split-button>

<script>
  const runSplitBtn = document.getElementById('run-split-btn');
  runSplitBtn.addEventListener('action-click', () => {
    Adw.createToast("Running default configuration...");
  });
  runSplitBtn.addEventListener('dropdown-click', () => {
    // Logic to show a popover with "Run with...", "Debug..."
    Adw.createToast("Show run options menu!");
  });

  const exportSplitBtn = document.getElementById('export-split-btn');
  exportSplitBtn.addEventListener('action-click', () => { Adw.createToast("Exporting as CSV..."); });
  exportSplitBtn.addEventListener('dropdown-click', () => { Adw.createToast("Show export format options!"); });
</script>
```

## Styling

*   Primary SCSS: `scss/_split_button.scss` (and `scss/_button.scss`).
*   The component consists of two `AdwButton` elements (or similar structure) visually joined.
*   The dropdown arrow part is usually a smaller, icon-only button.
*   Styling attributes like `suggested` apply to the main action part.

---
Next: [AlertDialog](./alertdialog.md)

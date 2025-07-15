# SplitButton

An AdwSplitButton is a composite button that combines a main action button with an attached dropdown arrow button. Clicking the main part triggers a default action, while clicking the arrow part typically reveals a menu or more options.

## JavaScript Factory: `Adw.SplitButton.factory()` or `createAdwSplitButton()`

Creates an `<adw-split-button>` Web Component instance.

**Signature:**

```javascript
Adw.SplitButton.factory(options = {}) -> AdwSplitButtonElement
// or createAdwSplitButton(options = {}) -> AdwSplitButtonElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options, mapped to attributes of the `<adw-split-button>`:
    *   `actionText` (String, optional): Text for the main action part. Sets the `action-text` attribute. If not provided, content can be slotted.
    *   `actionIconName` (String, optional): Name of an Adwaita icon for the main action part. Sets the `action-icon-name` attribute.
    *   `actionHref` (String, optional): If provided, the main action part (an internal `<adw-button>`) will behave like a link. Sets the `action-href` attribute. *Security: Ensure trusted URL.*
    *   `onActionClick` (Function, optional): Callback for when the main action part is clicked. Attached as an `action-click` event listener.
    *   `onDropdownClick` (Function, optional): Callback for when the dropdown arrow part is clicked. Attached as a `dropdown-click` event listener.
    *   `suggested` (Boolean, optional): Sets the `suggested` attribute.
    *   `disabled` (Boolean, optional): Sets the `disabled` attribute.
    *   `dropdownAriaLabel` (String, optional): ARIA label for the dropdown arrow button. Sets the `dropdown-aria-label` attribute.

**Returns:**

*   `(AdwSplitButtonElement)`: The created `<adw-split-button>` Web Component instance.

**Example:**

```html
<div id="js-splitbutton-container" style="padding: 10px;"></div>
<script>
  // Assuming createAdwSplitButton is globally available
  const container = document.getElementById('js-splitbutton-container');

  const saveSplitButton = createAdwSplitButton({
    actionText: "Save",
    actionIconName: "document-save-symbolic",
    suggested: true,
    onActionClick: () => {
      Adw.createToast("Default Save action!");
    },
    onDropdownClick: (event) => {
      Adw.createToast("Dropdown clicked! Show menu (e.g., Save As, Export).");
    }
  });
  container.appendChild(saveSplitButton);

  const downloadSplitButton = createAdwSplitButton({
    actionText: "Download",
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

*   `action-text` (String, optional): Text for the main action part. This is a fallback if no content is provided via slots.
*   `action-icon-name` (String, optional): Name of an Adwaita icon for the action part.
*   `action-href` (String, optional): If present, makes the main action part a link.
*   `suggested` (Boolean attribute): Applies suggested styling to the main action.
*   `disabled` (Boolean attribute): Disables the entire button.
*   `dropdown-aria-label` (String, optional): ARIA label for the dropdown arrow. Defaults to "More options".

**Slots:**
*   Default slot: Content for the main action part (e.g., text, other elements). Takes precedence over `action-text` attribute.
*   `action-label` (Named slot): Alternative way to provide text content for the action part, can be useful for more complex structures if default slot is used for other things.

**Events:**

*   `action-click`: Fired when the main action part is clicked. `event.detail` may contain `{originalEvent: MouseEvent}`.
*   `dropdown-click`: Fired when the dropdown arrow part is clicked. `event.detail` may contain `{originalEvent: MouseEvent}`. The user of the component is responsible for displaying a menu/popover.

**Example:**

```html
<adw-split-button
  action-icon-name="media-playback-start-symbolic"
  suggested
  dropdown-aria-label="Run options"
  id="run-split-btn">
  Run <!-- This text goes into the default slot -->
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

# ToggleGroup

An AdwToggleGroup manages a collection of `AdwToggleButton` elements, ensuring that only one button within the group can be active at a time (similar to a radio button group). It can also style the buttons as a single, visually linked unit.

## JavaScript Factory: `Adw.createAdwToggleGroup()`

Creates an Adwaita-styled toggle group.

**Signature:**

```javascript
Adw.createAdwToggleGroup(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `buttons` (Array<Object | HTMLElement>, optional): An array of
        `AdwToggleButton` option objects (passed to `Adw.createAdwToggleButton`)
        or pre-created `AdwToggleButton` elements. Each button should have a
        unique `value`.
    *   `linked` (Boolean, optional): If `true`, styles the buttons as a single
        linked group (e.g., like segments of a segmented button). Defaults to
        `false`.
    *   `activeValue` (String, optional): The `value` of the button to be initially
        active.
    *   `onActiveChanged` (Function, optional): Callback when the active button
        changes. Receives the `value` of the newly active button (or `null` if
        none become active, though typically one is always active in a group).

**Returns:**

*   `(HTMLDivElement)`: The `<div>` container for the toggle group. It's augmented with methods:
    *   `getValue() -> String | null`: Returns the value of the currently active button.
    *   `setValue(valueToActivate: String)`: Sets the active button by its value.

**Example:**

```html
<div id="js-togglegroup-container" style="padding: 10px;"></div>
<script>
  const container = document.getElementById('js-togglegroup-container');

  // Standard ToggleGroup
  const alignmentGroup = Adw.createAdwToggleGroup({
    buttons: [
      { label: "Left", value: "left" /*, icon: "format-justify-left-symbolic" */ },
      { label: "Center", value: "center", active: true },
      { label: "Right", value: "right" }
    ],
    onActiveChanged: (value) => {
      Adw.createToast(`Alignment changed to: ${value}`);
      document.body.style.textAlign = value; // Demo effect
    }
  });
  container.appendChild(Adw.createLabel("Text Alignment:"));
  container.appendChild(alignmentGroup);

  container.appendChild(document.createElement('br'));

  // Linked ToggleGroup
  const viewModeGroup = Adw.createAdwToggleGroup({
    buttons: [
      { label: "List", value: "list-view" },
      { label: "Grid", value: "grid-view" }
    ],
    linked: true,
    activeValue: "grid-view",
    onActiveChanged: (value) => Adw.createToast(`View mode: ${value}`)
  });
  container.appendChild(Adw.createLabel("View Mode:"));
  container.appendChild(viewModeGroup);

  // Programmatically change active value
  setTimeout(() => {
    // viewModeGroup.setValue("list-view");
  }, 3000);
</script>
```

## Web Component: `<adw-toggle-group>`

A declarative way to define Adwaita toggle groups.

**HTML Tag:** `<adw-toggle-group>`

**Attributes:**

*   `linked` (Boolean, optional): If present, styles buttons as a linked group.
*   `active-value` (String, optional): The `value` of the initially active child `<adw-toggle-button>`.

**Slots:**

*   Default slot: Place `<adw-toggle-button>` elements here. Each button should have a unique `value` attribute.

**Properties:**

*   `value` (String): Gets or sets the value of the active button in the group.

**Events:**

*   `active-changed`: Fired when the active button changes. `event.detail` contains `{ value: String | null }`.

**Example:**

```html
<div style="padding: 10px;">
  <p>Editor Mode:</p>
  <adw-toggle-group active-value="visual" id="editor-mode-group">
    <adw-toggle-button label="Visual" value="visual"></adw-toggle-button>
    <adw-toggle-button label="Code" value="code"></adw-toggle-button>
    <adw-toggle-button label="Preview" value="preview" disabled></adw-toggle-button>
  </adw-toggle-group>

  <p style="margin-top: 1em;">File Type (Linked):</p>
  <adw-toggle-group linked id="file-type-group">
    <adw-toggle-button value="doc">Document</adw-toggle-button>
    <adw-toggle-button value="sheet" active>Spreadsheet</adw-toggle-button>
    <adw-toggle-button value="slide">Presentation</adw-toggle-button>
  </adw-toggle-group>
</div>

<script>
  const editorModeGroup = document.getElementById('editor-mode-group');
  editorModeGroup.addEventListener('active-changed', (event) => {
    Adw.createToast(`Editor mode set to: ${event.detail.value}`);
  });

  const fileTypeGroup = document.getElementById('file-type-group');
  // Programmatically change active button in the linked group
  // setTimeout(() => { fileTypeGroup.value = "doc"; }, 2500);
</script>
```

## Styling

*   Primary SCSS: `scss/_toggle_group.scss` (and uses `_toggle_button.scss`, `_button.scss`).
*   When `linked`, child buttons have their borders adjusted to appear connected (e.g., shared borders, rounded corners only on the ends of the group).
*   The group itself is a flex container.
*   Spacing between non-linked buttons is managed by their margins or `gap` on the group.

---
Next: [NavigationSplitView](./navigationsplitview.md)

# ToggleButton

An AdwToggleButton is a button that maintains an active (pressed) or inactive state. It's often used for options that can be turned on or off, or as part of an `AdwToggleGroup` where only one button can be active at a time.

## JavaScript Factory: `Adw.createAdwToggleButton()`

Creates an Adwaita-styled toggle button.

**Signature:**

```javascript
Adw.createAdwToggleButton(text, options = {}) -> HTMLButtonElement (with methods)
```

**Parameters:**

*   `text` (String): The text content of the button.
*   `options` (Object, optional): Configuration options, extending `Adw.createButton` options:
    *   `active` (Boolean, optional): Initial active state. Defaults to `false`.
    *   `onToggled` (Function, optional): Callback when the button is toggled by user interaction or programmatically if `fireCallback` is true in `setActive`. Receives `(isActive: boolean, value?: string)`.
    *   `value` (String, optional): A value associated with the button, useful when part of a group.
    *   Other `Adw.createButton` options like `icon`, `flat` (defaults to `true`), `suggested`, `destructive`, `disabled`, `isCircular` are also applicable.

**Returns:**

*   `(HTMLButtonElement)`: The created toggle button element. It's augmented with methods:
    *   `setActive(state: boolean, fireCallback?: boolean)`: Programmatically sets the active state. `fireCallback` defaults to `true`.
    *   `isActive() -> boolean`: Returns the current active state.

**Example:**

```html
<div id="js-togglebutton-container" style="display: flex; gap: 10px; padding: 10px;"></div>
<script>
  const container = document.getElementById('js-togglebutton-container');

  // Standalone ToggleButton
  const boldToggle = Adw.createAdwToggleButton("B", {
    // icon: "format-text-bold-symbolic", // Example if using icon font
    value: "bold",
    onToggled: (isActive, value) => {
      Adw.createToast(`Bold is now ${isActive ? 'ON' : 'OFF'} (Value: ${value})`);
      document.body.style.fontWeight = isActive ? 'bold' : 'normal'; // Demo effect
    }
  });
  container.appendChild(boldToggle);

  // Another toggle, initially active
  const italicToggle = Adw.createAdwToggleButton("I", {
    active: true,
    value: "italic",
    onToggled: (isActive) => Adw.createToast(`Italic is ${isActive ? 'ON' : 'OFF'}`)
  });
  container.appendChild(italicToggle);

  // Programmatically toggle after a delay
  setTimeout(() => {
    if (boldToggle.setActive) boldToggle.setActive(true); // Programmatically activate bold
  }, 2000);
</script>
```

## Web Component: `<adw-toggle-button>`

A declarative way to define Adwaita toggle buttons.

**HTML Tag:** `<adw-toggle-button>`

**Attributes:**

*   `label` (String, optional): Text for the button. If not provided, uses text content.
*   `active` (Boolean, optional): Initial active state.
*   `disabled` (Boolean, optional): Disables the button.
*   `value` (String, optional): A value associated with the button.
*   `icon` (String, optional): HTML for an icon.
*   `flat` (Boolean, optional): Default `true`. Set to `"false"` for a non-flat toggle button.
*   `suggested`, `destructive`, `circular`: Standard button styling attributes.

**Properties:**

*   `active` (Boolean): Gets or sets the active state.
*   `value` (String): Gets or sets the button's value.

**Events:**

*   `toggled`: Fired when the button's active state changes due to user interaction or programmatic change that fires callbacks. `event.detail` contains `{ isActive: boolean, value?: string }`.
*   `adw-toggle-button-clicked`: (Internal) Fired on click, primarily for `AdwToggleGroup` to manage state. `event.detail` contains `{ value?: string, currentState: boolean }`.

**Example:**

```html
<div style="display: flex; gap: 10px; padding: 10px;">
  <adw-toggle-button label="Mute" value="mute" id="mute-toggle">
    <!-- Icon could be slotted or via attribute -->
  </adw-toggle-button>

  <adw-toggle-button active value="notifications" icon="<svg viewBox='0 0 16 16'><!-- Bell icon --><path d='M8 16a2 2 0 001.92-1.45L8 12.9l-1.92 1.65A2 2 0 008 16zm6-4.77V8.5a6 6 0 00-4.78-5.95L9 2a1 1 0 00-2 0l-.22.55A6 6 0 002 8.5v2.73L.5 13.5V14h15v-.5L14 11.23zM4 8.5A4 4 0 018 4.5a4 4 0 014 4V11H4V8.5z'/></svg>">
    Notifications
  </adw-toggle-button>
</div>

<script>
  const muteToggle = document.getElementById('mute-toggle');
  muteToggle.addEventListener('toggled', (event) => {
    Adw.createToast(`Mute is now ${event.detail.isActive ? 'ON' : 'OFF'}`);
  });

  // Programmatically toggle mute
  // setTimeout(() => { muteToggle.active = true; }, 2000);
</script>
```

## Styling

*   Primary SCSS: `scss/_toggle_button.scss` (if exists), `scss/_button.scss`.
*   Toggle buttons are often styled as `flat` buttons by default.
*   The `active` state (or `aria-pressed="true"`) receives distinct styling, often similar to a button's `:active` pseudo-class or using `accent-bg-color`.

---
Next: [ToggleGroup](./togglegroup.md)

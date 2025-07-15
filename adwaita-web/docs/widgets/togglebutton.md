# ToggleButton

An AdwToggleButton is a button that maintains an active (pressed) or inactive state. It's often used for options that can be turned on or off, or as part of an `AdwToggleGroup` where only one button can be active at a time.

## JavaScript Factory: `Adw.ToggleButton.factory()` or `createAdwToggleButton()`

Creates an `<adw-toggle-button>` Web Component instance.

**Signature:**

```javascript
Adw.ToggleButton.factory(text, options = {}) -> AdwToggleButtonElement
// or createAdwToggleButton(text, options = {}) -> AdwToggleButtonElement
```

**Parameters:**

*   `text` (String, optional): Text content for the button. Sets the `label` attribute if provided, otherwise the component uses its textContent.
*   `options` (Object, optional): Configuration options, mapped to attributes of the `<adw-toggle-button>`:
    *   `active` (Boolean, optional): Sets the `active` attribute. Defaults to `false`.
    *   `onToggled` (Function, optional): Callback function for the `toggled` event. Receives an event with `event.detail = { isActive: boolean, value?: string }`.
    *   `value` (String, optional): Sets the `value` attribute.
    *   `iconName` (String, optional): Name of an Adwaita icon. Sets the `icon-name` attribute.
    *   `icon` (String, optional): **Deprecated.** Use `iconName`.
    *   `flat` (Boolean, optional): If `false`, sets `flat="false"`. Otherwise, it's flat by default.
    *   `suggested`, `destructive`, `disabled`, `circular`: Boolean attributes.

**Returns:**

*   `(AdwToggleButtonElement)`: The created `<adw-toggle-button>` Web Component instance.

**Example:**

```html
<div id="js-togglebutton-container" style="display: flex; gap: 10px; padding: 10px;"></div>
<script>
  // Assuming createAdwToggleButton is globally available
  const container = document.getElementById('js-togglebutton-container');

  // Standalone ToggleButton
  const boldToggle = createAdwToggleButton("B", {
    iconName: "format-text-bold-symbolic",
    value: "bold",
    onToggled: (event) => { // Event listener for 'toggled'
      const { isActive, value } = event.detail;
      const state = isActive ? 'ON' : 'OFF';
      Adw.createToast(`Bold is now ${state} (Value: ${value})`);
      document.body.style.fontWeight = isActive ? 'bold' : 'normal'; // Demo effect
    }
  });
  container.appendChild(boldToggle);

  // Another toggle, initially active
  const italicToggle = createAdwToggleButton("I", {
    active: true, // Sets the 'active' attribute
    value: "italic",
    onToggled: (event) => Adw.createToast(`Italic is ${event.detail.isActive ? 'ON' : 'OFF'}`)
  });
  container.appendChild(italicToggle);

  // Programmatically toggle after a delay by setting the 'active' attribute/property
  setTimeout(() => {
    boldToggle.active = true; // Or boldToggle.setAttribute('active', '');
  }, 2000);
</script>
```

## Web Component: `<adw-toggle-button>`

A declarative way to define Adwaita toggle buttons.

**HTML Tag:** `<adw-toggle-button>`

**Attributes:**

*   `label` (String, optional): Text for the button. If not provided, the component uses its textContent (default slot).
*   `active` (Boolean attribute): Presence indicates the active/pressed state.
*   `disabled` (Boolean attribute): Presence disables the button.
*   `value` (String, optional): A value associated with the button.
*   `icon-name` (String, optional): Name of an Adwaita icon (e.g., `format-text-bold-symbolic`).
*   `icon` (String, optional): **Deprecated.** Use `icon-name`.
*   `flat` (String, optional): Defaults to being flat. Set `flat="false"` for a non-flat (raised) toggle button.
*   `suggested`, `destructive`, `circular`: Standard boolean button styling attributes.

**Properties:**

*   `active` (Boolean): Gets or sets the active state (reflects the `active` attribute).
*   `value` (String): Gets or sets the button's value (reflects the `value` attribute).

**Events:**

*   `toggled`: Fired when the button's `active` state changes. `event.detail` contains `{ isActive: boolean, value?: string }`.
*   `toggle-intent`: Fired on click before the state changes. This event is `cancelable`. If `event.preventDefault()` is called by a listener (e.g., an `adw-toggle-group`), the button will not toggle its own state. `event.detail` contains `{ value?: string, currentState: boolean }`.

**Slots:**

*   Default slot: Content for the button, typically text. Takes precedence over the `label` attribute.

**Example:**

```html
<div style="display: flex; gap: 10px; padding: 10px;">
  <adw-toggle-button value="mute" id="mute-toggle" icon-name="audio-volume-muted-symbolic">
    Mute
  </adw-toggle-button>

  <adw-toggle-button active value="notifications" icon-name="appointment-soon-symbolic">
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

# Switch

An `AdwSwitch` is a toggle control that allows users to switch between two states, typically "on" and "off" or "active" and "inactive". Adwaita Web provides styling for switches via the `.adw-switch` CSS class and an `<adw-switch>` Web Component.

This component is essential for `AdwSwitchRow`.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createSwitch()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on the CSS classes with the specified HTML structure, or the `<adw-switch>` Web Component.)*

## Web Component: `<adw-switch>`

A declarative way to create Adwaita switches.

**HTML Tag:** `<adw-switch>`

**Attributes:**

*   `active` (Boolean, optional): If present, the switch is initially "on". Can be dynamically changed.
*   `disabled` (Boolean, optional): If present, the switch is non-interactive.

**Properties:**
*   `active` (Boolean): Gets or sets the state of the switch.
*   `disabled` (Boolean): Gets or sets the disabled state of the switch.

**Events:**

*   `change`: Fired when the switch state changes. `event.detail` often contains an object like `{ active: true/false }`.
*   `input`: Similar to `change`, may fire as the user interacts. (Standard for form-like elements)

**Example:**

```html
<adw-switch></adw-switch> <!-- Off by default -->
<br/>
<adw-switch active></adw-switch> <!-- On by default -->
<br/>
<adw-switch active disabled></adw-switch> <!-- On and disabled -->
<br/>
<adw-switch id="my-dynamic-switch"></adw-switch>
<script>
  const mySwitch = document.getElementById('my-dynamic-switch');
  mySwitch.addEventListener('change', (event) => {
    console.log('Switch changed:', event.target.active);
    // Or console.log('Switch changed via event.detail:', event.detail.active);
  });
  // To change programmatically:
  // mySwitch.active = true;
</script>
```

## HTML Structure (for CSS Styling)

The CSS for `.adw-switch` expects a specific HTML structure, which is typically encapsulated by the `<adw-switch>` web component or created by the JavaScript factory. If styling manually, it would look like:

```html
<label class="adw-switch">
  <input type="checkbox"> <!-- The actual state holder -->
  <span class="adw-switch-slider"></span> <!-- Visual representation of track and knob (via ::before) -->
</label>
```
Or using a `div` as the root and associating a separate `<label>` using `for`:
```html
<div class="adw-switch">
  <input type="checkbox" id="my-standalone-switch">
  <span class="adw-switch-slider"></span>
</div>
<label for="my-standalone-switch">My Setting</label> <!-- Optional external label -->
```

## Styling Details

*   **SCSS Source:** `scss/_switch.scss`
*   **Key Components & States:**
    *   `.adw-switch`: The main container. Defines width (44px) and height (24px).
    *   `input[type="checkbox"]`: Hidden visually but holds the actual checked/unchecked state.
    *   `.adw-switch-slider`: The visual track of the switch.
        *   **Off State:** Background uses `var(--switch-slider-off-bg-color)`.
        *   **On State (when `input:checked + .adw-switch-slider`):** Background uses `var(--accent-bg-color)`.
        *   The knob is created using the `::before` pseudo-element of the slider.
            *   Knob background: `var(--switch-knob-bg-color)`.
            *   Knob moves via `transform: translateX(20px)` when checked.
    *   **Disabled States:**
        *   **Off & Disabled:** Slider uses `var(--switch-slider-disabled-off-bg-color)`. Knob uses `var(--switch-knob-disabled-bg-color)` and loses shadow.
        *   **On & Disabled:** Slider uses `var(--accent-bg-color)` but with `var(--disabled-opacity)`. Knob color remains standard but loses shadow.
    *   **Focus State (`input:focus-visible + .adw-switch-slider`):** An outline (`2px solid var(--accent-color)`) is applied to the slider.
*   **Theming Variables:**
    *   `--accent-bg-color` (for "on" track)
    *   `--switch-slider-off-bg-color`
    *   `--switch-knob-bg-color`
    *   `--switch-slider-disabled-off-bg-color`
    *   `--switch-knob-disabled-bg-color`
    *   `--disabled-opacity`
    *   `--accent-color` (for focus ring)
*   Transitions are applied for smooth visual changes.

---
Related: [SwitchRow](./switchrow.md) (uses `AdwSwitch`)
```

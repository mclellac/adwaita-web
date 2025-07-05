# ToggleGroup

The `.adw-toggle-group` class styles a container and its button children to function as an Adwaita Toggle Group. This is typically used for a set of exclusive toggles, often presented as segmented buttons. It's based on Libadwaita's `AdwToggleGroup`.

## Basic Usage

Apply the `.adw-toggle-group` class to a container element (e.g., a `<div>`). Inside this container, place button elements (e.g., `<button class="adw-button">`). The button corresponding to the active/pressed state should have the `.active` class or the `aria-pressed="true"` attribute.

```html
<div class="adw-toggle-group">
  <button class="adw-button active" aria-pressed="true">Option 1</button>
  <button class="adw-button" aria-pressed="false">Option 2</button>
  <button class="adw-button" aria-pressed="false">Option 3</button>
</div>
```

## Appearance and Variants

By default, an `.adw-toggle-group` may appear as a set of closely spaced individual buttons. The `.linked` class is commonly used to make them visually connected.

### Linked Style (Default Adwaita Appearance)

Add the `.linked` class to the `.adw-toggle-group` container to make the buttons appear as a single, segmented control. This is the most common appearance for toggle groups in Adwaita.

```html
<div class="adw-toggle-group linked">
  <button class="adw-button active">Left</button>
  <button class="adw-button">Center</button>
  <button class="adw-button">Right</button>
</div>
```
-   The group has an outer border.
-   Buttons inside have no individual borders except for separators between them.
-   The first and last buttons have rounded corners matching the group.

### Active State

The button with the `.active` class (or `aria-pressed="true"`) is styled using:
-   `--active-toggle-bg-color`
-   `--active-toggle-fg-color`
-   Font weight may be bolder (e.g., `var(--font-weight-bold)`).

### Flat Style

Add the `.flat` class for a borderless appearance, where buttons are flat and typically separated by subtle lines.

```html
<div class="adw-toggle-group linked flat">
  <button class="adw-button active">Day</button>
  <button class="adw-button">Week</button>
  <button class="adw-button">Month</button>
</div>
```

### Round Style

Add the `.round` class. If also `.linked`, the entire group becomes pill-shaped. If not `.linked`, individual buttons become pill-shaped.

```html
<div class="adwaita-web/scss/.adw-toggle-group linked round">
  <button class="adw-button active">View A</button>
  <button class="adw-button">View B</button>
</div>
```

### Vertical Orientation

Add the `.vertical` class to arrange the buttons vertically. This can be combined with `.linked`, `.flat`, and `.round`.

```html
<div class="adw-toggle-group linked vertical">
  <button class="adw-button active">Top</button>
  <button class="adw-button">Middle</button>
  <button class="adw-button">Bottom</button>
</div>
```

## Interactivity

As Adwaita Skin is a pure CSS library, the logic for managing the toggle state (which button is active) must be implemented with your own JavaScript. This typically involves:
- Listening for click events on the buttons.
- Updating the `.active` class (and/or `aria-pressed` attribute) on the clicked button and removing it from others in the group.

## CSS Variables Used

-   `--button-border-color`, `--border-color`
-   `--border-radius-default`, `--border-radius-small`
-   `--spacing-xxs`, `--spacing-xs`, `--spacing-s`
-   `--button-bg-color`, `--button-fg-color`
-   `--button-flat-hover-bg-color`
-   `--active-toggle-bg-color`, `--active-toggle-fg-color`
-   `--font-weight-bold` (for active button)
-   `--disabled-opacity`
-   `--pill-button-border-radius` (for `.round` variant)
-   `--accent-bg-color`, `--accent-fg-color` (Note: Default active toggles use `--active-toggle-*` vars, but if `.suggested-action` were applied to a toggle, it would use accent.)

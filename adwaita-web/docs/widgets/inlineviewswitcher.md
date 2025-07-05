# InlineViewSwitcher

The `.adw-inline-view-switcher` class styles a container to look and behave like an Adwaita Inline View Switcher. This component is typically used for switching between a small number of views, often presented as a group of connected, styled buttons.

It visually an `AdwToggleGroup` and shares its styling and variants.

## Basic Usage

Apply the `.adw-inline-view-switcher` class to a container element (e.g., a `<div>`). Inside this container, place button elements (e.g., `<button class="adw-button">`). The button corresponding to the active view should have the `.active` class.

```html
<div class="adw-inline-view-switcher">
  <button class="adw-button active">View 1</button>
  <button class="adw-button">View 2</button>
  <button class="adw-button">View 3</button>
</div>
```

## Styling and Variants

The `.adw-inline-view-switcher` inherits its core styling from `.adw-toggle-group`. This includes:

*   **Default:** A group of buttons with a shared border, looking like a segmented control.
*   **Active State:** The button with the `.active` class (or `[aria-pressed="true"]`) will be highlighted using `var(--accent-bg-color)` and `var(--accent-fg-color)`.
*   **Hover State:** Buttons will show a hover effect.

### Flat Style

Add the `.flat` class to make the inline view switcher appear as a series of flat buttons, often with subtle separators.

```html
<div class="adw-inline-view-switcher flat">
  <button class="adw-button active">Day</button>
  <button class="adw-button">Week</button>
  <button class="adw-button">Month</button>
</div>
```

### Round Style

Add the `.round` class to make the group (if linked) or individual buttons (if not linked by default styling of toggle group) pill-shaped.

```html
<div class="adw-inline-view-switcher round">
  <button class="adw-button active">Left</button>
  <button class="adw-button">Center</button>
  <button class="adw-button">Right</button>
</div>
```

### Vertical Orientation

Add the `.vertical` class to arrange the buttons vertically.

```html
<div class="adw-inline-view-switcher vertical">
  <button class="adw-button active">Option A</button>
  <button class="adw-button">Option B</button>
</div>
```

Refer to the [ToggleGroup](./togglegroup.md) documentation for more details on the base styling provided by `.adw-toggle-group`.

## Interactivity

As Adwaita Skin is a pure CSS library, the logic for switching views when a button is clicked must be implemented with your own JavaScript. This typically involves:
- Listening for click events on the buttons.
- Updating the `.active` class on the clicked button and removing it from others.
- Showing the corresponding content panel and hiding others.

## CSS Variables Used

Primarily inherits variables used by `.adw-toggle-group` and `.adw-button`, including:
- `var(--button-border-color)`
- `var(--border-radius-default)`, `var(--border-radius-small)`
- `var(--spacing-xxs)`, `var(--spacing-xs)`, `var(--spacing-s)`
- `var(--button-bg-color)`, `var(--button-fg-color)`
- `var(--button-flat-hover-bg-color)`
- `var(--accent-bg-color)`, `var(--accent-fg-color)`
- `var(--font-weight-bold)` (for active button)
- `var(--disabled-opacity)`
- `var(--pill-button-border-radius)` (for `.round` variant)

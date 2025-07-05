# ShortcutLabel

The `.adw-shortcut-label` class is used to style an element representing a keyboard shortcut. It typically displays key combinations like "Ctrl+S" or single keys like "Esc".

## Basic Usage

Apply the `.adw-shortcut-label` class to an inline element like `<span>` or `<kbd>`.

```html
<span class="adw-shortcut-label">Ctrl+N</span>
<span class="adw-shortcut-label">Shift+F10</span>
<span class="adw-shortcut-label">Esc</span>
```

## Appearance

-   Uses a monospace font for clarity.
-   Has a subtle background color, slightly offset from the main view background.
-   Includes a border and a small border radius, giving it a "lozenge" or "keycap" feel.
-   A subtle inset bottom shadow provides a slight 3D effect.

## CSS Variables Used (from `_variables.scss`)

-   `--monospace-font-family`
-   `--font-size-small`
-   `--window-fg-color` (for text and mixed into background)
-   `--view-bg-color` (mixed into background)
-   `--border-color`
-   `--border-radius-small`
-   `--spacing-xxs`, `--spacing-xs` (for padding)

## Customization

You can customize the appearance by overriding the above CSS variables or by targeting `.adw-shortcut-label` with your own CSS.
The font, background, border, and padding can be adjusted as needed.

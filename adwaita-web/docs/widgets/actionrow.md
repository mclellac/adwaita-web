# ActionRow

An ActionRow is a specialized type of `AdwRow` designed for presenting an action or navigation item, often with a title, subtitle, and an optional icon or chevron. It's commonly used within an `AdwListBox`.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createActionRow()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on the CSS classes with manual HTML structure, or the `<adw-action-row>` Web Component if available.)*

## HTML Structure (for CSS Styling)

To create an action row manually, you would typically use a `div` with the class `.adw-action-row` and structure its content using helper classes:

```html
<div class="adw-action-row activatable">
  <div class="adw-action-row-prefix">
    <span class="adw-icon icon-settings-symbolic"></span> <!-- Example -->
  </div>
  <div class="adw-action-row-content">
    <span class="adw-action-row-title">Settings</span>
    <span class="adw-action-row-subtitle">Configure application preferences</span>
  </div>
  <div class="adw-action-row-suffix">
    <span class="adw-icon adw-action-row-chevron"></span> <!-- Navigational chevron -->
  </div>
</div>
```
*   Add `.activatable` if the row should have hover/active states and be clickable.
*   `.adw-action-row-prefix`: For icons or widgets at the start.
*   `.adw-action-row-content`: Wraps title and subtitle.
*   `.adw-action-row-title`, `.adw-action-row-subtitle`: For text content.
*   `.adw-action-row-suffix`: For icons (like chevrons) or widgets (like switches, spinners) at the end.

## Web Component: `<adw-action-row>`

A declarative way to define Adwaita action rows.

**HTML Tag:** `<adw-action-row>`

**Attributes:**

*   `title` (String, required): The main title text.
*   `subtitle` (String, optional): Subtitle text.
*   `icon` (String, optional): HTML string for an SVG icon or an icon font class
    for the start icon.
*   `show-chevron` (Boolean, optional): If present, displays a navigation chevron
    at the end.
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
  <adw-action-row title="Display" subtitle="Resolution, Brightness, Night Light"
                  show-chevron>
    <!-- You can also put an icon via attribute or slot="prefix" -->
    <span slot="prefix"
          style="font-size: 20px; margin-right: var(--spacing-s);">🖥️</span>
  </adw-action-row>

  <adw-action-row title="Sound" show-chevron>
    <adw-spinner slot="suffix" active size="small"></adw-spinner>
  </adw-action-row>

  <adw-action-row title="Privacy" subtitle="Location Services, Camera Access"
                  icon="<svg viewBox='0 0 16 16'><!-- lock icon --><path d='M8 1a2...'/></svg>"
                  show-chevron>
  </adw-action-row>

  <adw-action-row title="Disabled Action" subtitle="This action is not available"
                  disabled show-chevron>
  </adw-action-row>
</adw-list-box>

<script>
  document.querySelector('adw-action-row[title="Display"]').addEventListener('click', () => {
    Adw.createToast("Display settings clicked!");
  });
</script>
```

## Styling

*   **SCSS Source:** `scss/_action_row.scss`. Inherits base row styles through `@include mixins.row-base`.
*   **Key Visual Aspects:**
    *   **Layout:** Uses flexbox. Default `gap` is `var(--spacing-m)`.
    *   **Padding & Height:** Typically `12px` top/bottom padding, aiming for standard Adwaita row heights (e.g., ~54px single line, ~70px with subtitle).
    *   **Shadow:** Standalone ActionRows or those in flat listboxes have a `var(--subtle-box-shadow)`.
    *   **Prefix/Suffix Icons:**
        *   General icons (e.g., in `.adw-action-row-prefix` or as part of a suffix widget) use `var(--secondary-fg-color)` and are typically 16px.
        *   Chevron icon (`.adw-action-row-chevron` in suffix for navigation) uses `pan-next-symbolic.svg` (or `go-next-symbolic.svg`), `currentColor` (thus `var(--secondary-fg-color)`), and `var(--icon-opacity)`.
    *   **Title (`.adw-action-row-title`):** Normal weight, `var(--window-fg-color)`, ellipsis for overflow.
    *   **Subtitle (`.adw-action-row-subtitle`):** Small size, `var(--secondary-fg-color)`, ellipsis for overflow. `margin-top: var(--spacing-xxs)`.
    *   **Activatable State (`.activatable` class):**
        *   Cursor becomes `pointer`.
        *   Hover: `background-color: var(--list-row-hover-bg-color)`.
        *   Active (pressed): `background-color: var(--list-row-active-bg-color)`.
        *   Focus: Standard outline `var(--focus-ring-width) solid var(--accent-color)` with `var(--focus-outline-offset)`.
    *   **Property Variant (`.property` class):**
        *   Title becomes de-emphasized (normal weight, `var(--secondary-fg-color)`).
        *   Subtitle becomes emphasized (`var(--primary-fg-color)`, normal weight, full opacity).
        *   If also `.monospace`, subtitle uses `var(--font-family-monospace)`.
    *   **Monospace Variant (`.monospace` class, if not also `.property`):**
        *   Subtitle uses `var(--font-family-monospace)`.
    *   **Destructive Variant (`.destructive-action` class):**
        *   Title color becomes `var(--destructive-color)`.
*   **Theming:**
    *   Background color from `var(--list-row-bg-color)`.
    *   Interactive states use variables like `var(--list-row-hover-bg-color)`, `var(--list-row-active-bg-color)`.
    *   Text colors primarily from `var(--window-fg-color)` and `var(--secondary-fg-color)`.

Refer to `scss/_action_row.scss` and [Theming Reference](../general/theming.md) for full details.

---
Next: [EntryRow](./entryrow.md)

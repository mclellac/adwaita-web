# ButtonRow

The `.adw-button-row` class styles a list row to look and behave like a button. This is often used in preferences or lists where an entire row should be an activatable target with button-like feedback. It's based on Libadwaita's `AdwButtonRow`.

## Basic Usage

Apply the `.adw-button-row` class to a `<div>` or other suitable block element, typically within an `.adw-list-box`.

```html
<div class="adw-list-box boxed-list">
  <div class="adw-button-row">
    <span class="adw-button-row-icon">
      <!-- Optional: place an .adw-icon or svg here -->
    </span>
    <span class="adw-button-row-title">Clickable Row Action</span>
  </div>
  <div class="adw-button-row suggested-action">
    <span class="adw-button-row-title">Suggested Action Row</span>
  </div>
  <div class="adw-button-row destructive-action">
    <span class="adw-button-row-title">Destructive Action Row</span>
  </div>
  <div class="adw-button-row" disabled>
    <span class="adw-button-row-title">Disabled Button Row</span>
  </div>
</div>
```

## Appearance and Behavior

-   **Base Styling:** Inherits general row structure (e.g., from `row-base` mixin) and button visual styles (e.g., from `.adw-button`).
-   **Layout:** Uses flexbox to align content. Text is typically left-aligned.
-   **Padding:** Uses row padding variables, which are generally less than standalone button padding.
-   **Borders:** Designed to integrate into list contexts. It typically has no visible border itself; separators are handled by the parent `.adw-list-box` (especially with `.boxed-list` style).
-   **States:** Supports `:hover`, `:active`, and `:focus-visible` states, visually similar to an `.adw-button`.
-   **Variants:** Can be combined with `.suggested-action` or `.destructive-action` classes to adopt those button styles.
-   **Disabled:** Can be disabled using the `disabled` attribute or `.disabled` class.

## HTML Structure

A common structure includes:
-   An optional icon area (e.g., `<span class="adw-button-row-icon">...</span>`).
-   A title (e.g., `<span class="adw-button-row-title">...</span>`).

## CSS Variables Used

Inherits variables from both row styling and button styling:
-   `--row-padding-vertical-default`, `--row-padding-horizontal-default`
-   `--button-bg-color`, `--button-fg-color`, `--button-hover-bg-color`, `--button-active-bg-color`
-   `--accent-bg-color`, `--accent-fg-color` (for suggested/active states)
-   `--destructive-bg-color`, `--destructive-fg-color`
-   `--focus-ring-color`, `--focus-ring-width`
-   `--disabled-opacity`

## Interactivity

Click handling and actions must be implemented with JavaScript. Adwaita Skin only provides the styling.

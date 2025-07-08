# Entry CSS Styling (Adwaita Skin)

Entries are input fields that allow users to enter a single line of text. Adwaita Skin provides CSS classes to style standard HTML `<input>` and `<textarea>` elements to look like Adwaita entries.

## HTML Structure and CSS Classes

To style an HTML `<input>` or `<textarea>` element as an Adwaita entry, apply the base class `adw-entry` or `adw-textarea` respectively.

**Basic Text Entry:**
```html
<input type="text" class="adw-entry" placeholder="Enter text here...">
```

**Textarea Entry:**
```html
<textarea class="adw-textarea" placeholder="Enter multiple lines of text..."></textarea>
```

**Supported Input Types:**
The `.adw-entry` class can be applied to various `<input>` types:
*   `type="text"`
*   `type="password"`
*   `type="email"`
*   `type="search"`
*   `type="url"`
*   `type="tel"`
*   `type="number"`

```html
<input type="password" class="adw-entry" placeholder="Password">
<input type="search" class="adw-entry" placeholder="Search...">
```

## Modifier Classes and States

*   **Disabled State:** Use the `disabled` attribute on the HTML element.
    ```html
    <input type="text" class="adw-entry" value="Cannot edit" disabled>
    ```
*   **Readonly State:** Use the `readonly` attribute.
    ```html
    <input type="text" class="adw-entry" value="Readonly information" readonly>
    ```
*   **Focus State:** Entries show a focus ring using the current accent color (`var(--accent-color)`).
*   **Placeholder Text:** Styled according to Adwaita guidelines (dimmed text).
*   **Validation States:** Apply these classes to the `.adw-entry` or `.adw-textarea` element to indicate validation status. The border and focus ring will change color.
    *   `.error`: For invalid input.
        ```html
        <input type="email" class="adw-entry error" value="not-an-email" placeholder="Email">
        ```
    *   `.warning`: For potentially problematic input.
        ```html
        <input type="text" class="adw-entry warning" placeholder="Username is very short">
        ```
    *   `.success`: For valid input (less common, but available).
        ```html
        <input type="text" class="adw-entry success" placeholder="Username available">
        ```

## Entry with Icons

To add icons inside an entry (e.g., a search icon or a clear button), use the `.adw-entry-wrapper` container:

```html
<div class="adw-entry-wrapper">
  <span class="adw-entry-icon start">
    <svg><!-- search icon --></svg>
  </span>
  <input type="search" class="adw-entry with-icon-start with-icon-end" placeholder="Search...">
  <button class="adw-entry-icon end interactive" aria-label="Clear search">
    <svg><!-- clear icon --></svg>
  </button>
</div>
```
*   Add `.with-icon-start` or `.with-icon-end` to the `.adw-entry` to adjust its padding.
*   Icons are placed in `<span>` or `<button>` elements with class `.adw-entry-icon` and either `.start` or `.end`.
*   Add `.interactive` to icon containers if they should be clickable.

## Styling & Theming

*   **SCSS Source:** `scss/_entry.scss`
*   **Key Visual Aspects:**
    *   **Appearance:** Entries have a subtle inset shadow (`box-shadow: inset 0 1px 1px var(--shade-color);`).
    *   **Background:** `var(--view-bg-color)`.
    *   **Text Color:** `var(--window-fg-color)`.
    *   **Border:** `var(--border-width) solid var(--border-color)` for the default state.
    *   **Focus:** Border color changes to `var(--accent-color)`, and an outer focus ring (`0 0 0 var(--focus-ring-width) var(--accent-color)`) is added while maintaining the inset shadow.
    *   **Validation States:** Border and focus ring colors change to `var(--error-color)`, `var(--warning-color)`, or `var(--success-color)`.
    *   **Placeholder:** Uses `currentColor` with `opacity: 0.5`.
    *   **Disabled State:** Uses `var(--disabled-opacity)`.
    *   **Specific Input Type Resets:** For `input[type="number"]` and `input[type="search"]`, default browser spinners and clear buttons (on WebKit/Blink) are removed for a cleaner look.

Refer to the [Theming Reference](../general/theming.md) and `scss/_variables.scss` for more details.

## Interactivity

All entry-related logic (e.g., reading values, validation feedback, icon actions) must be implemented with your own JavaScript. Adwaita Skin only provides the visual styling.

---
Next: [ListBox CSS Styling](./listbox.md)

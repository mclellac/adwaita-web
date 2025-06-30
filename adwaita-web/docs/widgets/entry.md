# Entry CSS Styling (Adwaita Skin)

Entries are input fields that allow users to enter a single line of text. Adwaita Skin provides CSS classes to style standard HTML `<input>` elements (and potentially `<textarea>` for multi-line, though specific textarea styling might need verification) to look like Adwaita entries.

## HTML Structure and CSS Classes

To style an HTML `<input>` element as an Adwaita entry, apply the base class `adw-entry`.

**Basic Text Entry:**

```html
<input type="text" class="adw-entry" placeholder="Enter text here...">
```

**Supported Input Types:**

The `.adw-entry` class can be applied to various `<input>` types, and the browser's default appearance for that type will be styled:
*   `type="text"`
*   `type="password"`
*   `type="email"`
*   `type="search"`
*   `type="url"`
*   `type="tel"`
*   `type="number"` (Note: for more styled number input with steppers, see SpinButton styling if available)

```html
<input type="password" class="adw-entry" placeholder="Password">
<input type="search" class="adw-entry" placeholder="Search...">
```

## Modifier Classes and States

*   `.disabled` or `disabled` attribute: To make an entry appear and behave as disabled.
    ```html
    <input type="text" class="adw-entry" value="Cannot edit" disabled>
    <input type="text" class="adw-entry disabled" value="CSS Disabled">
    ```
    *Note: Using the `disabled` attribute on the `<input>` element is standard and preferred.*

*   Focus State: Entries will typically show a focus ring (often using the accent color) when they are focused by the user. This is handled by `:focus` or `:focus-visible` pseudo-classes in the CSS.

*   Placeholder text is styled according to Adwaita guidelines.

## Examples

**Simple Text Entry:**
```html
<div>
  <label for="username-entry">Username:</label>
  <input type="text" id="username-entry" class="adw-entry" name="username" placeholder="e.g., jdoe">
</div>
```

**Password Entry:**
```html
<div>
  <label for="password-entry">Password:</label>
  <input type="password" id="password-entry" class="adw-entry" name="password" placeholder="Enter your password">
</div>
```

**Search Entry:**
Some Adwaita themes might have specific styling for search entries (e.g., rounded corners, embedded search icon). Check `adwaita-web/examples/` or `scss/_entry.scss` if specific search variants are available via additional classes.
```html
<input type="search" class="adw-entry" placeholder="Search items...">
```

## Styling & Theming

*   **SCSS Source:** `scss/_entry.scss`
*   **CSS Variables:** Entry styles are influenced by general theme variables from `scss/_variables.scss` (e.g., for background color, text color, border color, focus outline color).
    *   `--entry-bg-color` (or general `--view-bg-color`)
    *   `--entry-fg-color` (or general `--view-fg-color`)
    *   `--entry-border-color` (or general `--borders-color`)
    *   `--entry-focus-border-color` (often related to `--accent-color`)
    *   `--entry-placeholder-color`

Refer to `scss/_variables.scss` and `scss/_entry.scss` for a full list of CSS variables that can be used for customization.

## Interactivity

All entry-related logic (e.g., reading values, validation, handling `input` or `change` events) must be implemented with your own JavaScript. Adwaita Skin only provides the visual styling.

```javascript
// Example: Getting the value of an entry
const usernameInput = document.getElementById('username-entry');
usernameInput.addEventListener('input', function() {
  console.log('Username changed to:', usernameInput.value);
});
```

---
Next: [ListBox CSS Styling](./listbox.md)

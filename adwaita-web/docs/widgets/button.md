# Button CSS Styling (Adwaita Skin)

Buttons allow users to trigger actions. Adwaita Skin provides CSS classes to style standard HTML `<button>` and `<a>` elements to look like Adwaita buttons, following Libadwaita conventions.

## HTML Structure and CSS Classes

To style an HTML element as an Adwaita button, apply the base class `adw-button`. Additional modifier classes can be used for different styles and states.

**Basic Button:**
```html
<button class="adw-button">Standard Button</button>
```

**Anchor Styled as a Button:**
```html
<a href="#" class="adw-button">Link Button</a>
```

## Modifier Classes

Apply these classes in addition to `adw-button`:

*   `.suggested-action`: For suggested actions. Uses the current accent color.
    ```html
    <button class="adw-button suggested-action">Save</button>
    ```
*   `.destructive-action`: For destructive actions. Uses destructive colors.
    ```html
    <button class="adw-button destructive-action">Delete</button>
    ```
*   `.flat`: For flat buttons (no background/border unless hovered/active).
    ```html
    <button class="adw-button flat">Flat Button</button>
    ```
*   `.circular`: For circular buttons, typically used for icon-only buttons.
    ```html
    <button class="adw-button circular" aria-label="Add">
      <span class="adw-icon adw-icon-plus-symbolic"></span> <!-- Example icon -->
    </button>
    ```
*   `.pill`: For buttons with a pill shape (fully rounded ends).
    ```html
    <button class="adw-button suggested-action pill">Pill Button</button>
    ```
*   `.raised`: Ensures the button has a raised appearance, especially useful in toolbars where buttons might default to flat.
    ```html
    <div class="adw-header-bar">
      <button class="adw-button raised">Raised in Toolbar</button>
    </div>
    ```
*   `.disabled` or `disabled` attribute: To make a button appear and behave as disabled.
    ```html
    <button class="adw-button" disabled>Disabled Button</button>
    <button class="adw-button disabled">CSS Disabled Button</button>
    ```
    *Note: Using the `disabled` attribute on the `<button>` element is the standard HTML way and is preferred for accessibility and behavior.*

### Icons in Buttons
For icon buttons, include your icon element (e.g., `<span>` with icon font classes, or an inline `<svg>`) inside the button.

**Button with Icon and Text:**
```html
<button class="adw-button">
  <span class="adw-icon adw-icon-document-save-symbolic" role="img" aria-hidden="true"></span>
  Save
</button>
```

**Icon-only Circular Flat Button:**
```html
<button class="adw-button flat circular" aria-label="Edit">
  <span class="adw-icon adw-icon-edit-symbolic"></span>
</button>
```
*(Icon class names like `adw-icon-....-symbolic` depend on your project's icon setup. Refer to `scss/_icon.scss` or examples.)*

## Examples

**Standard Suggested Action Button:**
```html
<button class="adw-button suggested-action">Submit</button>
```

**Destructive Flat Button with Text:**
```html
<button class="adw-button destructive-action flat">Delete Item</button>
```

## Styling & Theming

*   **SCSS Source:** `scss/_button.scss`
*   **CSS Variables:** Button styles are primarily determined by semantic CSS custom properties defined in `scss/_variables.scss`.
    *   **Default buttons** use variables like `var(--window-bg-color)` (or `var(--view-bg-color)`) for background, `var(--window-fg-color)` for text, and `var(--border-color)` for borders.
    *   `.suggested-action` buttons use `var(--accent-bg-color)` for background and `var(--accent-fg-color)` for text. Flat suggested buttons use `var(--accent-color)` for text.
    *   `.destructive-action` buttons use `var(--destructive-bg-color)` and `var(--destructive-fg-color)`. Flat destructive buttons use `var(--destructive-color)` for text.
    *   Focus rings use `var(--focus-ring-color)` (which defaults to `var(--accent-color)`).
    *   Hover and active states are derived from these base colors.

Refer to the [Theming Reference](../general/theming.md) and `scss/_variables.scss` for a comprehensive understanding of the CSS variables used.

## Interactivity

All button actions (e.g., what happens on click) must be implemented with your own JavaScript. Adwaita Skin only provides the visual styling.

```javascript
// Example: Adding an event listener
document.querySelector('.my-save-button').addEventListener('click', function() {
  console.log('Save button was clicked!');
  // Perform save operation
});
```

---
Next: [Entry CSS Styling](./entry.md)

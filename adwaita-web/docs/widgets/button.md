# Button CSS Styling (Adwaita Skin)

Buttons allow users to trigger actions. Adwaita Skin provides CSS classes to style standard HTML `<button>` and `<a>` elements to look like Adwaita buttons.

## HTML Structure and CSS Classes

To style an HTML element as an Adwaita button, apply the base class `adw-button`. Additional modifier classes can be used for different styles (suggested, destructive, flat, etc.) and states.

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

*   `.suggested`: For suggested actions (typically blue).
    ```html
    <button class="adw-button suggested">Save</button>
    ```
*   `.destructive`: For destructive actions (typically red).
    ```html
    <button class="adw-button destructive">Delete</button>
    ```
*   `.flat`: For flat buttons (no background/border unless hovered/active).
    ```html
    <button class="adw-button flat">Flat Button</button>
    ```
*   `.circular`: For circular buttons, typically used for icon-only buttons.
    ```html
    <button class="adw-button circular" aria-label="Add">
      <!-- Add icon via CSS or inline SVG here -->
      <span class="adw-icon adw-icon-plus-symbolic"></span> <!-- Example using CSS icon class -->
    </button>
    ```
*   `.disabled` or `disabled` attribute: To make a button appear and behave as disabled.
    ```html
    <button class="adw-button" disabled>Disabled Button</button>
    <button class="adw-button disabled">CSS Disabled Button</button>
    ```
    *Note: Using the `disabled` attribute on the `<button>` element is the standard HTML way to disable it and is generally preferred for accessibility and behavior.*

*   For icon buttons, you might also need specific classes for icons if not using inline SVGs. The `adwaita-web/examples/` show usage of `<i>` tags with icon classes. A common pattern is:
    ```html
    <button class="adw-button">
      <span class="adw-icon adw-icon-document-save-symbolic" role="img" aria-label="Save"></span>
      Save
    </button>
    ```
    Or for an icon-only button:
    ```html
    <button class="adw-button flat circular" aria-label="Edit">
      <span class="adw-icon adw-icon-edit-symbolic"></span>
    </button>
    ```
    *(The exact icon class names like `adw-icon-....-symbolic` depend on how icons are implemented and provided in your version of `adwaita-skin.css`. Check `scss/_icon.scss` or examples.)*


## Examples

**Standard Suggested Button:**
```html
<button class="adw-button suggested">Submit</button>
```

**Destructive Flat Button with Text:**
```html
<button class="adw-button destructive flat">Delete Item</button>
```

**Circular Icon Button (Flat):**
(Requires icon setup - see `adwaita-web/examples/` or `scss/_icon.scss` for icon class details)
```html
<button class="adw-button circular flat" aria-label="Undo">
  <!-- Replace with your icon method, e.g., <span class="adw-icon adw-icon-edit-undo-symbolic"></span> -->
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M...Z"/></svg> <!-- Example inline SVG -->
</button>
```

**Link Styled as a Button:**
```html
<a href="https://example.com" class="adw-button" target="_blank">Visit Example.com</a>
```

## Styling & Theming

*   **SCSS Source:** `scss/_button.scss`
*   **CSS Variables:** Button styles are influenced by general theme variables from `scss/_variables.scss` (e.g., `--button-bg-color`, `--accent-bg-color`, text colors, border radius, padding).
*   **Key CSS Custom Properties for direct overrides:**
    *   `--button-bg-color`
    *   `--button-fg-color`
    *   `--button-border-color`
    *   `--button-hover-bg-color`
    *   `--button-active-bg-color`
    *   And variants for `flat`, `suggested`, `destructive` states (e.g., `--button-suggested-bg-color`).

Refer to `scss/_variables.scss` and `scss/_button.scss` for a full list of CSS variables that can be used for customization.

## Interactivity

All button actions (e.g., what happens on click) must be implemented with your own JavaScript. Adwaita Skin only provides the visual styling.

```javascript
// Example: Adding an event listener to a button
document.querySelector('.my-save-button').addEventListener('click', function() {
  console.log('Save button was clicked!');
  // Perform save operation
});
```

---
Next: [Entry CSS Styling](./entry.md)

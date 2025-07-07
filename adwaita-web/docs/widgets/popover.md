# Popover CSS Styling (Adwaita Skin)

Popovers are transient views that appear above other content, typically anchored to a specific UI element. They are used for menus, information bubbles, and other temporary interactions. Adwaita Skin provides CSS classes to style elements as Adwaita-compliant popovers.

## HTML Structure and CSS Classes

A basic popover structure involves a container element with the class `adw-popover`. This element is positioned by JavaScript. For visibility, the class `.open` is added.

**Basic Popover Structure:**
```html
<div class="adw-popover" id="myPopover">
  <!-- Popover content goes here -->
  <div class="adw-popover-surface"> <!-- Optional: for content popovers that might have an arrow -->
    <p>This is a popover!</p>
  </div>
</div>

<button id="triggerButton" aria-haspopup="true" aria-controls="myPopover">Open Popover</button>
```

**Menu Popover Structure:**
Popovers are commonly used for menus. In this case, the `.adw-popover` element itself often gets the `.menu` or `.menu-popover` class and contains an `adw-list-box` for menu items.

```html
<div class="adw-popover menu" id="myMenuPopover" role="menu">
  <div class="adw-list-box flat"> <!-- Flat listbox is typical for menus -->
    <div class="adw-action-row activatable" role="menuitem">
      <span class="adw-action-row-title">Menu Item 1</span>
    </div>
    <div class="adw-action-row activatable" role="menuitem">
      <span class="adw-action-row-title">Menu Item 2</span>
    </div>
    <hr class="popover-divider"> <!-- Optional divider -->
    <div class="adw-action-row destructive-action activatable" role="menuitem">
      <span class="adw-action-row-title">Close</span>
    </div>
  </div>
</div>
```

## Modifier Classes

*   `.adw-popover`: Base class for the popover container.
    *   `.open`: Add this class (usually via JS) to make the popover visible and trigger animations.
    *   `.menu` or `.menu-popover`: Apply to `.adw-popover` if it's directly acting as a menu surface. Styles background, shadow, and padding for menu items.
*   `.adw-popover-surface`: (Optional) Use this class for a `div` inside `.adw-popover` if you need a distinct surface, especially for content popovers that might include an arrow.
    *   `.menu`: If the `.adw-popover-surface` itself is the menu (less common than `.adw-popover.menu`).
*   `.adw-popover-arrow`: (Optional) An element to display an arrow pointing from the popover to its anchor. Requires JavaScript for positioning and directional classes.
    *   `.arrow-up`: Popover is below the target.
    *   `.arrow-down`: Popover is above the target.
    *   `.arrow-left`: Popover is to the right of the target.
    *   `.arrow-right`: Popover is to the left of the target.

## Styling & Theming

*   **SCSS Source:** `scss/_popover.scss`
*   **CSS Variables:**
    *   `--popover-bg-color`: Background color of the popover.
    *   `--popover-box-shadow`: Box shadow for the popover.
    *   `--popover-shade-color`: Used for arrow borders if applicable.
    *   `--z-index-popover`: Controls stacking order.
    *   `--animation-duration-short`, `--animation-ease-out-cubic`: For open/close animations.
    *   Menu items within popovers leverage ListBox and ActionRow variables for hover and selection (e.g., `var(--list-row-hover-bg-color)`, `var(--accent-bg-color)`).

## Interactivity (JavaScript)

Popovers heavily rely on JavaScript for:
1.  **Positioning:** Calculating and setting the `top` and `left` (or `right`, `bottom`) properties relative to an anchor element.
2.  **Visibility:** Toggling the `.open` class.
3.  **Focus Management:** Moving focus into and out of the popover, and handling "click-away" to close.
4.  **Arrow Positioning and Direction:** If using `.adw-popover-arrow`, JS needs to position it and apply the correct directional class (`.arrow-up`, etc.).

**Example (Conceptual JavaScript for toggling):**
```javascript
const popover = document.getElementById('myPopover');
const triggerButton = document.getElementById('triggerButton');

triggerButton.addEventListener('click', () => {
  // Basic toggle, actual positioning logic is more complex
  popover.classList.toggle('open');
  const isOpen = popover.classList.contains('open');
  triggerButton.setAttribute('aria-expanded', isOpen.toString());
  if (isOpen) {
    // Position popover logic here...
    // popover.style.left = ...;
    // popover.style.top = ...;
    popover.focus(); // Or focus first focusable element inside
  }
});

// Add click-away listener, Escape key listener, etc.
```
The `index.html` in the root of this project contains a more concrete example of basic popover JS for demonstration.

---
Next: [Preferences Styling](./preferencesdialog.md) (or other relevant component)

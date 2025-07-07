# Card CSS Styling (Adwaita Skin)

Cards are surfaces that display content and actions on a single topic. They are typically used to group related information in a visually distinct way.

## HTML Structure and CSS Classes

To create a card, apply the `.adw-card` class to a `<div>` or other appropriate block element.

**Basic Card:**
```html
<div class="adw-card">
  <h3 class="adw-label title-3" style="margin-top:0;">Card Title</h3>
  <p class="adw-label body">This is the content of the card.</p>
  <div class="adw-button-row" style="justify-content: flex-end; margin-top: var(--spacing-m);">
    <button class="adw-button flat">Action</button>
  </div>
</div>
```

## Modifier Classes

*   `.activatable`: Apply to `.adw-card` to give it hover and active states, making it suitable for being clickable.
    ```html
    <div class="adw-card activatable">
      <p class="adw-label body">This card is activatable. Click me!</p>
    </div>
    ```
*   `.adw-button.card`: Apply the `.card` class to an `.adw-button` element to make the button itself look and behave like a card.
    ```html
    <button class="adw-button card">
      <h4 class="adw-label title-4">Button as Card</h4>
      <p class="adw-label body-small">This button takes up the full card space.</p>
    </button>
    ```

## Styling & Theming

*   **SCSS Source:** `scss/_card.scss`
*   **Base Styling (via `mixins.apply-card-style`):**
    *   Background: `var(--card-bg-color)`
    *   Text Color: `var(--card-fg-color)`
    *   Border Radius: `var(--border-radius-large)`
    *   Padding: `var(--spacing-m)` (default internal padding)
    *   Box Shadow: A standard card shadow (e.g., `var(--stronger-card-box-shadow)` which is `0 1px 2px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05)` or similar).
*   **Activatable Cards:**
    *   Hover: `background-color: rgba(var(--card-fg-color-rgb), 0.05);`
    *   Active: `background-color: rgba(var(--card-fg-color-rgb), 0.08);`
    *   Focus: Displays the standard focus ring (`var(--focus-ring-color)`) combined with the card's box shadow.
*   **Button as Card (`.adw-button.card`):**
    *   Resets default button appearance and adopts card styling (background, color, border-radius, shadow).
    *   Its direct children will typically need their own padding if the button's default padding is removed. The SCSS example suggests `> * { padding: var(--spacing-m); }`.

Refer to the [Theming Reference](../general/theming.md) and `scss/_variables.scss` for more details on the CSS variables used.

## Interactivity

*   For `.adw-card.activatable` or `.adw-button.card`, click event handling must be implemented with JavaScript.
*   Content within a standard `.adw-card` (like buttons) follows normal interactivity rules.

---
Next: [HeaderBar](./headerbar.md)

# ToastOverlay

An `<adw-toast-overlay>` is a container widget that allows you to display `AdwToast` notifications over its main content. Toasts appear stacked at the bottom (or other configured position) of the overlay.

## Web Component: `<adw-toast-overlay>`

A container for displaying toasts over other content.

**HTML Tag:** `<adw-toast-overlay>`

**Attributes:**

*   This component does not typically have user-configurable attributes for its direct behavior. Its functionality is primarily accessed via JavaScript methods.

**Slots:**

*   Default slot: The main content of the page or section over which toasts will be displayed. This content fills the overlay area.

**Methods (via JavaScript):**

*   `addToast(toastElementOrOptions)`: Adds a toast to the overlay.
    *   `toastElementOrOptions` (AdwToastElement | Object):
        *   Can be a pre-created `<adw-toast>` element (or the element returned by `createAdwToast()`).
        *   Can be an options object that will be passed to `createAdwToast()` to generate a toast. See `AdwToast` documentation for options (e.g., `title`, `buttonLabel`, `timeout`, `priority`).
    *   Returns the added toast element.
*   `dismissAllToasts()`: Programmatically dismisses all currently visible toasts in the overlay.

**Example:**

```html
<adw-toast-overlay id="my-toast-overlay" style="height: 300px; border: 1px solid grey; position: relative;">
  <!-- Main content for the overlay -->
  <div style="padding: 20px;">
    <p>This is the main content area.</p>
    <p>Toasts will appear over this content.</p>
    <adw-button id="show-toast-btn">Show Toast</adw-button>
    <adw-button id="show-high-prio-toast-btn">Show High Priority Toast</adw-button>
  </div>
</adw-toast-overlay>

<script>
  const overlay = document.getElementById('my-toast-overlay');
  const showToastBtn = document.getElementById('show-toast-btn');
  const showHighPrioToastBtn = document.getElementById('show-high-prio-toast-btn');

  showToastBtn.addEventListener('click', () => {
    overlay.addToast({
      title: "A new message has arrived!",
      buttonLabel: "View",
      actionName: "view-message"
    });
  });

  showHighPrioToastBtn.addEventListener('click', () => {
    overlay.addToast({
      title: "Important: System update required!",
      priority: "high", // or Adw.TOAST_PRIORITY_HIGH if defined
      timeout: 0 // Indefinite until dismissed
    });
  });

  // Example of handling a button click on a toast (if AdwToast dispatches such an event)
  overlay.addEventListener('button-clicked', (event) => {
    // This assumes the toast element itself or the overlay dispatches 'button-clicked'
    // The actual event might be on the toast element returned by addToast.
    if (event.detail && event.detail.actionName === 'view-message') {
      console.log('View Message button on toast was clicked.');
      // Here you would typically dismiss the toast if it's not auto-dismissed
      // and perform the action.
      // event.target.closest('adw-toast').dismiss(); // Example if event target is inside toast
    }
  });
</script>
```

## JavaScript Factory: `createAdwToastOverlay()`

Creates an `<adw-toast-overlay>` Web Component instance.

**Signature:**

```javascript
createAdwToastOverlay(options = {}) -> AdwToastOverlayElement
```

**Parameters:**

*   `options` (Object, optional):
    *   `child` (Node, optional): A DOM Node to set as the initial main content for the overlay (slotted into the default slot).

**Returns:**

*   `(AdwToastOverlayElement)`: The created `<adw-toast-overlay>` instance.

**Example:**

```javascript
const mainContent = document.createElement('div');
mainContent.innerHTML = '<p>Content area for toasts.</p><adw-button id="factory-toast-btn">Toast from Factory Overlay</adw-button>';

const factoryOverlay = createAdwToastOverlay({ child: mainContent });
document.body.appendChild(factoryOverlay); // Append the overlay to the document

const factoryToastBtn = mainContent.querySelector('#factory-toast-btn');
if (factoryToastBtn) {
  factoryToastBtn.addEventListener('click', () => {
    factoryOverlay.addToast({ title: "Toast on factory-created overlay!" });
  });
}
```

## Styling

*   Primary SCSS: `scss/_toast_overlay.scss` and `scss/_toast.scss`.
*   The overlay itself is typically a full-container block.
*   A `.adw-toast-container` element is positioned within the overlay (e.g., at the bottom-center, bottom-left, or bottom-right) to hold and stack the toasts.
*   Toasts have enter and exit animations.

---
Next: [Toast](./toast.md)

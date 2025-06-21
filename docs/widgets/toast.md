# Toast

An `AdwToast` is a small, non-modal notification that appears briefly to provide feedback or information to the user. Toasts are often managed by a central overlay or toast manager. Adwaita-Web provides `Adw.createToast()` for imperative creation and an `<adw-toast>` Web Component (though toasts are often created dynamically).

## JavaScript Factory: `Adw.createToast()`

Creates an Adwaita-styled toast element. This function typically creates the toast element, which then needs to be added to an appropriate toast overlay or container by application code.

**Signature:**

```javascript
Adw.createToast(title, options = {}) -> HTMLElement
```

**Parameters:**

*   `title` (String): The main text to display in the toast.
*   `options` (Object, optional): Configuration options:
    *   `timeout` (Number, optional): Duration in milliseconds before the toast automatically dismisses. Defaults to `3000` (3 seconds). A value of `0` or negative might mean it persists until an action or manual dismissal.
    *   `actionName` (String, optional): If provided, an action button with this label is added to the toast.
    *   `onAction` (Function, optional): A callback function executed when the action button is clicked. The toast instance is passed as an argument.
    *   `priority` (String, optional): Priority of the toast. Can be `'normal'` or `'high'`. High priority toasts might be styled differently or placed above normal priority ones. Defaults to `'normal'`.
    *   `id` (String, optional): A specific ID to set on the toast element.

**Returns:**

*   `(HTMLElement)`: The created toast element (typically a `div` with class `adw-toast`).

**Example (Conceptual - requires a toast manager/overlay):**

```html
<div id="toast-container" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1500; display: flex; flex-direction: column; gap: 10px;"></div>
<button id="show-toast-btn">Show Toast</button>
<button id="show-action-toast-btn">Show Toast with Action</button>

<script>
  const toastContainer = document.getElementById('toast-container');

  function showToast(toastElement) {
    toastContainer.appendChild(toastElement);
    // Basic dismissal logic for example
    const timeout = parseInt(toastElement.dataset.timeout, 10) || 3000;
    if (timeout > 0) {
      setTimeout(() => {
        toastElement.remove();
      }, timeout);
    }
  }

  document.getElementById('show-toast-btn').addEventListener('click', () => {
    const myToast = Adw.createToast("File saved successfully!");
    showToast(myToast);
  });

  document.getElementById('show-action-toast-btn').addEventListener('click', () => {
    const actionToast = Adw.createToast("Update available.", {
      actionName: "Install",
      timeout: 5000, // 5 seconds
      onAction: (toast) => {
        console.log("Install action clicked!");
        toast.remove(); // Dismiss toast after action
      }
    });
    showToast(actionToast);
  });
</script>
```

## Web Component: `<adw-toast>`

While toasts are often created dynamically via the factory, a web component can be used for declarative scenarios or within other components.

**HTML Tag:** `<adw-toast>`

**Attributes:**

*   `title` (String, required): The main text for the toast.
*   `timeout` (Number, optional): Duration in milliseconds. Defaults to `3000`.
*   `action-name` (String, optional): Label for the action button.
*   `priority` (String, optional): `'normal'` or `'high'`. Defaults to `'normal'`.

**Properties:**
*   `title` (String)
*   `timeout` (Number)
*   `actionName` (String)
*   `priority` (String)

**Events:**

*   `action-clicked`: Fired when the action button is clicked. `event.detail` might contain the toast instance.
*   `dismissed`: Fired when the toast is dismissed (either by timeout or interaction).

**Example (Declarative, if part of a static view - less common for toasts):**

```html
<!-- This toast would need to be managed (shown/hidden) by parent component logic -->
<adw-toast title="Profile updated" timeout="2000" style="display: none;"></adw-toast>
```
*Usage note: `<adw-toast>` elements are typically added and removed from the DOM dynamically by a toast management system rather than being statically placed in HTML and hidden/shown.*

## Styling

*   Primary SCSS: `scss/_toast.scss`
*   Variables:
    *   `--toast-bg-color`, `--toast-fg-color` (from `_variables.scss`).
    *   `--toast-box-shadow`.
    *   Uses accent colors for the action button if present.
*   Toasts are usually absolutely positioned within a container at the bottom or top of the viewport.
*   High priority toasts might have a different background or border color.

---
Next: [Banner](./banner.md)
```

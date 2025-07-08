# Toast

An `AdwToast` is a small, non-modal notification that appears briefly to
provide feedback or information to the user. Toasts are often managed by a
central overlay or toast manager. Adwaita-Web provides `Adw.createToast()` for
imperative creation and an `<adw-toast>` Web Component (though toasts are often
created dynamically).

## JavaScript Factory: `Adw.createToast()`

Creates an Adwaita-styled toast element. This function typically creates the toast element, which then needs to be added to an appropriate toast overlay or container by application code.

**Signature:**

```javascript
Adw.createToast(title, options = {}) -> HTMLElement | null
```

**Parameters:**

*   `title` (String): The main message text to display in the toast. The factory currently supports a single string for the primary content.
*   `options` (Object, optional): Configuration options:
    *   `timeout` (Number, optional): Duration in milliseconds before the toast
        automatically dismisses. Defaults to `3000` (3 seconds). A value of `0` or
        negative makes the toast persistent until manually dismissed via its close button or action.
    *   `actionName` (String, optional): If provided, an action button with this
        label is added to the toast.
    *   `onAction` (Function, optional): A callback function executed when the
        action button (if `actionName` is provided) is clicked. The toast element itself is passed as an argument to this function.
    *   `id` (String, optional): A specific ID to set on the toast element.
    *   `type` (String, optional): Intended for future styling (e.g., 'info', 'success'). Currently not implemented to change visual style.

**Returns:**

*   `(HTMLElement | null)`: The created toast `div` element (with class `adw-toast`), or `null` if the required toast overlay container (`#adw-toast-overlay`) is not found in the DOM. The toast is automatically appended to the overlay and managed.

**Example:**

```html
<!-- Ensure this overlay exists in your main HTML structure -->
<div id="adw-toast-overlay" class="adw-toast-overlay"></div>

<button id="show-toast-btn">Show Toast</button>
<button id="show-action-toast-btn">Show Toast with Action</button>

<script>
  // Adw.createToast is defined in adwaita-web/js/toast.js
  // Ensure toast.js is loaded.

  document.getElementById('show-toast-btn').addEventListener('click', () => {
    Adw.createToast("File saved successfully!");
  });

  document.getElementById('show-action-toast-btn').addEventListener('click', () => {
    Adw.createToast("Update available.", {
      actionName: "Install",
      timeout: 5000, // 5 seconds
      onAction: (toastElement) => {
        console.log("Install action clicked!");
        // Toast will dismiss on action click if Adw.dismissToast is called within onAction,
        // or if the action itself leads to a state where the toast is no longer relevant.
        // The default behavior is that the toast remains until its timeout or manual close,
        // unless onAction explicitly dismisses it.
        Adw.dismissToast(toastElement); // Example: dismiss after action
      }
    });
  });
</script>
```
*Note: The `Adw.createToast` function handles appending the toast to an element with ID `adw-toast-overlay` and manages its show/hide lifecycle.*

## Web Component: `<adw-toast>`

While toasts are typically created dynamically via the `Adw.createToast()` factory, a web component `<adw-toast>` can be defined for scenarios requiring declarative toast elements or for use within other web components. (Note: A web component for `<adw-toast>` is not explicitly provided in `toast.js`; this section describes a general pattern if one were to be used or created).

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
<!-- This toast would need to be managed (shown/hidden) by parent logic -->
<adw-toast title="Profile updated" timeout="2000" style="display: none;"></adw-toast>
```
*Usage note: `<adw-toast>` elements are typically added and removed from the DOM
dynamically by a toast management system rather than being statically placed in
HTML and hidden/shown.*

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

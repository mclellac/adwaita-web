# Banner

An `AdwBanner` is a prominent message area typically displayed at the top of a view or window, used for important announcements or status messages that require user attention but are not necessarily modal. Adwaita-Web provides `Adw.createBanner()` and the `<adw-banner>` Web Component.

## JavaScript Factory: `Adw.createBanner()`

Creates an Adwaita-styled banner element.

**Signature:**

```javascript
Adw.createBanner(title, options = {}) -> HTMLElement
```

**Parameters:**

*   `title` (String): The main text to display in the banner. HTML can be used if `useMarkup` is true.
*   `options` (Object, optional): Configuration options:
    *   `useMarkup` (Boolean, optional): If `true`, the `title` string is treated as HTML. Defaults to `false`. **Use with caution and ensure any HTML is sanitized if from user input.**
    *   `buttonLabel` (String, optional): If provided, a button with this label is added to the banner.
    *   `onButtonClicked` (Function, optional): A callback function executed when the button is clicked. The banner instance is passed as an argument.
    *   `type` (String, optional): Sets the visual style of the banner. Common types could be `'info'`, `'warning'`, `'error'`, `'success'`. This usually applies a corresponding CSS class (e.g., `adw-banner-warning`). Defaults to a neutral/info style.
    *   `id` (String, optional): A specific ID to set on the banner element.

**Returns:**

*   `(HTMLElement)`: The created banner element (typically a `div` with class `adw-banner`).

**Example:**

```html
<div id="banner-container"></div>
<script>
  const container = document.getElementById('banner-container');

  const infoBanner = Adw.createBanner("This is an informational banner.");
  container.appendChild(infoBanner);

  const actionBanner = Adw.createBanner("Your session will expire soon.", {
    buttonLabel: "Renew Session",
    type: "warning",
    onButtonClicked: (banner) => {
      console.log("Renew Session clicked!");
      banner.remove(); // Example: dismiss banner on action
    }
  });
  container.appendChild(actionBanner);
</script>
```

## Web Component: `<adw-banner>`

A declarative way to create Adwaita banners.

**HTML Tag:** `<adw-banner>`

**Attributes:**

*   `title` (String, required): The main text for the banner.
*   `use-markup` (Boolean, optional): If present, treats the `title` as HTML.
*   `button-label` (String, optional): Label for the action button.
*   `type` (String, optional): Visual type: `'info'`, `'warning'`, `'error'`, `'success'`.

**Properties:**
*   `title` (String)
*   `useMarkup` (Boolean)
*   `buttonLabel` (String)
*   `type` (String)

**Events:**

*   `button-clicked`: Fired when the action button (if present) is clicked. `event.detail` might contain the banner instance.
*   `dismissed`: (Potentially) Fired if the banner has a built-in dismiss mechanism (e.g., a close button, not standard in Libadwaita banners but common in web implementations).

**Slots:**
*   If the `title` attribute is not used, the default slot can be used for the banner's main content.
*   A named slot like `slot="action"` could be used for custom action elements instead of just `button-label`. (This would be an enhancement over basic Libadwaita).

**Example:**

```html
<adw-banner title="Welcome to Adwaita-Web!"></adw-banner>

<adw-banner title="<strong>Update Required!</strong> Your software is out of date."
            use-markup
            button-label="Update Now"
            type="warning">
</adw-banner>

<adw-banner type="error">
  <p>Failed to load critical data. Please try again later.</p>
  <!-- Example of custom content via slot -->
</adw-banner>
```

## Styling

*   Primary SCSS: `scss/_banner.scss`
*   Variables:
    *   Uses status colors for different types, e.g., `--warning-bg-color` for `type="warning"`.
    *   General text and button variables.
*   Banners typically span the full width of their container.
*   They have distinct background colors based on their `type`.
*   The action button is usually styled as a suggested or flat button.

---
Next: [Switch](./switch.md)
```

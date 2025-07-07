# Banner

An `AdwBanner` is a prominent message area typically displayed at the top of a
view or window, used for important announcements or status messages that require
user attention but are not necessarily modal.

Adwaita Web provides styling for banners via the `.adw-banner` CSS class and helper JavaScript functions in `adwaita-web/js/banner.js` to initialize their interactivity (e.g., dismissal). There isn't a direct JavaScript factory like `Adw.createBanner()` for programmatic creation; banners are typically defined in HTML.

## HTML Structure

To create a banner, you would typically use the following HTML structure:

```html
<div class="adw-banner [type-class]" role="status">
  <div class="adw-banner__content">
    <span class="adw-icon [icon-class]"></span> <!-- Optional icon -->
    <p class="adw-label body">Your banner message here.</p>
  </div>
  <div class="adw-banner__actions">
    <!-- Optional action button -->
    <button class="adw-button flat">Action</button>
    <!-- Dismiss button (functionality initialized by banner.js) -->
    <button class="adw-button flat adw-banner-dismiss-button">Dismiss</button>
  </div>
</div>
```
*   Apply `.adw-banner` to the main container.
*   Optional type classes: `.info`, `.warning`, `.error`, `.success` (these might need to be defined in `_banner.scss` or use existing status color variables). The `index.html` showcase uses `.warning` as an example.
*   `.adw-banner__content`: Wraps the icon and message.
*   `.adw-banner__actions`: Wraps action and dismiss buttons.
*   A dismiss button should have class `.adw-banner-dismiss-button` or `.adw-banner-dismiss` for `banner.js` to make it functional.

## JavaScript Initialization (`banner.js`)

The `adwaita-web/js/banner.js` script provides:
*   `Adw.initBanners()`: Call this function (it's also called automatically on DOMContentLoaded) to find all `.adw-banner` elements and attach click listeners to their dismiss buttons.
*   `Adw.dismissBanner(bannerElement)`: A function to programmatically dismiss a banner.

**Example (HTML and JS Interaction):**

```html
<div id="banner-container">
  <div class="adw-banner warning" role="alert">
    <div class="adw-banner__content">
      <span class="adw-icon icon-status-dialog-warning-symbolic"></span>
      <p class="adw-label body">This is a warning banner that can be dismissed.</p>
    </div>
    <div class="adw-banner__actions">
      <button class="adw-button flat adw-banner-dismiss-button">Dismiss</button>
    </div>
  </div>
</div>

<script src="path/to/adwaita-web/js/banner.js"></script>
<!-- Adw.initBanners() is called automatically by banner.js -->
```

## Web Component: `<adw-banner>` (If Available)

(This section describes a hypothetical Web Component. If `adwaita-web/js/banner.js` or another file defines an `<adw-banner>` custom element, its specific API would be documented here. Based on current findings, `banner.js` focuses on initializing HTML-defined banners.)

If a Web Component `adw-banner` exists, it would likely encapsulate the HTML structure and dismissal logic. Example hypothetical usage:
```html
<!-- Hypothetical <adw-banner> Web Component -->
<adw-banner title="Welcome to Adwaita-Web!" type="info" closable button-label="Learn More"></adw-banner>
```
*Check the `adwaita-web/js/` directory for a definition of `<adw-banner>` if you intend to use it as a Web Component.*
For now, primary usage is via HTML structure and `banner.js` initialization.

**HTML Tag:** `<adw-banner>`

**Attributes:**

*   `title` (String, required): The main text for the banner.
*   `use-markup` (Boolean, optional): If present, treats the `title` as HTML.
*   `button-label` (String, optional): Label for the action button.
*   `type` (String, optional): Visual type: `'info'`, `'warning'`, `'error'`,
    `'success'`.

**Properties:**
*   `title` (String)
*   `useMarkup` (Boolean)
*   `buttonLabel` (String)
*   `type` (String)

**Events:**

*   `button-clicked`: Fired when the action button (if present) is clicked.
    `event.detail` might contain the banner instance.
*   `dismissed`: Fired if the banner is dismissed via its built-in dismiss mechanism.
    Applications using `banner.js` should provide a dismiss button (e.g., a text button "Dismiss")
    with the class `.adw-banner-dismiss-button` or `.adw-banner-dismiss`. `banner.js`
    will automatically handle its functionality.

**Slots:**
*   If the `title` attribute is not used, the default slot can be used for the
    banner's main content.
*   A named slot like `slot="action"` could be used for custom action elements instead of just `button-label`. (This would be an enhancement over basic Libadwaita).

**Example:**

```html
<adw-banner title="Welcome to Adwaita-Web!"></adw-banner>

<adw-banner title="&lt;strong&gt;Update Required!&lt;/strong&gt; Your software is out of date."
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

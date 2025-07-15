# StatusPage

An AdwStatusPage is used to display non-interactive information to the user, often for empty states, "no results" found, error messages that aren't dialogs, or welcome screens. It typically includes an icon, a title, a description, and optional action buttons.

## JavaScript Factory: `Adw.createStatusPage()`

Creates an Adwaita-styled status page.

**Signature:**

```javascript
Adw.createStatusPage(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): The main heading for the status page.
    *   `description` (String, optional): A more detailed message or description.
    *   `iconHTML` (String, optional): HTML string for an SVG icon or an icon font class. *Security: Ensure trusted/sanitized HTML if user-supplied.*
    *   `actions` (Array<HTMLElement>, optional): An array of button elements (e.g., created with `Adw.createButton()`) to offer as actions.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element of the status page.

**Example:**

```html
<div id="js-statuspage-container" style="border: 1px solid var(--borders-color); padding: var(--spacing-l); text-align: center; max-width:500px; margin: auto;"></div>
<script>
  const container = document.getElementById('js-statuspage-container');

  // "No Results" Status Page
  const noResultsPage = Adw.createStatusPage({
    // Example icon (magnifying glass with slash, shortened for brevity)
    iconHTML: '<svg viewBox="0 0 48 48" width="64" height="64"><path d="M24 4C12.95Z"/></svg>',
    title: "No Results Found",
    description: "Your search query did not match any documents. " +
                 "Try using different keywords.",
    actions: [
      Adw.createButton("Clear Search", {
        onClick: () => Adw.createToast("Search cleared (concept).")
      })
    ]
  });
  // Replace current content of container with the status page
  // container.innerHTML = ''; // Clear previous if any
  // container.appendChild(noResultsPage);


  // Welcome Page (example, might be put in place of noResultsPage)
   const welcomeAction = Adw.createButton("Get Started", {
    suggested: true,
    onClick: () => Adw.createToast("Welcome action!")
  });
  const welcomePage = Adw.createStatusPage({
    // Example 'welcome' icon (shortened)
    iconHTML: '<svg viewBox="0 0 48 48" width="64" height="64"><path d="M10 36V12h4Z"/></svg>',
    title: "Welcome to My Application!",
    description: "This application helps you manage your tasks efficiently. " +
                 "Click below to begin.",
    actions: [welcomeAction]
  });
  container.innerHTML = ''; // Clear previous
  container.appendChild(welcomePage);


</script>
```

## Web Component: `<adw-status-page>`

A declarative way to define Adwaita status pages.

**HTML Tag:** `<adw-status-page>`

**Attributes:**

*   `title` (String, optional): The main heading.
*   `description` (String, optional): The descriptive text.
*   `icon` (String, optional): HTML string for an SVG icon or an icon font class.

**Slots:**

*   `icon` (if `icon` attribute not used): Place custom HTML for the icon here.
*   `actions`: Place `adw-button` or standard `<button>` elements here to define actions.
*   Default slot (if `title` and `description` attributes are not sufficient): Can be used for more complex description content.

**Example:**

```html
<adw-status-page
  title="Empty Mailbox"
  description="There are no messages in your inbox."
  icon="<svg viewBox='0 0 48 48' width='64'><path d='M8 12C5.79Z'/></svg>"
  style="max-width: 400px; margin: 20px auto; padding: 20px;
         border: 1px solid var(--borders-color);">
  <div slot="actions">
    <adw-button suggested id="compose-mail-btn">Compose New Mail</adw-button>
  </div>
</adw-status-page>

<script>
  document.getElementById('compose-mail-btn').addEventListener('click', () => {
    Adw.createToast("Opening mail composer...");
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_status_page.scss`.
*   Typically centers its content (icon, title, description, actions) vertically and horizontally.
*   Uses theme variables for text colors, and button styles for actions.
*   The icon size and spacing are defined in the SCSS.

---
Next: [SplitButton](./splitbutton.md)

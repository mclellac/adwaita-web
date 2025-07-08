# TabView, TabBar, TabButton, TabPage

The TabView system provides a way to manage multiple pages of content, where each page is associated with a tab in a tab bar. Users can switch between pages by clicking on their corresponding tabs.

## Core Components

*   **`AdwTabView`**: The main container that coordinates the `AdwTabBar` and the display of `AdwTabPage` content.
*   **`AdwTabBar`**: The bar that displays `AdwTabButton` elements.
*   **`AdwTabButton`**: An individual button in the `AdwTabBar`, representing a page.
*   **`AdwTabPage`**: A container for the content of a single tab.

*(Note: Previous versions of this documentation may have described JavaScript factories like `Adw.createTabView()`, `Adw.createTabBar()`, etc. As of the current review, these specific factory functions were not found in the core `adwaita-web/js` source. Usage should primarily rely on the Web Components detailed below or by applying CSS classes to manually structured HTML.)*

## Web Components

The TabView system is primarily implemented via a set of interconnected Web Components:

### `<adw-tab-button>`

*   **Attributes**:
    *   `label` (String)
    *   `page-name` (String, required)
    *   `active` (Boolean)
    *   `closable` (Boolean, default: true)
    *   `icon` (String, HTML for icon)
*   **Events**: `select` (`{detail: {pageName}}`), `close` (`{detail: {pageName}}`)

### `<adw-tab-bar>`

*   **Attributes**:
    *   `active-tab-name` (String)
    *   `show-new-tab-button` (Boolean)
*   **Slots**: Default slot for `<adw-tab-button>` elements.
*   **Events**: `tab-select` (`{detail: {pageName}}`), `tab-close` (`{detail: {pageName}}`), `new-tab-requested`.
*   **Methods**: `addSlottedTab(adwTabButtonElement)`, `removeSlottedTab(pageName)`, `setActiveTab(pageName)`.

### `<adw-tab-page>`

*   **Attributes**:
    *   `page-name` (String, required)
    *   `label` (String, optional): Title for the tab button if not set on the button itself.
*   **Slots**: Default slot for page content.
*   **Internal CSS**: Hidden by default (`display: none`), shown by `AdwTabView`.

### `<adw-tab-view>`

*   **Attributes**:
    *   `active-page-name` (String)
    *   `show-new-tab-button` (Boolean)
*   **Slots**: Default slot for `<adw-tab-page>` elements. The `<adw-tab-view>` will generate an internal `<adw-tab-bar>` based on these pages.
*   **Events**: `new-tab-requested`, `page-changed` (`{detail: {pageName}}`), `before-page-close` (`{detail: {pageName}, cancelable}`), `page-closed` (`{detail: {pageName}}`).
*   **Methods**: `addPage(adwTabPageElement, makeActive?)`, `removePage(pageName)`, `setActivePage(pageName)`, `getActivePageName()`.

**Web Component Example (Full TabView):**
```html
<adw-tab-view id="wc-tab-view" active-page-name="home" show-new-tab-button
              style="height: 300px; border: 1px solid var(--borders-color);">
  <adw-tab-page page-name="home" label="Home Tab">
    <div style="padding: var(--spacing-m);">
      <h3>Welcome Home!</h3>
      <p>This is the home page content.</p>
    </div>
  </adw-tab-page>
  <adw-tab-page page-name="settings" label="Settings">
    <div style="padding: var(--spacing-m);">
      <h3>Application Settings</h3>
      <adw-entry-row title="Username"></adw-entry-row>
    </div>
  </adw-tab-page>
  <adw-tab-page page-name="profile" label="User Profile" non-closable> <!-- non-closable example -->
    <div style="padding: var(--spacing-m);">
      <h3>User Profile Details</h3>
    </div>
  </adw-tab-page>
</adw-tab-view>

<script>
  const wcTabView = document.getElementById('wc-tab-view');
  let wcPageCounter = 0; // For unique page names if adding dynamically

  wcTabView.addEventListener('new-tab-requested', () => {
    wcPageCounter++;
    const newPage = document.createElement('adw-tab-page');
    newPage.setAttribute('page-name', `new-page-${wcPageCounter}`);
    newPage.setAttribute('label', `New Page ${wcPageCounter}`);
    newPage.innerHTML = `<div style="padding: var(--spacing-m);">Content of New Page ${wcPageCounter}</div>`;
    wcTabView.addPage(newPage, true); // Add and make active
  });

  wcTabView.addEventListener('page-changed', (event) => {
    Adw.createToast(`WC TabView changed to: ${event.detail.pageName}`);
  });

  wcTabView.addEventListener('before-page-close', (event) => {
    if (event.detail.pageName === 'settings') {
      // const reallyClose = confirm("Are you sure you want to close the Settings tab?");
      // if (!reallyClose) {
      //   event.preventDefault(); // Prevent closing
      // }
    }
  });

  wcTabView.addEventListener('page-closed', (event) => {
    Adw.createToast(`WC TabView closed page: ${event.detail.pageName}`);
  });
</script>
```

## Styling Details

*   **SCSS Source:** `scss/_tabs.scss`
*   **Key CSS Classes & Structure:**
    *   **`.adw-tab-button`**:
        *   Styles the individual tab. Rounded top corners, transparent background when inactive, dimmed text.
        *   Padding: `var(--spacing-s) var(--spacing-m)`.
        *   Margin: `margin-right: var(--spacing-xxs)` and negative bottom margin to overlap `AdwTabBar`'s border.
        *   Hover: Opacity 1, subtle background (`rgba(var(--headerbar-fg-color-rgb), 0.05)`).
        *   Active (`.active` class): Background `var(--view-bg-color)`, text `var(--accent-color)` (bold), full opacity. Border color `var(--headerbar-border-color)` on sides/top, bottom border blends with view background.
        *   Focus: Inset box shadow using `var(--accent-color)`.
        *   Internal Structure (assumed by SCSS for full styling):
            *   `.adw-tab-button-content-wrapper`: Flex container for icon and label.
            *   `.adw-tab-button-icon`: For an optional icon.
            *   `.adw-tab-button-label`: For the text label (handles overflow with ellipsis).
            *   `.adw-tab-button-close`: A close button (styled like a small, flat `.adw-button`).
    *   **`.adw-tab-bar`**:
        *   The container for tab buttons. Uses `flex` display.
        *   Background: `var(--headerbar-bg-color)`, text `var(--headerbar-fg-color)`.
        *   Padding: Horizontal `var(--spacing-s)`.
        *   Border: `border-bottom: var(--border-width) solid var(--headerbar-border-color)`.
        *   `.adw-tab-bar-new-tab-button`: A small, circular, flat icon button for adding new tabs.
        *   `.inline` variant: Transparent background (or `var(--window-bg-color)`), standard border. Active tabs look more like toggle buttons.
    *   **`.adw-tab-page`**:
        *   Container for a single tab's content.
        *   Padding: `var(--spacing-l)`.
        *   Background: `var(--view-bg-color)`. Text: `var(--view-fg-color)`.
        *   Typically `display: block; height: 100%; overflow: auto;`. Visibility controlled by JavaScript.
    *   **`.adw-tab-view`**:
        *   Main container, uses flex column layout for tab bar and page container.
        *   Background: `var(--window-bg-color)`.
        *   `.adw-tab-view-pages-container`: Wraps the tab pages, handles overflow, and uses `position: relative` for absolute positioning of pages if needed for transitions.
        *   Active page (e.g., with `.active-page` class) is made visible.
    *   **`.adw-tab-overview`**: Placeholder styles for a grid view of tab thumbnails.
*   **Theming Variables:** Many variables from `_headerbar.scss` and `_view.scss` are reused (e.g., `--headerbar-bg-color`, `--view-bg-color`, `--accent-color`).

Refer to `scss/_tabs.scss` for comprehensive styling details.

---
Next: [NavigationView](./navigationview.md)

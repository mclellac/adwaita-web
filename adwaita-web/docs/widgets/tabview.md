# TabView, TabBar, TabButton, TabPage

The TabView system provides a way to manage multiple pages of content, where each page is associated with a tab in a tab bar. Users can switch between pages by clicking on their corresponding tabs.

## Core Components

*   **`AdwTabView`**: The main container that coordinates the `AdwTabBar` and the display of `AdwTabPage` content.
*   **`AdwTabBar`**: The bar that displays `AdwTabButton` elements.
*   **`AdwTabButton`**: An individual button in the `AdwTabBar`, representing a page.
*   **`AdwTabPage`**: A container for the content of a single tab.

## JavaScript Factories

### `Adw.createTabButton(options = {}) -> HTMLDivElement`

*   **`options`**:
    *   `label` (String): Text for the tab.
    *   `iconHTML` (String, optional): HTML for an icon. *Security: Ensure trusted HTML.*
    *   `pageName` (String, required): Unique identifier for the page this tab controls.
    *   `isActive` (Boolean, optional): Initial active state.
    *   `isClosable` (Boolean, optional): If `true` (default), shows a close button.
    *   `onSelect` (Function, optional): `onSelect(pageName)` callback.
    *   `onClose` (Function, optional): `onClose(pageName)` callback for the close button.
*   **Returns**: The tab button `<div>` element.

### `Adw.createTabBar(options = {}) -> HTMLDivElement (with methods)`

*   **`options`**:
    *   `tabsData` (Array<Object>, optional): Initial tabs, each object matching `Adw.createTabButton` options.
    *   `activeTabName` (String, optional): `pageName` of the initially active tab.
    *   `onTabSelect` (Function, optional): `onTabSelect(pageName)` callback.
    *   `onTabClose` (Function, optional): `onTabClose(pageName)` callback.
    *   `showNewTabButton` (Boolean, optional): If `true`, shows a '+' button.
    *   `onNewTabRequested` (Function, optional): Callback for the new tab button.
*   **Returns**: The tab bar `<div>` element, augmented with methods:
    *   `setActiveTab(pageName)`
    *   `addTab(tabData, makeActive?)`
    *   `removeTab(pageName)`

### `Adw.createTabPage(options = {}) -> HTMLDivElement`

*   **`options`**:
    *   `content` (HTMLElement, required): The main content element for this tab page.
    *   `pageName` (String, required): Unique identifier for this page.
*   **Returns**: The tab page `<div>` container.

### `Adw.createTabView(options = {}) -> HTMLDivElement (with methods)`

*   **`options`**:
    *   `pages` (Array<Object>, optional): Initial pages. Each object: `{ name: String, title: String, content: HTMLElement, isClosable?: boolean }`.
    *   `activePageName` (String, optional): Initially active page name.
    *   `showNewTabButton` (Boolean, optional): Passed to `AdwTabBar`.
    *   `onNewTabRequested` (Function, optional): Passed to `AdwTabBar`. App should
        call `adwTabView.addPage()`.
    *   `onPageChanged` (Function, optional): `onPageChanged(pageName)` callback.
    *   `onBeforePageClose` (Function, optional):
        `onBeforePageClose(pageName) -> boolean`. Return `false` to prevent
        closing.
    *   `onPageClosed` (Function, optional): `onPageClosed(pageName)` callback.
*   **Returns**: The main tab view `<div>`, augmented with methods:
    *   `addPage(pageData, makeActive?)`
    *   `removePage(pageName)`
    *   `setActivePage(pageName)`
    *   `getActivePageName() -> String | null`

**JavaScript Example (Full TabView):**

```html
<div id="js-tabview-container" style="height: 300px; border: 1px solid var(--borders-color);"></div>
<script>
  const tabViewContainer = document.getElementById('js-tabview-container');
  let pageCounter = 2;

  const page1Content = Adw.createLabel("Content for Page 1");
  const page2Content = Adw.createEntry({placeholder: "Input for Page 2"});
  const initialPages = [
    { name: "page1", title: "Page 1", content: page1Content, isClosable: true },
    { name: "page2", title: "Page Two", content: page2Content, isClosable: true }
  ];

  const myTabView = Adw.createTabView({
    pages: initialPages,
    activePageName: "page1",
    showNewTabButton: true,
    onNewTabRequested: () => {
      pageCounter++;
      const newPageName = `page${pageCounter}`;
      myTabView.addPage({
        name: newPageName,
        title: `Page ${pageCounter}`,
        content: Adw.createLabel(`Content for new Page ${pageCounter}`),
        isClosable: true
      }, true); // Add and make active
    },
    onPageChanged: (pageName) => Adw.createToast(`Switched to ${pageName}`),
    onBeforePageClose: (pageName) => {
      if (pageName === "page1") {
        // return confirm("Are you sure you want to close Page 1? It's important!");
      }
      return true; // Allow close
    },
    onPageClosed: (pageName) => Adw.createToast(`${pageName} was closed.`)
  });

  tabViewContainer.appendChild(myTabView);
</script>
```

## Web Components

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

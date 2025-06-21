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

## Styling

*   `scss/_tabs.scss` is the primary file.
*   `AdwTabBar` styles the container for tab buttons (flex layout, borders).
*   `AdwTabButton` styles individual tabs (padding, borders, active state, close button).
*   `AdwTabPage` is usually a simple block container, with `display: none` toggled by `AdwTabView`.
*   `AdwTabView` structures the tab bar and content area.

---
Next: [NavigationView](./navigationview.md)

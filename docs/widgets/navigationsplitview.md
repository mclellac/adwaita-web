# NavigationSplitView

An AdwNavigationSplitView is a layout container that provides a master-detail view, typically with a collapsible sidebar (master) and a main content pane (detail). The content pane often hosts an `AdwNavigationView` or `AdwTabView`. It's responsive, changing behavior at defined breakpoints (e.g., sidebar overlays content on narrower screens).

## JavaScript Factory: `Adw.createAdwNavigationSplitView()`

Creates an Adwaita-styled navigation split view.

**Signature:**

```javascript
Adw.createAdwNavigationSplitView(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `sidebar` (HTMLElement, required): The content for the sidebar.
    *   `content` (HTMLElement, required): The content for the main pane.
    *   `showSidebar` (Boolean, optional): Initial visibility of the sidebar. Defaults to `true`.
    *   `canCollapse` (Boolean, optional): Whether the sidebar can be collapsed. Defaults to `true`. If `false`, the sidebar is always visible in docked mode (unless screen is too narrow for docked mode).
    *   `collapseThreshold` (Number, optional): Width in pixels below which the sidebar transitions to overlay mode (if `canCollapse` is true). Defaults to `768`.
    *   `sidebarWidth` (String, optional): Default CSS width of the sidebar when docked (e.g., "300px"). Defaults to a predefined value.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the navigation split view. It's augmented with methods:
    *   `showSidebar()`
    *   `hideSidebar()`
    *   `toggleSidebar()`
    *   `isSidebarVisible() -> boolean`
    *   `isOverlayMode() -> boolean` (True if sidebar is currently overlaying content due to narrow width)
    *   `connectObserver()`: (Called internally) Starts the ResizeObserver.
    *   `disconnectObserver()`: Stops the ResizeObserver.

**Example:**

```html
<div id="js-navsplitview-container" style="height: 400px; border: 1px solid var(--borders-color); width: 100%; max-width: 800px; margin: auto; resize: horizontal; overflow: auto;">
  <!-- Resize this container to see responsive behavior -->
</div>
<script>
  const container = document.getElementById('js-navsplitview-container');

  // --- Sidebar Content ---
  const sidebarContent = document.createElement('div');
  sidebarContent.style.padding = "var(--spacing-m)";
  sidebarContent.innerHTML = `
    <h4>Navigation</h4>
    <ul><li>Home</li><li>Messages</li><li>Settings</li></ul>
    <adw-button id="js-navsplit-toggle-btn">Toggle Sidebar JS</adw-button>
  `;


  // --- Main Content (e.g., a NavigationView) ---
  const mainPage1 = Adw.createLabel("Main Content Area - Page 1", { title: 2 });
  mainPage1.style.padding = "var(--spacing-l)";
  const mainContentNav = Adw.createNavigationView({ // Assuming NavigationView exists
      initialPages: [{name: "main1", element: mainPage1, header: {title: "Main View"}}]
  });


  const navSplitView = Adw.createAdwNavigationSplitView({
    sidebar: sidebarContent,
    content: mainContentNav,
    showSidebar: true,
    collapseThreshold: 600, // Custom threshold for demo
    sidebarWidth: "250px"
  });
  container.appendChild(navSplitView);

  // Ensure observer is connected (usually handled by factory if in DOM)
  // requestAnimationFrame(() => navSplitView.connectObserver());

  // Wire up the toggle button inside the sidebar (if it were real)
  const toggleBtnInSidebar = sidebarContent.querySelector('#js-navsplit-toggle-btn');
  if(toggleBtnInSidebar) {
      toggleBtnInSidebar.addEventListener('click', () => navSplitView.toggleSidebar());
  }

  navSplitView.addEventListener('sidebar-toggled', (e) => {
    console.log(`JS NavSplitView: Sidebar visible: ${e.detail.isVisible}, Overlay: ${e.detail.isOverlay}`);
  });
</script>
```

## Web Component: `<adw-navigation-split-view>`

A declarative way to define Adwaita navigation split views.

**HTML Tag:** `<adw-navigation-split-view>`

**Attributes:**

*   `show-sidebar` (Boolean, optional): If present and not `"false"`, sidebar is initially shown.
*   `can-collapse` (Boolean, optional): If present and not `"false"` (default is `true`), allows sidebar to collapse.
*   `collapse-threshold` (Number, optional): Width in pixels for overlay mode transition. Default `768`.
*   `sidebar-width` (String, optional): CSS width of the sidebar. Default `300px`.

**Slots:**

*   `sidebar`: Content for the sidebar pane.
*   `content` (or default slot): Content for the main details pane.

**Events:**

*   `sidebar-toggled`: Fired when sidebar visibility changes. `event.detail` contains `{ isVisible: boolean, isOverlay: boolean }`.

**Methods:**

*   `showSidebar()`, `hideSidebar()`, `toggleSidebar()`
*   `isSidebarVisible() -> boolean`
*   `isOverlayMode() -> boolean`

**Example:**

```html
<adw-button id="wc-navsplit-toggle-btn-external">Toggle WC Sidebar</adw-button>
<adw-navigation-split-view
  id="my-wc-navsplit"
  show-sidebar
  collapse-threshold="700"
  sidebar-width="280px"
  style="height: 450px; border: 1px solid var(--borders-color); margin-top: 5px; resize: horizontal; overflow: auto; min-width: 300px; max-width: 100%;">

  <div slot="sidebar" style="padding: var(--spacing-m); background-color: var(--sidebar-bg-color);">
    <h3>Sidebar Menu</h3>
    <adw-list-box flat>
      <adw-action-row title="Dashboard"></adw-action-row>
      <adw-action-row title="Analytics"></adw-action-row>
      <adw-action-row title="Reports"></adw-action-row>
    </adw-list-box>
  </div>

  <div slot="content" style="padding: var(--spacing-l);">
    <h2>Main Application Content</h2>
    <p>This area displays the details or the main navigation stack. Resize the container or browser window to see the responsive behavior of the sidebar.</p>
    <adw-status-page title="No Item Selected" description="Please select an item from the sidebar."></adw-status-page>
  </div>
</adw-navigation-split-view>

<script>
  const wcNavSplit = document.getElementById('my-wc-navsplit');
  const wcNavSplitToggleBtnExternal = document.getElementById('wc-navsplit-toggle-btn-external');

  wcNavSplitToggleBtnExternal.addEventListener('click', () => {
    wcNavSplit.toggleSidebar();
  });

  wcNavSplit.addEventListener('sidebar-toggled', (event) => {
    console.log('WC NavigationSplitView sidebar toggled:', event.detail);
    Adw.createToast(`WC Sidebar: ${event.detail.isVisible ? 'Shown' : 'Hidden'}, Overlay: ${event.detail.isOverlay}`);
  });
</script>
```

## Styling & Behavior

*   Primary SCSS: `scss/_navigation_split_view.scss`.
*   Uses flexbox for layout.
*   A `ResizeObserver` monitors the component's width to switch between docked and overlay modes for the sidebar.
*   In overlay mode, the sidebar is typically positioned absolutely, and a backdrop (`.adw-navigation-split-view-backdrop`) is shown to obscure the main content.
*   CSS transitions are used for smooth showing/hiding of the sidebar and backdrop.
*   The `collapsed` class is applied to the sidebar when it's hidden in docked mode.
*   The `sidebar-overlay` class is applied to the main split view container when in overlay mode.
*   The `revealed` class is applied to the sidebar when it's shown in overlay mode.

---
Next: [OverlaySplitView](./overlaysplitview.md)

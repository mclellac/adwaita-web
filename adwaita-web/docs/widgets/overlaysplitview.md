# OverlaySplitView

An AdwOverlaySplitView is a layout container similar to `AdwNavigationSplitView`,
providing a sidebar and a main content pane. However, in an
`AdwOverlaySplitView`, the sidebar *always* overlays the content (or is hidden)
and does not have a "docked" mode where it pushes content aside. It's suitable
for contexts where the sidebar is less frequently accessed or needs to be
quickly shown/hidden without disturbing the main content flow.

## JavaScript Factory: `Adw.createAdwOverlaySplitView()`

Creates an Adwaita-styled overlay split view.

**Signature:**

```javascript
Adw.createAdwOverlaySplitView(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `sidebar` (HTMLElement, required): The content for the sidebar.
    *   `content` (HTMLElement, required): The content for the main pane.
    *   `showSidebar` (Boolean, optional): Initial visibility of the sidebar.
        Defaults to `false` (sidebar is typically hidden by default in overlay
        views).
    *   `canCollapse` (Boolean, optional): Whether the sidebar can be hidden by user
        interaction (e.g., backdrop click, Escape key). Defaults to `true`. If
        `false`, once shown, it might only be hideable programmatically or not at
        all via typical dismiss actions.
    *   `sidebarPosition` (String, optional): Position of the sidebar. Can be
        `"start"` (left, default) or `"end"` (right).
    *   `sidebarWidth` (String, optional): CSS width of the sidebar when shown
        (e.g., "300px"). Defaults to a predefined value.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the overlay split view. It's augmented with methods:
    *   `showSidebar()`
    *   `hideSidebar()` (Respects `canCollapse`)
    *   `toggleSidebar()` (Respects `canCollapse` for hiding)
    *   `isSidebarVisible() -> boolean`

**Example:**

```html
<div id="js-overlaysplitview-container"
     style="height: 300px; border: 1px solid var(--borders-color);
            width: 100%; max-width: 600px; margin: auto;
            position: relative; overflow: hidden;">
  <!-- Button to trigger sidebar will be part of main content or external -->
</div>
<script>
  const container = document.getElementById('js-overlaysplitview-container');

  // --- Sidebar Content ---
  const sidebarContent = document.createElement('div');
  sidebarContent.style.padding = "var(--spacing-m)";
  // Overlay often looks like a popover
  sidebarContent.style.backgroundColor = "var(--popover-bg-color)";
  sidebarContent.style.height = "100%";
  sidebarContent.innerHTML = `
    <h4>Filters</h4>
    <adw-list-box flat>
      <adw-action-row title="Category A"></adw-action-row>
      <adw-action-row title="Category B"></adw-action-row>
    </adw-list-box>
  `;

  // --- Main Content ---
  const mainContent = document.createElement('div');
  mainContent.style.padding = "var(--spacing-l)";
  const openOverlayBtn = Adw.createButton("Show Filters", {
      onClick: () => overlaySplitView.showSidebar()
  });
  const mainLabel = "Main application content goes here. " +
                    "The sidebar will overlay this.";
  mainContent.append(openOverlayBtn, Adw.createLabel(mainLabel));


  const overlaySplitView = Adw.createAdwOverlaySplitView({
    sidebar: sidebarContent,
    content: mainContent,
    showSidebar: false, // Start hidden
    sidebarPosition: "start", // "end" for right-side
    sidebarWidth: "280px"
  });
  container.appendChild(overlaySplitView);

  overlaySplitView.addEventListener('sidebar-toggled', (e) => {
    console.log(`JS OverlaySplitView: Sidebar visible: ${e.detail.isVisible}`);
    openOverlayBtn.disabled = e.detail.isVisible; // Disable button when sidebar is open
  });
</script>
```

## Web Component: `<adw-overlay-split-view>`

A declarative way to define Adwaita overlay split views.

**HTML Tag:** `<adw-overlay-split-view>`

**Attributes:**

*   `show-sidebar` (Boolean, optional): If present and not `"false"`, sidebar is initially shown. Default is `false`.
*   `can-collapse` (Boolean, optional): If present and not `"false"` (default is `true`), allows sidebar to be hidden via backdrop click/Escape.
*   `sidebar-position` (String, optional): `"start"` (default) or `"end"`.
*   `sidebar-width` (String, optional): CSS width of the sidebar. Default `300px`.

**Slots:**

*   `sidebar`: Content for the sidebar pane.
*   `content` (or default slot): Content for the main details pane.

**Events:**

*   `sidebar-toggled`: Fired when sidebar visibility changes. `event.detail` contains `{ isVisible: boolean }`.

**Methods:**

*   `showSidebar()`, `hideSidebar()`, `toggleSidebar()`
*   `isSidebarVisible() -> boolean`

**Example:**

```html
<adw-button id="wc-overlaysplit-toggle-btn">Open Settings Overlay</adw-button>
<adw-overlay-split-view
  id="my-wc-overlaysplit"
  sidebar-position="end"
  sidebar-width="320px"
  style="height: 350px; border: 1px solid var(--borders-color);
         margin-top: 5px; position: relative; overflow: hidden;">

  <div slot="sidebar"
       style="background-color: var(--dialog-bg-color);
              padding: var(--spacing-m); height: 100%;">
    <h3>Quick Settings</h3>
    <adw-switch-row title="Dark Mode"></adw-switch-row>
    <adw-switch-row title="Notifications"></adw-switch-row>
    <adw-button style="margin-top: var(--spacing-m)"
                onclick="document.getElementById('my-wc-overlaysplit').hideSidebar()">
      Close Settings
    </adw-button>
  </div>

  <div slot="content"
       style="padding: var(--spacing-l);
              background-color: var(--view-bg-color); height:100%;">
    <h2>Main Application View</h2>
    <p>This is the primary content. The settings sidebar will appear overlaying
    this content from the right.</p>
  </div>
</adw-overlay-split-view>

<script>
  const wcOverlaySplit = document.getElementById('my-wc-overlaysplit');
  const wcOverlaySplitToggleBtn = document.getElementById('wc-overlaysplit-toggle-btn');

  wcOverlaySplitToggleBtn.addEventListener('click', () => {
    wcOverlaySplit.showSidebar();
  });

  wcOverlaySplit.addEventListener('sidebar-toggled', (event) => {
    console.log('WC OverlaySplitView sidebar toggled:', event.detail);
    Adw.createToast(`WC Overlay Sidebar: ${event.detail.isVisible ? 'Shown' : 'Hidden'}`);
    wcOverlaySplitToggleBtn.disabled = event.detail.isVisible;
  });
</script>
```

## Styling & Behavior

*   Primary SCSS: `scss/_overlay_split_view.scss`.
*   The sidebar is always in an "overlay" state, meaning it's typically positioned absolutely over the content.
*   A backdrop (`.adw-overlay-split-view-backdrop`) is shown when the sidebar is visible (if `canCollapse` is true) to obscure the main content and allow dismissal by clicking it.
*   CSS transitions are used for the sliding animation of the sidebar and fading of the backdrop.
*   The `revealed` class controls the visibility and animated state of the sidebar.
*   Unlike `AdwNavigationSplitView`, it does not use `ResizeObserver` as its behavior isn't dependent on its own width (it's always an overlay).

---
Next: [ProgressBar](./progressbar.md)

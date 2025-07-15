# ToolbarView

An AdwToolbarView is a layout container that arranges content with optional top
and bottom toolbars. The main content area is typically scrollable, and the
toolbars can be revealed or hidden. This is useful for views that need
persistent actions or information visible at the top or bottom.

## JavaScript Factory: `Adw.createToolbarView()`

Creates an Adwaita-styled toolbar view.

**Signature:**

```javascript
Adw.createToolbarView(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `content` (HTMLElement, optional): The main content element for the view.
    *   `topBar` (HTMLElement, optional): An element for the top bar (e.g., an `AdwHeaderBar` or a custom `div`).
    *   `bottomBar` (HTMLElement, optional): An element for the bottom bar.
    *   `topBarRevealed` (Boolean, optional): Initial visibility of the top bar. Defaults to `true` if `topBar` is provided, `false` otherwise.
    *   `bottomBarRevealed` (Boolean, optional): Initial visibility of the bottom bar. Defaults to `true` if `bottomBar` is provided, `false` otherwise.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the toolbar view. It's augmented with methods:
    *   `setTopBar(element: HTMLElement | null)`
    *   `setBottomBar(element: HTMLElement | null)`
    *   `showTopBar()`
    *   `hideTopBar()`
    *   `showBottomBar()`
    *   `hideBottomBar()`
    *   And properties: `topBarRevealed` (Boolean), `bottomBarRevealed` (Boolean).

**Example:**

```html
<div id="js-toolbarview-container" style="height: 350px; border: 1px solid var(--borders-color); display: flex;"></div>
<script>
  const container = document.getElementById('js-toolbarview-container');

  // --- Top Bar ---
  const topBarContent = Adw.createHeaderBar({ title: "Toolbar View Demo" });
  // Or a simpler div:
  // const topBarContent = document.createElement('div');
  // topBarContent.style.padding = "var(--spacing-s)";
  // topBarContent.style.backgroundColor = "var(--headerbar-bg-color)";
  // topBarContent.style.borderBottom = "1px solid var(--borders-color)";
  // topBarContent.textContent = "Top Toolbar";


  // --- Bottom Bar ---
  const bottomBarChildren = [
    Adw.createButton("Cancel", { onClick: () => Adw.createToast("Cancel") }),
    Adw.createButton("Apply", { suggested: true, onClick: () => Adw.createToast("Apply") })
  ];
  const bottomBarContent = Adw.createBox({
    orientation: "horizontal",
    spacing: "m",
    align: "center",
    justify: "end", // Align buttons to the right
    children: bottomBarChildren
  });
  bottomBarContent.style.padding = "var(--spacing-s)";
  // Use headerbar colors for consistency
  bottomBarContent.style.backgroundColor = "var(--headerbar-bg-color)";
  bottomBarContent.style.borderTop = "1px solid var(--borders-color)";


  // --- Main Content ---
  const mainScrollableContent = document.createElement('div');
  mainScrollableContent.style.padding = "var(--spacing-m)";
  for (let i = 1; i <= 20; i++) {
    const p = document.createElement('p');
    p.textContent = `Scrollable content line ${i}... Lorem ipsum dolor sit amet.`;
    mainScrollableContent.appendChild(p);
  }

  const toolbarView = Adw.createToolbarView({
    topBar: topBarContent,
    bottomBar: bottomBarContent,
    content: mainScrollableContent,
    topBarRevealed: true,
    bottomBarRevealed: true
  });

  container.appendChild(toolbarView); // ToolbarView should fill its container

  // Example: Toggle bottom bar after a delay
  setTimeout(() => {
    if (toolbarView.bottomBarRevealed) {
      // toolbarView.hideBottomBar();
      // Adw.createToast("Bottom bar hidden by JS.");
    }
  }, 3000);
</script>
```

## Web Component: `<adw-toolbar-view>`

A declarative way to define Adwaita toolbar views.

**HTML Tag:** `<adw-toolbar-view>`

**Attributes:**

*   `top-bar-revealed` (Boolean, optional): If present and not `"false"`, the top bar is shown (if content exists for it).
*   `bottom-bar-revealed` (Boolean, optional): If present and not `"false"`, the bottom bar is shown (if content exists for it).

**Slots:**

*   `top-bar`: Content for the top toolbar.
*   Default slot: Main content for the view. This area is typically scrollable.
*   `bottom-bar`: Content for the bottom toolbar.

**Methods:**
*   `showTopBar()`, `hideTopBar()`
*   `showBottomBar()`, `hideBottomBar()`

**Properties:**
*   `topBarRevealed` (Boolean)
*   `bottomBarRevealed` (Boolean)

**Example:**

```html
<adw-toolbar-view style="height: 400px; border: 1px solid var(--borders-color);"
                    top-bar-revealed bottom-bar-revealed
                    id="wc-toolbar-view">
  <adw-header-bar slot="top-bar">
    <h1 slot="title">My Document</h1>
    <adw-button slot="end" flat icon="<svg viewBox='0 0 16 16'><path d='M2.5 12Z'/></svg>"></adw-button>
  </adw-header-bar>

  <div style="padding: var(--spacing-l); overflow-y: auto;"> <!-- Main content -->
    <p>This is the primary scrollable content area of the toolbar view.</p>
    <p>It can contain text, images, forms, or other Adwaita components.</p>
    <!-- Add more content here to demonstrate scrolling -->
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
    tempor incididunt ut labore et dolore magna aliqua.</p>
    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
    ut aliquip ex ea commodo consequat.</p>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
    dolore eu fugiat nulla pariatur.</p>
    <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.</p>
     <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
     tempor incididunt ut labore et dolore magna aliqua.</p>
    <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
    ut aliquip ex ea commodo consequat.</p>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
    dolore eu fugiat nulla pariatur.</p>
    <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
    officia deserunt mollit anim id est laborum.</p>
  </div>

  <adw-box class="adw-box adw-box-spacing-m align-center" slot="bottom-bar"
           style="padding: var(--spacing-s); border-top: 1px solid var(--borders-color);">
    <adw-label>Status: Ready</adw-label>
    <div style="flex-grow: 1;"></div> <!-- Spacer -->
    <adw-button id="wc-tbv-action">Perform Action</adw-button>
  </adw-box>
</adw-toolbar-view>

<adw-button onclick="document.getElementById('wc-toolbar-view').hideBottomBar()">Toggle Bottom Bar</adw-button>
<script>
    document.getElementById('wc-tbv-action').addEventListener('click', () => Adw.createToast("Action from ToolbarView clicked!"));
</script>
```

## Styling

*   Primary SCSS: `scss/_toolbar_view.scss`.
*   Uses flexbox to arrange top bar, content, and bottom bar in a column.
*   The main content area (`.adw-toolbar-view-content`) is typically set to `flex-grow: 1` and `overflow-y: auto` to allow scrolling.
*   Top and bottom bars (`.adw-toolbar-view-top-bar`, `.adw-toolbar-view-bottom-bar`) have styles for background, borders, and transitions for reveal/hide animations if implemented.
*   The `revealed` class is used to control visibility and animations of the bars.

---
Next: [Carousel](./carousel.md)

# NavigationView

An AdwNavigationView manages a stack of views (pages), allowing users to
navigate between them using "push" (to a new view) and "pop" (back to the
previous view) operations. It typically includes an `AdwHeaderBar` that
updates its title and back button visibility based on the navigation stack.

## JavaScript Factory: `Adw.createNavigationView()`

Creates an Adwaita-styled navigation view manager.

**Signature:**

```javascript
Adw.createNavigationView(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `initialPages` (Array<Object>, optional): An array of page data objects to
        initialize the stack. The first page in the array is shown initially.
        Each object:
        *   `name` (String, required): A unique identifier for the page.
        *   `element` (HTMLElement, required): The HTML element representing the
            page content.
        *   `header` (Object, optional): Configuration for the header bar when this
            page is active.
            *   `title` (String, optional): Page title.
            *   `subtitle` (String, optional): Page subtitle.
            *   `start` (Array<HTMLElement>, optional): Elements for the start of
                the header bar (prepended to back button if shown).
            *   `end` (Array<HTMLElement>, optional): Elements for the end of the
                header bar.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the navigation view. It's augmented with methods:
    *   `push(pageData)`: Pushes a new page onto the stack. `pageData` is an object like those in `initialPages`.
    *   `pop()`: Pops the current page from the stack, revealing the previous one.
    *   `getVisiblePageName() -> String | null`: Returns the name of the currently visible page.

**Example:**

```html
<div id="js-navview-container"
     style="height: 350px; border: 1px solid var(--borders-color);
            display: flex; flex-direction: column;"></div>
<script>
  const navViewContainer = document.getElementById('js-navview-container');

  // --- Page 1 Content ---
  const page1Content = document.createElement('div');
  page1Content.style.padding = "var(--spacing-m)";
  const page1Button = Adw.createButton("Go to Page 2", {
    onClick: () => myNavView.push(page2Data) // page2Data defined below
  });
  const page1Label = Adw.createLabel("This is the first page.", {isBody: true});
  page1Content.append(page1Label, page1Button);

  // --- Page 2 Content ---
  const page2Content = document.createElement('div');
  page2Content.style.padding = "var(--spacing-m)";
  const page2Button = Adw.createButton("Go to Page 3 (Settings)", {
    onClick: () => myNavView.push(page3Data) // page3Data defined below
  });
  const page2Label = Adw.createLabel("This is the second page.", {isBody: true});
  page2Content.append(page2Label, page2Button);

  // --- Page 3 Content ---
  const page3Content = Adw.createEntryRow({title: "Some Setting"}); // Example content

  // --- Page Data Objects ---
  const page1Data = {
    name: "home",
    element: page1Content,
    header: { title: "Home View" }
  };
  const page2Data = {
    name: "details",
    element: page2Content,
    header: { title: "Details", subtitle: "Page 2" }
  };
  const page3Data = {
    name: "settings",
    element: page3Content,
    header: { title: "Settings" }
  };

  const myNavView = Adw.createNavigationView({
    initialPages: [page1Data]
  });

  navViewContainer.appendChild(myNavView);

  myNavView.addEventListener('pushed', (e) => Adw.createToast(`Pushed to: ${e.detail.pageName}`));
  myNavView.addEventListener('popped', (e) => Adw.createToast(`Popped: ${e.detail.pageName}`));
</script>
```

## Web Component: `<adw-navigation-view>`

A declarative way to define Adwaita navigation views.

**HTML Tag:** `<adw-navigation-view>`

**Attributes:**
*   No specific attributes for initial configuration beyond styling. Initial pages are defined via slotted content.

**Slots:**

*   Default slot: Place page elements here. Each page element should be
    identifiable (e.g., have a `data-page-name` or `page-name` attribute) and
    can define its header bar content via sub-slots.
    *   A page element (e.g., a `<div>` or a custom `<adw-navigation-page>`
        component) should have a `data-page-name` (or `page-name`) attribute.
    *   Inside a page element, you can define header parts:
        *   `<div slot="header-title">My Page Title</div>`
        *   `<div slot="header-subtitle">Subtitle</div>`
        *   `<div slot="header-start"><adw-button>...</adw-button></div>`
        *   `<div slot="header-end"><adw-button>...</adw-button></div>`
    The first slotted page element is typically shown initially.

**Events:**

*   `pushed`: Fired after a page is pushed. `event.detail` contains `{ pageName: String }`.
*   `popped`: Fired after a page is popped. `event.detail` contains `{ pageName: String }`.

**Methods:**

*   `push(pageElementOrName)`: Pushes a new page. If `pageElementOrName` is a
    string, it's treated as the `data-page-name` of an existing slotted page to
    navigate to. If it's an HTMLElement, it's added to the view (if not already
    present) and pushed. The element should conform to the page structure with
    `data-page-name` and optional header slots.
*   `pop()`: Pops the current page.
*   `getVisiblePageName() -> String | null`: Returns the name of the current page.

**Example:**

```html
<adw-navigation-view id="wc-nav-view" style="height: 350px; border: 1px solid var(--borders-color);">
  <div data-page-name="main-list" style="padding: var(--spacing-m);">
    <div slot="header-title">Main List</div>
    <adw-button id="wc-nav-goto-details">View Item Details</adw-button>
    <adw-button id="wc-nav-goto-settings" style="margin-left: 10px;">Go to Settings</adw-button>
  </div>

  <div data-page-name="item-details" style="padding: var(--spacing-m);">
    <div slot="header-title">Item Details</div>
    <div slot="header-subtitle">Viewing selected item</div>
    <p>Detailed information about the item...</p>
    <adw-button id="wc-nav-goto-settings-from-details">Settings from Details</adw-button>
  </div>

  <div data-page-name="app-settings" style="padding: var(--spacing-m);">
    <div slot="header-title">Application Settings</div>
    <adw-entry-row title="User Name"></adw-entry-row>
    <adw-switch-row title="Enable Feature X" active></adw-switch-row>
  </div>
</adw-navigation-view>

<script>
  const wcNavView = document.getElementById('wc-nav-view');
  const gotoDetailsBtn = document.getElementById('wc-nav-goto-details');
  const gotoSettingsBtn = document.getElementById('wc-nav-goto-settings');
  const gotoSettingsFromDetailsBtn = document.getElementById('wc-nav-goto-settings-from-details');


  gotoDetailsBtn.addEventListener('click', () => {
    wcNavView.push("item-details"); // Push by page name
  });
  gotoSettingsBtn.addEventListener('click', () => {
    wcNavView.push("app-settings");
  });
  gotoSettingsFromDetailsBtn.addEventListener('click', () => {
    wcNavView.push("app-settings");
  });

  wcNavView.addEventListener('pushed', (e) => Adw.createToast(`WC NavView Pushed: ${e.detail.pageName}`));
  wcNavView.addEventListener('popped', (e) => Adw.createToast(`WC NavView Popped: ${e.detail.pageName}`));
</script>
```

## Styling

*   Primary SCSS: `scss/_navigation_view.scss` (and uses `_headerbar.scss`).
*   Manages an internal `AdwHeaderBar`.
*   Page transitions (slide animations) are defined in CSS (`.adw-navigation-page-entering-left`, `.adw-navigation-page-exiting-right`, etc.).
*   The container ensures only the active page is visible.

---
Next: [BottomSheet](./bottomsheet.md)

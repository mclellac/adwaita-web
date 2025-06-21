# ViewSwitcher

A ViewSwitcher is a container that manages multiple views (pages or content areas) and provides a set of buttons (often styled like tabs or a segmented button) to switch between them. Only one view is visible at a time.

## JavaScript Factory: `Adw.createViewSwitcher()`

Creates an Adwaita-styled view switcher.

**Signature:**

```javascript
Adw.createViewSwitcher(options = {}) -> HTMLDivElement (the main switcher container)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `views` (Array<Object>, required): An array of view objects. Each object
        should have:
        *   `name` (String, required): A unique identifier for the view.
        *   `content` (HTMLElement, required): The HTML element representing the
            content of this view.
        *   `id` (String, optional): An ID for the view's content panel (used for
            ARIA).
        *   `buttonOptions` (Object, optional): Options passed to
            `Adw.createButton` for this view's switcher button. Typically
            includes `text` or `icon`. Example: `{ text: "View Title" }`.
    *   `activeViewName` (String, optional): The `name` of the view to be initially
        active. If not provided, the first view in the `views` array becomes
        active.
    *   `label` (String, optional): An ARIA label for the view switcher bar (the
        group of buttons).
    *   `isInline` (Boolean, optional): If `true`, styles the switcher buttons more
        compactly, suitable for inline use. Defaults to `false`.
    *   `onViewChanged` (Function, optional): Callback function executed when the
        active view changes. Receives `(viewName, buttonId, panelId)` as
        arguments.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element containing the switcher bar and the content area for views. It will have methods like `setActiveView(viewName)` and `getActiveViewName()`.

**Example:**

```html
<div id="js-viewswitcher-container" style="border: 1px solid var(--borders-color); padding: var(--spacing-s);"></div>
<script>
  const container = document.getElementById('js-viewswitcher-container');

  const view1Content = document.createElement('div');
  view1Content.innerHTML = '<h2>View 1 Content</h2><p>This is the first page.</p>';
  view1Content.style.padding = 'var(--spacing-m)';

  const view2Content = Adw.createEntry({ placeholder: "Enter data for view 2..." });
  const view2Wrapper = document.createElement('div');
  view2Wrapper.innerHTML = '<h2>View 2 Content</h2>';
  view2Wrapper.appendChild(view2Content);
  view2Wrapper.style.padding = 'var(--spacing-m)';


  const viewSwitcher = Adw.createViewSwitcher({
    views: [
      { name: "home", content: view1Content, buttonOptions: { text: "Home" } },
      { name: "settings", content: view2Wrapper, buttonOptions: { text: "Settings" } }
    ],
    activeViewName: "home",
    label: "Main Views",
    onViewChanged: (viewName) => {
      Adw.createToast(`Switched to: ${viewName}`);
    }
  });
  container.appendChild(viewSwitcher);

  // Programmatically switch view after a delay
  setTimeout(() => {
    viewSwitcher.setActiveView("settings");
  }, 2500);
</script>
```

## Web Component: `<adw-view-switcher>`

A declarative way to define Adwaita view switchers.

**HTML Tag:** `<adw-view-switcher>`

**Attributes:**

*   `label` (String, optional): ARIA label for the switcher button group.
*   `active-view` (String, optional): The `view-name` of the initially active
    view. Can be dynamically changed to switch views.
*   `is-inline` (Boolean, optional): If present, applies inline styling to the
    switcher buttons.

**Slots:**

*   Default slot: Child elements that represent the views. Each child element
    **must** have a `view-name` attribute. The content of the child element is
    the view itself. The text content of a `label` attribute on the child or a
    `data-view-title` attribute can be used for the switcher button text if not
    specified via other means.

**Events:**

*   `view-changed`: Fired when the active view changes. `event.detail` contains
    `{ viewName: String, buttonId: String, panelId: String }`.

**Methods:**
*   `setActiveView(viewName)`: Programmatically sets the active view.

**Example:**

```html
<adw-view-switcher label="Document Sections" active-view="intro" id="wc-view-switcher" style="border: 1px solid var(--borders-color); padding: var(--spacing-s);">
  <div view-name="intro" data-view-title="Introduction" style="padding: var(--spacing-m);">
    <h3>Introduction Page</h3>
    <p>Welcome to the documentation.</p>
  </div>
  <div view-name="usage" data-view-title="Usage Guide" style="padding: var(--spacing-m);">
    <h3>Usage Guide</h3>
    <adw-entry placeholder="Search usage topics..."></adw-entry>
  </div>
  <div view-name="api" data-view-title="API Reference" style="padding: var(--spacing-m);">
    <h3>API Reference</h3>
    <p>Details about functions and methods.</p>
  </div>
</adw-view-switcher>

<script>
  const wcViewSwitcher = document.getElementById('wc-view-switcher');
  wcViewSwitcher.addEventListener('view-changed', (event) => {
    Adw.createToast(`WC Switched to: ${event.detail.viewName}`);
  });

  // Programmatically change after 2 seconds
  setTimeout(() => {
    // wcViewSwitcher.setActiveView("api"); // Using method
    // OR
    wcViewSwitcher.setAttribute("active-view", "api"); // Using attribute
  }, 2000);
</script>
```

## Styling

*   Primary SCSS: `scss/_viewswitcher.scss`.
*   The switcher bar is typically a group of `AdwButton` elements, often styled as `flat` or linked.
*   The content area displays only the active view.
*   The `is-inline` variant uses smaller padding/margins for the buttons.

---
Next: [Flap](./flap.md)

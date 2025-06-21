# HeaderBar

A HeaderBar is a crucial component in Adwaita applications, typically appearing at the top of a window or view, containing a title and actions. Adwaita-Web provides `Adw.createHeaderBar()` and the `<adw-header-bar>` Web Component.

## JavaScript Factory: `Adw.createHeaderBar()`

Creates an Adwaita-styled header bar.

**Signature:**

```javascript
Adw.createHeaderBar(options = {}) -> HTMLElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): Main title text for the header bar.
    *   `subtitle` (String, optional): Subtitle text, displayed below the main title.
    *   `start` (Array<HTMLElement>, optional): An array of HTML elements (e.g., `Adw.createButton()`) to place at the start (left side) of the header bar.
    *   `end` (Array<HTMLElement>, optional): An array of HTML elements to place at the end (right side) of the header bar.

**Returns:**

*   `(HTMLElement)`: The created `<header>` element representing the header bar. This element will have methods like `updateTitleSubtitle(title, subtitle)`, `setStartWidgets(widgetsArray)`, and `setEndWidgets(widgetsArray)` monkey-patched onto it if they don't exist, allowing dynamic updates.

**Example:**

```html
<div id="js-headerbar-container">
  <!-- This container will house a full window structure usually -->
</div>
<script>
  const container = document.getElementById('js-headerbar-container');

  const backButton = Adw.createButton("", {
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/></svg>', // Left arrow
    flat: true,
    onClick: () => Adw.createToast("Back button clicked")
  });

  const menuButton = Adw.createButton("", {
    icon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>', // Menu icon
    flat: true,
    onClick: () => Adw.createToast("Menu button clicked")
  });

  const myHeaderBar = Adw.createHeaderBar({
    title: "My Application",
    subtitle: "Current View",
    start: [backButton],
    end: [menuButton]
  });
  container.appendChild(myHeaderBar); // Typically, a header bar is part of an AdwWindow

  // Example of updating title dynamically
  setTimeout(() => {
    if (myHeaderBar.updateTitleSubtitle) { // Check if method exists
        myHeaderBar.updateTitleSubtitle("Updated Title", "New Subtitle");
    } else { // Fallback for older versions or direct manipulation
        const titleEl = myHeaderBar.querySelector('.adw-header-bar-title');
        const subtitleEl = myHeaderBar.querySelector('.adw-header-bar-subtitle');
        if (titleEl) titleEl.textContent = "Updated Title";
        if (subtitleEl) subtitleEl.textContent = "New Subtitle";
    }
  }, 2000);
</script>
```

## Web Component: `<adw-header-bar>`

A declarative way to define Adwaita header bars.

**HTML Tag:** `<adw-header-bar>`

**Slots:**

*   `start`: Content for the start (left) section of the header bar. Place buttons or other elements here.
*   `title`: Content for the main title area. Typically, you'd place an `<h1>` or an `<adw-window-title>` element here.
*   `subtitle`: Content for the subtitle area, below the title. Typically, an `<h2>` or simple text.
*   `end`: Content for the end (right) section of the header bar.

**Example:**

```html
<adw-header-bar>
  <div slot="start">
    <adw-button circular flat icon='<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/></svg>'></adw-button>
  </div>
  <adw-window-title slot="title">My App Title</adw-window-title>
  <span slot="subtitle" style="font-size: var(--font-size-small); opacity: 0.7;">Details about view</span>
  <div slot="end">
    <adw-button flat>Action 1</adw-button>
    <adw-button circular flat icon='<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>'></adw-button>
  </div>
</adw-header-bar>

<!-- For a simpler title structure, you can directly slot H1/H2 -->
<adw-header-bar>
  <h1 slot="title">Simpler Title</h1>
  <h2 slot="subtitle" style="font-size: var(--font-size-small); opacity: 0.7;">Simpler Subtitle</h2>
</adw-header-bar>
```
*Note: `<adw-window-title>` is a simple Web Component that wraps its content in an `<h1>` tag with the class `adw-header-bar-title`.*

## Styling

*   Primary SCSS: `scss/_headerbar.scss`
*   Variables:
    *   `--headerbar-bg-color`
    *   `--headerbar-fg-color`
    *   `--headerbar-border-color` (typically for the bottom border)
    *   `--headerbar-shade-color` (used for subtle shadows or darker borders when scrolled)
    *   `--headerbar-backdrop-color` (background when window is not focused, or for "transparent" header bars blending with content)
*   The internal structure uses flexbox to arrange the start, center (title/subtitle), and end sections.

---
Next: [Window](./window.md)

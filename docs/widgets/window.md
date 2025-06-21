# Window (Application Window)

The Window component serves as the main container for an application's UI, typically including a HeaderBar and a main content area. Adwaita-Web provides `Adw.createWindow()` and the `<adw-application-window>` Web Component.

## JavaScript Factory: `Adw.createWindow()`

Creates an Adwaita-styled window structure.

**Signature:**

```javascript
Adw.createWindow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `header` (HTMLElement, optional): An Adwaita HeaderBar element (e.g., created with `Adw.createHeaderBar()`).
    *   `content` (HTMLElement, optional): The main content element for the window. *Security: Ensure this content is trusted or sanitized if it's user-generated HTML.*

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the window structure.

**Example:**

```html
<div id="js-window-container" style="height: 400px; border: 1px solid var(--borders-color);"></div>
<script>
  const windowContainer = document.getElementById('js-window-container');

  // 1. Create a HeaderBar
  const myHeader = Adw.createHeaderBar({
    title: "My JS Window",
    end: [ Adw.createButton("Close", { onClick: () => Adw.createToast("Window close requested") }) ]
  });

  // 2. Create content for the window
  const myContent = document.createElement('div');
  myContent.style.padding = "var(--spacing-m)";
  myContent.innerHTML = `
    <p>This is the main content area of the Adwaita-Web window.</p>
    <adw-button>A button in content</adw-button>
  `;

  // 3. Create the Window
  const myAppWindow = Adw.createWindow({
    header: myHeader,
    content: myContent
  });

  windowContainer.appendChild(myAppWindow);
</script>
```

## Web Component: `<adw-application-window>`

A declarative way to define an Adwaita application window structure.

**HTML Tag:** `<adw-application-window>`

**Slots:**

*   `header`: Place an `<adw-header-bar>` component here.
*   Default slot: The main content for the window. This content will be wrapped in a `<main class="adw-window-content">` element.

**Example:**

```html
<adw-application-window style="height: 450px; border: 1px solid var(--borders-color);">
  <adw-header-bar slot="header">
    <h1 slot="title">My WC Application</h1>
    <adw-button slot="end" flat icon='<svg viewBox="0 0 16 16"><path d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>'></adw-button>
  </adw-header-bar>

  <!-- Default slot for main content -->
  <div style="padding: var(--spacing-l);">
    <h2>Welcome!</h2>
    <p>This is the content area of the <code>&lt;adw-application-window&gt;</code>.</p>
    <p>It can contain any HTML or other Adwaita components.</p>
    <adw-box spacing="m">
        <adw-button suggested>Confirm</adw-button>
        <adw-button>Cancel</adw-button>
    </adw-box>
  </div>
</adw-application-window>
```

## Styling

*   Primary SCSS: `scss/_window.scss`
*   Variables:
    *   `--window-bg-color`: Background color of the window frame/chrome.
    *   `--window-fg-color`: Default text color within the window frame.
    *   `--view-bg-color`: Often used for the background of the main content area if it's distinct (e.g., inside `.adw-window-content`).
*   The component structure typically involves a flex column layout for the header and content.
*   The `.adw-window-content` class is applied to the main content wrapper and can be targeted for specific styling (e.g., padding, overflow).

---
Next: [Box](./box.md)

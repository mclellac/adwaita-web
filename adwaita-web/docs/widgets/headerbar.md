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
    icon: '<svg viewBox="0 0 16 16"><path d="M12 8a.5.5Z"/></svg>', // Left arrow (shortened)
    flat: true,
    onClick: () => Adw.createToast("Back button clicked")
  });

  const menuButton = Adw.createButton("", {
    icon: '<svg viewBox="0 0 16 16"><path d="M2.5 12a.5.5Z"/></svg>', // Menu icon (shortened)
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
    <adw-button circular flat icon='<svg viewBox="0 0 16 16"><path d="M12 8Z"/></svg>'></adw-button>
  </div>
  <adw-window-title slot="title">My App Title</adw-window-title>
  <span slot="subtitle"
        style="font-size: var(--font-size-small); opacity: 0.7;">
    Details about view
  </span>
  <div slot="end">
    <adw-button flat>Action 1</adw-button>
    <adw-button circular flat icon='<svg viewBox="0 0 16 16"><path d="M2.5 12Z"/></svg>'></adw-button>
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

*   **SCSS Source:** `scss/_headerbar.scss`
*   **Key CSS Classes & Structure:**
    *   `.adw-header-bar`: Main container element.
        *   Background: `var(--headerbar-bg-color)`.
        *   Text Color: `var(--headerbar-fg-color)`.
        *   Bottom Border: `var(--border-width) solid var(--headerbar-shade-color)`.
    *   `.adw-header-bar-start`: Container for elements at the start (left).
    *   `.adw-header-bar-center-box`: Flex container for centered title and subtitle.
        *   `.adw-header-bar-title`: For the main title text.
        *   `.adw-header-bar-subtitle`: For the subtitle text (dimmed opacity).
    *   `.adw-header-bar-end`: Container for elements at the end (right).
*   **Button Styling:** Buttons placed directly in `.adw-header-bar-start` or `.adw-header-bar-end` are styled flat by default (transparent background, inherit header bar text color).
    *   Use the `.raised` class on a button to make it retain its standard bordered/background appearance.
    *   `suggested-action` and `destructive-action` buttons retain their specific styling.
*   **States & Variants:**
    *   `.scrolled` or `.raised-border`: Added to `.adw-header-bar` when content scrolls under it (e.g., in `AdwToolbarView`). Changes `border-bottom-color` to `var(--headerbar-darker-shade-color)`.
    *   `.backdrop`: When the window is inactive, this class (or a parent `.window.backdrop`) changes the header bar's background to `var(--headerbar-backdrop-color)`.
    *   `.flat` (DEPRECATED): Makes the header bar transparent with no border. `AdwToolbarView` should be used for this effect.
    *   **Development Style:** If `.adw-header-bar` is inside an element with class `.devel`, it gets a striped background for visual distinction (e.g., for nightly application builds).
*   **Theming Variables:**
    *   `--headerbar-bg-color`, `--headerbar-fg-color`
    *   `--headerbar-shade-color`, `--headerbar-darker-shade-color` (for borders)
    *   `--headerbar-backdrop-color`
    *   `--dim-opacity` (for subtitle)
    *   Buttons use `var(--headerbar-fg-color-rgb)` for hover/active alpha overlays.

Refer to `scss/_headerbar.scss` for detailed structure and variables.

---
Next: [Window](./window.md)

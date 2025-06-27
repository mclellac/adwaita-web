# WindowTitle

The `<adw-window-title>` component is a simple Web Component intended to semantically represent the title within an `<adw-header-bar>` or at the top of a window-like structure.

## Web Component: `<adw-window-title>`

A declarative way to define a window or view title.

**HTML Tag:** `<adw-window-title>`

**Purpose:**

*   Provides a semantic element for titles.
*   Typically, its content is styled as a main heading (like an `<h1>`).
*   When used within an `<adw-header-bar>`'s `title` slot, the `<adw-header-bar>` component's styles will apply to it to ensure it fits the Adwaita design.

**Attributes:**

*   The component itself sets `role="heading"` and `aria-level="1"` in its `connectedCallback` if not already present, to improve accessibility.

**Slots:**

*   Default slot: The text content or other inline elements that make up the title.

**Example:**

```html
<adw-header-bar>
  <adw-window-title slot="title">My Application Title</adw-window-title>
  <!-- Other header bar content like buttons -->
</adw-header-bar>

<hr/>

<!-- Standalone usage (styling would need to be applied manually or by a container) -->
<adw-window-title>Some Page Title</adw-window-title>
<p>Content related to the page title above.</p>
```

## JavaScript Factory

There isn't a dedicated factory for `<adw-window-title>` as it's a very simple component. It can be created using `document.createElement('adw-window-title')` and then its `textContent` or child nodes can be set.

```javascript
const myTitle = document.createElement('adw-window-title');
myTitle.textContent = "Dynamic Title";
// myHeaderBar.querySelector('[slot="title"]').appendChild(myTitle); // Example
```

## Styling

*   `<adw-window-title>` itself is a simple custom element. It doesn't apply much styling directly.
*   Its appearance is primarily dictated by the CSS of its parent container, especially when slotted into an `<adw-header-bar>`.
*   The `adw-header-bar` styles its `title` slot to properly display the title text, often targeting `::slotted(adw-window-title)` or `::slotted(h1)`.

---
Next: [PreferencesView](./preferencesview.md) (or relevant component)

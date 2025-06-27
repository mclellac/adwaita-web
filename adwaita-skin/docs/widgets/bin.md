# Bin

An AdwBin is a simple container widget that holds a single child element.
It's often used as a base class for more complex widgets that need to manage a
single child, or as a straightforward way to apply Adwaita container styling
or padding to a single item.

## JavaScript Factory: `Adw.createBin()`

Creates an Adwaita-styled bin container.

**Signature:**

```javascript
Adw.createBin(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `child` (HTMLElement, optional): The single child element to place inside the bin.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the bin.

**Example:**

```html
<div id="js-bin-container" style="padding: 10px;"></div>
<script>
  const container = document.getElementById('js-bin-container');

  // Bin containing a label
  const labelContent = Adw.createLabel("This label is inside a Bin.", {title: 3});
  const binWithLabel = Adw.createBin({ child: labelContent });
  binWithLabel.style.border = "1px dashed var(--borders-color)";
  binWithLabel.style.padding = "var(--spacing-s)";
  container.appendChild(binWithLabel);

  // Bin containing an AdwButton (perhaps for specific alignment/padding wrapper)
  const buttonContent = Adw.createButton("Binned Button", {suggested: true});
  const binWithButton = Adw.createBin({ child: buttonContent });
  binWithButton.style.marginTop = "var(--spacing-m)";
  binWithButton.style.display = "inline-block"; // To show its boundaries
  binWithButton.style.backgroundColor = "var(--shade-color)";
  container.appendChild(binWithButton);
</script>
```

## Web Component: `<adw-bin>`

A declarative way to use an Adwaita bin container.

**HTML Tag:** `<adw-bin>`

**Attributes:**
*   No specific attributes beyond global HTML attributes (like `class`, `style`). Behavior is primarily about containing a single child.

**Slots:**

*   Default slot: Expects a single child element. If multiple direct children are provided, they will all be slotted, but the conceptual model of a "Bin" is to hold one primary child.

**Example:**

```html
<p>Bin with a card-like style applied to the Bin itself:</p>
<adw-bin style="border: 1px solid var(--borders-color); padding: var(--spacing-m);
              border-radius: var(--border-radius-default); max-width: 300px;
              background-color: var(--view-bg-color);">
  <adw-label title-level="2">Content Card</adw-label>
  <p>This content is wrapped by an AdwBin, styled to look like a simple card.</p>
  <adw-button flat>An action</adw-button>
</adw-bin>

<p style="margin-top: 1em;">
  Bin used to group an image and caption (though an AdwBox might be more
  semantically correct for multiple items):
</p>
<adw-bin>
  <div> <!-- The single child of the bin -->
    <img src="app-demo/static/img/default_avatar.png" alt="Avatar"
         style="width: 80px; height: 80px; border-radius: 4px;">
    <p style="font-size: var(--font-size-small); text-align: center;">Avatar Image</p>
  </div>
</adw-bin>
```

## Styling

*   Primary SCSS: `scss/_bin.scss`.
*   A Bin itself is often unstyled or has minimal styling (like `display: block`).
*   Its primary purpose is to act as a container. Any significant visual styling
    (borders, padding, background) would often be applied directly to the bin
    element via classes or inline styles, or through styles applied to its
    single child.
*   It does not impose flex or grid layout on its child by default, unless
    specific utility classes are added.

---
Next: [WrapBox](./wrapbox.md)

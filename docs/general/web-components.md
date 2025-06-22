# Web Components in Adwaita-Web

Alongside the JavaScript factory functions, Adwaita-Web offers a suite of standard Web Components for a more declarative approach to building UIs. These components encapsulate the structure, style, and behavior of Adwaita widgets into custom HTML tags.

## Using Adwaita-Web Components

Once `js/components.js` (or the bundled `adwaita-web.js`) is included in your page, the custom elements are automatically registered and ready to use directly in your HTML.

**General Pattern:**

```html
<adw-widget-name attribute1="value1" attribute2 boolean-attribute>
  <!-- Optional slotted content -->
  <span slot="some-slot-name">Slotted content</span>
</adw-widget-name>
```

*   `<adw-widget-name>`: Custom HTML tag representing the Adwaita widget (e.g., `<adw-button>`, `<adw-dialog>`).
*   `attribute1="value1"`: Attributes that configure the component. These often mirror the options available in the JavaScript factory functions.
*   `boolean-attribute`: Boolean attributes are set by their presence (e.g., `disabled`, `suggested`).
*   Slotted Content: Many components use `<slot>` elements to allow you to inject custom content into predefined areas within the component's shadow DOM.

**Example: Using `<adw-button>` and `<adw-entry>`**

```html
<adw-box orientation="vertical" spacing="m">
  <adw-label title-level="1">Login Form</adw-label>
  <adw-entry-row title="Username" placeholder="Enter your username"></adw-entry-row>
  <adw-password-entry-row title="Password" placeholder="Enter your password"></adw-password-entry-row>
  <adw-button suggested id="login-btn">Login</adw-button>
</adw-box>

<script>
  document.getElementById('login-btn').addEventListener('click', () => {
    const username = document.querySelector('adw-entry-row[title="Username"]').value; // Assuming .value property
    Adw.createToast(`Login attempt for: ${username}`);
  });
</script>
```

## Relationship to JavaScript Factories

The Web Components in Adwaita-Web are typically wrappers around the JavaScript factory functions. When a Web Component is created or its attributes change, its internal logic often calls the corresponding `Adw.createWidgetName()` factory function to generate or update its shadow DOM content.

This means:
*   The appearance and behavior are consistent between the two ways of creating widgets.
*   Web Components benefit from the same underlying styling and theming capabilities.

## Attributes

Attributes on Web Components map to the options of their factory function counterparts. For example:

*   `<adw-button suggested destructive>Delete</adw-button>` (text is slotted content)
    corresponds to
    `Adw.createButton("Delete", { suggested: true, destructive: true })`.

Common attribute conventions:
*   Boolean options (e.g., `suggested`, `disabled`, `flat`) are represented as present/absent attributes.
    *   `<adw-button disabled>` (true)
    *   `<adw-button>` (false for disabled)
*   String or number options are set as standard attributes (e.g., `title="My Row"`, `value="42"`).
*   Attribute names are typically kebab-case (e.g., `title-level` for `titleLevel` in JS options).

## Properties and Methods

Some Web Components may also expose JavaScript properties and methods for more dynamic interaction. For instance, an `<adw-dialog>` component might have `open()` and `close()` methods and an `isOpen` property.

```html
<adw-dialog title="My Web Component Dialog" id="my-wc-dialog">
  <div slot="content">This is the dialog content.</div>
  <adw-button slot="buttons" data-action="close">Close</adw-button>
</adw-dialog>

<adw-button id="show-dialog-btn">Show Dialog</adw-button>

<script>
  const dialog = document.getElementById('my-wc-dialog');
  const showBtn = document.getElementById('show-dialog-btn');

  showBtn.addEventListener('click', () => {
    dialog.open(); // Call method on the component instance
  });

  dialog.addEventListener('click', (event) => {
    // Example of handling button clicks within a dialog via event delegation
    if (event.target.dataset.action === 'close') {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => { // Custom event from dialog when closed
      console.log("Dialog was closed.");
  });
</script>
```

## Slots

Slots are a standard Web Component feature used for content projection. Adwaita-Web components use slots to allow developers to insert their own HTML content into specific parts of a widget.

*   **Default Slot:** Content placed directly inside the component tags without a `slot` attribute.
*   **Named Slots:** Content targeted to a specific location using `slot="slot-name"`. For example, an `<adw-header-bar>` might have slots like `start`, `title`, and `end`.

```html
<adw-header-bar>
  <adw-button slot="start" icon-name="go-previous-symbolic" aria-label="Back"></adw-button>
  <h1 slot="title">My Application</h1>
  <adw-button slot="end" icon-name="open-menu-symbolic" aria-label="Menu"></adw-button>
</adw-header-bar>
```

## Styling

Web Components use Shadow DOM, which provides style encapsulation. The Adwaita-Web CSS (`style.css`) includes styles that target both the global scope (for factory-created elements) and the internals of the Web Components' shadow DOM.
CSS custom properties defined in `:root` or on the component host are generally accessible within the Shadow DOM, allowing for theming.

## Benefits of Web Components

*   **Declarative Syntax:** Write UIs directly in HTML, which can be more intuitive for structuring pages.
*   **Encapsulation:** Shadow DOM encapsulates styles and structure, reducing conflicts with other parts of your application.
*   **Reusability:** Standardized way to create reusable UI pieces.
*   **Interoperability:** Work well with various JavaScript frameworks or vanilla JavaScript.

Refer to the individual widget documentation pages (`docs/widgets/`) for details on specific attributes, slots, properties, and methods for each Adwaita-Web Component.
---

Next: [Widget Documentation](../widgets/README.md) (This will be the index for widgets)

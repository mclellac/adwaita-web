# Introduction to Adwaita-Web

Adwaita-Web is a UI framework that brings the look and feel of the Adwaita design language to web applications. It provides a set of JavaScript factory functions and Web Components to easily construct user interfaces that are consistent with GNOME desktop applications.

## Key Features

*   **Adwaita Styling:** Components are styled to match the Adwaita theme, providing a familiar user experience for GNOME users.
*   **JavaScript Factories:** A simple JavaScript API (`Adw.*`) allows for programmatic creation of UI elements.
*   **Web Components:** Standard Web Components (e.g., `<adw-button>`) offer a declarative way to build UIs.
*   **Theming:** Supports light and dark themes, accent color customization, and is built with CSS variables for easy extension.
*   **Responsive Design:** Many components are designed to work well across different screen sizes.

## Getting Started

### Including Adwaita-Web

To use Adwaita-Web in your project, you need to include its CSS stylesheet and JavaScript file.

**1. CSS:**

Link the main stylesheet in the `<head>` of your HTML document:

```html
<link rel="stylesheet" href="path/to/scss/style.css">
```
*(Note: The actual path might differ based on your project setup. After compilation, this would typically be a single CSS file, e.g., `adwaita-web.css`)*

**2. JavaScript:**

Include the main JavaScript file, usually before the closing `</body>` tag:

```html
<script src="path/to/js/components.js"></script>
```
*(Note: The actual path might differ. This file contains the `Adw` global object and registers the Web Components.)*

### Basic Usage

Once included, you can start using the components either via JavaScript or directly as HTML tags.

**JavaScript Factory Example:**

```html
<div id="button-container"></div>

<script>
  const container = document.getElementById('button-container');
  const myButton = Adw.createButton("Click Me!", { suggested: true });
  container.appendChild(myButton);

  myButton.addEventListener('click', () => {
    Adw.createToast("Button clicked!");
  });
</script>
```

**Web Component Example:**

```html
<adw-button suggested>Click Me Too!</adw-button>

<script>
  document.querySelector('adw-button').addEventListener('click', () => {
    Adw.createToast("Web Component button clicked!");
  });
</script>
```

## Philosophy

Adwaita-Web aims to provide a straightforward way to build web interfaces that align with GNOME's design principles. It prioritizes:

*   **Consistency:** Adhering to Adwaita design guidelines.
*   **Simplicity:** Offering easy-to-use APIs for both JavaScript and HTML.
*   **Flexibility:** Allowing for theming and customization.

Explore the documentation to learn more about specific widgets, theming capabilities, and the different ways you can integrate Adwaita-Web into your projects.
---

Next, explore:
*   [Theming](./theming.md)
*   [JavaScript API](./javascript-api.md)
*   [Web Components](./web-components.md)
*   [Available Widgets](../widgets/README.md) (This will be the index for widgets)

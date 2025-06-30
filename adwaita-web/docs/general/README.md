# Introduction to Adwaita Skin

Adwaita Skin is a pure CSS library that brings the look and feel of the Adwaita design language to standard HTML web applications. It allows you to style your existing HTML elements using a system of CSS classes, without requiring JavaScript frameworks or web components for styling.

## Key Features

*   **Adwaita Styling via CSS:** HTML elements are styled to match the Adwaita theme by applying CSS classes (e.g., `<button class="adw-button">`).
*   **Pure CSS:** Does not include or require JavaScript for its core styling functionality. Interactivity is handled by your application.
*   **SCSS Based:** Written in SCSS, allowing for maintainable and organized stylesheets, compiled into a single `adwaita-skin.css` file.
*   **Theming:** Supports light and dark themes, accent color customization through CSS custom properties (variables).
*   **Responsive Design:** Styles are designed to adapt to different screen sizes where appropriate.

## Getting Started

### Including Adwaita Skin CSS

To use Adwaita Skin in your project, you only need to include its compiled CSS stylesheet.

**1. CSS:**

Link the main stylesheet (`adwaita-skin.css`) in the `<head>` of your HTML document. This file is typically found in `adwaita-web/css/adwaita-skin.css` after being compiled from SCSS sources (see `adwaita-web/scss/`).

```html
<link rel="stylesheet" href="path/to/adwaita-skin.css">
```
*(Example: `<link rel="stylesheet" href="css/adwaita-skin.css">` if you place it in a `css` subfolder)*

There is **no JavaScript file to include** for Adwaita Skin itself, as it's purely a CSS library.

### Basic Usage (CSS Class Application)

Once the CSS is linked, you can start styling your HTML elements by adding the appropriate Adwaita Skin classes.

**Button Example:**

To style a standard HTML button:
```html
<button class="adw-button">Standard Button</button>
```

To make it a "suggested" action button:
```html
<button class="adw-button suggested">Suggested Action</button>
```

**Entry (Input) Example:**

```html
<input type="text" class="adw-entry" placeholder="An Adwaita-styled input">
```

## Philosophy

Adwaita Skin aims to provide a straightforward way to apply Adwaita visual styling to web interfaces built with standard HTML. It prioritizes:

*   **Consistency:** Adhering to Adwaita design guidelines for visual appearance.
*   **Simplicity:** Offering an easy-to-use system of CSS classes.
*   **Flexibility:** Allowing for theming and customization via CSS variables.
*   **HTML First:** Empowering developers to use semantic HTML, styled with CSS, without being tied to specific JavaScript component models for the visual layer.

Explore the documentation to learn more about specific styled elements, theming capabilities, and how to integrate Adwaita Skin into your projects.
---

Next, explore:
*   [Theming](./theming.md)
*   [Usage Guide](./usage-guide.md)
*   [Styled Elements (CSS Classes)](../widgets/README.md) (This will be the index for styled elements)

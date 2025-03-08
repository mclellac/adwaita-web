# Adwaita Web UI Framework

Vanilla JavaScript UI framework that mimics the look and feel of GNOME's GTK4 and libdwaita, making it easy to create web applications with a consistent Adwaita/GTK4 style. It uses HTML, CSS (via SCSS), and JavaScript, with no external dependencies.

![Light Theme](images/light.png)

## Features

- **Adwaita Styling:** Closely follows the visual style of libadwaita for a consistent GNOME look.
- **Light and Dark Themes:** Built-in support for both light and dark themes, with automatic switching based on user preference (localStorage) or manual toggling.
- **Component-Based:** Provides reusable UI components (buttons, entries, switches, etc.) as JavaScript functions.
- **No Dependencies:** Written in pure JavaScript, HTML, and SCSS, with no external library dependencies.
- **Customizable:** Uses CSS custom properties (variables) for easy theming and customization.
- **Accessible:** Uses appropriate roles and labels where needed.

## Installation

1. **Clone or Download:** Get the code from the repository (or copy the code files directly):

   ```
   gtk-web-framework/
   ├── test.html
   ├── js/
       └── components.js
   ├── style.css           (Generated from scss/style.scss)
   ├── scss/
       ├── style.scss
       ├── _variables.scss
       ├── _base.scss
       ├── _button.scss
       ├── _entry.scss
       ├── _switch.scss
       ├── _label.scss
       ├── _headerbar.scss
       ├── _window.scss
       ├── _box.scss
       ├── _toast.scss
       ├── _dialog.scss
       ├── _progress-bar.scss
       ├── _checkbox.scss
       ├── _radio.scss
       └── _list-box.scss

   ```

2. **Install Sass:** You need a Sass compiler to convert the SCSS files into CSS. The recommended method is to use the Dart Sass command-line tool:

   ```bash
   npm install -g sass
   ```

   You can also use a VS Code extension like "Live Sass Compiler" if you prefer.

3. **Compile CSS:** Navigate to the `gtk-web-framework` directory in your terminal and run:

   ```bash
   sass scss/style.scss style.css
   ```

   For continuous development, use the `--watch` flag:

   ```bash
   sass --watch scss/style.scss:style.css
   ```

   This will automatically recompile `style.css` whenever you make changes to any of the SCSS files.

4. **Include in your HTML:** Include the compiled `style.css` and the `components.js` file in your HTML:

   ```html
   <head>
     <link rel="stylesheet" href="style.css" />
   </head>
   <body>
     <div id="app"></div>
     <script src="js/components.js"></script>
     <script>
       // Your application code using the Adw components goes here
     </script>
   </body>
   ```

## Usage

The framework provides a global `Adw` object containing functions for creating each UI component. Each function takes an `options` object to customize the appearance and behavior of the component.

**Example:**

```javascript
const myButton = Adw.createButton("Click Me", {
  onClick: () => {
    alert("Button clicked!");
  },
  destructive: true,
});

document.getElementById("app").appendChild(myButton);
```

TODO:Document components

# JavaScript API (Adw Object)

Adwaita-Web provides a global JavaScript object named `Adw` that serves as the entry point for programmatically interacting with its components and features. This object contains factory functions for creating UI elements and utility functions for tasks like theme management.

## The `Adw` Global Object

After including the `js/components.js` (or a bundled `adwaita-web.js`) script in your page, the `Adw` object will be available in the global scope.

```javascript
console.log(Adw);
// Output might look like:
// {
//   createButton: function(text, options){...},
//   createDialog: function(options){...},
//   createAvatar: function(options){...},
//   // ... other factory functions
//   toggleTheme: function(themeName){...},
//   setAccentColor: function(colorName){...},
//   getAccentColors: function(){...},
//   // ... etc.
// }
```

## Factory Function Pattern

A core part of the Adwaita-Web JavaScript API is its set of factory functions. These functions are used to create instances of Adwaita widgets.

**General Pattern:**

```javascript
const widgetInstance = Adw.createWidgetName(param1, param2, ..., options);
```

*   `createWidgetName`:  The name of the function typically follows the pattern `createAdwWidgetName` (e.g., `createAdwButton`, `createAdwHeaderBar`). Some might be shorter (e.g. `Adw.Button` was an older pattern, prefer `createAdwButton` if available, though the `Adw` object often exposes them as `Adw.createButton`).
*   `param1, param2, ...`: Required parameters specific to the widget (e.g., `text` for a button, `title` for a window).
*   `options`: An optional JavaScript object (`{}`) containing configuration options for the widget. These options vary greatly between widgets but often control aspects like styling (e.g., `suggested`, `flat` for a button), behavior (e.g., `onClick` callbacks), or initial state (e.g., `disabled`, `checked`).

**Example: Creating a Button**

```javascript
const myButton = Adw.createButton("Save", {
  suggested: true,
  icon: '<svg>...</svg>', // Or an icon class name
  onClick: () => {
    console.log("Save button clicked!");
  }
});

// The 'myButton' variable now holds an HTMLButtonElement (or HTMLAnchorElement if href was provided)
document.body.appendChild(myButton);
```

### Return Values

Factory functions typically return the primary HTML element that constitutes the widget. For example, `Adw.createButton()` returns an `<button>` or `<a>` element, and `Adw.createEntry()` returns an `<input>` element.

For more complex widgets that might consist of multiple parts or require methods to control them (like a Dialog or Flap), the factory function might return an object containing the main element and an API for interaction.

**Example: Dialog**

```javascript
const myDialog = Adw.createDialog({
  title: "Confirmation",
  content: "Are you sure you want to proceed?",
  buttons: [
    Adw.createButton("Cancel", { onClick: () => myDialog.close() }),
    Adw.createButton("Confirm", { suggested: true, onClick: () => {
      console.log("Confirmed!");
      myDialog.close();
    }})
  ]
});

// myDialog is an object: { dialog: HTMLDivElement, open: function, close: function }
myDialog.open();
```

## Common Options

While options are widget-specific, some are common:

*   `onClick`: A callback function for click events.
*   `disabled`: Boolean, to disable the widget.
*   Styling flags: `suggested`, `destructive`, `flat` (for buttons and similar elements).
*   `icon`: Often accepts an SVG string or a CSS class name for an icon.

## Utility Functions

Besides widget factories, the `Adw` object also provides utility functions, primarily for theming:

*   `Adw.toggleTheme(themeName)`: Switches between 'light' and 'dark' themes.
*   `Adw.setAccentColor(colorName)`: Sets the global accent color.
*   `Adw.getAccentColors()`: Returns an object describing available accent colors.
*   `Adw.loadSavedTheme()`: Loads theme preferences from localStorage or system settings (usually called automatically).

## Discovering Components and Options

The most comprehensive way to discover all available factory functions and their specific parameters/options is to:
1.  Refer to the individual widget documentation pages (under `docs/widgets/`).
2.  Examine the `js/components.js` file directly, as it contains the definitions for all factory functions and their JSDoc comments.

The JavaScript API provides a flexible and powerful way to dynamically build and manage Adwaita-styled user interfaces.
---

Next: [Web Components](./web-components.md)

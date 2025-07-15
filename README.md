# Adwaita Web UI Framework

A CSS and JavaScript UI library that mimics the look and feel of GNOME's GTK4 and libadwaita, making it easy to create web applications with a consistent Adwaita/GTK4 style. It uses HTML, CSS (via SCSS), and minimal JavaScript.

![Light Theme](images/light.png)

## Features

- **Adwaita Styling:** Aims to closely follow the visual style and naming conventions of libadwaita for a consistent GNOME desktop look on the web. Styling is primarily delivered via CSS classes applied to standard HTML elements.
- **Light and Dark Themes:** Built-in support for both light and dark themes. Includes automatic detection of system preference via `prefers-color-scheme`, manual toggling, and remembers the user's choice via `localStorage`.
- **CSS First:** Most Adwaita elements are styled by applying CSS classes (e.g., `.adw-button`, `.adw-entry`) to standard HTML tags.
- **Web Components for Specific Widgets:** For more complex interactive elements like Dialogs (`<adw-dialog>`, `<adw-about-dialog>`), JavaScript-defined Custom Elements (Web Components) are provided.
- **Helper JavaScript Utilities:** JavaScript utilities like `Adw.createToast()` for toasts and `banner.js` for dismissible banners enhance interactivity.
- **CSS Variables:** Extensively uses CSS custom properties (variables) for theming, making customization of colors, fonts, and spacing straightforward, inspired by libadwaita's own variable system.
- **Accent Colors:** Supports dynamic accent color switching, allowing users to choose from a predefined palette, with preferences saved.
- **Responsive Design:** Components and styles are designed to be reasonably responsive where applicable.
- **Accessibility (ARIA):** Incorporates ARIA roles and attributes to improve accessibility for users of assistive technologies.
- **No External Dependencies:** Written in pure JavaScript, HTML, and SCSS.

## Installation

1.  **Get the Code:** Clone this repository or download/copy the `adwaita-web/` directory.

    ```
    adwaita-web/
    ├── css/
    │   └── adwaita-skin.css  (Generated CSS output)
    ├── js/
    │   ├── components.js     (Main script for loading JS-defined web components like dialogs)
    │   ├── components/
    │   │   ├── dialog.js
    │   │   └── aboutdialog.js
    │   ├── toast.js          (Utility for toast notifications)
    │   ├── banner.js         (Utility for dismissible banners)
    │   └── app-layout.js     (Example layout helper, used by antisocialnet demo)
    ├── scss/
    │   ├── adwaita-skin.scss (Main SCSS file, imports all component styles)
    │   ├── _variables.scss
    │   ├── _base.scss
    │   └── _*.scss           (Individual component SCSS partials)
    ├── data/                 (Icons and other static data)
    ├── fonts/                (Font files)
    └── ... (docs/, examples/, etc.)
    ```

2.  **Compile SCSS to CSS:**
    You need a Sass compiler (Dart Sass is recommended: `npm install -g sass`).
    The primary SCSS file is `adwaita-web/scss/adwaita-skin.scss`.
    A build script `build-adwaita-web.sh` is provided in the repository root. This script:
    *   Compiles `adwaita-web/scss/adwaita-skin.scss` to `adwaita-web/css/adwaita-skin.css`.
    *   Copies the compiled CSS, JavaScript files, icons, and fonts to the `antisocialnet/static/` directory for the demo application.
    *   You can adapt this script or run the SASS command directly:
        ```bash
        sass adwaita-web/scss/adwaita-skin.scss adwaita-web/css/adwaita-skin.css --style compressed
        ```
        For development, use `--watch`:
        ```bash
        sass --watch adwaita-web/scss/adwaita-skin.scss:adwaita-web/css/adwaita-skin.css
        ```

3.  **Include in your HTML:**
    Include the compiled `adwaita-skin.css`. If you use the JavaScript-defined web components (like dialogs) or utilities (like toasts), also include the relevant JS files.
    `components.js` loads the dialog components.

    ```html
    <head>
      <link rel="stylesheet" href="path/to/adwaita-web/css/adwaita-skin.css" />
      <!-- For Dialogs -->
      <script type="module" src="path/to/adwaita-web/js/components.js" defer></script>
      <!-- For Toasts (optional) -->
      <script src="path/to/adwaita-web/js/toast.js" defer></script>
      <!-- For Banners (optional) -->
      <script src="path/to/adwaita-web/js/banner.js" defer></script>
    </head>
    <body>
      <div id="app">
        <button class="adw-button suggested">Click Me!</button>
        <input type="text" class="adw-entry" placeholder="Enter text...">
      </div>

      <!-- Example: Using a Toast -->
      <div id="adw-toast-overlay" class="adw-toast-overlay"></div>
      <script>
        document.querySelector('.adw-button.suggested').addEventListener('click', () => {
          if (window.Adw && Adw.createToast) {
            Adw.createToast("Button clicked!");
          }
        });
      </script>
    </body>
    ```

## Usage

Adwaita Web is used as follows:

1.  **CSS Classes for Styling:** Apply CSS classes (e.g., `.adw-button`, `.adw-entry`, `.adw-list-box`) to standard HTML elements to style them according to the Adwaita theme. This is the primary way to use the library.
    Example:
    ```html
    <button class="adw-button suggested">Save</button>
    <input type="text" class="adw-entry" placeholder="Enter your name...">
    <div class="adw-list-box">
      <div class="adw-action-row interactive">
        <span class="adw-action-row-title">Settings</span>
      </div>
    </div>
    ```

2.  **JavaScript Web Components (for specific widgets):**
    Certain complex widgets like Dialogs are provided as Custom Elements.
    Example:
    ```html
    <button id="open-about-dialog-btn">About</button>
    <adw-about-dialog id="my-about-dialog" app-name="My App">
      <!-- content -->
    </adw-about-dialog>
    <script>
      // Ensure js/components.js is loaded
      customElements.whenDefined('adw-about-dialog').then(() => {
        const dialog = document.getElementById('my-about-dialog');
        document.getElementById('open-about-dialog-btn').addEventListener('click', () => {
          dialog.open(); // Use the component's method
        });
      });
    </script>
    ```
    The `Adw.Dialog.factory()` and `Adw.AboutDialog.factory()` can also be used to create dialogs imperatively.

3.  **JavaScript Helper Utilities:**
    Functions like `Adw.createToast()` are provided for dynamic UI elements that are not structured as web components.
    Example:
    ```javascript
    // Ensure toast.js is loaded
    if (window.Adw && Adw.createToast) {
      Adw.createToast("File saved successfully!", { type: 'success' });
    }
    ```

## Component Documentation

Refer to `adwaita-web/docs/README.md` for links to documentation on how to use CSS classes for various Adwaita elements.
The primary approach is to structure your HTML and apply the appropriate `.adw-*` classes.

For the JavaScript-defined web components (`<adw-dialog>`, `<adw-about-dialog>`) and utilities (`Adw.createToast`), refer to their respective JS files in `adwaita-web/js/` for usage details and available options/attributes.

Here's an overview of common elements styled with CSS classes:

### Buttons (CSS: `.adw-button`)

Apply to `<button>` or `<a>` elements.

-   **HTML Example:**
    ```html
    <button class="adw-button suggested" id="save-btn">Save</button>
    <button class="adw-button circular flat" aria-label="New Document">
      <span class="adw-icon icon-document-new-symbolic"></span>
    </button>
    <a href="#" class="adw-button flat">Flat Link Button</a>
    ```
    Common classes: `.suggested-action` (for accent color, often just `.suggested`), `.destructive-action` (for red, often just `.destructive`), `.flat`, `.circular`. Use icon span classes like `.icon-*` for icons.

### Entries (CSS: `.adw-entry`)

Apply to `<input type="text/search/password/etc.">` or `<textarea>`.

-   **HTML Example:**
    ```html
    <input type="text" class="adw-entry" placeholder="Enter your name..." value="Initial Text">
    <textarea class="adw-entry" disabled>Cannot edit</textarea>
    ```

### Switches (CSS: `.adw-switch` on `<input type="checkbox">`)

Use a specific HTML structure for switches:
-   **HTML Example:**
    ```html
    <label class="adw-switch" for="notif-switch">
      <input type="checkbox" class="adw-switch" id="notif-switch" checked>
      <span class="adw-switch-slider"></span>
      <span class="adw-label">Enable Notifications</span>
    </label>
    ```
    The outer label wraps the checkbox, a slider span, and the text label.

### Labels (CSS: `.adw-label`, or utility classes like `.title-1`, `.caption`)

Apply to `<span>`, `<p>`, `<h1>-<h6>`, etc.

-   **HTML Example:**
    ```html
    <h1 class="adw-title-1">Main Application Title</h1>
    <p><span class="adw-label caption">A small note or caption.</span></p>
    <label class="adw-label" for="my-input">Standard body text label.</label>
    ```
    Utility classes like `.title-1`, `.title-2`, `.title-3`, `.title-4`, `.caption`, `.body` (often default) control typography.

### Header Bars (CSS: `.adw-header-bar`)

Typically a `<header class="adw-header-bar">`. Structure its children for start, center, and end sections.

-   **HTML Example:**
    ```html
    <header class="adw-header-bar">
      <div class="adw-header-bar__start">
        <button class="adw-button circular flat"><span class="adw-icon icon-actions-open-menu-symbolic"></span></button>
      </div>
      <div class="adw-header-bar__center">
        <h1 class="adw-header-bar__title">My App</h1>
        <span class="adw-header-bar__subtitle">Version 1.0</span>
      </div>
      <div class="adw-header-bar__end">
        <button class="adw-button">Action</button>
      </div>
    </header>
    ```

### Application Windows (CSS: `.adw-window`)

A top-level container, often holding a header bar and main content area.
-   **HTML Example:**
    ```html
    <div class="adw-window">
      <header class="adw-header-bar">
        <!-- ... header content ... -->
      </header>
      <main class="adw-window-content"> <!-- Or any other main content wrapper -->
        <p>Window content goes here.</p>
      </main>
    </div>
    ```

### Boxes (CSS: `.adw-box`)

A flexbox container. Add modifier classes for orientation, spacing, alignment.
-   **HTML Example:**
    ```html
    <div class="adw-box horizontal spacing-s align-center">
      <button class="adw-button">OK</button>
      <button class="adw-button">Cancel</button>
    </div>
    ```
    Classes: `.horizontal` or `.vertical`, `.spacing-[xs|s|m|l|xl]`, `.align-[start|center|end|stretch]`, `.justify-[start|center|end|between|around|evenly]`, `.fill-children`.

### List Boxes (CSS: `.adw-list-box`) & Rows (CSS: `.adw-action-row`, `.adw-entry-row`, etc.)

A container for list items. Rows are typically children.
-   **HTML Example:**
    ```html
    <div class="adw-list-box selectable">
      <div class="adw-action-row interactive">
        <span class="adw-action-row-title">Setting 1</span>
      </div>
      <div class="adw-action-row">
        <span class="adw-action-row-title">Open Settings</span>
        <span class="adw-action-row-subtitle">Configure preferences</span>
      </div>
    </div>
    ```
    Classes for `<div class="adw-list-box">`: `.flat` (removes outer border), `.selectable`.
    See `adwaita-web/scss/` for row types like `.adw-action-row`, `.adw-entry-row`, `.adw-expander-row`, `.adw-combo-row`, `.adw-switch-row`.

### Progress Bars (CSS: `.adw-progress-bar`)

Apply to a `<div>` or `<progress>` element.
-   **HTML Example:**
    ```html
    <div class="adw-progress-bar" style="--progress-value: 50;" aria-valuenow="50"></div>
    <progress class="adw-progress-bar" value="50" max="100"></progress>
    <div class="adw-progress-bar indeterminate"></div>
    ```
    Set `--progress-value` CSS custom property (0-100) for determinate state or use `<progress>` tag. Add `.indeterminate` class for indeterminate state.

### Checkboxes & Radio Buttons (CSS: `.adw-checkbox`, `.adw-radio-button` on `<input>`)

Structure with a label.
-   **HTML Example:**
    ```html
    <div class="adw-checkbox-row"> <!-- Optional wrapper for alignment -->
      <input type="checkbox" class="adw-checkbox" id="agree-cb" checked>
      <label for="agree-cb" class="adw-label">I agree</label>
    </div>

    <div class="adw-radio-row"> <!-- Optional wrapper -->
      <input type="radio" class="adw-radio-button" name="group1" id="option1-rb" checked>
      <label for="option1-rb" class="adw-label">Option 1</label>
    </div>
    <div class="adw-radio-row">
      <input type="radio" class="adw-radio-button" name="group1" id="option2-rb">
      <label for="option2-rb" class="adw-label">Option 2</label>
    </div>
    ```

### Dialogs (`<adw-dialog>` / `Adw.createDialog()`)

Creates a modal dialog. Declarative dialogs are defined in HTML and opened/closed via JavaScript.

-   **HTML Example (Declarative Dialog):**
    ```html
    <adw-button id="open-my-dialog">Open Dialog</adw-button>

    <adw-dialog id="my-sample-dialog" title="Confirm Action">
      <div slot="content">Are you sure you want to proceed?</div>
      <adw-button slot="buttons" data-action="confirm" suggested>Confirm</adw-button>
      <adw-button slot="buttons" data-action="cancel">Cancel</adw-button>
    </adw-dialog>

    <script>
      const dialog = document.getElementById('my-sample-dialog');
      document.getElementById('open-my-dialog').addEventListener('click', () => dialog.open());
      dialog.addEventListener('click', (event) => { // Example: handle button clicks
        const action = event.target.closest('[data-action]')?.dataset.action;
        if (action === 'confirm' || action === 'cancel') dialog.close();
      });
    </script>
    ```
    Attributes for `<adw-dialog>`: `title`, `open`, `close-on-backdrop-click`. Content and buttons are slotted.
-   **JS Factory (Imperative Dialog):** `Adw.createDialog(options = {})`
    - `options`: `title`, `content` (HTMLElement/string), `buttons` (HTMLElement[]), `onClose`, `closeOnBackdropClick`.
    - Returns: The created `<adw-dialog>` Web Component instance. Call `dialogInstance.open()` and `dialogInstance.close()` on it.
    - **Specialized Dialog Factories:** `Adw.createAlertDialog()`, `Adw.createAboutDialog()`, `Adw.createPreferencesDialog()` are also available and return their respective Web Component instances.

### Toasts (`Adw.createToast()`)

Shows a temporary toast notification. This is an imperative-only component.

- **`Adw.createToast(text, options = {})`**
  - `text`: `string` - Message to display.
  - `options`: `object`
    - `button`: `HTMLElement` - Optional button in the toast.
    - `timeout`: `number` (ms) - Duration. 0 for persistent (default: 4000ms).
    - `type`: `string` ('info', 'success', 'warning', 'error') - Styles the toast.
- **Example:**
  ```javascript
  Adw.createToast("File saved successfully.", { type: 'success' });
  ```

### ViewSwitchers (`<adw-view-switcher>` / `Adw.createViewSwitcher()`)

Creates a view switcher with a button bar to toggle between different content views.

-   **HTML Example:**
    ```html
    <adw-view-switcher active-view-name="view1">
      <adw-view name="view1" title="View One">
        <p>Content for View One</p>
      </adw-view>
      <adw-view name="view2" title="View Two">
        <p>Content for View Two</p>
      </adw-view>
    </adw-view-switcher>
    ```
    `<adw-view>` children define the views. Attributes for `<adw-view-switcher>`: `active-view-name`, `label`, `is-inline`. Attributes for `<adw-view>`: `name`, `title`.
-   **JS Factory:** `Adw.createViewSwitcher(options = {})`
    - `options`: `views` (Array of `{name, title, content}`), `activeViewName`, `onViewChanged`, `label`, `isInline`.

### Avatars (`<adw-avatar>` / `Adw.createAvatar()`)

Displays an image, text initials, or custom content as an avatar.

-   **HTML Example:**
    ```html
    <adw-avatar text="Jules Verne" size="64"></adw-avatar>
    <adw-avatar image="path/to/image.png" size="48"></adw-avatar>
    <adw-avatar icon="<svg>...</svg>" shape="rounded"></adw-avatar>
    ```
    Attributes: `text`, `image`, `icon`, `size`, `shape` ('circular'/'rounded').
-   **JS Factory:** `Adw.createAvatar(options = {})`
    - `options`: `text`, `imageSrc` (maps to `image`), `iconHTML` (maps to `icon`), `size`, `shape`.

### Flaps (`<adw-flap>` / `Adw.createFlap()`)

Creates a two-pane layout with a collapsible "flap" panel.

-   **HTML Example:**
    ```html
    <adw-button id="toggle-my-flap">Toggle Flap</adw-button>
    <adw-flap id="my-flap">
      <div slot="flap-content">Flap Panel Content</div>
      <div slot="main-content">Main Area Content</div>
    </adw-flap>
    <script>
      document.getElementById('toggle-my-flap').addEventListener('click', () => {
        document.getElementById('my-flap').toggle();
      });
    </script>
    ```
    Attributes: `folded`, `reveal-duration`, `sidebar-position` ('start'/'end'), `swipe-to-open`, `swipe-to-close`. Content is slotted.
-   **JS Factory:** `Adw.createFlap(options = {})`
    - `options`: `flapContent`, `mainContent`, `isFolded` (maps to `folded`), etc.
    - Returns: The created `<adw-flap>` Web Component instance. Call methods like `toggle()` on the instance.
  ```

### Specialized ListBox Rows

These components are designed to be used as children of `Adw.createListBox()`. They provide pre-defined structures for common list item patterns.

#### `Adw.createActionRow(options = {})`

A row for `AdwListBox` that can be activated, often used to trigger an action or navigate.

- **`options`**: `object`
  - `title` (string): Main text.
  - `subtitle` (string, optional): Secondary text displayed below the title.
  - `iconHTML` (string, optional): SVG string or icon font class for an icon displayed at the start of the row.
  - `onClick` (function, optional): Makes the row activatable and triggers this callback.
  - `showChevron` (boolean, default: `true`): If `onClick` is provided, displays a chevron arrow at the end of the row.
- **Example:**

  ```javascript
  const settingsAction = Adw.createActionRow({
    title: "Open Settings",
    subtitle: "Configure application preferences",
    onClick: () => console.log("Settings clicked"),
  });
  ```

#### `Adw.createEntryRow(options = {})`

A row for `AdwListBox` that embeds a label and an `AdwEntry` (text input field).

- **`options`**: `object`
  - `title` (string): Label for the entry.
  - `entryOptions` (object, optional): Options passed directly to `Adw.createEntry()`.
  - `labelForEntry` (boolean, default: `true`): If true, links the title label to the entry using `for`/`id` attributes for accessibility.
- **Example:**

  ```javascript
  const usernameRow = Adw.createEntryRow({
    title: "Username:",
    entryOptions: { placeholder: "Enter your username" },
  });
  ```

#### `Adw.createExpanderRow(options = {})`

A row for `AdwListBox` that can expand to show or hide additional content.

- **`options`**: `object`
  - `title` (string): Text displayed on the clickable part of the row.
  - `subtitle` (string, optional): Secondary text on the clickable part.
  - `expanded` (boolean, default: `false`): Initial expanded state.
  - `content` (HTMLElement): The DOM element to show or hide when expanded.
- **Example:**

  ```javascript
  const detailsContent = Adw.createLabel("Some detailed information here.");
  const advancedOptions = Adw.createExpanderRow({
    title: "Advanced Options",
    subtitle: "Click to see more",
    content: detailsContent,
  });
  ```

#### `Adw.createComboRow(options = {})`

A row for `AdwListBox` that includes a label and a dropdown/select menu.

- **`options`**: `object`
  - `title` (string): Label for the combo row.
  - `subtitle` (string, optional): Secondary text.
  - `selectOptions` (Array<string|{label: string, value: string}>): Options for the `<select>` element.
  - `selectedValue` (string|number, optional): The value of the initially selected option.
  - `onChanged` (function, optional): Callback when the selected value changes. Receives the new value.
  - `disabled` (boolean, default: `false`): Disables the select element.
- **Example:**

  ```javascript
  const qualityCombo = Adw.createComboRow({
    title: "Video Quality",
    selectOptions: [
      { label: "Low (480p)", value: "480p" },
      { label: "Medium (720p)", value: "720p" },
      { label: "High (1080p)", value: "1080p" },
    ],
    selectedValue: "720p",
    onChanged: (value) => console.log("Quality set to:", value),
  });
  ```

## Theming

The framework uses CSS Custom Properties (variables) for theming, closely following libadwaita's approach. Key variables are defined in `scss/_variables.scss` for both light and dark themes. You can override these variables in your own CSS to customize the look and feel.

The theme switching is handled by:

1. Checking `localStorage` for a user-saved theme (`"light"` or `"dark"`).
2. If not found, respecting the system preference via `prefers-color-scheme`.
3. A `Adw.toggleTheme()` function is provided to manually switch themes and save the preference.

### Accent Colors

The framework also supports user-selectable accent colors. The currently selected accent color is used for elements like suggested action buttons, active states in lists or view switchers, progress bars, etc.

- **Available Colors:** A predefined palette of accent colors is available. You can retrieve the list of names using:

  ```javascript
  const availableAccents = Adw.getAccentColors();
  // Returns an array like ['blue', 'green', 'red', ...]
  ```

- **Setting Accent Color:** To change the accent color dynamically:

  ```javascript
  Adw.setAccentColor("green");
  // UI elements will now use the 'green' accent.
  // This preference is saved to localStorage and applied on future loads.
  ```

- **JavaScript Functions:**
  - `Adw.getAccentColors()`: Returns an array of available accent color name strings.
  - `Adw.setAccentColor(colorName)`: Sets the application-wide accent color. `colorName` should be one of the strings returned by `getAccentColors()`. The chosen color is persisted in `localStorage`.
  - `Adw.loadSavedAccentColor()`: Called automatically on page load (as part of `loadSavedTheme`) to apply any previously selected accent color.

The SCSS defines a palette for both light and dark themes (e.g., `--accent-blue-light-bg`, `--accent-blue-dark-bg`, and their corresponding foregrounds `--accent-blue-light-fg`, etc.). The `setAccentColor` JavaScript function dynamically updates the main `--accent-bg-color` and `--accent-fg-color` CSS variables based on the selected color name and current theme (light/dark).

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Screenshots

_(Note: Screenshots below may need updating to reflect the latest styling and new components.)_

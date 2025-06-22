# Adwaita Web UI Framework

Vanilla JavaScript UI framework that mimics the look and feel of GNOME's GTK4 and libdwaita, making it easy to create web applications with a consistent Adwaita/GTK4 style. It uses HTML, CSS (via SCSS), and JavaScript, with no external dependencies.

![Light Theme](images/light.png)

## Features

- **Adwaita Styling:** Aims to closely follow the visual style and naming conventions of libadwaita for a consistent GNOME desktop look on the web.
- **Light and Dark Themes:** Built-in support for both light and dark themes. Includes automatic detection of system preference via `prefers-color-scheme`, manual toggling, and remembers the user's choice via `localStorage`.
- **Component-Based:** Primarily delivered as [Custom Elements (Web Components)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) for easy declarative use in HTML. Helper JavaScript factory functions are also provided for imperative creation.
- **CSS Variables:** Extensively uses CSS custom properties (variables) for theming, making customization of colors, fonts, and spacing straightforward, inspired by libadwaita's own variable system.
- **Accent Colors:** Supports dynamic accent color switching, allowing users to choose from a predefined palette, with preferences saved.
- **Responsive Design:** Components are designed to be reasonably responsive where applicable.
- **Accessibility (ARIA):** Incorporates ARIA roles and attributes to improve accessibility for users of assistive technologies.
- **No External Dependencies:** Written in pure JavaScript, HTML, and SCSS.

## Installation

1. **Clone or Download:** Get the code from the repository (or copy the code files directly):

   ```
   adwaita-web/
   ├── js/
   │   ├── components.js  (Main script, includes all component logic)
   │   └── components/    (Individual component JS modules)
   │       ├── button.js
   │       └── ...
   ├── scss/
   │   ├── style.scss     (Main SCSS file, imports all component styles)
   │   ├── _variables.scss
   │   ├── _base.scss
   │   └── _*.scss        (Individual component SCSS partials)
   ├── style.css          (Generated CSS output)
   └── ... (docs/, examples/, etc.)
   ```

2. **Install Sass:** You need a Sass compiler to convert the SCSS files into CSS. The recommended method is the Dart Sass command-line tool:

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

4. **Include in your HTML:** Include the compiled `style.css` and the `components.js` file in your HTML. `components.js` should be loaded as a module if you are using ES6 imports within your own scripts, or ensure it's loaded before scripts that use `Adw`. For web components to be defined, it must be included.

   ```html
   <head>
     <link rel="stylesheet" href="style.css" />
     <!-- Ensure components.js is loaded, ideally as a module or before your app script -->
     <script src="js/components.js" defer></script>
   </head>
   <body>
     <div id="app">
       <!-- You can now use Adwaita Web Components directly -->
       <adw-button id="my-declarative-button" suggested>Click Me Declaratively!</adw-button>
     </div>
     <script>
       // Example of interacting with the declarative button
       document.getElementById('my-declarative-button').addEventListener('click', () => {
         Adw.createToast("Declarative button clicked!");
       });
     </script>
   </body>
   ```

## Usage

Adwaita Web components can be used in two main ways:

1.  **Declaratively in HTML:** Most components are provided as [Custom Elements (Web Components)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) that you can use directly in your HTML markup. This is the recommended approach for structuring your UI.
    Example:
    ```html
    <adw-button suggested>Save</adw-button>
    <adw-entry placeholder="Enter your name..."></adw-entry>
    ```

2.  **Imperatively via JavaScript:** The framework also provides a global `Adw` object containing factory functions (e.g., `Adw.createButton(...)`) for creating UI components from JavaScript. This is useful for dynamic content generation, one-off elements like toasts and dialogs, or if you prefer a JavaScript-driven approach.
    Example:
    ```javascript
    const myButton = Adw.createButton("Click Me Imperatively", {
      onClick: () => {
        Adw.createToast("Imperative button clicked!");
      },
      suggested: true,
    });
    document.getElementById("app").appendChild(myButton);
    ```

## Component Documentation

Components can be used as HTML custom elements (e.g., `<adw-button>`) or created imperatively using JavaScript functions from the global `Adw` object (e.g., `Adw.createButton(...)`). Attributes in HTML map to options in the JavaScript factory functions.

Detailed API information for JavaScript factories, including all options for each component, can be found in the JSDoc comments within the respective `js/components/*.js` files. For web components, attributes often mirror these options.

Here's an overview of common components:

### Buttons (`<adw-button>` / `Adw.createButton()`)

Creates a button.

-   **HTML Example:**
    ```html
    <adw-button id="save-btn" suggested>Save</adw-button>
    <adw-button id="icon-btn" icon-name="document-new-symbolic" circular aria-label="New Document"></adw-button>
    <adw-button flat>Flat</adw-button>
    ```
    Common attributes: `suggested`, `destructive`, `flat`, `disabled`, `icon-name`, `circular`. Text content goes inside the tags.
-   **JS Factory:** `Adw.createButton(text, options = {})`
    - `text`: `string` - Text displayed on the button.
    - `options`: `object` (corresponds to HTML attributes)
        - `onClick`: `function` - Callback for click events.
        - `suggested`, `destructive`, `flat`, `disabled`, `iconName`, `isCircular` (maps to `circular`), `href`. (Note: `icon` option is deprecated).

### Entries (`<adw-entry>` / `Adw.createEntry()`)

Creates a text input field.

-   **HTML Example:**
    ```html
    <adw-entry placeholder="Enter your name..." value="Initial Text"></adw-entry>
    <adw-entry disabled value="Cannot edit"></adw-entry>
    ```
    Common attributes: `placeholder`, `value`, `disabled`.
-   **JS Factory:** `Adw.createEntry(options = {})`
    - `options`: `placeholder`, `value`, `onInput`, `disabled`.

### Switches (`<adw-switch>` / `Adw.createSwitch()`)

Creates a toggle switch.

-   **HTML Example:**
    ```html
    <adw-switch label="Enable Notifications" checked></adw-switch>
    <adw-switch label="Disabled Switch" disabled></adw-switch>
    ```
    Common attributes: `label`, `checked`, `disabled`.
-   **JS Factory:** `Adw.createSwitch(options = {})`
    - `options`: `label`, `checked`, `onChanged`, `disabled`.

### Labels (`<adw-label>` / `Adw.createLabel()`)

Creates a text label. Can also be used for headings and other text elements.

-   **HTML Example:**
    ```html
    <adw-label title-level="1">Main Application Title</adw-label>
    <adw-label is-caption>A small note or caption.</adw-label>
    <adw-label is-body>Standard body text.</adw-label>
    ```
    Common attributes: `title-level` (1-4), `is-caption`, `is-body`, `is-link`, `disabled`. Text content goes inside.
-   **JS Factory:** `Adw.createLabel(text, options = {})`
    - `options`: `htmlTag`, `title` (maps to `title-level`), `isCaption`, `isLink`, `isDisabled`.

### Header Bars (`<adw-header-bar>` / `Adw.createHeaderBar()`)

Creates a header bar, typically used at the top of a window or view. Uses slots for content.

-   **HTML Example:**
    ```html
    <adw-header-bar>
      <adw-button slot="start" icon="<svg><!-- menu --></svg>" circular></adw-button>
      <adw-window-title slot="title" title="My App" subtitle="Version 1.0"></adw-window-title>
      <adw-button slot="end">Action</adw-button>
    </adw-header-bar>
    ```
    Use `<adw-window-title slot="title">` for the title area.
-   **JS Factory:** `Adw.createHeaderBar(options = {})`
    - `options`: `title`, `subtitle` (for simple text titles), `start` (HTMLElement[]), `end` (HTMLElement[]).

### Application Windows (`<adw-application-window>` / `Adw.createWindow()`)

A top-level container, often holding a header bar and main content area.

-   **HTML Example:**
    ```html
    <adw-application-window>
      <adw-header-bar slot="header">
        <!-- ... header content ... -->
      </adw-header-bar>
      <div class="main-content">
        <p>Window content goes here.</p>
      </div>
    </adw-application-window>
    ```
-   **JS Factory:** `Adw.createWindow(options = {})` (Primarily for simpler, non-slotted content)
    - `options`: `header` (HTMLElement), `content` (HTMLElement).

### Boxes (`<adw-box>` / `Adw.createBox()`)

A flexbox container.

-   **HTML Example:**
    ```html
    <adw-box orientation="horizontal" spacing="s" align="center">
      <adw-button>OK</adw-button>
      <adw-button>Cancel</adw-button>
    </adw-box>
    ```
    Attributes: `orientation` ('vertical'/'horizontal'), `spacing`, `align`, `justify`, `fill-children`.
-   **JS Factory:** `Adw.createBox(options = {})`
    - `options`: `orientation`, `align`, `justify`, `spacing`, `fillChildren`, `children`.

### List Boxes (`<adw-list-box>` / `Adw.createListBox()`) & Rows

Creates a list box container. Rows are typically children.

-   **HTML Example:**
    ```html
    <adw-list-box selectable>
      <adw-row interactive>
        <adw-label>Setting 1</adw-label>
      </adw-row>
      <adw-action-row title="Open Settings" subtitle="Configure preferences"></adw-action-row>
    </adw-list-box>
    ```
    Attributes for `<adw-list-box>`: `flat` (removes outer border), `selectable`.
    See specialized row components below.
-   **JS Factory:** `Adw.createListBox(options = {})`
    - `options`: `children` (HTMLElement[], typically created rows), `isFlat`, `selectable`.
    **JS Factory for basic `<adw-row>`:** `Adw.createRow(options = {})`
    - `options`: `children`, `activated`, `interactive`, `onClick`.

### Progress Bars (`<adw-progress-bar>` / `Adw.createProgressBar()`)

Creates a progress bar.

-   **HTML Example:**
    ```html
    <adw-progress-bar value="50"></adw-progress-bar>
    <adw-progress-bar indeterminate></adw-progress-bar>
    ```
    Attributes: `value` (0-100), `indeterminate`, `disabled`.
-   **JS Factory:** `Adw.createProgressBar(options = {})`
    - `options`: `value`, `isIndeterminate`, `disabled`.

### Checkboxes & Radio Buttons (`<adw-checkbox>`, `<adw-radio-button>` / `Adw.createCheckbox()`, `Adw.createRadioButton()`)

-   **HTML Example:**
    ```html
    <adw-checkbox label="I agree" checked></adw-checkbox>
    <adw-radio-button label="Option 1" name="group1" checked></adw-radio-button>
    <adw-radio-button label="Option 2" name="group1"></adw-radio-button>
    ```
    Attributes: `label`, `checked`, `disabled`, `name` (required for radio).
-   **JS Factory:** `Adw.createCheckbox(options = {})`, `Adw.createRadioButton(options = {})`
    - `options`: `label`, `checked`, `onChanged`, `disabled`, `name`.

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

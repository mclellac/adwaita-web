# Tutorial: Creating a Simple Application with Adwaita Web

This tutorial will guide you through building a very simple web application interface using the Adwaita Web library. We'll create a basic "Quick Notes" app that allows you to add and display short notes. This will demonstrate how to use several Adwaita Web components and styling conventions.

## 1. Introduction

Adwaita Web provides CSS styles and JavaScript components to build web interfaces that mimic the look and feel of GNOME's Adwaita design language. This tutorial focuses on using the CSS styling aspect with basic HTML, and will touch upon how JavaScript can be used for interactivity.

**What we'll build:**
*   A header bar with the application title.
*   An input area to add new notes.
*   A list to display the added notes.

## 2. Setup

### Basic HTML Page (`quick_notes.html`)
First, create a basic HTML file. Let's call it `quick_notes.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quick Notes App</title>
  <link rel="stylesheet" href="path/to/adwaita-web/css/adwaita-skin.css"> <!-- Adjust path as needed -->
  <style>
    body {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      margin: 0;
    }
    .app-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }
    .content-area {
      padding: var(--spacing-l);
      flex-grow: 1;
      overflow-y: auto;
    }
    .notes-list {
      margin-top: var(--spacing-m);
    }
  </style>
</head>
<body>
  <div class="app-container">
    <!-- App content will go here -->
  </div>

  <script>
    // Basic JavaScript for interactivity will go here
  </script>
</body>
</html>
```

### Linking Adwaita Web CSS
In the `<head>` section, we've linked to `adwaita-skin.css`. You'll need to:
1.  **Compile the SCSS:** If you're working from the source, use a SASS compiler on `adwaita-web/scss/adwaita-skin.scss` to generate `adwaita-skin.css`. The project includes a `build-adwaita-web.sh` script that can do this and also prepares other assets.
2.  **Adjust the Path:** Make sure the `href` attribute in the `<link>` tag correctly points to where `adwaita-skin.css` is located relative to your `quick_notes.html` file. For example, if you run the build script, it might place it in a `build/css/` directory.

## 3. Basic Layout with AdwHeaderBar

Let's add a header bar to our application.

Modify the `app-container` div:
```html
  <div class="app-container">
    <header class="adw-header-bar">
      <div class="adw-header-bar-center-box">
        <h1 class="adw-header-bar-title">Quick Notes</h1>
      </div>
      <div class="adw-header-bar-end">
        <button class="adw-button flat circular" id="theme-toggle-button" aria-label="Toggle Theme">
          <span class="adw-icon icon-display-brightness-symbolic"></span> <!-- Placeholder icon -->
        </button>
      </div>
    </header>

    <main class="content-area">
      <!-- Input and list will go here -->
    </main>
  </div>
```
*   We use `adw-header-bar` for the main header.
*   `adw-header-bar-center-box` and `adw-header-bar-title` for the title.
*   `adw-header-bar-end` for right-aligned actions (like a theme toggle).
*   You'll need to define `icon-display-brightness-symbolic` or use an actual SVG/image for the icon. For simplicity, we'll assume it's defined elsewhere or you can use text.

## 4. Adding Notes: Input Area

Now, let's add an input field and a button to add new notes within the `content-area`.

```html
    <main class="content-area">
      <div class="adw-box horizontal spacing-s" style="align-items: center; margin-bottom: var(--spacing-l);">
        <input type="text" class="adw-entry" id="new-note-input" placeholder="Enter your note..." style="flex-grow: 1;">
        <button class="adw-button suggested-action" id="add-note-button">
          <span class="adw-icon icon-add-symbolic"></span> Add Note
        </button>
      </div>

      <div class="adw-list-box notes-list" id="notes-list-container">
        <!-- Notes will be added here -->
        <div class="adw-row placeholder-row">
          <span class="adw-label dim-label">No notes yet.</span>
        </div>
      </div>
    </main>
```
*   We use an `adw-box horizontal spacing-s` to layout the input and button side-by-side with small spacing.
*   `adw-entry` styles the text input.
*   `adw-button suggested-action` styles the "Add Note" button. (Define `icon-add-symbolic` or use text).
*   `adw-list-box` will contain our notes. We've added a placeholder row for when it's empty.

## 5. Displaying Notes in a ListBox

Each note in the list can be an `AdwActionRow`.

```html
<!-- Inside <div class="adw-list-box notes-list" id="notes-list-container"> -->
<!-- Example of how a note might look (to be added by JavaScript): -->
<!--
<div class="adw-action-row">
  <span class="adw-action-row-title">My first note text</span>
  <div style="flex-grow: 1;"></div> &lt;!&ndash; Spacer &ndash;&gt;
  <button class="adw-button flat circular destructive-action" aria-label="Delete note">
    <span class="adw-icon icon-edit-delete-symbolic"></span>
  </button>
</div>
-->
```
We'll add these rows dynamically with JavaScript later. For now, this shows the structure. (Define `icon-edit-delete-symbolic`).

## 6. Styling and Theming

Adwaita Web makes theming easy.

### Light/Dark Mode
To toggle dark mode, you'll need a bit of JavaScript for the theme toggle button:
```javascript
// Inside the <script> tag at the bottom of body

const themeToggleButton = document.getElementById('theme-toggle-button');
const brightnessIcon = themeToggleButton.querySelector('.adw-icon'); // Assuming it's there

function setTheme(themeName) {
  if (themeName === 'dark') {
    document.documentElement.classList.add('theme-dark');
    // Update icon to sun or similar for dark mode (optional)
    // brightnessIcon.classList.remove('icon-display-brightness-symbolic');
    // brightnessIcon.classList.add('icon-weather-sunny-symbolic'); // Define this icon
  } else {
    document.documentElement.classList.remove('theme-dark');
    // Update icon to moon or similar for light mode (optional)
    // brightnessIcon.classList.remove('icon-weather-sunny-symbolic');
    // brightnessIcon.classList.add('icon-display-brightness-symbolic');
  }
  localStorage.setItem('appTheme', themeName);
}

themeToggleButton.addEventListener('click', () => {
  if (document.documentElement.classList.contains('theme-dark')) {
    setTheme('light');
  } else {
    setTheme('dark');
  }
});

// Apply saved theme on load
const savedTheme = localStorage.getItem('appTheme');
if (savedTheme) {
  setTheme(savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme('dark'); // Prefer system dark mode if no saved theme
}
```
*(Remember to define any icons like `icon-weather-sunny-symbolic` if you implement the icon change.)*

### Accent Colors
You can change the accent color by adding a class to `document.documentElement` (e.g., `accent-green`, `accent-purple`).
For example, to set it to green:
```javascript
document.documentElement.classList.add('accent-green');
// To remove a previous accent before adding a new one:
// document.documentElement.classList.remove('accent-blue', 'accent-red', ...);
```
This would typically be part of a settings panel in a larger application.

## 7. Interactivity: Adding Notes (JavaScript)

Let's make the "Add Note" button work.

```javascript
// Inside the <script> tag

const newNoteInput = document.getElementById('new-note-input');
const addNoteButton = document.getElementById('add-note-button');
const notesListContainer = document.getElementById('notes-list-container');
const placeholderRow = notesListContainer.querySelector('.placeholder-row');

addNoteButton.addEventListener('click', () => {
  const noteText = newNoteInput.value.trim();
  if (noteText === '') {
    // Optional: Show an AdwToast or inline message if using Adw.js helpers
    // Adw.createToast("Note cannot be empty!");
    alert("Note cannot be empty!"); // Simple alert for now
    return;
  }

  if (placeholderRow) {
    placeholderRow.remove(); // Remove "No notes yet" message
  }

  const noteRow = document.createElement('div');
  noteRow.className = 'adw-action-row';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'adw-action-row-title';
  titleSpan.textContent = noteText;

  const spacer = document.createElement('div');
  spacer.style.flexGrow = '1';

  const deleteButton = document.createElement('button');
  deleteButton.className = 'adw-button flat circular destructive-action';
  deleteButton.setAttribute('aria-label', 'Delete note');
  const deleteIcon = document.createElement('span');
  // Ensure you have 'icon-edit-delete-symbolic' CSS defined for the icon's appearance
  deleteIcon.className = 'adw-icon icon-edit-delete-symbolic';
  deleteButton.appendChild(deleteIcon);

  deleteButton.addEventListener('click', () => {
    noteRow.remove();
    // If list becomes empty, show placeholder again
    if (notesListContainer.children.length === 0) {
        notesListContainer.appendChild(placeholderRow); // Re-add original placeholder or create new
    }
  });

  noteRow.appendChild(titleSpan);
  noteRow.appendChild(spacer);
  noteRow.appendChild(deleteButton);

  notesListContainer.appendChild(noteRow);

  newNoteInput.value = ''; // Clear input
  newNoteInput.focus();

  // Optional: Use Adw.Toast for feedback if Adw.js is included
  // Adw.createToast("Note added!");
});
```

This JavaScript provides basic functionality. A real app would use more robust DOM manipulation, potentially Web Components for each note, and save data (e.g., to `localStorage`).

### Using Adw.js Components (Conceptual)
If you were using the Adwaita Web JavaScript components:
*   **Dialogs:** For confirmation before deleting a note:
    ```javascript
    // Conceptual, assuming Adw.AlertDialog.factory is available
    // Adw.AlertDialog.factory("Really delete this note?", {
    //   heading: "Confirm Deletion",
    //   choices: [ {label: "Cancel", value: "cancel"}, {label: "Delete", value: "delete", style: "destructive"}],
    //   onResponse: (value) => { if (value === "delete") { /* ... delete logic ... */ } }
    // }).open();
    ```
*   **Toasts:** For notifications:
    ```javascript
    // Adw.Toast.show("Note successfully added!"); // If using the Adw.Toast API
    ```

## 8. Conclusion

This tutorial demonstrated how to set up a simple HTML page with Adwaita Web CSS to create a basic application interface. We covered:
*   Linking the stylesheet.
*   Using `AdwHeaderBar`, `AdwBox`, `AdwEntry`, `AdwButton`, and `AdwListBox` with `AdwActionRow`.
*   Basic theme (dark mode) and accent color application.
*   Conceptual JavaScript for interactivity.

From here, you can explore more Adwaita Web components and SCSS utilities to build richer interfaces. Refer to the individual widget documentation pages for detailed information on each component's styling options and expected HTML structure.

Remember to consult the `THEMING_REFERENCE.md` for a full list of CSS custom properties to customize the look and feel further.
You would also need to define the icons used (e.g. `icon-display-brightness-symbolic`, `icon-add-symbolic`, `icon-edit-delete-symbolic`) in your CSS, for example:
```css
/* In your main CSS or a separate icon CSS file */
.adw-icon { /* Basic icon setup */
  display: inline-block;
  width: 16px; height: 16px;
  background-color: currentColor; /* For mask-image icons */
  -webkit-mask-size: contain; mask-size: contain;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
}
.icon-display-brightness-symbolic { -webkit-mask-image: url(path/to/display-brightness-symbolic.svg); mask-image: url(path/to/display-brightness-symbolic.svg); }
.icon-add-symbolic { -webkit-mask-image: url(path/to/list-add-symbolic.svg); mask-image: url(path/to/list-add-symbolic.svg); }
.icon-edit-delete-symbolic { -webkit-mask-image: url(path/to/edit-delete-symbolic.svg); mask-image: url(path/to/edit-delete-symbolic.svg); }
/* ... add other icons you use ... */
```
Adjust the `url()` paths to point to your icon files. The Adwaita Web library provides many symbolic icons in `adwaita-web/data/icons/symbolic/`.
Happy Hacking!
```

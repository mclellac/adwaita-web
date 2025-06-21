# PreferencesDialog

A PreferencesDialog is used to present application settings or preferences to the user, typically organized into multiple pages or sections. It often uses a ViewSwitcher internally to navigate between these pages.

## JavaScript Factory: `Adw.createPreferencesDialog()`

Creates and manages an Adwaita-styled preferences dialog.

**Signature:**

```javascript
Adw.createPreferencesDialog(options = {}) -> { dialog: HTMLDivElement, open: function, close: function }
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): Title for the dialog window. Defaults to "Preferences".
    *   `pages` (Array<Object>, required): An array of page objects. Each object defines a page in the preferences dialog:
        *   `name` (String, required): A unique internal name for the page.
        *   `title` (String, required): The display title for the page (used in the ViewSwitcher button).
        *   `pageElement` (HTMLElement, required): The HTML element that constitutes the content of this preference page. This element should be structured like an `AdwPreferencesPage` (see below or `adw-preferences-page` Web Component).
    *   `initialPageName` (String, optional): The `name` of the page to show initially. Defaults to the first page in the `pages` array.
    *   `onClose` (Function, optional): Callback function executed when the dialog is closed.

**Returns:**

*   An `Object` with the dialog instance (`dialog`), `open()` and `close()` methods.

**Structure of `pageElement` (e.g., an `AdwPreferencesPage`):**
A typical `pageElement` would be a `div` with class `adw-preferences-page` (or an `<adw-preferences-page>` element). Inside, it might contain:
*   An `<h1>` with class `adw-preferences-page-title` (though the dialog's ViewSwitcher often handles showing the title).
*   One or more `AdwPreferencesGroup` elements (divs with class `adw-preferences-group`), each with a title and containing rows like `AdwEntryRow`, `AdwSwitchRow`, `AdwComboRow`.

**Example:**

```html
<div id="js-prefsdialog-trigger"></div>
<script>
  const triggerContainer = document.getElementById('js-prefsdialog-trigger');

  // --- Page 1: General Preferences ---
  const generalPage = document.createElement('div'); // Simulates AdwPreferencesPage
  generalPage.classList.add('adw-preferences-page');
  // Group 1.1
  const appearanceGroup = document.createElement('div'); // Simulates AdwPreferencesGroup
  appearanceGroup.classList.add('adw-preferences-group');
  const appearanceTitle = document.createElement('h2'); // Simulates group title
  appearanceTitle.classList.add('adw-preferences-group-title');
  appearanceTitle.textContent = "Appearance";
  appearanceGroup.appendChild(appearanceTitle);
  appearanceGroup.appendChild(
    Adw.createSwitchRow({ title: "Use Dark Theme", active: true, onChanged: (val) => Adw.toggleTheme(val ? 'dark' : 'light')}) // Assuming SwitchRow exists
  );
  appearanceGroup.appendChild(
    Adw.createComboRow({ title: "Accent Color", selectOptions: [{label: "Blue", value: "blue"}, {label: "Green", value: "green"}], value: "blue" }) // Assuming ComboRow exists
  );
  generalPage.appendChild(appearanceGroup);

  // --- Page 2: Advanced Preferences ---
  const advancedPage = document.createElement('div');
  advancedPage.classList.add('adw-preferences-page');
  const networkGroup = document.createElement('div');
  networkGroup.classList.add('adw-preferences-group');
  const networkTitle = document.createElement('h2');
  networkTitle.classList.add('adw-preferences-group-title');
  networkTitle.textContent = "Network Settings";
  networkGroup.appendChild(networkTitle);
  networkGroup.appendChild(
    Adw.createEntryRow({ title: "Proxy Server", entryOptions: { placeholder: "e.g., 127.0.0.1:8080"} })
  );
  advancedPage.appendChild(networkGroup);


  const showPrefsBtn = Adw.createButton("Open Preferences (JS)", {
    onClick: () => {
      const prefsDialog = Adw.createPreferencesDialog({
        title: "Application Settings",
        pages: [
          { name: "general", title: "General", pageElement: generalPage },
          { name: "advanced", title: "Advanced", pageElement: advancedPage }
        ],
        initialPageName: "general",
        onClose: () => console.log("Preferences dialog closed.")
      });
      prefsDialog.open();
    }
  });
  triggerContainer.appendChild(showPrefsBtn);
</script>
```

## Web Component: `<adw-preferences-dialog>`

A declarative way to define Adwaita preferences dialogs.

**HTML Tag:** `<adw-preferences-dialog>`

**Attributes:**

*   `title` (String, optional): Title for the dialog window. Defaults to "Preferences".
*   `open` (Boolean, optional): Controls visibility. Add to open, remove to close.
*   `initial-page-name` (String, optional): The `name` of the page to show initially.

**Slots:**

*   Default slot: This is where you place `<adw-preferences-page>` elements. Each `<adw-preferences-page>` should have a `name` attribute (unique) and a `title` attribute (for the switcher button).

**Events:**

*   `open`: Fired when the dialog opens.
*   `close`: Fired when the dialog closes.
*   `page-changed`: Fired when the visible preference page changes. `event.detail` might contain `{ pageName: String }`.

**Methods:**

*   `open()`: Shows the dialog.
*   `close()`: Hides the dialog.

**Example of related components for page structure:**

*   `<adw-preferences-page name="general" title="General">...</adw-preferences-page>`
*   `<adw-preferences-group title="Appearance">...</adw-preferences-group>`
*   `<adw-switch-row title="Dark Theme"></adw-switch-row>`
*   `<adw-entry-row title="Username"></adw-entry-row>`
*   `<adw-combo-row title="Language"></adw-combo-row>`

**Example Usage:**

```html
<adw-button id="wc-prefs-btn">Open Preferences (WC)</adw-button>

<adw-preferences-dialog id="my-wc-prefs" title="My App Settings" initial-page-name="ui-settings">
  <adw-preferences-page name="ui-settings" title="User Interface">
    <adw-preferences-group title="Theme">
      <adw-switch-row title="Enable Animations" active></adw-switch-row>
      <adw-combo-row title="Font Size" id="wc-font-size-combo"></adw-combo-row>
    </adw-preferences-group>
    <adw-preferences-group title="Notifications">
      <adw-switch-row title="Show Desktop Notifications"></adw-switch-row>
    </adw-preferences-group>
  </adw-preferences-page>

  <adw-preferences-page name="account" title="Account">
    <adw-preferences-group title="Profile">
      <adw-entry-row title="Display Name" placeholder="Your Name"></adw-entry-row>
      <adw-action-row title="Change Password..." show-chevron></adw-action-row>
    </adw-preferences-group>
  </adw-preferences-page>
</adw-preferences-dialog>

<script>
  const wcPrefs = document.getElementById('my-wc-prefs');
  const wcPrefsBtn = document.getElementById('wc-prefs-btn');

  // Populate combo row options for the WC example
  const wcFontCombo = document.getElementById('wc-font-size-combo');
  if (wcFontCombo) {
    wcFontCombo.selectOptions = [
      { label: "Small", value: "small" }, { label: "Medium", value: "medium" }, { label: "Large", value: "large" }
    ];
    wcFontCombo.value = "medium";
  }


  wcPrefsBtn.addEventListener('click', () => {
    wcPrefs.open();
  });

  wcPrefs.addEventListener('close', () => {
    console.log('WC Preferences Dialog closed.');
  });
  wcPrefs.addEventListener('page-changed', (event) => {
    console.log('WC Preferences page changed to:', event.detail.pageName);
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_preferences_dialog.scss` (builds on `_dialog.scss` and uses `_viewswitcher.scss`).
*   The dialog content area often has specific padding and layout for preference pages and groups.
*   The ViewSwitcher used for navigation is typically styled to be well-integrated.

---
Next: [SpinButton](./spinbutton.md)

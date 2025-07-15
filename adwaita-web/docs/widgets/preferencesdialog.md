# PreferencesDialog

A PreferencesDialog is used to present application settings or preferences to the user, typically organized into multiple pages or sections. It often uses a ViewSwitcher internally to navigate between these pages.

## JavaScript Factory: `Adw.PreferencesDialog.factory()` or `createAdwPreferencesDialog()`

Creates an `<adw-preferences-dialog>` Web Component instance.

**Signature:**

```javascript
Adw.PreferencesDialog.factory(options = {}) -> AdwPreferencesDialogElement
// or createAdwPreferencesDialog(options = {}) -> AdwPreferencesDialogElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, optional): Sets the `title` attribute on the `<adw-preferences-dialog>`. Defaults to "Preferences".
    *   `pages` (Array<Object>, required): An array of page objects. Each object defines a page:
        *   `name` (String, required): Unique name for the page. Used for `initial-page-name` and for the internal view switcher.
        *   `title` (String, required): Display title for the page tab/button.
        *   `pageElement` (Node, required): The DOM Node representing the content of this preference page. This element should be structured appropriately (e.g., an `<adw-preferences-page>` or a `<div>` containing groups and rows). The factory will set `name` and `title` attributes on this `pageElement` if not already present and assign `slot="page"` before appending it to the `<adw-preferences-dialog>`.
    *   `initialPageName` (String, optional): Sets the `initial-page-name` attribute.
    *   `onClose` (Function, optional): Attached as a `close` event listener to the WC.

**Returns:**

*   `(AdwPreferencesDialogElement)`: The created `<adw-preferences-dialog>` Web Component instance.

**Example:**

```html
<div id="js-prefsdialog-trigger"></div>
<script>
  // Assuming createAdwPreferencesDialog and other Adwaita WCs/factories are available
  const triggerContainer = document.getElementById('js-prefsdialog-trigger');

  // --- Page 1: General Preferences ---
  const generalPage = document.createElement('adw-preferences-page');
  // 'name' and 'title' will be set by the factory from pageData if not set here
  // generalPage.setAttribute('name', 'general');
  // generalPage.setAttribute('title', 'General');

  const appearanceGroup = document.createElement('adw-preferences-group');
  appearanceGroup.title = "Appearance"; // Assuming title property or attribute

  const switchRow = document.createElement('adw-switch-row');
  switchRow.title = "Use Dark Theme";
  switchRow.active = true;
  switchRow.addEventListener('change', (e) => Adw.toggleTheme(e.target.active ? 'dark' : 'light'));
  appearanceGroup.appendChild(switchRow);

  const comboRow = document.createElement('adw-combo-row');
  comboRow.title = "Accent Color";
  comboRow.selectOptions = [{label: "Blue", value: "blue"}, {label: "Green", value: "green"}];
  comboRow.value = "blue";
  appearanceGroup.appendChild(comboRow);
  generalPage.appendChild(appearanceGroup);

  // --- Page 2: Advanced Preferences ---
  const advancedPage = document.createElement('adw-preferences-page');
  const networkGroup = document.createElement('adw-preferences-group');
  networkGroup.title = "Network Settings";
  const entryRow = document.createElement('adw-entry-row');
  entryRow.title = "Proxy Server";
  entryRow.placeholder = "e.g., 127.0.0.1:8080";
  networkGroup.appendChild(entryRow);
  advancedPage.appendChild(networkGroup);

  const showPrefsBtn = createAdwButton("Open Preferences (JS)", {
    onClick: () => {
      const prefsDialogWC = createAdwPreferencesDialog({
        title: "Application Settings",
        pages: [
          { name: "general", title: "General", pageElement: generalPage },
          { name: "advanced", title: "Advanced", pageElement: advancedPage }
        ],
        initialPageName: "general",
        onClose: () => console.log("Preferences dialog (WC) closed.")
      });
      prefsDialogWC.open();
    }
  });
  triggerContainer.appendChild(showPrefsBtn);
</script>
```

## Web Component: `<adw-preferences-dialog>`

A declarative way to define Adwaita preferences dialogs. This component internally uses an `<adw-dialog>` and an `<adw-view-switcher>`.

**HTML Tag:** `<adw-preferences-dialog>`

**Attributes:**

*   `title` (String, optional): Title for the dialog window. Defaults to "Preferences".
*   `open` (Boolean attribute): Controls visibility.
*   `initial-page-name` (String, optional): The `name` of the page (child element) to show initially.

**Slots:**

*   Default slot: This is where you place preference page elements (e.g., `<adw-preferences-page>`). Each child element intended as a page should have:
    *   A `name` attribute (or `view-name`): Unique identifier for the page.
    *   A `title` attribute (or `view-title`): Text for the navigation tab/button in the view switcher.

**Events:**

*   `open`: Fired when the dialog begins to open.
*   `close`: Fired when the dialog has closed.
*   `page-changed`: Fired by the internal `<adw-view-switcher>` when the visible preference page changes. `event.detail` typically contains `{ viewName: String }` (from `adw-view-switcher`). `AdwPreferencesDialog` may re-dispatch or allow this to bubble.

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

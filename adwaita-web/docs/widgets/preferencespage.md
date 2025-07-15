# PreferencesPage

The `<adw-preferences-page>` component represents a single "page" or section within a preferences window or view. It typically contains one or more `<adw-preferences-group>` elements, which in turn hold individual preference rows.

It's designed to be used within an `<adw-preferences-view>` or as a direct child of `<adw-preferences-dialog>` (which uses an internal view switcher).

## Web Component: `<adw-preferences-page>`

A container for a collection of preference groups.

**HTML Tag:** `<adw-preferences-page>`

**Attributes:**

*   `name` (String, required for use in view switchers): A unique identifier for this page. This `name` is used by components like `<adw-preferences-dialog>` or `<adw-view-switcher>` to identify and navigate to the page.
*   `title` (String, required for use in view switchers): The human-readable title for this page, displayed in the navigation element (e.g., a tab or a sidebar button) of a view switcher.
*   `description` (String, optional): A short description displayed at the top of the page, below the main title (if the container shows it).
*   `description-centered` (Boolean attribute): If present, the description text will be centered.
*   `icon-name` (String, optional): Name of an Adwaita icon to be associated with this page. (Note: The current JavaScript implementation of `AdwPreferencesPage` does not actively render this icon itself; its usage might depend on the container, like `AdwViewSwitcher`, to display it next to the title).

**Slots:**

*   Default slot: Expects one or more `<adw-preferences-group>` elements as children.
*   `banner` (Named slot): Allows placing a banner (e.g., `<adw-banner>`) at the top of the preference page, above the title and description rendered by the page itself.

**Example:**

```html
<adw-preferences-dialog title="My Application Settings" initial-page-name="ui-settings">

  <adw-preferences-page
      name="ui-settings"
      title="User Interface"
      description="Customize the look and feel of the application."
      icon-name="preferences-desktop-theme-symbolic">

    <adw-banner slot="banner" type="info" revealed>
      Some settings might require a restart.
    </adw-banner>

    <adw-preferences-group title="Theme & Appearance">
      <adw-switch-row title="Enable Dark Mode" active></adw-switch-row>
      <adw-combo-row title="Font Size" value="medium">
        <!-- Options would be populated via JavaScript for adw-combo-row -->
      </adw-combo-row>
    </adw-preferences-group>

    <adw-preferences-group title="Animations">
      <adw-switch-row title="Enable Animations"></adw-switch-row>
    </adw-preferences-group>
  </adw-preferences-page>

  <adw-preferences-page
      name="account-settings"
      title="Account"
      description="Manage your account details and security."
      icon-name="preferences-system-account-symbolic">
    <adw-preferences-group title="User Profile">
      <adw-entry-row title="Display Name" placeholder="Enter your display name"></adw-entry-row>
    </adw-preferences-group>
  </adw-preferences-page>

</adw-preferences-dialog>
```

## JavaScript Factory

There is no dedicated JavaScript factory for `<adw-preferences-page>`. It's intended to be used declaratively or created via `document.createElement('adw-preferences-page')` and then populated with attributes and child groups.

## Styling

*   Primary SCSS: `scss/_preferences.scss` (likely, or styles applied by parent containers like `_preferences_dialog.scss`).
*   It renders its own title (from `title` attribute) as an `<h1>` and description as a `<p>` within its Shadow DOM.
*   Provides structure for preference groups.

---
Next: [PreferencesGroup](./preferencesgroup.md)

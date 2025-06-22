# PreferencesView

The `<adw-preferences-view>` component serves as a container for one or more `<adw-preferences-page>` elements. It's typically used as the direct child of an `<adw-preferences-dialog>`'s content area when the dialog uses a view switcher to navigate between pages.

While `AdwPreferencesDialog` often incorporates an `AdwViewSwitcher` internally to manage pages, `AdwPreferencesView` can be used if you are building a custom preferences layout, for example, a static view that always shows all pages or a different navigation mechanism.

In many common scenarios, you might not interact with `<adw-preferences-view>` directly if you are using `<adw-preferences-dialog>`, as the dialog and its internal view switcher manage the layout of `<adw-preferences-page>` elements.

## Web Component: `<adw-preferences-view>`

A simple container for preference pages.

**HTML Tag:** `<adw-preferences-view>`

**Attributes:**

*   This component does not have specific attributes of its own. It relies on standard HTML attributes like `class` or `id` if needed.

**Slots:**

*   Default slot: Expects one or more `<adw-preferences-page>` elements as children.

**Example:**

```html
<!--
  Note: AdwPreferencesDialog usually manages its own view switcher.
  This example shows AdwPreferencesView in a more direct context,
  though often it's an internal part of AdwPreferencesDialog.
-->
<adw-preferences-dialog title="Application Settings">
  <!-- AdwPreferencesDialog typically slots adw-preferences-page directly,
       and its internal AdwViewSwitcher would manage them.
       If AdwPreferencesView is used explicitly, it would be like this: -->
  <adw-preferences-view>
    <adw-preferences-page name="general" title="General Settings">
      <!-- ... groups and rows ... -->
    </adw-preferences-page>
    <adw-preferences-page name="advanced" title="Advanced Settings">
      <!-- ... groups and rows ... -->
    </adw-preferences-page>
  </adw-preferences-view>
</adw-preferences-dialog>

<!-- More direct usage if not inside a dialog with a view switcher -->
<adw-preferences-view style="border: 1px solid var(--borders-color); padding: var(--spacing-s);">
  <h2>User Preferences</h2>
  <adw-preferences-page name="profile" title="Profile">
    <adw-preferences-group title="User Details">
      <adw-entry-row title="Username" value="current_user"></adw-entry-row>
    </adw-preferences-group>
  </adw-preferences-page>
  <adw-preferences-page name="notifications" title="Notifications">
     <adw-preferences-group title="Alerts">
      <adw-switch-row title="Enable Email Notifications" active></adw-switch-row>
    </adw-preferences-group>
  </adw-preferences-page>
</adw-preferences-view>
```

## JavaScript Factory

There is no dedicated JavaScript factory for `<adw-preferences-view>` as it's a simple structural element. It can be created using `document.createElement('adw-preferences-view')`.

## Styling

*   Primary SCSS: `scss/_preferences.scss` (likely, or styles applied by parent containers).
*   It typically provides basic block layout for its children (`<adw-preferences-page>`).

---
Next: [PreferencesPage](./preferencespage.md)

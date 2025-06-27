# PreferencesGroup

The `<adw-preferences-group>` component is used to group related preference rows (like `<adw-action-row>`, `<adw-switch-row>`, `<adw-entry-row>`, etc.) within an `<adw-preferences-page>`. It typically displays a title and an optional description for the group.

## Web Component: `<adw-preferences-group>`

A container for a set of related preference controls.

**HTML Tag:** `<adw-preferences-group>`

**Attributes:**

*   `title` (String, optional): The title of the preference group, displayed as a heading above the rows.
*   `description` (String, optional): A short description or explanatory text displayed below the group title.
*   `separate-rows` (Boolean attribute): If present, adds a separator line between each row within the group for clearer visual distinction.

**Slots:**

*   Default slot: Expects one or more preference row elements (e.g., `<adw-action-row>`, `<adw-switch-row>`, `<adw-combo-row>`, `<adw-entry-row>`, etc.) as children.
*   `header-suffix` (Named slot): Allows placing widgets (like an `<adw-button>` or `<adw-spinner>`) in the header area of the group, typically aligned to the end of the title/description line.

**Example:**

```html
<adw-preferences-page name="editor-settings" title="Editor">
  <adw-preferences-group
      title="Text Editing"
      description="Settings related to how text is displayed and edited.">

    <adw-switch-row title="Insert spaces instead of tabs" active></adw-switch-row>
    <adw-spin-row title="Tab size" min="1" max="8" value="4" step="1"></adw-spin-row>
    <adw-entry-row title="Ignored file patterns" placeholder="e.g., *.log, .git/"></adw-entry-row>
  </adw-preferences-group>

  <adw-preferences-group title="Spell Checking" separate-rows>
    <adw-switch-row title="Enable spell check as you type"></adw-switch-row>
    <adw-combo-row title="Default dictionary">
      <!-- Options for adw-combo-row typically set via JS -->
    </adw-combo-row>
    <adw-action-row title="Manage Dictionaries..." show-chevron>
        <adw-button slot="header-suffix" flat circular icon-name="document-edit-symbolic" title="Edit Dictionaries"></adw-button>
    </adw-action-row>
     <div slot="header-suffix"> <!-- Example of multiple items in header-suffix -->
        <adw-spinner size="16px" style="margin-right: 8px;"></adw-spinner>
        <adw-button appearance="flat" class="small">Help</adw-button>
    </div>
  </adw-preferences-group>
</adw-preferences-page>
```

## JavaScript Factory

There is no dedicated JavaScript factory for `<adw-preferences-group>`. It's intended to be used declaratively or created via `document.createElement('adw-preferences-group')` and then populated with attributes and child rows.

## Styling

*   Primary SCSS: `scss/_preferences.scss` (likely, or styles applied by parent containers).
*   Renders a `<section>` with a `<header>` (for title, description, and header-suffix slot) and a main content area for the rows (default slot).
*   The `separate-rows` attribute typically adds a border or line between child rows.

---
Next: [ToastOverlay](./toastoverlay.md)

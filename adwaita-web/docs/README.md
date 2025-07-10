# Adwaita-Web Documentation

Welcome to the documentation for Adwaita-Web, a CSS and JavaScript UI library for bringing the Adwaita design language to web applications.

This documentation provides guidance on how to apply Adwaita styling, primarily using CSS classes, and how to use its JavaScript components and utilities.

## Core Concepts

Adwaita-Web follows a hybrid approach:

*   **CSS-First Styling**: The primary way to style your application is by applying Adwaita CSS classes (e.g., `.adw-button`, `.adw-entry`) to standard HTML elements. The core styling is provided by `adwaita-web/css/adwaita-skin.css` (compiled from SCSS).
*   **JavaScript Web Components**: For more complex, interactive elements like Dialogs (`<adw-dialog>`, `<adw-about-dialog>`), the library provides JavaScript-defined Custom Elements. These are loaded via `adwaita-web/js/components.js`.
*   **JavaScript Utilities**: Helper functions and scripts (e.g., `Adw.createToast()` in `toast.js`, `banner.js` for dismissible banners) are available for enhancing interactivity.
*   **[Theming](./general/theming.md)**: Learn about the light and dark themes, accent color customization, and the underlying CSS variable system.
*   **[Usage Guide](./general/usage-guide.md)**: Understand how to apply Adwaita styles to your HTML using CSS classes and how to interact with the JavaScript components/utilities.

For general setup and installation, please refer to the main [README.md](../../README.md) in the repository root.

## Styled Elements and Components Documentation

This section provides examples of how to style common HTML elements using Adwaita-Web CSS classes and how to use its JavaScript components. Each linked page aims to cover the recommended HTML structure and usage.

**Important Note:** This documentation is in transition.
*   Many elements are styled using **CSS classes** (e.g., `.adw-button`, `.adw-entry`).
*   Specific components like **Dialogs** are JavaScript Web Components (e.g., `<adw-dialog>`).
*   Utilities like **Toasts** are used via JavaScript functions (e.g., `Adw.createToast()`).

While being updated, some individual widget pages listed below may still contain outdated information. For the most accurate current usage, consult the main [README.md](../../README.md), the `adwaita-web/examples/` directory, the `adwaita-web/scss/` files (for CSS class details), and `adwaita-web/js/` files (for Web Components and utilities).

Interactivity for CSS-styled elements generally needs to be implemented with your own JavaScript. Web Components encapsulate their own behavior.

*   **Actions & Input:**
    *   [Button](./widgets/button.md) (e.g., `.adw-button`)
    *   [ToggleButton](./widgets/togglebutton.md) (e.g., `.adw-toggle-button`, or `.adw-button.active`)
    *   [ToggleGroup](./widgets/togglegroup.md) (e.g., `.adw-toggle-group`)
    *   [InlineViewSwitcher](./widgets/inlineviewswitcher.md) (e.g., `.adw-inline-view-switcher`, uses ToggleGroup)
    *   [SplitButton](./widgets/splitbutton.md) (e.g., `.adw-split-button`)
    *   [Entry](./widgets/entry.md) (e.g., `.adw-entry`)
    *   [Checkbox](./widgets/checkbox.md) (e.g., `.adw-checkbox`)
    *   [RadioButton](./widgets/radiobutton.md) (e.g., `.adw-radio-button`)
    *   [SpinButton](./widgets/spinbutton.md) (e.g., `.adw-spin-button`)
    *   [ShortcutLabel](./widgets/shortcutlabel.md) (e.g., `.adw-shortcut-label`)

*   **Display & Information:**
    *   [Label](./widgets/label.md) (e.g., `.adw-label`, or utility text classes)
    *   [Avatar](./widgets/avatar.md) (e.g., `.adw-avatar`)
    *   [ProgressBar](./widgets/progressbar.md) (e.g., `.adw-progress-bar`)
    *   [Spinner](./widgets/spinner.md) (e.g., `.adw-spinner`)
    *   [StatusPage](./widgets/statuspage.md) (e.g., `.adw-status-page`)
    *   [Toast](./widgets/toast.md) (e.g., `.adw-toast`) - *Note: Showing/hiding Toasts requires custom JavaScript.*
    *   [Banner](./widgets/banner.md) (e.g., `.adw-banner`)

*   **Layout & Containers:**
    *   [Window (ApplicationWindow)](./widgets/window.md) (e.g., `.adw-window`)
    *   [HeaderBar](./widgets/headerbar.md) (e.g., `.adw-header-bar`)
    *   [Box](./widgets/box.md) (e.g., `.adw-box`)
    *   [Bin](./widgets/bin.md) (e.g., `.adw-bin`)
    *   [WrapBox](./widgets/wrapbox.md) (e.g., `.adw-wrap-box`)
    *   [Clamp](./widgets/clamp.md) (e.g., `.adw-clamp`)
    *   [ToolbarView](./widgets/toolbarview.md) (e.g., `.adw-toolbar-view`)

*   **Navigation & Views:**
    *   [ViewSwitcher](./widgets/viewswitcher.md) (e.g., `.adw-view-switcher-bar`)
    *   [TabView, TabBar, TabButton, TabPage](./widgets/tabview.md) (e.g., `.adw-tab-view`, etc.)
    *   [NavigationView](./widgets/navigationview.md) (e.g., `.adw-navigation-view`)
    *   [Flap](./widgets/flap.md) (e.g., `.adw-flap`)
    *   [NavigationSplitView](./widgets/navigationsplitview.md) (e.g., `.adw-navigation-split-view`)
    *   [OverlaySplitView](./widgets/overlaysplitview.md) (e.g., `.adw-overlay-split-view`)
    *   [BottomSheet](./widgets/bottomsheet.md) (e.g., `.adw-bottom-sheet`)
    *   [Carousel](./widgets/carousel.md) (e.g., `.adw-carousel`)
    *   [BreakpointBin](./widgets/breakpointbin.md) (e.g., `.adw-breakpoint-bin`)

*   **Rows & Lists (often used within ListBox or Preferences):**
    *   [Row](./widgets/row.md) (e.g., `.adw-row` base class)
    *   [ListBox](./widgets/listbox.md) (e.g., `.adw-list-box`)
    *   [ActionRow](./widgets/actionrow.md) (e.g., `.adw-action-row`)
    *   [EntryRow](./widgets/entryrow.md) (e.g., `.adw-entry-row`)
    *   [PasswordEntryRow](./widgets/passwordentryrow.md) (e.g., `.adw-password-entry-row`)
    *   [ExpanderRow](./widgets/expanderrow.md) (e.g., `.adw-expander-row`)
    *   [SwitchRow](./widgets/switchrow.md) (e.g., `.adw-switch-row`)
    *   [ComboRow](./widgets/comborow.md) (e.g., `.adw-combo-row`)
    *   [SpinRow](./widgets/spinrow.md) (e.g., `.adw-spin-row`)
    *   [ButtonRow](./widgets/buttonrow.md) (e.g., `.adw-button-row`)

*   **Dialogs:**
    *   [Dialog](./widgets/dialog.md) (e.g., `.adw-dialog`)
    *   [AlertDialog](./widgets/alertdialog.md) (e.g., `.adw-alert-dialog` structure within `.adw-dialog`)
    *   [AboutDialog](./widgets/aboutdialog.md) (structure for an about dialog, uses `.adw-dialog`)
    *   [PreferencesDialog](./widgets/preferencesdialog.md) (structure for a preferences dialog, uses `.adw-dialog`)
        *   Related: `AdwPreferencesPage` (e.g., `.adw-preferences-page`), `AdwPreferencesGroup` (e.g., `.adw-preferences-group`) - typically used within a preferences dialog structure.

## Contributing

(Information about contributing to Adwaita-Web development or its documentation can be added here in the future.)

---

We hope this documentation helps you build beautiful and consistent web applications with Adwaita-Web!

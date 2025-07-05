# Adwaita Skin Documentation

Welcome to the official documentation for Adwaita Skin, a pure CSS library for bringing the Adwaita design language to web applications.

This documentation provides guidance on how to apply Adwaita styling to standard HTML elements using CSS classes and understand the theming system.

## Core Concepts

Before diving into individual styled elements, it's helpful to understand the foundational aspects of Adwaita Skin:

*   **[Introduction](./general/README.md)**: What Adwaita Skin is, key features, and how to quickly get started by including its CSS in your project.
*   **[Theming](./general/theming.md)**: Learn about the light and dark themes, accent color customization, and the underlying CSS variable system.
*   **[Usage Guide](./general/usage-guide.md)**: Understand how to apply Adwaita styles to your HTML using the provided CSS classes. This section replaces the previous JavaScript API and Web Components documentation.

## Styled Elements (CSS Classes) Documentation

This section provides examples of how to style common HTML elements using Adwaita Skin CSS classes to achieve the Adwaita look and feel. Each linked page aims to cover the recommended HTML structure and the specific CSS classes to apply.

**Important Note:** This documentation is in transition. While key examples like Button, Entry, and ListBox are being updated to reflect the pure CSS approach, many other individual widget pages listed below may still contain outdated information referring to JavaScript APIs or Web Components. For the most accurate and current usage for all elements, please refer to the HTML structures used in the `adwaita-web/examples/` directory and consult the `adwaita-web/scss/` files to see how styles are defined and applied.

Adwaita Skin itself is a **pure CSS library**. All interactivity seen in examples or desired in your application must be implemented using your own JavaScript.

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

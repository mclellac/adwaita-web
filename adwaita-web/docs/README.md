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
    *   [Button](./widgets/button.md) (`<adw-button>`)
    *   [ToggleButton](./widgets/togglebutton.md) (`<adw-toggle-button>`)
    *   [ToggleGroup](./widgets/togglegroup.md) (`<adw-toggle-group>`)
    *   [SplitButton](./widgets/splitbutton.md) (`<adw-split-button>`)
    *   [Entry](./widgets/entry.md) (`<adw-entry>`)
    *   [Checkbox](./widgets/checkbox.md) (`<adw-checkbox>`)
    *   [RadioButton](./widgets/radiobutton.md) (`<adw-radio-button>`)
    *   [SpinButton](./widgets/spinbutton.md) (`<adw-spin-button>`)

*   **Display & Information:**
    *   [Label](./widgets/label.md) (`<adw-label>`)
    *   [Avatar](./widgets/avatar.md) (`<adw-avatar>`)
    *   [ProgressBar](./widgets/progressbar.md) (`<adw-progress-bar>`)
    *   [Spinner](./widgets/spinner.md) (`<adw-spinner>`)
    *   [StatusPage](./widgets/statuspage.md) (`<adw-status-page>`)
    *   [Toast](./widgets/toast.md) (`<adw-toast>`) - *Note: Toast is JS-only via `Adw.createToast()`*
    *   [Banner](./widgets/banner.md) (`<adw-banner>`)

*   **Layout & Containers:**
    *   [Window (ApplicationWindow)](./widgets/window.md) (`<adw-application-window>`)
    *   [HeaderBar](./widgets/headerbar.md) (`<adw-header-bar>`)
    *   [Box](./widgets/box.md) (`<adw-box>`)
    *   [Bin](./widgets/bin.md) (`<adw-bin>`)
    *   [WrapBox](./widgets/wrapbox.md) (`<adw-wrap-box>`)
    *   [Clamp](./widgets/clamp.md) (`<adw-clamp>`)
    *   [ToolbarView](./widgets/toolbarview.md) (`<adw-toolbar-view>`)

*   **Navigation & Views:**
    *   [ViewSwitcher](./widgets/viewswitcher.md) (`<adw-view-switcher>`)
    *   [TabView, TabBar, TabButton, TabPage](./widgets/tabview.md) (`<adw-tab-view>`, etc.)
    *   [NavigationView](./widgets/navigationview.md) (`<adw-navigation-view>`)
    *   [Flap](./widgets/flap.md) (`<adw-flap>`)
    *   [NavigationSplitView](./widgets/navigationsplitview.md) (`<adw-navigation-split-view>`)
    *   [OverlaySplitView](./widgets/overlaysplitview.md) (`<adw-overlay-split-view>`)
    *   [BottomSheet](./widgets/bottomsheet.md) (`<adw-bottom-sheet>`)
    *   [Carousel](./widgets/carousel.md) (`<adw-carousel>`)
    *   [BreakpointBin](./widgets/breakpointbin.md) (`<adw-breakpoint-bin>`)

*   **Rows & Lists (often used within ListBox or Preferences):**
    *   [Row](./widgets/row.md) (`<adw-row>`)
    *   [ListBox](./widgets/listbox.md) (`<adw-list-box>`)
    *   [ActionRow](./widgets/actionrow.md) (`<adw-action-row>`)
    *   [EntryRow](./widgets/entryrow.md) (`<adw-entry-row>`)
    *   [PasswordEntryRow](./widgets/passwordentryrow.md) (`<adw-password-entry-row>`)
    *   [ExpanderRow](./widgets/expanderrow.md) (`<adw-expander-row>`)
    *   [SwitchRow](./widgets/switchrow.md) (`<adw-switch-row>`)
    *   [ComboRow](./widgets/comborow.md) (`<adw-combo-row>`)
    *   [SpinRow](./widgets/spinrow.md) (`<adw-spin-row>`)
    *   [ButtonRow](./widgets/buttonrow.md) (`<adw-button-row>`)

*   **Dialogs:**
    *   [Dialog](./widgets/dialog.md) (`<adw-dialog>`)
    *   [AlertDialog](./widgets/alertdialog.md) (`<adw-alert-dialog>`)
    *   [AboutDialog](./widgets/aboutdialog.md) (`<adw-about-dialog>`)
    *   [PreferencesDialog](./widgets/preferencesdialog.md) (`<adw-preferences-dialog>`)
        *   Related: `AdwPreferencesPage` (`<adw-preferences-page>`), `AdwPreferencesGroup` (`<adw-preferences-group>`) - typically used within `<adw-preferences-dialog>`.

## Contributing

(Information about contributing to Adwaita-Web development or its documentation can be added here in the future.)

---

We hope this documentation helps you build beautiful and consistent web applications with Adwaita-Web!

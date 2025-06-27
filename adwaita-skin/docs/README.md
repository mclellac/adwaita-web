# Adwaita-Web Documentation

Welcome to the official documentation for Adwaita-Web, a UI framework for bringing the Adwaita design language to web applications.

This documentation provides guidance on how to use the various components, understand the theming system, and leverage the JavaScript API and Web Components provided by the library.

## Core Concepts

Before diving into individual widgets, it's helpful to understand the foundational aspects of Adwaita-Web:

*   **[Introduction](./general/README.md)**: What Adwaita-Web is, key features, and how to quickly get started by including it in your project.
*   **[Theming](./general/theming.md)**: Learn about the light and dark themes, accent color customization, and the underlying CSS variable system.
*   **[JavaScript API (`Adw` Object)](./general/javascript-api.md)**: Understand how to programmatically create and manage Adwaita widgets using the global `Adw` object and its factory functions.
*   **[Web Components](./general/web-components.md)**: Discover how to use Adwaita widgets declaratively in your HTML using custom elements like `<adw-button>`.

## Widget Documentation

Explore the detailed documentation for each available widget. Each page covers the JavaScript factory function, Web Component usage, attributes, properties, events, slots, and styling information.

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

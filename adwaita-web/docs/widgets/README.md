# Adwaita Skin - Styled HTML Elements

This section provides documentation for applying Adwaita Skin CSS classes to standard HTML elements to achieve the appearance of various Adwaita widgets. Each page aims to detail the necessary HTML structure and the specific CSS classes required.

**Important Note:** This documentation is currently being updated to reflect the pure CSS nature of Adwaita Skin. Many of the individual pages listed below may still contain outdated information referring to JavaScript APIs or Web Components, which are no longer part of Adwaita Skin.

For the most accurate and current usage, especially for pages not yet explicitly updated:
1.  Refer to the HTML structure and CSS classes used in the example files in the `adwaita-web/examples/` directory.
2.  Consult the SCSS files in `adwaita-web/scss/` to understand how styles are defined and which classes are available (e.g., `_button.scss`, `_listbox.scss`).

Adwaita Skin is a **pure CSS library**. All interactivity must be implemented using your own JavaScript. The documentation will focus on the HTML and CSS needed for styling.

## Available Widgets

*   **Actions & Input:**
    *   [Button](./button.md): A clickable button for actions.
    *   [ToggleButton](./togglebutton.md): A button with an on/off state.
    *   [ToggleGroup](./togglegroup.md): A group of toggle buttons where only one can be active.
    *   [SplitButton](./splitbutton.md): A button with a main action and a dropdown for secondary actions.
    *   [Entry](./entry.md): A single-line text input field.
    *   [Checkbox](./checkbox.md): A standard checkbox.
    *   [RadioButton](./radiobutton.md): A radio button, typically used in groups.
    *   [SpinButton](./spinbutton.md): An input for numerical values with increment/decrement buttons.

*   **Display & Information:**
    *   [Label](./label.md): For displaying static text, including styled titles, body, and captions.
    *   [Avatar](./avatar.md): Displays a user image or initials.
    *   [ProgressBar](./progressbar.md): Shows the progress of an operation.
    *   [Spinner](./spinner.md): An animated indicator for ongoing processes.
    *   [StatusPage](./statuspage.md): For empty states, errors, or informational messages.
    *   [Toast](./toast.md): A small, temporary notification message. (JS-only)
    *   [Banner](./banner.md): An inline notification banner.

*   **Layout & Containers:**
    *   [Window (ApplicationWindow)](./window.md): The main application window container.
    *   [HeaderBar](./headerbar.md): The title bar for a window or view.
    *   [Box](./box.md): A flexbox container for horizontal or vertical layout.
    *   [Bin](./bin.md): A simple container for a single child element.
    *   [WrapBox](./wrapbox.md): Arranges children in a line, wrapping as needed.
    *   [Clamp](./clamp.md): Constrains its child's width to a maximum size.
    *   [ToolbarView](./toolbarview.md): A layout with optional top and bottom toolbars around a main content area.

*   **Navigation & Views:**
    *   [ViewSwitcher](./viewswitcher.md): Buttons to switch between different views.
    *   [TabView, TabBar, TabButton, TabPage](./tabview.md): A tabbed interface for managing multiple pages.
    *   [NavigationView](./navigationview.md): Manages a stack of views with push/pop navigation.
    *   [Flap](./flap.md): A container with a collapsible/expandable side panel.
    *   [NavigationSplitView](./navigationsplitview.md): A master-detail view with a collapsible sidebar.
    *   [OverlaySplitView](./overlaysplitview.md): A master-detail view where the sidebar always overlays content.
    *   [BottomSheet](./bottomsheet.md): A sheet that slides up from the bottom, typically for contextual actions.
    *   [Carousel](./carousel.md): Displays a series of slides.
    *   [BreakpointBin](./breakpointbin.md): Shows different children based on container width.

*   **Rows & Lists:**
    *   [Row](./row.md): A generic row container, often used in ListBoxes.
    *   [ListBox](./listbox.md): A container for a list of rows.
    *   [ActionRow](./actionrow.md): A row for actions, often with a title, subtitle, and chevron.
    *   [EntryRow](./entryrow.md): A row combining a label with a text entry.
    *   [PasswordEntryRow](./passwordentryrow.md): A specialized entry row for passwords.
    *   [ExpanderRow](./expanderrow.md): A row that can expand to show more content.
    *   [SwitchRow](./switchrow.md): A row combining a label with a switch toggle.
    *   [ComboRow](./comborow.md): A row combining a label with a dropdown select.
    *   [SpinRow](./spinrow.md): A row combining a label with a spin button.
    *   [ButtonRow](./buttonrow.md): A row designed to hold one or more buttons.

*   **Dialogs:**
    *   [Dialog](./dialog.md): A generic modal dialog.
    *   [AlertDialog](./alertdialog.md): A dialog for alerts and simple confirmations.
    *   [AboutDialog](./aboutdialog.md): A dialog to display application information.
    *   [PreferencesDialog](./preferencesdialog.md): A dialog for application preferences, typically with multiple pages.

---
Back to: [Main Documentation](../README.md) | [Core Concepts](../general/README.md)

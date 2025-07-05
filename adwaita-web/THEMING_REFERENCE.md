# Adwaita Skin Theming Reference

This document outlines the CSS Custom Properties provided by Adwaita Skin for theming, aiming to align with Libadwaita 1.8.beta.
All color definitions are managed in `scss/_variables.scss`.

## Themes

Adwaita Skin supports a **light theme** (default) and a **dark theme**. The dark theme is activated by adding the class `theme-dark` to a root HTML element (e.g., `<html>` or `<body>`).

## Core UI Colors

These variables define the primary colors for different UI states and elements. They change between light and dark themes.

### Accent Colors
Used for interactive elements, selections, and to highlight important actions. The default accent is **Blue**.
To change the active accent color, apply a class like `.accent-green`, `.accent-red`, etc., to a root element.

*   `--accent-bg-color`: Background color for accented elements (e.g., suggested action buttons, selected list rows).
    *   Default (Blue): `#3584e4` (Light & Dark)
*   `--accent-fg-color`: Foreground color (text/icons) on top of `--accent-bg-color`.
    *   Default (Blue): `#ffffff` (Light & Dark)
*   `--accent-color`: Standalone accent color, typically for text or icons on a neutral background (e.g., flat suggested button text, focused entry border).
    *   Default (Blue, Light Theme): `#0461be`
    *   Default (Blue, Dark Theme): `#81d0ff`

**Available Accent Classes (apply to `html` or `body`):**
`.accent-blue`, `.accent-teal`, `.accent-green`, `.accent-yellow`, `.accent-orange`, `.accent-red`, `.accent-pink`, `.accent-purple`, `.accent-slate`. Each class updates the three `--accent-*` variables above to their respective color values for the current theme (light/dark).

### Destructive Colors
Used for actions that indicate a potentially dangerous operation (e.g., deleting).

*   `--destructive-bg-color`: Background for destructive action elements.
    *   Light: `#e01b24`
    *   Dark: `#c01c28`
*   `--destructive-fg-color`: Foreground on destructive backgrounds.
    *   Light & Dark: `#ffffff`
*   `--destructive-color`: Standalone destructive color (text/icons on neutral background).
    *   Light: `#c30000`
    *   Dark: `#ff938c`

### Success Colors
Used to indicate a successful operation.

*   `--success-bg-color`: Background for success elements.
    *   Light: `#2ec27e`
    *   Dark: `#26a269`
*   `--success-fg-color`: Foreground on success backgrounds.
    *   Light & Dark: `#ffffff`
*   `--success-color`: Standalone success color.
    *   Light: `#007c3d`
    *   Dark: `#78e9ab`

### Warning Colors
Used to indicate a warning.

*   `--warning-bg-color`: Background for warning elements.
    *   Light: `#e5a50a`
    *   Dark: `#cd9309`
*   `--warning-fg-color`: Foreground on warning backgrounds.
    *   Light & Dark: `rgb(0 0 0 / 80%)` (Dark text)
*   `--warning-color`: Standalone warning color.
    *   Light: `#905400`
    *   Dark: `#ffc252`

### Error Colors
Used to indicate an error. Often similar to destructive colors.

*   `--error-bg-color`: Background for error elements.
    *   Light: `#e01b24`
    *   Dark: `#c01c28`
*   `--error-fg-color`: Foreground on error backgrounds.
    *   Light & Dark: `#ffffff`
*   `--error-color`: Standalone error color.
    *   Light: `#c30000`
    *   Dark: `#ff938c`

## UI Surface Colors

These variables define colors for various UI surfaces and regions.

### Window Colors
*   `--window-bg-color`: Main application window background.
    *   Light: `#fafafb`
    *   Dark: `#222226`
*   `--window-fg-color`: Default foreground (text) color on window backgrounds.
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`

### View Colors
Used for main content areas within windows (e.g., text views, list box backgrounds if not carded).
*   `--view-bg-color`:
    *   Light: `#ffffff`
    *   Dark: `#1d1d20`
*   `--view-fg-color`: Default foreground on view backgrounds.
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`

### Header Bar Colors
Used for `AdwHeaderBar` and similar top/bottom bars in `AdwToolbarView`.
*   `--headerbar-bg-color`:
    *   Light: `#ffffff`
    *   Dark: `#2e2e32`
*   `--headerbar-fg-color`: Foreground (text/icons) on header bars.
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--headerbar-border-color`: Border color for elements within header bars (e.g., separators).
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--headerbar-backdrop-color`: Background when the window is unfocused.
    *   Light: `#fafafb` (Same as `--window-bg-color`)
    *   Dark: `#222226` (Same as `--window-bg-color`)
*   `--headerbar-shade-color`: Subtle bottom border/shadow for header bars.
    *   Light: `rgb(0 0 6 / 12%)`
    *   Dark: `rgb(0 0 6 / 36%)`
*   `--headerbar-darker-shade-color`: Darker border/shadow (e.g., for `ADW_TOOLBAR_RAISED_BORDER`).
    *   Light: `rgb(0 0 6 / 12%)` (Note: Libadwaita seems to use same as normal shade for light)
    *   Dark: `rgb(0 0 6 / 90%)`

### Sidebar Colors
Used for sidebars in `AdwNavigationSplitView`, `AdwOverlaySplitView`.
*   `--sidebar-bg-color`:
    *   Light: `#ebebed`
    *   Dark: `#2e2e32`
*   `--sidebar-fg-color`:
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--sidebar-backdrop-color`: Background when window is unfocused.
    *   Light: `#f2f2f4`
    *   Dark: `#28282c`
*   `--sidebar-border-color`: Border separating sidebar from content.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 36%)`
*   `--sidebar-shade-color`: Scroll undershoots and transitions within sidebars.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 25%)`

### Secondary Sidebar Colors
Used for middle panes in triple-pane layouts.
*   `--secondary-sidebar-bg-color`:
    *   Light: `#f3f3f5`
    *   Dark: `#28282c`
*   `--secondary-sidebar-fg-color`: (Usually same as `--window-fg-color`)
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--secondary-sidebar-backdrop-color`: Background when window is unfocused.
    *   Light: `#f6f6fa`
    *   Dark: `#252529`
*   `--secondary-sidebar-border-color`: Border separating secondary sidebar.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 36%)`
*   `--secondary-sidebar-shade-color`: Scroll undershoots and transitions.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 25%)`

### Card Colors
Used for `.card` styled elements and `.boxed-list` list boxes.
*   `--card-bg-color`:
    *   Light: `#ffffff`
    *   Dark: `rgb(255 255 255 / 8%)`
*   `--card-fg-color`: Foreground (text) on cards.
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--card-shade-color`: Separators in boxed lists or inner border effect.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 36%)`

### Dialog Colors
*   `--dialog-bg-color`:
    *   Light: `#fafafb`
    *   Dark: `#36363a`
*   `--dialog-fg-color`:
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--dialog-backdrop-color`: Overlay color behind dialogs.
    *   Default: `rgba(0,0,0,0.4)`
*   `--dialog-box-shadow`: Shadow for dialogs.
    *   Light: `0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)`
    *   Dark: (Uses same definition, effect differs on dark backdrop)

### Popover Colors
*   `--popover-bg-color`:
    *   Light: `#ffffff`
    *   Dark: `#36363a`
*   `--popover-fg-color`: (Usually same as `--window-fg-color`)
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--popover-shade-color`: Used for arrow border or undershoots within popovers.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 25%)`
*   `--popover-box-shadow`: Shadow for popovers.
    *   Light: `0 2px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)`
    *   Dark: `0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.25)`

### Other UI Colors
*   `--active-toggle-bg-color`: Background for active toggles in `AdwToggleGroup`.
    *   Light: `#ffffff`
    *   Dark: `rgb(255 255 255 / 20%)`
*   `--active-toggle-fg-color`: Foreground for active toggles.
    *   Light: `rgb(0 0 6 / 80%)`
    *   Dark: `#ffffff`
*   `--overview-bg-color`, `--overview-fg-color`: For `AdwTabOverview`.
*   `--thumbnail-bg-color`, `--thumbnail-fg-color`: For tab thumbnails in `AdwTabOverview`.
*   `--shade-color`: General subtle shade, e.g., for scroll undershoots.
    *   Light: `rgb(0 0 6 / 7%)`
    *   Dark: `rgb(0 0 6 / 25%)`
*   `--scrollbar-outline-color`: For overlay scrollbars.
    *   Light: `#ffffff`
    *   Dark: `rgb(0 0 6 / 50%)`
*   `--progress-bar-track-color`: Background of progress bar track. (Defaults to `--shade-color`)
*   `--progress-bar-fill-color`: Fill color of progress bar. (Defaults to `--accent-bg-color`)
*   `--spinner-color`: Color of the active part of a spinner. (Defaults to `--accent-color`)
*   `--spinner-track-color`: Color of the inactive part of a spinner. (Defaults to `--shade-color`)
*   `--expander-content-bg-color`: Background for the content area of an `AdwExpanderRow`. (Defaults to `var(--view-bg-color)`)
*   `--pill-button-border-radius`: Border radius for pill-shaped buttons/groups (e.g., `100px`).

### Row & List Styling Variables
These are primarily used by the `row-base` mixin and row components like `AdwActionRow`.
*   `--primary-fg-color`: Default primary text color for row content (defaults to `var(--window-fg-color)`).
*   `--secondary-fg-color`: Color for secondary text (subtitles, dimmed icons) in rows (derived from `var(--window-fg-color-rgb)` and `var(--dim-opacity)`).
*   `--icon-opacity`: Default opacity for less prominent icons like chevrons (e.g., `0.7`).
*   `--row-padding-vertical-default`: Default vertical padding for rows (e.g., `10px`).
*   `--row-padding-horizontal-default`: Default horizontal padding for rows (e.g., `var(--spacing-m)`).
*   `--row-min-height`: Default minimum height for rows (e.g., `48px`).
*   `--row-bg-color`: Default background color for rows (often `transparent`).
*   `--row-fg-color`: Default foreground color for rows (defaults to `var(--primary-fg-color)`).
*   `--row-border-radius`: Default border radius for interactive elements within rows (defaults to `var(--border-radius-small)`).
*   `--list-row-selected-bg-color`: Background for selected rows (defaults to `var(--accent-bg-color)`).
*   `--list-row-selected-fg-color`: Foreground for selected rows (defaults to `var(--accent-fg-color)`).
*   `--list-row-hover-bg-color`: Background for hovered rows.
*   `--list-row-active-bg-color`: Background for activated/pressed rows.
*   `--list-separator-color`: Color for separators between rows in a default listbox.

### Toast Variables
*   `--toast-bg-color`: Background color for toasts (e.g., a dark neutral color like `var(--dark-3)`).
*   `--toast-fg-color`: Foreground (text) color for toasts (e.g., a light color like `var(--light-1)`).
*   `--toast-secondary-fg-color`: Color for secondary elements in toasts (e.g., `rgba(var(--light-1), 0.7)`).
*   `--toast-accent-color`: Accent color used for actions within toasts (defaults to `var(--accent-color)`).
*   `--toast-box-shadow`: Box shadow for toasts (defaults to `var(--popover-box-shadow-dark)`).
*   `--toast-max-width`: Maximum width of toasts (e.g., `400px`).
*   `--toast-min-height`: Minimum height of toasts (e.g., `36px`).
*   `--toast-border-radius`: Border radius for toasts (defaults to `var(--border-radius-large)`).

## Fonts
*   `--document-font-family`: Default sans-serif font stack.
*   `--document-font-size`: Default base font size (e.g., `10pt`).
*   `--monospace-font-family`: Default monospace font stack.
*   `--monospace-font-size`: Default base font size for monospace.
*   Typography scale variables used by utility classes like `.title-1`, etc.:
    *   `--font-size-base`, `--font-size-small`, `--font-size-large`
    *   `--title-1-font-size`, `--title-2-font-size`, `--title-3-font-size`, `--title-4-font-size`

## Helper Variables
These are used internally and can be leveraged for custom styling.
*   `--border-opacity`: Opacity used with `currentColor` to derive `--border-color`.
    *   Default: `0.15`
*   `--dim-opacity`: Opacity for dimmed/secondary text or elements.
    *   Default: `0.55`
*   `--disabled-opacity`: Opacity for disabled elements.
    *   Default: `0.5`
*   `--border-color`: Dynamically calculated border color: `color-mix(in srgb, currentColor var(--border-opacity), transparent)`.
*   `--window-radius`: Default radius for windows and dialogs (e.g., `15px`).
*   `--border-radius-default`, `--border-radius-small`, `--border-radius-medium`, `--border-radius-large`: Standard border radii.
*   `--border-width`: Default border width (e.g., `1px`).
*   `--focus-ring-width`: Width of focus rings (e.g., `2px`).
*   `--focus-ring-color`: Color of focus rings (defaults to `var(--accent-color)`).
*   `--focus-outline-offset`: Default offset for focus rings on rows (e.g., `-2px`).
*   Spacing variables: `--spacing-xxs` (3px) to `--spacing-xxl` (36px).
*   Icon sizes: `--icon-size-base` (16px), `--icon-size-large` (20px), `--icon-size-small` (14px).

## Animation Variables
*   `--animation-duration-shortest`: e.g., `100ms`
*   `--animation-duration-short`: e.g., `150ms`
*   `--animation-duration-medium`: e.g., `250ms`
*   `--animation-duration-long`: e.g., `400ms`
*   `--animation-ease-out-cubic`: `cubic-bezier(0.215, 0.610, 0.355, 1.000)`
*   `--animation-ease-in-out-cubic`: `cubic-bezier(0.645, 0.045, 0.355, 1.000)`
*   `--animation-ease-in-cubic`: `cubic-bezier(0.550, 0.055, 0.675, 0.190)`
*   `--animation-ease-out-sine`: `cubic-bezier(0.390, 0.575, 0.565, 1.000)`

## GNOME Color Palette
The full GNOME color palette (e.g., `--blue-1` to `--blue-5`, `--green-1` to `--green-5`, etc.) is also available as CSS custom properties for direct use. Refer to `scss/_variables.scss` or Libadwaita documentation for the full list.

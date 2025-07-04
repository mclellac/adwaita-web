# Adwaita Web Theming Reference

This document outlines the canonical color values used in Adwaita theming, which `adwaita-web` aims to replicate. These serve as a reference for development and contributions.

All color definitions are managed via SASS variables and CSS Custom Properties in `scss/_variables.scss`.

## Light Theme

Key principle: The overall window is a very light grey, with pure white elements (like cards, rows, buttons, inputs) on top of it. Sidebars are typically a shade between the window background and pure white.

| Element Semantic Name     | Target Hex Value | Notes                                                        | Corresponding SCSS/CSS Variable (Primary)      |
|---------------------------|------------------|--------------------------------------------------------------|------------------------------------------------|
| Window Background         | `#fafafb`        | Main application background.                                 | `$adw-window-background-light`, `--window-bg-color` |
| View Background           | `#fafafb`        | Background for larger content areas like listbox backdrops.    | `--view-bg-color` (derived from `$adwaita-window-background-light`) |
| Widget Background         | `#ffffff`        | Buttons, Entries, List Rows (on views), Cards.               | `$adw-light-1`, `--button-bg-color`, `--input-bg-color`, `--list-row-bg-color`, `--card-bg-color` (often defaults to `--window-bg-color` but should be white for cards on `#fafafb` views) |
| Headerbar Background      | `#fafafb`        | Usually matches window background.                           | `$headerbar-background-color-light` (derived from `$adw-window-background-light`) |
| Sidebar Background        | `#f2f2f2`        | Slightly darker than window, lighter than some old Adwaita elements. | `$adw-sidebar-background-light`, `--sidebar-bg-color` |
| Text (Primary)            | `rgba(0,0,0,0.8)`| Dark grey, not pure black.                                 | `$text-color-light`, `--text-color`             |
| Text (Secondary)          | `rgba(0,0,0,0.55)`| Lighter grey for subtitles, less important text.             | `$text-color-secondary-light`, `--text-color-secondary` |
| Borders/Dividers          | `rgba(0,0,0,0.15)` for general borders, `rgba(0,0,0,0.1)` for dividers | Subtle dark lines.                                           | `$border-color-light`, `$divider-color-light`, `--border-color`, `--divider-color` |
| Accent Color (Default)    | `$adw-blue-3` (`#3584e4`) | Default accent for selections, focus rings.                | `--accent-bg-color` (bg), `--accent-color` (fg/border) |
| Listbox/Popover Shadow    | complex          | Subtle, multi-layered shadow.                                | `--listbox-box-shadow` (see `_variables.scss`)   |

_Note on Card Backgrounds_: While individual cards are `#ffffff`, if a view area itself is styled like a card (e.g. a preferences page), that view area would be `#fafafb`. The term "Card" here refers to distinct card elements placed *within* a view or window. The `adwaita-web` library's general `.adw-card` in `_box.scss` defaults its `--card-bg-color` to `var(--window-bg-color)`. For the app-demo, specific card components like `.blog-content-card` correctly use this when the window background is `#fafafb`. If a card is meant to be pure white, it should explicitly set its background to `$adwaita-light-1` or the equivalent CSS var. Currently, the app-demo cards will correctly pick up the intended pure white via `--list-row-bg-color` or by being on `--window-bg-color` if the view itself isn't distinct. This might need refinement if cards are placed directly on the main window background and are expected to be white. For now, the primary target is that elements *on* a view (like rows) or distinct interactive elements (buttons, inputs) are pure white.

## Dark Theme

Key principle: Dark grey backgrounds with slightly lighter grey surfaces for interactive elements or content areas.

| Element Semantic Name     | Target Hex Value | Notes                                                        | Corresponding SCSS/CSS Variable (Primary)      |
|---------------------------|------------------|--------------------------------------------------------------|------------------------------------------------|
| Window Background         | `#242424`        | Main application background.                                 | `$background-color-dark`, `--window-bg-color`    |
| View Background           | `#303030`        | Background for larger content areas like listbox backdrops. Usually matches headerbar. | `--view-bg-color` (derived from `$headerbar-background-color-dark`) |
| Widget Background         | `#3d3846`        | Buttons, Entries, List Rows (on views).                      | `$adw-dark-3`, `--button-bg-color`, `--input-bg-color`, `--list-row-bg-color` |
| Headerbar Background      | `#303030`        |                                                              | `$headerbar-background-color-dark`             |
| Sidebar Background        | `#303030`        | Usually matches headerbar or view background.                | `--sidebar-bg-color` (derived from `$headerbar-background-color-dark`) |
| Text (Primary)            | `#eeeeec` or `rgba(255,255,255,0.87)` | Very light grey, not pure white for body text. Pure white for titles. | `$text-color-dark` (uses `$adw-light-1`), `--text-color` |
| Text (Secondary)          | `rgba(255,255,255,0.7)` |                                                              | `$text-color-secondary-dark`, `--text-color-secondary` |
| Borders/Dividers          | `rgba(255,255,255,0.15)` for general borders, `rgba(255,255,255,0.1)` for dividers | Subtle light lines.                                          | `$border-color-dark`, `$divider-color-dark`, `--border-color`, `--divider-color` |
| Accent Color (Default)    | `$adw-blue-3` (`#3584e4`) for bg, `$adw-blue-2` (`#62a0ea`) for fg/border | Default accent for selections, focus rings.                | `--accent-bg-color` (bg), `--accent-color` (fg/border) |
| Listbox/Popover Shadow    | complex          | Subtle, multi-layered shadow adapted for dark theme.         | `--listbox-box-shadow` (see `_variables.scss`)   |

This document should be updated as more specific color decisions are made or if official Adwaita guidelines provide more explicit mappings for web usage.Tool output for `create_file_with_block`:

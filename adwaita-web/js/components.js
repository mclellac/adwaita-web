// Main Adwaita Web component aggregator

// Utilities
import * as utils from './components/utils.js';

// Components
import * as button from './components/button.js';
import * as headerBar from './components/header_bar.js';
import * as dialog from './components/dialog.js';
import * as forms from './components/forms.js';
import * as rows from './components/rows.js';
import * as misc from './components/misc.js';
import * as controls from './components/controls.js';
import * as views from './components/views.js'; // This includes Tab, Navigation, Toolbar views etc.
import * as layouts from './components/layouts.js'; // Added import for layouts
import * as listbox from './components/listbox.js'; // Import AdwListBox
import * as bottomSheet from './components/bottom_sheet.js'; // Import AdwBottomSheet
import * as popover from './components/popover.js'; // Import AdwPopover (new)

// Theme and Accent functions are in utils, already exported from there.
// adwGenerateId is also in utils.

// Ensure Adw and Adw.config objects exist, then merge in defaults.
window.Adw = window.Adw || {};
window.Adw.config = window.Adw.config || {};

const defaultConfig = {
    cssPath: '/static/css/adwaita-web.css', // This will only be used if not set by user HTML
    iconBasePath: '/data/icons/symbolic/' // Default for icons if not set by user.
};

// Merge defaults without overwriting existing values provided by user (e.g., in index.html)
for (const key in defaultConfig) {
    if (window.Adw.config[key] === undefined) {
        window.Adw.config[key] = defaultConfig[key];
    }
}

const AdwProperties = { // Renamed to avoid conflict with global Adw during construction
    // Utilities
    adwGenerateId: utils.adwGenerateId,
    toggleTheme: utils.toggleTheme,
    getAccentColors: utils.getAccentColors,
    setAccentColor: utils.setAccentColor,
    DEFAULT_ACCENT_COLOR: utils.DEFAULT_ACCENT_COLOR,
    loadSavedTheme: utils.loadSavedTheme, // Already attached to DOMContentLoaded in utils.js

    // Component Factory Functions
    createButton: button.createAdwButton,
    createHeaderBar: headerBar.createAdwHeaderBar,
    // Dialogs
    createDialog: dialog.createAdwDialog,
    createAlertDialog: dialog.createAdwAlertDialog,
    createAboutDialog: dialog.createAdwAboutDialog,
    createPreferencesDialog: dialog.createAdwPreferencesDialog,
    // Forms
    createEntry: forms.createAdwEntry,
    createSpinButton: forms.createAdwSpinButton,
    // Rows
    createRow: rows.createAdwRow,
    createActionRow: rows.createAdwActionRow,
    createEntryRow: rows.createAdwEntryRow,
    createPasswordEntryRow: rows.createAdwPasswordEntryRow,
    createExpanderRow: rows.createAdwExpanderRow,
    createComboRow: rows.createAdwComboRow,
    createSpinRow: rows.createAdwSpinRow,
    createButtonRow: rows.createAdwButtonRow,
    // Misc
    createLabel: misc.createAdwLabel,
    createAvatar: misc.createAdwAvatar,
    createSpinner: misc.createAdwSpinner,
    createStatusPage: misc.createAdwStatusPage,
    createProgressBar: misc.createAdwProgressBar,
    createToast: misc.createAdwToast,
    createBanner: misc.createAdwBanner, // Renamed from createAdwBanner in original global
    createIcon: misc.createAdwIcon, // Add Icon factory
    // No factory for AdwToastOverlay, it's meant to be used declaratively or via getElementById
    // Controls
    createSwitch: controls.createAdwSwitch,
    createCheckbox: controls.createAdwCheckbox,
    createRadioButton: controls.createAdwRadioButton,
    createSplitButton: controls.createAdwSplitButton,
    createToggleButton: controls.createAdwToggleButton,
    createToggleGroup: controls.createAdwToggleGroup,
    // Layouts & Views (from layouts.js and views.js)
    createBox: layouts.createAdwBox, // Corrected: from layouts.js
    createWindow: layouts.createAdwWindow, // Corrected: from layouts.js
    createFlap: layouts.createAdwFlap, // Corrected: from layouts.js
    createBin: layouts.createAdwBin, // Corrected: from layouts.js
    createWrapBox: layouts.createAdwWrapBox, // Corrected: from layouts.js
    createClamp: layouts.createAdwClamp, // Corrected: from layouts.js
    createBreakpointBin: layouts.createAdwBreakpointBin, // Corrected: from layouts.js
    createListBox: listbox.createAdwListBox, // Add ListBox factory
    createViewSwitcher: views.createAdwViewSwitcher,
    createToolbarView: views.createAdwToolbarView,
    createCarousel: views.createAdwCarousel, // Renamed createAdwCarousel to createCarousel
    createNavigationSplitView: views.createAdwNavigationSplitView,
    createOverlaySplitView: views.createAdwOverlaySplitView,
    createTabView: views.createAdwTabView,
    createTabBar: views.createAdwTabBar, // If these were separate in original Adw obj
    createTabPage: views.createAdwTabPage,
    createNavigationView: views.createAdwNavigationView,
    createBottomSheet: bottomSheet.createAdwBottomSheet, // Factory for AdwBottomSheet
    createPopover: popover.createAdwPopover, // Factory for AdwPopover (new)

    // Theme utilities now include the main applicator
    applyFinalThemeAndAccent: utils.applyFinalThemeAndAccent,


    // Web Component Classes (for direct use or inspection if needed)
    Button: button.AdwButton,
    HeaderBar: headerBar.AdwHeaderBar,
    WindowTitle: headerBar.AdwWindowTitle,
    Dialog: dialog.AdwDialog,
    AlertDialog: dialog.AdwAlertDialog,
    AboutDialog: dialog.AdwAboutDialog,
    PreferencesDialog: dialog.AdwPreferencesDialog,
    Entry: forms.AdwEntry,
    SpinButton: forms.AdwSpinButton,
    Row: rows.AdwRow,
    ActionRow: rows.AdwActionRow,
    EntryRow: rows.AdwEntryRow,
    PasswordEntryRow: rows.AdwPasswordEntryRow,
    ExpanderRow: rows.AdwExpanderRow,
    ComboRow: rows.AdwComboRow,
    SpinRow: rows.AdwSpinRow,
    ButtonRow: rows.AdwButtonRow,
    Label: misc.AdwLabel,
    Avatar: misc.AdwAvatar,
    Spinner: misc.AdwSpinner,
    StatusPage: misc.AdwStatusPage,
    ProgressBar: misc.AdwProgressBar,
    Toast: misc.AdwToast, // Data provider Web Component
    ToastOverlay: misc.AdwToastOverlay, // The actual overlay manager
    Banner: misc.AdwBanner, // Web component might not be necessary
    Icon: misc.AdwIcon, // Add Icon Web Component Class
    PreferencesView: misc.AdwPreferencesView,
    PreferencesPage: misc.AdwPreferencesPage,
    PreferencesGroup: misc.AdwPreferencesGroup,
    Switch: controls.AdwSwitch,
    Checkbox: controls.AdwCheckbox,
    RadioButton: controls.AdwRadioButton,
    SplitButton: controls.AdwSplitButton,
    ToggleButton: controls.AdwToggleButton,
    ToggleGroup: controls.AdwToggleGroup,
    // Layouts from layouts.js
    Box: layouts.AdwBox,
    ApplicationWindow: layouts.AdwApplicationWindow,
    Flap: layouts.AdwFlap,
    Bin: layouts.AdwBin,
    WrapBox: layouts.AdwWrapBox,
    Clamp: layouts.AdwClamp,
    BreakpointBin: layouts.AdwBreakpointBin,
    ListBox: listbox.AdwListBox, // Add ListBox Web Component Class
    // Views from views.js
    ViewSwitcher: views.AdwViewSwitcher,
    ToolbarView: views.AdwToolbarView,
    Carousel: views.AdwCarousel, // Renamed AdwCarousel to Carousel
    NavigationSplitView: views.AdwNavigationSplitView,
    OverlaySplitView: views.AdwOverlaySplitView,
    TabView: views.AdwTabView,
    TabBar: views.AdwTabBar,
    TabPage: views.AdwTabPage,
    NavigationView: views.AdwNavigationView,
    BottomSheet: bottomSheet.AdwBottomSheet,
    Popover: popover.AdwPopover, // Web Component Class for AdwPopover (new)
};

// Merge other Adw properties into window.Adw, being careful not to overwrite config again
for (const key in AdwProperties) {
    // No need to check for 'config' here as AdwProperties doesn't have it.
    window.Adw[key] = AdwProperties[key];
}

// Ensure Adw.config is part of the final window.Adw if it somehow got detached.
// This is belt-and-suspenders; the initial window.Adw.config setup should be sufficient.
if (!window.Adw.config) {
    // This case should ideally not be hit if index.html and the top part of this script run correctly.
    console.warn("Adw.config was unexpectedly missing, re-applying defaults.");
    window.Adw.config = defaultConfig;
}


// Define all custom elements
// Use window.Adw directly now as it's fully populated.
if (typeof customElements !== 'undefined') {
    // From button.js
    if (!customElements.get('adw-button')) customElements.define('adw-button', window.Adw.Button);
    // From header_bar.js
    if (!customElements.get('adw-header-bar')) customElements.define('adw-header-bar', window.Adw.HeaderBar);
    if (!customElements.get('adw-window-title')) customElements.define('adw-window-title', window.Adw.WindowTitle);
    // From dialog.js
    if (!customElements.get('adw-dialog')) customElements.define('adw-dialog', window.Adw.Dialog);
    if (!customElements.get('adw-alert-dialog')) customElements.define('adw-alert-dialog', window.Adw.AlertDialog);
    if (!customElements.get('adw-about-dialog')) customElements.define('adw-about-dialog', window.Adw.AboutDialog);
    if (!customElements.get('adw-preferences-dialog')) customElements.define('adw-preferences-dialog', window.Adw.PreferencesDialog);
    // From forms.js
    if (!customElements.get('adw-entry')) customElements.define('adw-entry', window.Adw.Entry);
    if (!customElements.get('adw-spin-button')) customElements.define('adw-spin-button', window.Adw.SpinButton);
    // From rows.js
    if (!customElements.get('adw-row')) customElements.define('adw-row', window.Adw.Row);
    if (!customElements.get('adw-action-row')) customElements.define('adw-action-row', window.Adw.ActionRow);
    if (!customElements.get('adw-entry-row')) customElements.define('adw-entry-row', window.Adw.EntryRow);
    if (!customElements.get('adw-password-entry-row')) customElements.define('adw-password-entry-row', window.Adw.PasswordEntryRow);
    if (!customElements.get('adw-expander-row')) customElements.define('adw-expander-row', window.Adw.ExpanderRow);
    if (!customElements.get('adw-combo-row')) customElements.define('adw-combo-row', window.Adw.ComboRow);
    if (!customElements.get('adw-spin-row')) customElements.define('adw-spin-row', window.Adw.SpinRow);
    if (!customElements.get('adw-button-row')) customElements.define('adw-button-row', window.Adw.ButtonRow);
    // From misc.js
    if (!customElements.get('adw-label')) customElements.define('adw-label', window.Adw.Label);
    if (!customElements.get('adw-avatar')) customElements.define('adw-avatar', window.Adw.Avatar);
    if (!customElements.get('adw-spinner')) customElements.define('adw-spinner', window.Adw.Spinner);
    if (!customElements.get('adw-status-page')) customElements.define('adw-status-page', window.Adw.StatusPage);
    if (!customElements.get('adw-progress-bar')) customElements.define('adw-progress-bar', window.Adw.ProgressBar);
    if (!customElements.get('adw-toast')) customElements.define('adw-toast', window.Adw.Toast); // Data provider
    if (!customElements.get('adw-toast-overlay')) customElements.define('adw-toast-overlay', window.Adw.ToastOverlay); // Manager
    if (!customElements.get('adw-banner')) customElements.define('adw-banner', window.Adw.Banner);
    if (!customElements.get('adw-preferences-view')) customElements.define('adw-preferences-view', window.Adw.PreferencesView);
    if (!customElements.get('adw-preferences-page')) customElements.define('adw-preferences-page', window.Adw.PreferencesPage);
    if (!customElements.get('adw-preferences-group')) customElements.define('adw-preferences-group', window.Adw.PreferencesGroup);
    if (!customElements.get('adw-icon')) customElements.define('adw-icon', window.Adw.Icon); // Register AdwIcon
    // From controls.js
    if (!customElements.get('adw-switch')) customElements.define('adw-switch', window.Adw.Switch);
    if (!customElements.get('adw-checkbox')) customElements.define('adw-checkbox', window.Adw.Checkbox);
    if (!customElements.get('adw-radio-button')) customElements.define('adw-radio-button', window.Adw.RadioButton);
    if (!customElements.get('adw-split-button')) customElements.define('adw-split-button', window.Adw.SplitButton);
    if (!customElements.get('adw-toggle-button')) customElements.define('adw-toggle-button', window.Adw.ToggleButton);
    if (!customElements.get('adw-toggle-group')) customElements.define('adw-toggle-group', window.Adw.ToggleGroup);
    // From layouts.js
    if (!customElements.get('adw-box')) customElements.define('adw-box', window.Adw.Box);
    if (!customElements.get('adw-application-window')) customElements.define('adw-application-window', window.Adw.ApplicationWindow);
    if (!customElements.get('adw-flap')) customElements.define('adw-flap', window.Adw.Flap);
    if (!customElements.get('adw-bin')) customElements.define('adw-bin', window.Adw.Bin);
    if (!customElements.get('adw-wrap-box')) customElements.define('adw-wrap-box', window.Adw.WrapBox);
    if (!customElements.get('adw-clamp')) customElements.define('adw-clamp', window.Adw.Clamp);
    if (!customElements.get('adw-breakpoint-bin')) customElements.define('adw-breakpoint-bin', window.Adw.BreakpointBin);
    // From listbox.js
    if (!customElements.get('adw-list-box')) customElements.define('adw-list-box', window.Adw.ListBox);
    // From views.js
    if (!customElements.get('adw-view-switcher')) customElements.define('adw-view-switcher', window.Adw.ViewSwitcher);
    if (!customElements.get('adw-toolbar-view')) customElements.define('adw-toolbar-view', window.Adw.ToolbarView);
    if (!customElements.get('adw-carousel')) customElements.define('adw-carousel', window.Adw.Carousel);
    if (!customElements.get('adw-navigation-split-view')) customElements.define('adw-navigation-split-view', window.Adw.NavigationSplitView);
    if (!customElements.get('adw-overlay-split-view')) customElements.define('adw-overlay-split-view', window.Adw.OverlaySplitView);
    if (!customElements.get('adw-tab-view')) customElements.define('adw-tab-view', window.Adw.TabView);
    if (!customElements.get('adw-tab-bar')) customElements.define('adw-tab-bar', window.Adw.TabBar);
    if (!customElements.get('adw-tab-page')) customElements.define('adw-tab-page', window.Adw.TabPage);
    if (!customElements.get('adw-navigation-view')) customElements.define('adw-navigation-view', window.Adw.NavigationView);
    if (!customElements.get('adw-bottom-sheet')) customElements.define('adw-bottom-sheet', window.Adw.BottomSheet);
    // From popover.js (new)
    if (!customElements.get('adw-popover')) customElements.define('adw-popover', window.Adw.Popover);
}

console.log('[Debug] Adw object populated and custom elements defined.');

// Apply the final theme and accent color once the Adw object is ready and DOM is likely parsed.
// Using DOMContentLoaded ensures body.dataset is available for DB preferences.
if (document.readyState === 'loading') { // DOMContentLoaded or after
    window.addEventListener('DOMContentLoaded', Adw.applyFinalThemeAndAccent);
} else { // `DOMContentLoaded` already fired
    Adw.applyFinalThemeAndAccent();
}

console.log('[Debug] components.js execution ended, theme/accent application scheduled/run.');

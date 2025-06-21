console.log('[Debug] adw-initializer.js execution started');
document.addEventListener('DOMContentLoaded', () => {
  if (!window.Adw) {
    console.error('Adw components library not loaded. Make sure components.js is included before this initializer.');
    return;
  }

  // AdwButton, AdwHeaderBar, AdwDialog are now proper Web Components.
  // Their initialization logic is handled by their `connectedCallback` and attribute observation.
  // The adw-initializer.js no longer needs to manually process and replace these tags.

  // The following components are now full Web Components defined in components.js.
  // The browser will handle their upgrade. The initializer should not replace them:
  // - adw-preferences-view
  // - adw-preferences-page
  // - adw-preferences-group
  // - adw-list-box
  // - adw-action-row
  // - adw-entry-row
  // - adw-expander-row
  // - adw-password-entry-row
  // - adw-switch-row
  // - adw-combo-row
  // - adw-view-switcher (now a Web Component, see components/views.js and components.js)
  // - adw-split-button (now a Web Component)
  // - adw-dialog (now a Web Component)
  // - adw-spinner (now a Web Component)
  // - adw-status-page (now a Web Component)
  // - adw-application-window (now a Web Component)

  // Most components that were previously initialized here are now Web Components.
  // Their initialization is handled by their respective class definitions and
  // the `customElements.define` calls in `js/components.js`.

  // The `adw-page` tag, if still used, should be styled directly via CSS
  // or be part of a larger Web Component like `adw-application-window`.
  // The generic replacement logic for `adw-page` has been removed.

  // Helper functions like `moveChildren`, `collectSlotElements`, `getAttributes`
  // have been removed as their callers were removed.

  console.log('Adw-initializer: All relevant components are now Web Components. Initializer script has minimal work.');
});

console.log('[Debug] adw-initializer.js execution started');
document.addEventListener('DOMContentLoaded', () => {
  if (!window.Adw) {
    console.error('Adw components library not loaded. Make sure components.js is included before this initializer.');
    return;
  }

  function moveChildren(source, destination) {
    while (source.firstChild) {
      destination.appendChild(source.firstChild);
    }
  }

  function collectSlotElements(parentElement, slotName) {
    const elements = [];
    Array.from(parentElement.children).forEach(child => {
      if (child.getAttribute('slot') === slotName) {
        elements.push(child.cloneNode(true)); // Clone to avoid issues if original is mutated elsewhere
      }
    });
    return elements;
  }

  function getAttributes(element) {
    const attrs = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // AdwButton, AdwHeaderBar, AdwDialog are now proper Web Components.
  // Their initialization logic is handled by their `connectedCallback` and attribute observation.
  // The adw-initializer.js no longer needs to manually process and replace these tags.

  // The following components are now full Web Components defined in components.js.
  // The browser will handle their upgrade. The initializer should not replace them.
  // (Note: AdwDialog was previously here, now removed from explicit init)
  // - adw-preferences-view
  // - adw-preferences-page
  // - adw-preferences-group
  // - adw-list-box
  // - adw-action-row // AdwActionRow is a WC, its factory might be used by others.
  // - adw-entry-row // AdwEntryRow is a WC
  // - adw-expander-row // AdwExpanderRow is a WC
  // - adw-password-entry-row // AdwPasswordEntryRow is a WC
  // - adw-switch-row // AdwSwitchRow is a WC
  // - adw-combo-row // AdwComboRow is a WC

  // Retain initializers for components that are NOT yet full Web Components
  // or require specific initialization logic beyond custom element upgrade.
  // For example, AdwViewSwitcher might still benefit from factory-based initialization
  // if its Web Component definition is not fully self-sufficient from Light DOM.

  document.querySelectorAll('adw-view-switcher').forEach(viewSwitcherElement => {
    const options = {
      views: [],
      activeViewName: viewSwitcherElement.getAttribute('active-view-name') || null
    };
    const originalAttrs = getAttributes(viewSwitcherElement);

    Array.from(viewSwitcherElement.children).forEach(childElement => {
      if (childElement.hasAttribute('data-view-name')) {
        options.views.push({
          name: childElement.getAttribute('data-view-name'),
          content: childElement // Pass the live element, factory might move it or use its content
        });
      } else {
        console.warn("Child element in adw-view-switcher is missing 'data-view-name' attribute:", childElement);
      }
    });
    // Children might be moved by createAdwViewSwitcher. If it clones, then original children need to be removed before replaceWith.
    // Assuming factory handles moving/removing original children as needed.

    const newViewSwitcher = window.Adw.createViewSwitcher(options);
    for (const attrName in originalAttrs) {
      if (!['active-view-name', 'class'].includes(attrName) && !newViewSwitcher.hasAttribute(attrName)) {
        newViewSwitcher.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newViewSwitcher.className += ' ' + originalAttrs[attrName]; // Append original classes
      }
    }
    viewSwitcherElement.replaceWith(newViewSwitcher);
  });

  // AdwSplitButton is now a Web Component and handles its own initialization.
  // The adw-initializer.js should not manually process adw-split-button tags.

  // AdwDialog is now a Web Component and handles its own initialization.
  // The adw-initializer.js should not manually process adw-dialog tags.

  // AdwSpinner is now a Web Component.
  // AdwStatusPage is now a Web Component.

  // --- GENERIC HANDLERS (SHOULD BE LAST OR CAREFUL WITH SPECIFICITY) ---
  const simpleReplaceTags = ['adw-page']; // adw-application-window is now a proper WC
  simpleReplaceTags.forEach(tagName => {
    document.querySelectorAll(tagName).forEach(element => {
      if (element.closest('.adw-expander-row-content')) return;

      const div = document.createElement('div');
      const originalAttrs = getAttributes(element);

      let className = tagName.toLowerCase();
      if(originalAttrs.class){
        className += ' ' + originalAttrs.class;
      }
      div.className = className;

      for(const attrName in originalAttrs) {
        if (attrName !== 'class') {
          div.setAttribute(attrName, originalAttrs[attrName]);
        }
      }
      moveChildren(element, div);
      element.replaceWith(div);
    });
  });

  console.log('Adw-initializer finished processing custom tags.');
});

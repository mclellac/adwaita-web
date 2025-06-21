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

  document.querySelectorAll('adw-button').forEach(buttonElement => {
    const text = buttonElement.textContent;
    const options = {};
    const originalAttrs = getAttributes(buttonElement);

    options.suggested = buttonElement.getAttribute('appearance') === 'suggested';
    options.destructive = buttonElement.getAttribute('appearance') === 'destructive';
    options.flat = buttonElement.hasAttribute('flat');
    options.disabled = buttonElement.hasAttribute('disabled');
    options.active = buttonElement.hasAttribute('active');
    options.isCircular = buttonElement.hasAttribute('circular');

    if (originalAttrs.href) {
      options.href = originalAttrs.href;
    }

    if (originalAttrs.icon) {
        options.icon = originalAttrs.icon;
    } else {
        const iconSlot = collectSlotElements(buttonElement, 'icon');
        if (iconSlot.length > 0 && iconSlot[0].innerHTML) {
            options.icon = iconSlot[0].innerHTML;
        }
    }

    const newButton = window.Adw.createButton(text.trim(), options);
    for (const attrName in originalAttrs) {
        if (!['appearance', 'href', 'flat', 'disabled', 'active', 'circular', 'icon', 'slot'].includes(attrName) && !newButton.hasAttribute(attrName)) {
            newButton.setAttribute(attrName, originalAttrs[attrName]);
        }
    }
    buttonElement.replaceWith(newButton);
  });

  document.querySelectorAll('adw-header-bar').forEach(headerBarElement => {
    const options = {
      start: [],
      end: []
    };
    let titleText = '';
    let subtitleText = '';

    Array.from(headerBarElement.children).forEach(child => {
      const slot = child.getAttribute('slot');
      let processedChild = null;

      if (child.matches('adw-window-title') || slot === 'title') {
        titleText = child.textContent;
        if(child.hasAttribute('subtitle')) {
            subtitleText = child.getAttribute('subtitle');
        }
        return;
      }

      // Process adw-buttons specifically to ensure they are Adw.Buttons
      if (child.tagName.toLowerCase() === 'adw-button') {
        const buttonOriginalAttrs = getAttributes(child);
        const buttonText = child.textContent;
        const buttonOpts = {
            href: child.getAttribute('href'),
            suggested: child.getAttribute('appearance') === 'suggested',
            destructive: child.getAttribute('appearance') === 'destructive',
            flat: child.hasAttribute('flat'),
            isCircular: child.hasAttribute('circular')
        };
        if (buttonOriginalAttrs.icon) {
            buttonOpts.icon = buttonOriginalAttrs.icon;
        } else {
            const iconChild = child.querySelector('[slot="icon"]');
            if (iconChild) buttonOpts.icon = iconChild.innerHTML;
        }
        processedChild = window.Adw.createButton(buttonText.trim(), buttonOpts);
        for (const attrName in buttonOriginalAttrs) {
            if (!['appearance', 'href', 'flat', 'circular', 'icon', 'slot'].includes(attrName) && !processedChild.hasAttribute(attrName)) {
                processedChild.setAttribute(attrName, buttonOriginalAttrs[attrName]);
            }
        }
      } else {
        processedChild = child.cloneNode(true);
      }

      if (slot === 'start') {
        options.start.push(processedChild);
      } else if (slot === 'end') {
        options.end.push(processedChild);
      }
    });

    if(titleText) options.title = titleText;
    if(subtitleText) options.subtitle = subtitleText;

    const newHeaderBar = window.Adw.createHeaderBar(options);
    const originalAttrs = getAttributes(headerBarElement);
    for (const attrName in originalAttrs) {
        if (!newHeaderBar.hasAttribute(attrName)) { // Avoid overwriting attributes set by createHeaderBar
            newHeaderBar.setAttribute(attrName, originalAttrs[attrName]);
        }
    }
    headerBarElement.replaceWith(newHeaderBar);
  });

  // The following components are now full Web Components defined in components.js.
  // The browser will handle their upgrade. The initializer should not replace them.
  // - adw-preferences-view
  // - adw-preferences-page
  // - adw-preferences-group
  // - adw-list-box
  // - adw-action-row
  // - adw-entry-row
  // - adw-expander-row
  // - adw-password-entry-row
  // - adw-switch-row (newly added to components.js)
  // - adw-combo-row (newly added to components.js)

  // Retain initializers for components that are NOT yet full Web Components
  // or require specific initialization logic beyond custom element upgrade.

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
          content: childElement
        });
      } else {
        console.warn("Child element in adw-view-switcher is missing 'data-view-name' attribute:", childElement);
      }
    });
    // Children are moved by createAdwViewSwitcher, so no need to remove them from original element explicitly before replaceWith

    const newViewSwitcher = window.Adw.createViewSwitcher(options);
    for (const attrName in originalAttrs) {
      if (!['active-view-name', 'class'].includes(attrName) && !newViewSwitcher.hasAttribute(attrName)) {
        newViewSwitcher.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newViewSwitcher.className += ' ' + originalAttrs[attrName];
      }
    }
    viewSwitcherElement.replaceWith(newViewSwitcher);
  });

  document.querySelectorAll('adw-split-button').forEach(splitButtonElement => {
    const options = {
      actionText: splitButtonElement.textContent.trim() || splitButtonElement.getAttribute('action-text'),
      actionHref: splitButtonElement.getAttribute('action-href'),
      suggested: splitButtonElement.getAttribute('appearance') === 'suggested',
      disabled: splitButtonElement.hasAttribute('disabled'),
      id: splitButtonElement.getAttribute('id'),
      dropdownAriaLabel: splitButtonElement.getAttribute('dropdown-label') || "More options"
      // onActionClick and onDropdownClick are not set from attributes here
    };
    const originalAttrs = getAttributes(splitButtonElement);

    const actionTextSlot = collectSlotElements(splitButtonElement, 'action-text');
    if (actionTextSlot.length > 0 && actionTextSlot[0].textContent) {
      options.actionText = actionTextSlot[0].textContent.trim();
    }

    const newSplitButton = window.Adw.createSplitButton(options);

    for (const attrName in originalAttrs) {
      if (!['action-text', 'action-href', 'appearance', 'disabled', 'id', 'dropdown-label', 'class', 'slot'].includes(attrName) && !newSplitButton.hasAttribute(attrName)) {
        newSplitButton.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
           newSplitButton.classList.add(...originalAttrs[attrName].split(' ').filter(Boolean));
      }
    }
    while (splitButtonElement.firstChild) {
      splitButtonElement.removeChild(splitButtonElement.firstChild);
    }
    splitButtonElement.replaceWith(newSplitButton);
  });

  document.querySelectorAll('adw-dialog').forEach(adwDialogElement => {
    const title = adwDialogElement.getAttribute('title');
    const id = adwDialogElement.id;

    let contentInput;
    const contentSlotElement = adwDialogElement.querySelector('[slot="content"]');
    if (contentSlotElement) {
        const contentWrapper = document.createElement('div');
        Array.from(contentSlotElement.childNodes).forEach(child => contentWrapper.appendChild(child.cloneNode(true)));
        contentInput = contentWrapper;
    } else {
        // Fallback: use text content if no slot="content"
        const tempDiv = document.createElement('div');
        Array.from(adwDialogElement.childNodes).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE && child.getAttribute('slot') === 'actions') {
            } else {
                tempDiv.appendChild(child.cloneNode(true));
            }
        });
        if (tempDiv.innerHTML.trim() !== '') {
            contentInput = tempDiv;
        } else {
            contentInput = document.createElement('p');
        }
    }

    const actionButtonElements = Array.from(adwDialogElement.querySelectorAll('[slot="actions"] > adw-button, [slot="actions"] > button'));
    const buttons = actionButtonElements.map(btnEl => {
        const btnOptions = {
            suggested: btnEl.getAttribute('appearance') === 'suggested' || btnEl.classList.contains('suggested-action'),
            destructive: btnEl.getAttribute('appearance') === 'destructive' || btnEl.classList.contains('destructive-action'),
            flat: btnEl.hasAttribute('flat') || btnEl.getAttribute('appearance') === 'flat',
            // onClick handlers are set by the script using the dialog.
        };
        const newBtn = Adw.createButton(btnEl.textContent.trim(), btnOptions);
        if(btnEl.id) newBtn.id = btnEl.id;
        if(btnEl.getAttribute('type')) newBtn.setAttribute('type', btnEl.getAttribute('type'));
        return newBtn;
    });

    const dialogComponent = Adw.createDialog({ title, content: contentInput, buttons });

    if (id) {
        dialogComponent.dialog.id = id;
    }

    // Make methods available on the DOM element itself
    dialogComponent.dialog.showModal = dialogComponent.open;
    dialogComponent.dialog.close = dialogComponent.close;

    adwDialogElement.replaceWith(dialogComponent.dialog);
  });

  document.querySelectorAll('adw-spinner').forEach(adwSpinnerElement => {
    const options = {
      size: adwSpinnerElement.getAttribute('size'),
      id: adwSpinnerElement.id
    };
    const newSpinner = Adw.createSpinner(options);
    // createSpinner returns the element directly, so if id was set via options, it's on newSpinner.
    // If not, ensure it's copied if it was on the original tag.
    if (options.id && !newSpinner.id) {
        newSpinner.id = options.id;
    }
    const originalAttrs = getAttributes(adwSpinnerElement);
    for (const attrName in originalAttrs) {
        if (!['size', 'id', 'class'].includes(attrName) && !newSpinner.hasAttribute(attrName)) {
            newSpinner.setAttribute(attrName, originalAttrs[attrName]);
        } else if (attrName === 'class') {
            newSpinner.className += ' ' + originalAttrs[attrName];
        }
    }
    adwSpinnerElement.replaceWith(newSpinner);
  });

  document.querySelectorAll('adw-status-page').forEach(adwStatusPageElement => {
    const iconSlotElement = adwStatusPageElement.querySelector('[slot="icon"]');
    const iconHTML = iconSlotElement ? iconSlotElement.innerHTML : undefined;

    const actionElementsSlot = adwStatusPageElement.querySelector('[slot="actions"]');
    let actionElements = [];
    if (actionElementsSlot) {
        actionElements = Array.from(actionElementsSlot.children).map(el => el.cloneNode(true));
    }

    const options = {
      title: adwStatusPageElement.getAttribute('title'),
      description: adwStatusPageElement.getAttribute('description'),
      iconHTML: iconHTML,
      actions: actionElements,
      id: adwStatusPageElement.id
    };

    const newStatusPage = Adw.createStatusPage(options);
    // createStatusPage returns the element directly. Ensure ID is preserved.
    if (options.id && !newStatusPage.id) {
        newStatusPage.id = options.id;
    }
    const originalAttrs = getAttributes(adwStatusPageElement);
     for (const attrName in originalAttrs) {
        if (!['title', 'description', 'id', 'class'].includes(attrName) && !newStatusPage.hasAttribute(attrName) && attrName !== 'slot') {
            newStatusPage.setAttribute(attrName, originalAttrs[attrName]);
        } else if (attrName === 'class') {
            newStatusPage.className += ' ' + originalAttrs[attrName];
        }
    }
    adwStatusPageElement.replaceWith(newStatusPage);
  });

  // --- GENERIC HANDLERS (SHOULD BE LAST OR CAREFUL WITH SPECIFICITY) ---
  const simpleReplaceTags = ['adw-application-window', 'adw-page'];
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

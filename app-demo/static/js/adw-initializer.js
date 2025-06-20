document.addEventListener('DOMContentLoaded', () => {
  if (!window.Adw) {
    console.error('Adw components library not loaded. Make sure components.js is included before this initializer.');
    return;
  }

  // Helper function to move children
  function moveChildren(source, destination) {
    while (source.firstChild) {
      destination.appendChild(source.firstChild);
    }
  }

  // Helper function to collect slot elements
  function collectSlotElements(parentElement, slotName) {
    const elements = [];
    // Direct children with slot attribute
    Array.from(parentElement.children).forEach(child => {
      if (child.getAttribute('slot') === slotName) {
        elements.push(child.cloneNode(true)); // Clone to avoid issues if original is mutated elsewhere
      }
    });
    return elements;
  }

  // Helper function to get all attributes as an object
  function getAttributes(element) {
    const attrs = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // Handle <adw-button>
  document.querySelectorAll('adw-button').forEach(buttonElement => {
    const text = buttonElement.textContent; // Assuming text is direct content
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

    // Icon handling
    if (originalAttrs.icon) { // If 'icon' attribute provides a class name or path
        options.icon = originalAttrs.icon;
    } else { // Check for slotted icon element
        const iconSlot = collectSlotElements(buttonElement, 'icon');
        if (iconSlot.length > 0 && iconSlot[0].innerHTML) {
            options.icon = iconSlot[0].innerHTML; // Pass SVG string or content of slot
        }
    }

    const newButton = window.Adw.createButton(text.trim(), options);
    // Copy over any other attributes that might be relevant
    for (const attrName in originalAttrs) {
        if (!['appearance', 'href', 'flat', 'disabled', 'active', 'circular', 'icon', 'slot'].includes(attrName) && !newButton.hasAttribute(attrName)) {
            newButton.setAttribute(attrName, originalAttrs[attrName]);
        }
    }
    buttonElement.replaceWith(newButton);
  });

  // Handle <adw-header-bar>
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
        return; // Don't add title element to start/end slots
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
            const iconChild = child.querySelector('[slot="icon"]'); // Check for direct child with slot="icon"
            if (iconChild) buttonOpts.icon = iconChild.innerHTML;
        }
        processedChild = window.Adw.createButton(buttonText.trim(), buttonOpts);
        // Copy remaining attributes from the original adw-button tag
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
      } else {
        // If no slot, and not title, default to end or start? Or ignore?
        // For now, elements without a slot (and not title) are not explicitly added.
        // console.warn("Child in adw-header-bar without 'start', 'end', or 'title' slot:", child);
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

  // Handle <adw-preferences-page>
  document.querySelectorAll('adw-preferences-page').forEach(prefPageElement => {
    const div = document.createElement('div');
    div.className = 'adw-preferences-page';
    const originalAttrs = getAttributes(prefPageElement);
    for (const attrName in originalAttrs) {
        if (attrName !== 'class') div.setAttribute(attrName, originalAttrs[attrName]);
        else div.className += ' ' + originalAttrs[attrName];
    }
    moveChildren(prefPageElement, div);
    prefPageElement.replaceWith(div);
  });

  // Handle <adw-preferences-group>
  document.querySelectorAll('adw-preferences-group').forEach(prefGroupElement => {
    const div = document.createElement('div');
    div.className = 'adw-preferences-group';
    const originalAttrs = getAttributes(prefGroupElement);
     for (const attrName in originalAttrs) {
        if (attrName !== 'class' && attrName !== 'title') div.setAttribute(attrName, originalAttrs[attrName]);
        else if (attrName === 'class') div.className += ' ' + originalAttrs[attrName];
    }

    if (prefGroupElement.hasAttribute('title')) {
      const titleElement = document.createElement('div');
      titleElement.className = 'adw-preferences-group-title';
      titleElement.textContent = prefGroupElement.getAttribute('title');
      div.appendChild(titleElement);
    }
    moveChildren(prefGroupElement, div);
    prefGroupElement.replaceWith(div);
  });

  // --- NEW HANDLERS START HERE ---

  // Handle <adw-list-box>
  document.querySelectorAll('adw-list-box').forEach(listBoxElement => {
    const options = {
      isFlat: listBoxElement.hasAttribute('flat'),
      selectable: listBoxElement.hasAttribute('selectable'),
      children: []
    };

    // Children of adw-list-box are expected to be adw-action-row, adw-entry-row etc.
    // These should be processed by their respective handlers *before* this list-box handler
    // if they are defined as custom tags. If they are already processed into Adw components,
    // then they can be moved directly.
    // For robustness, we might need to ensure processing order or re-process here.
    // For now, assume children are either standard elements or already processed custom elements.
    while (listBoxElement.firstChild) {
      options.children.push(listBoxElement.firstChild);
    }

    const newListBox = window.Adw.createListBox(options);
    const originalAttrs = getAttributes(listBoxElement);
    for (const attrName in originalAttrs) {
      if (!['flat', 'selectable', 'class'].includes(attrName) && !newListBox.hasAttribute(attrName)) {
        newListBox.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newListBox.className += ' ' + originalAttrs[attrName];
      }
    }
    listBoxElement.replaceWith(newListBox);
  });

  // Handle <adw-action-row>
  document.querySelectorAll('adw-action-row').forEach(actionRowElement => {
    const options = {
      title: actionRowElement.getAttribute('title') || '',
      subtitle: actionRowElement.getAttribute('subtitle'),
      // iconHTML, onClick, showChevron are handled below
    };
    const originalAttrs = getAttributes(actionRowElement);

    const iconSlot = collectSlotElements(actionRowElement, 'icon');
    if (iconSlot.length > 0 && iconSlot[0].innerHTML) {
      options.iconHTML = iconSlot[0].innerHTML;
    }

    const href = actionRowElement.getAttribute('href');
    if (href) {
      options.onClick = () => { window.location.href = href; };
    }

    options.showChevron = actionRowElement.getAttribute('show-chevron') !== "false";
    // Adw.createActionRow's logic: showChevron is true by default if onClick is present.
    // If show-chevron="false", it will be false. If show-chevron="true", it's true.

    const newActionRow = window.Adw.createActionRow(options);
    // Copy common attributes, let createActionRow handle its specific ones.
    for (const attrName in originalAttrs) {
      if (!['title', 'subtitle', 'href', 'show-chevron', 'slot', 'class', 'icon'].includes(attrName) && !newActionRow.hasAttribute(attrName)) {
         newActionRow.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newActionRow.className += ' ' + originalAttrs[attrName];
      }
    }
    if (originalAttrs.hasOwnProperty('activated')) { // Adw.createActionRow returns a row; apply state classes
        newActionRow.classList.add('activated');
    }
    // 'interactive' is implicitly handled by Adw.createRow if onClick is set.

    actionRowElement.replaceWith(newActionRow);
  });

  // Handle <adw-entry-row>
  document.querySelectorAll('adw-entry-row').forEach(entryRowElement => {
    const options = {
      title: entryRowElement.getAttribute('title') || '',
      entryOptions: {}
    };
    const originalAttrs = getAttributes(entryRowElement);

    const inputElement = entryRowElement.querySelector('input, textarea');
    if (inputElement) {
      const inputAttrs = getAttributes(inputElement);
      options.entryOptions = { ...inputAttrs }; // Clone all attributes from the input/textarea
       // id might be important for label 'for' attribute, ensure createEntryRow handles this or pass it.
      if(inputAttrs.id) options.entryOptions.id = inputAttrs.id;
      inputElement.remove();
    } else {
        // If no input is provided, Adw.createEntry will create a default one.
        // We can still pass attributes from the adw-entry-row itself if they are meant for the input.
        for(const key in originalAttrs){
            if(['placeholder', 'value', 'name', 'type', 'id', 'disabled', 'required'].includes(key)){
                options.entryOptions[key] = originalAttrs[key];
            }
        }
    }

    options.labelForEntry = entryRowElement.getAttribute('label-for-entry') !== "false";


    const newEntryRow = window.Adw.createEntryRow(options);
    for (const attrName in originalAttrs) {
      if (!['title', 'class'].includes(attrName) && !options.entryOptions.hasOwnProperty(attrName) && !newEntryRow.hasAttribute(attrName)) {
        newEntryRow.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newEntryRow.className += ' ' + originalAttrs[attrName];
      }
    }
    entryRowElement.replaceWith(newEntryRow);
  });

  // Handle <adw-expander-row>
  document.querySelectorAll('adw-expander-row').forEach(expanderRowElement => {
    const options = {
      title: expanderRowElement.getAttribute('title') || '',
      subtitle: expanderRowElement.getAttribute('subtitle'),
      expanded: expanderRowElement.hasAttribute('expanded')
    };
    const originalAttrs = getAttributes(expanderRowElement);

    const contentWrapper = document.createElement('div');
    // Any children not matching specific slots for title/subtitle/icon for the row part itself
    // are considered content for the expander.
    // The createExpanderRow component expects a single 'content' element.
    moveChildren(expanderRowElement, contentWrapper);
    options.content = contentWrapper;

    const newExpanderRow = window.Adw.createExpanderRow(options); // This returns a wrapper
    for (const attrName in originalAttrs) {
      if (!['title', 'subtitle', 'expanded', 'class'].includes(attrName) && !newExpanderRow.hasAttribute(attrName)) {
        newExpanderRow.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newExpanderRow.element.className += ' ' + originalAttrs[attrName]; // createExpanderRow returns {element: ...}
      }
    }
    expanderRowElement.replaceWith(newExpanderRow.element);
  });

  // Handle <adw-password-entry-row>
  document.querySelectorAll('adw-password-entry-row').forEach(passwordEntryRowElement => {
    const options = {
      title: passwordEntryRowElement.getAttribute('title') || 'Password',
      entryOptions: {}
    };
    const originalAttrs = getAttributes(passwordEntryRowElement);

    // Collect common input attributes from the <adw-password-entry-row> tag itself
    // These will be passed to the Adw.createEntry within createAdwPasswordEntryRow
    const commonInputAttrs = ['name', 'placeholder', 'value', 'id', 'required', 'disabled'];
    commonInputAttrs.forEach(attr => {
      if (passwordEntryRowElement.hasAttribute(attr)) {
        options.entryOptions[attr] = passwordEntryRowElement.getAttribute(attr);
      }
    });
     if (passwordEntryRowElement.hasAttribute('required')) {
        options.entryOptions.required = true;
    }
    if (passwordEntryRowElement.hasAttribute('disabled')) {
        options.entryOptions.disabled = true;
    }


    options.labelForEntry = passwordEntryRowElement.getAttribute('label-for-entry') !== "false";

    const newPasswordEntryRow = window.Adw.createAdwPasswordEntryRow(options);
    // Apply any remaining attributes from the original custom tag to the new row element
    for (const attrName in originalAttrs) {
      if (!['title', 'class', ...commonInputAttrs, 'label-for-entry'].includes(attrName) && !newPasswordEntryRow.hasAttribute(attrName)) {
        newPasswordEntryRow.setAttribute(attrName, originalAttrs[attrName]);
      } else if (attrName === 'class') {
        newPasswordEntryRow.className += ' ' + originalAttrs[attrName];
      }
    }
    passwordEntryRowElement.replaceWith(newPasswordEntryRow);
  });

  // Handle <adw-view-switcher>
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
          content: childElement // Pass the element itself as content
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

  // Handle <adw-split-button>
  document.querySelectorAll('adw-split-button').forEach(splitButtonElement => {
    const options = {
      actionText: splitButtonElement.textContent.trim() || splitButtonElement.getAttribute('action-text'),
      actionHref: splitButtonElement.getAttribute('action-href'), // Added action-href
      suggested: splitButtonElement.getAttribute('appearance') === 'suggested',
      disabled: splitButtonElement.hasAttribute('disabled'),
      id: splitButtonElement.getAttribute('id'),
      dropdownAriaLabel: splitButtonElement.getAttribute('dropdown-label') || "More options"
      // onActionClick and onDropdownClick are not set from attributes here
    };
    const originalAttrs = getAttributes(splitButtonElement);

    // If there's a specific element for action text via slot="action-text"
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
    // Clear original content as it's reconstructed or specified via attributes
    while (splitButtonElement.firstChild) {
      splitButtonElement.removeChild(splitButtonElement.firstChild);
    }
    splitButtonElement.replaceWith(newSplitButton);
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

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
    const text = buttonElement.textContent;
    const options = {};
    if (buttonElement.getAttribute('appearance') === 'suggested') {
      options.suggested = true;
    }
    if (buttonElement.getAttribute('appearance') === 'destructive') {
      options.destructive = true;
    }
    if (buttonElement.getAttribute('href')) {
      options.href = buttonElement.getAttribute('href');
    }
    // Add any other attribute mappings here, e.g., for flat, disabled, active, icon

    const newButton = window.Adw.createButton(text, options);
    // Copy over any other attributes that might be relevant (e.g., id, custom data-*)
    const originalAttrs = getAttributes(buttonElement);
    for (const attrName in originalAttrs) {
        if (attrName !== 'appearance' && attrName !== 'href' && !newButton.hasAttribute(attrName)) {
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

    // Collect slotted elements and title
    Array.from(headerBarElement.children).forEach(child => {
      if (child.matches('adw-window-title') || child.getAttribute('slot') === 'title') {
        titleText = child.textContent;
      } else if (child.getAttribute('slot') === 'start') {
        // If the child is an adw-button that hasn't been processed yet, process it now
        if (child.tagName.toLowerCase() === 'adw-button') {
          const buttonText = child.textContent;
          const buttonOpts = {};
          if (child.getAttribute('appearance') === 'suggested') buttonOpts.suggested = true;
          if (child.getAttribute('appearance') === 'destructive') buttonOpts.destructive = true;
          if (child.getAttribute('href')) buttonOpts.href = child.getAttribute('href');
          options.start.push(window.Adw.createButton(buttonText, buttonOpts));
        } else {
          options.start.push(child.cloneNode(true)); // Keep other elements as they are
        }
      } else if (child.getAttribute('slot') === 'end') {
         if (child.tagName.toLowerCase() === 'adw-button') {
          const buttonText = child.textContent;
          const buttonOpts = {};
          if (child.getAttribute('appearance') === 'suggested') buttonOpts.suggested = true;
          if (child.getAttribute('appearance') === 'destructive') buttonOpts.destructive = true;
          if (child.getAttribute('href')) buttonOpts.href = child.getAttribute('href');
          options.end.push(window.Adw.createButton(buttonText, buttonOpts));
        } else {
          options.end.push(child.cloneNode(true));
        }
      }
    });
    if(titleText) options.title = titleText;

    const newHeaderBar = window.Adw.createHeaderBar(options);
    headerBarElement.replaceWith(newHeaderBar);
  });

  // Handle <adw-preferences-page>
  document.querySelectorAll('adw-preferences-page').forEach(prefPageElement => {
    const div = document.createElement('div');
    div.className = 'adw-preferences-page'; // From SCSS
    moveChildren(prefPageElement, div);
    prefPageElement.replaceWith(div);
  });

  // Handle <adw-preferences-group>
  document.querySelectorAll('adw-preferences-group').forEach(prefGroupElement => {
    const div = document.createElement('div');
    div.className = 'adw-preferences-group'; // From SCSS
    if (prefGroupElement.hasAttribute('title')) {
      const titleElement = document.createElement('div'); // Or h2, h3 based on styling
      titleElement.className = 'adw-preferences-group-title'; // Assuming a class for styling
      titleElement.textContent = prefGroupElement.getAttribute('title');
      div.appendChild(titleElement);
    }
    moveChildren(prefGroupElement, div);
    prefGroupElement.replaceWith(div);
  });

  // Generic handler for simple tag replacement to div with class
  const simpleReplaceTags = ['adw-application-window', 'adw-page'];
  simpleReplaceTags.forEach(tagName => {
    document.querySelectorAll(tagName).forEach(element => {
      const div = document.createElement('div');
      div.className = tagName.toLowerCase(); // e.g., adw-application-window
      // Copy attributes
      for(let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name !== 'class') { // class is set above
          div.setAttribute(attr.name, attr.value);
        } else {
          div.className += ' ' + attr.value; // Append existing classes
        }
      }
      moveChildren(element, div);
      element.replaceWith(div);
    });
  });

  console.log('Adw-initializer finished.');
});

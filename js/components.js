// js/components.js

function createAdwButton(text, options = {}) {
  const button = document.createElement(options.href ? 'a' : 'button');
  button.classList.add('adw-button');
  button.textContent = text;

  if (options.href) {
      button.href = options.href;
  }
  if (options.onClick) {
      button.addEventListener('click', options.onClick);
  }
    if(options.suggested){
        button.classList.add('suggested-action');
    }
  if (options.destructive) {
      button.classList.add('destructive');
  }
    if (options.flat){
        button.classList.add('flat')
    }
  if (options.disabled) {
      button.setAttribute('disabled', '');
  }
  if (options.active) {
      button.classList.add('active');
  }

  return button;
}

// AdwEntry
function createAdwEntry(options = {}) {
  const entry = document.createElement('input');
  entry.type = 'text';
  entry.classList.add('adw-entry');

  if (options.placeholder) {
      entry.placeholder = options.placeholder;
  }
  if (options.value) {
      entry.value = options.value;
  }
  if (options.onInput) {
      entry.addEventListener('input', options.onInput);
  }
  if (options.disabled) {
      entry.setAttribute('disabled', '');
  }
  return entry;
}

// AdwSwitch
function createAdwSwitch(options = {}) {
  const wrapper = document.createElement('label');
  wrapper.classList.add('adw-switch');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('role', 'switch'); // For accessibility
  input.addEventListener('change', options.onChanged);

  const slider = document.createElement('span');
  slider.classList.add('adw-switch-slider');

  wrapper.appendChild(input);
  wrapper.appendChild(slider);

  if (options.checked) {
      input.checked = true;
  }
  if (options.disabled) {
      input.setAttribute('disabled', '');
  }
  return wrapper;
}

// AdwLabel
function createAdwLabel(text, options = {}) {
  const label = document.createElement('label'); //Could also be a span, depending on usage.
  label.classList.add('adw-label');
  label.textContent = text;
  if (options.for) {
      label.setAttribute('for', options.for);
  }
    if(options.title){
        label.classList.add(`title-${options.title}`);
    }
    if(options.isBody){
        label.classList.add('body');
    }
    if(options.isCaption){
        label.classList.add('caption')
    }
  return label;
}

// AdwHeaderBar
function createAdwHeaderBar(options = {}) {
    const headerBar = document.createElement('header');
    headerBar.classList.add('adw-header-bar');

    const startBox = document.createElement('div');
    startBox.classList.add('adw-header-bar-start');
    options.start?.forEach(el => startBox.appendChild(el));

    const centerBox = document.createElement('div');
    centerBox.classList.add('adw-header-bar-center-box');

    if (options.title) {
        const title = document.createElement('h1');
        title.classList.add("adw-header-bar-title");
        title.textContent = options.title;
        centerBox.appendChild(title);
    }
    if(options.subtitle){
        const subtitle = document.createElement('h2');
        subtitle.classList.add('adw-header-bar-subtitle');
        subtitle.textContent = options.subtitle;
        centerBox.appendChild(subtitle);
    }

    const endBox = document.createElement('div');
    endBox.classList.add('adw-header-bar-end');
    options.end?.forEach(el => endBox.appendChild(el));

    headerBar.appendChild(startBox);
    headerBar.appendChild(centerBox);
    headerBar.appendChild(endBox);

    return headerBar;
}

// AdwWindow
function createAdwWindow(options = {}) {
  const windowEl = document.createElement('div');
  windowEl.classList.add('adw-window');
  if(options.header){
    windowEl.appendChild(options.header);
  }
  const content = document.createElement('main');
  content.classList.add('adw-window-content');
    content.appendChild(options.content);

  windowEl.appendChild(content);
  return windowEl;
}

// AdwBox
function createAdwBox(options = {}) {
  const box = document.createElement('div');
  box.classList.add('adw-box');
  if (options.orientation === 'vertical') {
      box.classList.add('adw-box-vertical');
  }
  options.children?.forEach(child => box.appendChild(child));
  return box;
}

// AdwRow (For use inside an AdwBox with vertical orientation, or AdwListBox)
function createAdwRow(options = {}) {
  const row = document.createElement('div');
  row.classList.add('adw-row');
  options.children?.forEach(child => row.appendChild(child));
    if(options.activated){
        row.classList.add('activated')
    }
  return row;
}

// AdwToast
function createAdwToast(text, options = {}) {
    const toast = document.createElement('div');
    toast.classList.add('adw-toast');
    toast.textContent = text;

    if (options.button) {
        toast.appendChild(options.button); //Allow a button to be added
    }
    if (options.timeout) {
       setTimeout(() => {
           toast.classList.add('fade-out')
           setTimeout(()=>{
               toast.remove();
           }, 200)

        }, options.timeout);
    }


  document.body.appendChild(toast); //Append to the body
    //Must be done in a timeout to allow the transition to work.
   setTimeout(()=>{
    toast.classList.add('visible');
   }, 10)
  return toast; // Return the toast element
}


// AdwDialog
function createAdwDialog(options = {}) {
    const backdrop = document.createElement('div');
    backdrop.classList.add('adw-dialog-backdrop');

    const dialog = document.createElement('div');
    dialog.classList.add('adw-dialog');

    if (options.title) {
        const title = document.createElement('div');
        title.classList.add('adw-dialog-title');
        title.textContent = options.title;
        dialog.appendChild(title);
    }

    if (options.content) {
        const content = document.createElement('div');
        content.classList.add('adw-dialog-content');
        content.appendChild(options.content); // options.content should be a DOM node.
        dialog.appendChild(content);
    }

    if (options.buttons) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.classList.add('adw-dialog-buttons');
        options.buttons.forEach(button => buttonsContainer.appendChild(button));
        dialog.appendChild(buttonsContainer);
    }
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    //Show the Dialog
    setTimeout(()=>{ //Needed to allow transitions
        backdrop.classList.add('open');
        dialog.classList.add('open');
    }, 10)

  // Add close functionality (clicking outside or on a close button)
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) { // Only close if clicking directly on the backdrop
            closeAdwDialog(backdrop)
        }
    });

    function closeAdwDialog(backdrop) {
        backdrop.classList.remove('open');
        dialog.classList.remove('open');

        setTimeout(() => { //Wait for transition to complete
            backdrop.remove(); // Clean up the DOM
        }, 300); // Match the transition duration in CSS
    }

    return { // Return an object for controlling the dialog
        dialog: dialog,
        backdrop: backdrop,
        close: () => { closeAdwDialog(backdrop)}
    }
}
//AdwProgressBar
function createAdwProgressBar(options = {}){
    const progressBar = document.createElement('div');
    progressBar.classList.add('adw-progress-bar');
    const progressBarValue = document.createElement('div');
    progressBarValue.classList.add('adw-progress-bar-value');
    progressBar.appendChild(progressBarValue);

    if(options.value){
        progressBarValue.style.width = `${options.value}%`;
    }
     if (options.disabled) {
      progressBar.setAttribute('disabled', '');
    }
    return progressBar;
}
// AdwCheckbox
function createAdwCheckbox(options = {}) {
    const wrapper = document.createElement('label');
    wrapper.classList.add('adw-checkbox');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.addEventListener('change', options.onChanged);

    const indicator = document.createElement('span');
    indicator.classList.add('adw-checkbox-indicator');

    const label = document.createElement('span');
    label.classList.add('adw-checkbox-label');
    label.textContent = options.label;

    wrapper.appendChild(input);
    wrapper.appendChild(indicator);
    wrapper.appendChild(label);

    if (options.checked) {
        input.checked = true;
    }
    if (options.disabled) {
      input.setAttribute('disabled', '');
    }

    return wrapper;
}

// AdwRadioButton
function createAdwRadioButton(options = {}) {
    const wrapper = document.createElement('label');
    wrapper.classList.add('adw-radio');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = options.name; // Important for grouping radio buttons
    input.addEventListener('change', options.onChanged);

    const indicator = document.createElement('span');
    indicator.classList.add('adw-radio-indicator');

    const label = document.createElement('span');
    label.classList.add('adw-radio-label');
    label.textContent = options.label;

    wrapper.appendChild(input);
    wrapper.appendChild(indicator);
    wrapper.appendChild(label);

    if (options.checked) {
        input.checked = true;
    }

    if (options.disabled) {
        input.setAttribute('disabled', '');
    }

    return wrapper;
}

// AdwListBox
function createAdwListBox(options = {}){
    const listBox = document.createElement('div');
    listBox.classList.add('adw-list-box');
    options.children?.forEach(child => listBox.appendChild(child));
    return listBox;
}

// --- Theme Toggle Function  ---
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('light-theme');

  // Store preference
  if (body.classList.contains('light-theme')) {
      localStorage.setItem('theme', 'light');
  } else {
      localStorage.setItem('theme', 'dark');
  }
}

// --- Load Saved Theme ---
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
  } // Default is dark
}

// Export the functions.
window.Adw = {
  createButton: createAdwButton,
  createEntry: createAdwEntry,
  createSwitch: createAdwSwitch,
  createLabel: createAdwLabel,
  createHeaderBar: createAdwHeaderBar,
  createWindow: createAdwWindow,
  createBox: createAdwBox,
  createRow: createAdwRow,
  createToast: createAdwToast,
  createDialog: createAdwDialog,
    createProgressBar: createAdwProgressBar,
  createCheckbox: createAdwCheckbox,
  createRadioButton: createAdwRadioButton,
    createListBox: createAdwListBox,
  toggleTheme: toggleTheme,
};

window.addEventListener('DOMContentLoaded', loadSavedTheme);
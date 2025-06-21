document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-switch'); // This is now <adw-switch-row>
  const accentColorCombo = document.getElementById('accent-color-combo'); // This is now <adw-combo-row>
  const body = document.body;

  const ACCENT_COLORS_LIST = [
    { value: 'default', label: 'Default (Blue)' },
    { value: 'green', label: 'Green' },
    { value: 'orange', label: 'Orange' },
    { value: 'purple', label: 'Purple' },
    { value: 'red', label: 'Red' },
    { value: 'yellow', label: 'Yellow' }
  ];

  // --- Initialization ---
  function initializeSettings() {
    // Populate Accent Color ComboBox
    if (accentColorCombo) {
      // Assuming <adw-combo-row> has a `selectOptions` property
      // that takes an array of {label: string, value: string}
      accentColorCombo.selectOptions = ACCENT_COLORS_LIST;
    }

    // Load and apply saved theme
    const savedTheme = localStorage.getItem('theme') || (body.dataset.serverTheme || 'light'); // Default to light if no system preference
    if (themeSwitch) {
      // <adw-switch-row> should have an 'active' property
      themeSwitch.active = (savedTheme === 'dark');
    }
    applyTheme(savedTheme);

    // Load and apply saved accent color
    const savedAccentColor = localStorage.getItem('accentColor') || (body.dataset.serverAccentColor || 'default');
    if (accentColorCombo) {
      // <adw-combo-row> should have a 'value' property
      accentColorCombo.value = savedAccentColor;
    }
    applyAccentColor(savedAccentColor);
  }

  // --- Theme Logic ---
  function applyTheme(theme) {
    body.classList.remove('dark-theme', 'light-theme');
    if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else { // light or system (defaulting to light for now)
      body.classList.add('light-theme');
    }
    // Dispatch event for other components if needed
    document.dispatchEvent(new CustomEvent('adw-theme-changed', {
      detail: { theme, isLight: (theme === 'light') }
    }));
  }

  if (themeSwitch) {
    // Assuming <adw-switch-row> fires a 'change' event,
    // and its state is in event.target.active or this.active
    themeSwitch.addEventListener('change', function() {
      const newTheme = this.active ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
      savePreference('/api/settings/theme', { theme: newTheme });
    });
  }

  // --- Accent Color Logic ---
  function applyAccentColor(accent) {
    // Remove old accent classes
    ACCENT_COLORS_LIST.forEach(color => {
      body.classList.remove(`accent-${color.value}`);
    });

    // Add 'accent-default' for default or rely on CSS to not have an accent class for default.
    // The _theme.scss uses body.accent-blue for default blue.
    if (accent && accent !== 'default') {
      body.classList.add(`accent-${accent}`);
    } else {
      body.classList.add('accent-default'); // This class should map to blue or rely on :root default
    }
    // Dispatch event for other components if needed
    document.dispatchEvent(new CustomEvent('adw-accent-changed', { detail: { accent } }));
  }

  if (accentColorCombo) {
    // Assuming <adw-combo-row> fires a 'change' event,
    // and its value is in event.target.value or this.value
    accentColorCombo.addEventListener('change', function() {
      const newAccentColor = this.value;
      localStorage.setItem('accentColor', newAccentColor);
      applyAccentColor(newAccentColor);
      savePreference('/api/settings/accent_color', { accent_color: newAccentColor });
    });
  }

  // --- API Helper ---
  async function savePreference(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Ensure CSRF token is available and correctly sourced
          'X-CSRFToken': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Failed to save preference:', errorData.message);
        // Optionally, revert UI change or show error toast
        // Example: createAdwToast(`Failed to save: ${errorData.message}`, { type: 'error' });
      } else {
        const result = await response.json();
        console.log('Preference saved:', result.message, data);
        // Example: createAdwToast('Settings saved!', { type: 'success' });
      }
    } catch (error) {
      console.error('Error saving preference:', error);
      // Example: createAdwToast(`Error: ${error.message}`, { type: 'error' });
    }
  }

  // Wait for custom elements to be defined and upgraded.
  // Using requestAnimationFrame to delay initialization slightly after DOMContentLoaded
  // to give custom elements a better chance to upgrade, though ideally,
  // one would use customElements.whenDefined('adw-switch-row').then(...)
  // for each component if this becomes an issue.
  requestAnimationFrame(() => {
    initializeSettings();
  });
});

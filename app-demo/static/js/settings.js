document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-switch'); // This is <adw-switch-row>
  const accentColorCombo = document.getElementById('accent-color-combo'); // This is <adw-combo-row>
  const body = document.body; // Still useful for server-side initial values

  // --- Initialization ---
  function initializeSettings() {
    if (!window.Adw) {
      console.error("Adwaita-Web (Adw) object not found. Make sure components.js is loaded before settings.js");
      return;
    }

    // Populate Accent Color ComboBox
    if (accentColorCombo) {
      const availableAccents = Adw.getAccentColors(); // Returns [{id: 'blue', name: 'Default (Blue)'}, ...]
      accentColorCombo.selectOptions = availableAccents.map(accent => ({
        value: accent.id, // e.g. 'blue'
        label: accent.name // e.g. 'Default (Blue)'
      }));

      // Load and apply saved accent color
      // Adw.loadSavedTheme() already calls Adw.setAccentColor with localStorage or default.
      // We just need to set the combo box's initial value.
      // Adw.DEFAULT_ACCENT_COLOR (from utils.js) stores the ID of the default accent (e.g., 'default')
      const currentAccentId = localStorage.getItem('accentColorName') || body.dataset.serverAccentColor || Adw.DEFAULT_ACCENT_COLOR;
      accentColorCombo.value = currentAccentId;
    }

    // Load and apply saved theme
    // Adw.loadSavedTheme() is called automatically on DOMContentLoaded from utils.js
    // It handles localStorage, system preference, and applies the theme.
    // We just need to set the switch's initial state.
    if (themeSwitch) {
      const currentTheme = localStorage.getItem('theme') || (body.classList.contains('light-theme') ? 'light' : 'dark');
      themeSwitch.active = (currentTheme === 'dark');
    }
  }

  // --- Event Listeners ---
  if (themeSwitch) {
    themeSwitch.addEventListener('change', function() {
      // Adw.toggleTheme() handles applying the class and saving to localStorage.
      Adw.toggleTheme();
      const newTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
      savePreference('/api/settings/theme', { theme: newTheme });
    });
  }

  if (accentColorCombo) {
    accentColorCombo.addEventListener('change', function() {
      const newAccentColorName = this.value; // e.g. 'green'
      // Adw.setAccentColor() handles applying the CSS variables and saving to localStorage.
      Adw.setAccentColor(newAccentColorName);
      savePreference('/api/settings/accent_color', { accent_color: newAccentColorName });
    });
  }

  // --- API Helper (for server-side persistence) ---
  async function savePreference(url, data) {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (!csrfToken) {
        console.error('CSRF token not found. Cannot save preference.');
        // Adw.createAdwToast('Error: CSRF token missing.', { type: 'error' });
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status: ${response.status}` }));
        console.error('Failed to save preference to server:', errorData.message || response.statusText);
        // Example: Adw.createAdwToast(`Failed to save: ${errorData.message || response.statusText}`, { type: 'error' });
      } else {
        const result = await response.json();
        console.log('Preference saved to server:', result.message, data);
        // Example: Adw.createAdwToast('Settings saved to server!', { type: 'success' });
      }
    } catch (error) {
      console.error('Error saving preference to server:', error);
      // Example: Adw.createAdwToast(`Client-side error: ${error.message}`, { type: 'error' });
    }
  }

  // Initialize settings after custom elements are likely defined and Adw object is available.
  // Adw.loadSavedTheme is already attached to DOMContentLoaded in utils.js,
  // so theme and accent are applied by the time this runs.
  // This mainly ensures UI elements (switch, combo) reflect the loaded state.
  if (window.customElements && typeof customElements.whenDefined === 'function') {
    Promise.all([
      customElements.whenDefined('adw-switch-row'),
      customElements.whenDefined('adw-combo-row')
    ]).then(() => {
      initializeSettings();
    }).catch(error => {
      console.error("Error waiting for Adwaita components to be defined:", error);
      // Fallback to initialize after a short delay if whenDefined fails or is not supported.
      requestAnimationFrame(initializeSettings);
    });
  } else {
    // Fallback for older browsers or environments where whenDefined might not be robust.
    requestAnimationFrame(initializeSettings);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const themeSwitch = document.getElementById('theme-switch');
  const accentColorCombo = document.getElementById('accent-color-combo');
  const body = document.body;

  const ACCENT_COLORS = {
    'default': 'Default (Blue)',
    'green': 'Green',
    'orange': 'Orange',
    'purple': 'Purple',
    'red': 'Red',
    'yellow': 'Yellow'
  };

  // --- Initialization ---
  function initializeSettings() {
    // Populate Accent Color ComboBox
    if (accentColorCombo) {
      accentColorCombo.innerHTML = ''; // Clear existing options if any
      for (const [value, name] of Object.entries(ACCENT_COLORS)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = name;
        accentColorCombo.appendChild(option);
      }
    }

    // Load and apply saved theme
    // Use body.dataset for server-side values as a fallback to localStorage
    const savedTheme = localStorage.getItem('theme') || (body.dataset.serverTheme || 'system');
    if (themeSwitch) {
      // Assuming adw-switch-row uses 'active' property like a boolean for its state
      themeSwitch.active = (savedTheme === 'dark');
    }
    applyTheme(savedTheme);

    // Load and apply saved accent color
    const savedAccentColor = localStorage.getItem('accentColor') || (body.dataset.serverAccentColor || 'default');
    if (accentColorCombo) {
      accentColorCombo.value = savedAccentColor;
    }
    applyAccentColor(savedAccentColor);
  }

  // --- Theme Logic ---
  function applyTheme(theme) {
    body.classList.remove('dark-theme', 'light-theme', 'system-theme'); // Clear old theme classes
    if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else if (theme === 'light') {
      body.classList.add('light-theme');
    } else { // system
      body.classList.add('system-theme'); // Assumes CSS handles prefers-color-scheme for .system-theme or :root
    }
    // For Adwaita components that might need explicit update after class change
    // Also, ensure adw-initializer.js's theme handling is compatible or updated if needed.
    document.dispatchEvent(new CustomEvent('adw-theme-changed', { detail: { theme, isLight: (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) } }));
  }

  if (themeSwitch) {
    // Assuming adw-switch-row fires 'state-set' or similar when toggled by user
    // The event name might be different, e.g., 'change' or specific to the component library.
    // 'state-set' is used as per the prompt's example.
    themeSwitch.addEventListener('state-set', (event) => {
      const newTheme = event.detail.active ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
      savePreference('/api/settings/theme', { theme: newTheme });
    });
  }

  // --- Accent Color Logic ---
  function applyAccentColor(accent) {
    // Remove old accent classes
    for (const colorKey of Object.keys(ACCENT_COLORS)) {
      body.classList.remove(`accent-${colorKey}`);
    }
    // Add 'accent-default' for default or rely on CSS to not have an accent class for default.
    // The _theme.scss uses body.accent-blue for default blue.
    if (accent && accent !== 'default') {
      body.classList.add(`accent-${accent}`);
    } else {
      body.classList.add('accent-default'); // This class should map to blue or rely on :root
    }
     // For Adwaita components that might need explicit update
    document.dispatchEvent(new CustomEvent('adw-accent-changed', { detail: { accent } }));
  }

  if (accentColorCombo) {
    accentColorCombo.addEventListener('change', (event) => {
      const newAccentColor = event.target.value;
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
          // CSRF Token handling:
          // Flask-WTF typically uses a hidden input for form submissions.
          // For JS fetch POSTs, the token needs to be included in headers.
          // A common way is to get it from a meta tag or a global JS variable if available.
          // Example: 'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
          // For this app, let's assume csrf is handled by Flask-Login session for these API calls,
          // or the API routes are exempted via `csrf.exempt(save_theme_preference)` etc.
          // If not, this will fail with a 400 Bad Request (CSRF token missing).
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Failed to save preference:', errorData.message);
        // Optionally, revert UI change or show error toast
      } else {
        const result = await response.json();
        console.log('Preference saved:', result.message, data);
        // Optionally, show success toast
      }
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  }

  initializeSettings();
});

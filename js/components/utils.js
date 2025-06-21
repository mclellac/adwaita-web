// js/components/utils.js
export function adwGenerateId(prefix = 'adw-id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Theme related functions

// These will map to the CSS variables defined in :root in _variables.scss
// e.g., name 'blue' will use var(--accent-blue-light-bg), var(--accent-blue-dark-standalone) etc.
export const ACCENT_COLOR_DEFINITIONS = {
    blue: {
        name: "Default (Blue)",
        light: { bg: 'var(--accent-blue-light-bg)', fg: 'var(--accent-blue-light-fg)', standalone: 'var(--accent-blue-standalone)', hover: 'var(--accent-blue-light-bg-hover)', active: 'var(--accent-blue-light-bg-active)' },
        dark:  { bg: 'var(--accent-blue-dark-bg)',  fg: 'var(--accent-blue-dark-fg)',  standalone: 'var(--accent-blue-dark-standalone)',  hover: 'var(--accent-blue-dark-bg-hover)',  active: 'var(--accent-blue-dark-bg-active)'  }
    },
    green: {
        name: "Green",
        light: { bg: 'var(--accent-green-light-bg)', fg: 'var(--accent-green-light-fg)', standalone: 'var(--accent-green-standalone)', hover: 'var(--accent-green-light-bg-hover)', active: 'var(--accent-green-light-bg-active)' },
        dark:  { bg: 'var(--accent-green-dark-bg)',  fg: 'var(--accent-green-dark-fg)',  standalone: 'var(--accent-green-dark-standalone)',  hover: 'var(--accent-green-dark-bg-hover)',  active: 'var(--accent-green-dark-bg-active)'  }
    },
    yellow: {
        name: "Yellow",
        light: { bg: 'var(--accent-yellow-light-bg)', fg: 'var(--accent-yellow-light-fg)', standalone: 'var(--accent-yellow-standalone)', hover: 'var(--accent-yellow-light-bg-hover)', active: 'var(--accent-yellow-light-bg-active)' },
        dark:  { bg: 'var(--accent-yellow-dark-bg)',  fg: 'var(--accent-yellow-dark-fg)',  standalone: 'var(--accent-yellow-dark-standalone)',  hover: 'var(--accent-yellow-dark-bg-hover)',  active: 'var(--accent-yellow-dark-bg-active)'  }
    },
    orange: {
        name: "Orange",
        light: { bg: 'var(--accent-orange-light-bg)', fg: 'var(--accent-orange-light-fg)', standalone: 'var(--accent-orange-standalone)', hover: 'var(--accent-orange-light-bg-hover)', active: 'var(--accent-orange-light-bg-active)' },
        dark:  { bg: 'var(--accent-orange-dark-bg)',  fg: 'var(--accent-orange-dark-fg)',  standalone: 'var(--accent-orange-dark-standalone)',  hover: 'var(--accent-orange-dark-bg-hover)',  active: 'var(--accent-orange-dark-bg-active)'  }
    },
    purple: {
        name: "Purple",
        light: { bg: 'var(--accent-purple-light-bg)', fg: 'var(--accent-purple-light-fg)', standalone: 'var(--accent-purple-standalone)', hover: 'var(--accent-purple-light-bg-hover)', active: 'var(--accent-purple-light-bg-active)' },
        dark:  { bg: 'var(--accent-purple-dark-bg)',  fg: 'var(--accent-purple-dark-fg)',  standalone: 'var(--accent-purple-dark-standalone)',  hover: 'var(--accent-purple-dark-bg-hover)',  active: 'var(--accent-purple-dark-bg-active)'  }
    },
    red: {
        name: "Red",
        light: { bg: 'var(--accent-red-light-bg)', fg: 'var(--accent-red-light-fg)', standalone: 'var(--accent-red-standalone)', hover: 'var(--accent-red-light-bg-hover)', active: 'var(--accent-red-light-bg-active)' },
        dark:  { bg: 'var(--accent-red-dark-bg)',  fg: 'var(--accent-red-dark-fg)',  standalone: 'var(--accent-red-dark-standalone)',  hover: 'var(--accent-red-dark-bg-hover)',  active: 'var(--accent-red-dark-bg-active)'  }
    },
    teal: {
        name: "Teal",
        light: { bg: 'var(--accent-teal-light-bg)', fg: 'var(--accent-teal-light-fg)', standalone: 'var(--accent-teal-standalone)', hover: 'var(--accent-teal-light-bg-hover)', active: 'var(--accent-teal-light-bg-active)' },
        dark:  { bg: 'var(--accent-teal-dark-bg)',  fg: 'var(--accent-teal-dark-fg)',  standalone: 'var(--accent-teal-dark-standalone)',  hover: 'var(--accent-teal-dark-bg-hover)',  active: 'var(--accent-teal-dark-bg-active)'  }
    },
    pink: {
        name: "Pink",
        light: { bg: 'var(--accent-pink-light-bg)', fg: 'var(--accent-pink-light-fg)', standalone: 'var(--accent-pink-standalone)', hover: 'var(--accent-pink-light-bg-hover)', active: 'var(--accent-pink-light-bg-active)' },
        dark:  { bg: 'var(--accent-pink-dark-bg)',  fg: 'var(--accent-pink-dark-fg)',  standalone: 'var(--accent-pink-dark-standalone)',  hover: 'var(--accent-pink-dark-bg-hover)',  active: 'var(--accent-pink-dark-bg-active)'  }
    },
    brown: { // For "Slate"
        name: "Brown",
        light: { bg: 'var(--accent-brown-light-bg)', fg: 'var(--accent-brown-light-fg)', standalone: 'var(--accent-brown-standalone)', hover: 'var(--accent-brown-light-bg-hover)', active: 'var(--accent-brown-light-bg-active)' },
        dark:  { bg: 'var(--accent-brown-dark-bg)',  fg: 'var(--accent-brown-dark-fg)',  standalone: 'var(--accent-brown-dark-standalone)',  hover: 'var(--accent-brown-dark-bg-hover)',  active: 'var(--accent-brown-dark-bg-active)'  }
    }
};

export const DEFAULT_ACCENT_COLOR_NAME = 'blue';

export function getAccentColors() { // Returns simplified list for UI pickers
    return Object.entries(ACCENT_COLOR_DEFINITIONS).map(([key, value]) => ({
        id: key, // e.g., 'blue', 'green'
        name: value.name // e.g., 'Default (Blue)'
    }));
}

export function setAccentColor(accentName = DEFAULT_ACCENT_COLOR_NAME) {
    const root = document.documentElement;
    const accent = ACCENT_COLOR_DEFINITIONS[accentName] || ACCENT_COLOR_DEFINITIONS[DEFAULT_ACCENT_COLOR_NAME];

    root.style.setProperty('--chosen-accent-light-bg', accent.light.bg);
    root.style.setProperty('--chosen-accent-light-fg', accent.light.fg);
    root.style.setProperty('--chosen-accent-light-standalone', accent.light.standalone);
    root.style.setProperty('--chosen-accent-light-hover-bg', accent.light.hover || accent.light.bg); // Fallback for hover/active
    root.style.setProperty('--chosen-accent-light-active-bg', accent.light.active || accent.light.bg);

    root.style.setProperty('--chosen-accent-dark-bg', accent.dark.bg);
    root.style.setProperty('--chosen-accent-dark-fg', accent.dark.fg);
    root.style.setProperty('--chosen-accent-dark-standalone', accent.dark.standalone);
    root.style.setProperty('--chosen-accent-dark-hover-bg', accent.dark.hover || accent.dark.bg);
    root.style.setProperty('--chosen-accent-dark-active-bg', accent.dark.active || accent.dark.bg);

    try {
        localStorage.setItem('accentColorName', accentName);
    } catch (e) {
        console.warn("Could not save accent color name to localStorage:", e);
    }
}

export function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        const savedAccentName = localStorage.getItem('accentColorName');

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-theme');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches && !document.body.classList.contains('light-theme') && savedTheme !== 'dark') {
            document.body.classList.add('light-theme');
        }

        setAccentColor(savedAccentName || DEFAULT_ACCENT_COLOR_NAME);

    } catch (e) {
        console.warn("Could not load theme from localStorage:", e);
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.add('light-theme');
        }
        setAccentColor(DEFAULT_ACCENT_COLOR_NAME); // Fallback to default blue
    }
}

export function toggleTheme() {
    document.body.classList.toggle('light-theme');
    try {
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    } catch (e) {
        console.warn("Could not save theme preference to localStorage:", e);
    }
}

// Global event listener
window.addEventListener("DOMContentLoaded", loadSavedTheme);


const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:', './', '../', '/', '#'];
/**
 * Sanitizes an href value to prevent javascript: URLs and other unsafe protocols.
 * @param {string} url The URL to sanitize.
 * @returns {string|null} The sanitized URL, or null if disallowed.
 */
export function sanitizeHref(url) {
    if (typeof url !== 'string' || url.trim() === '') return null; // Handle empty or non-string URLs

    // Check for typical relative paths first, as URL constructor might alter them undesirably for simple cases
    if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        // Further validation could be added for these (e.g., ensure no protocol-like content after #)
        // For now, assume these simple relative forms are safe if they don't contain "javascript:" etc.
        if (url.toLowerCase().includes('javascript:')) return null; // Basic check
        return url;
    }

    try {
        const parsedUrl = new URL(url, window.location.origin);
        if (ALLOWED_PROTOCOLS.includes(parsedUrl.protocol.toLowerCase())) {
            return parsedUrl.href;
        }
    } catch (e) {
        // Invalid URL, or protocol not allowed by constructor
        // Fall through to final null if not explicitly allowed by startsWith checks
    }
    return null; // Disallow if protocol not in whitelist or URL is malformed
}

// js/components/utils.js
export function adwGenerateId(prefix = 'adw-id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Theme related functions

// These will map to the CSS variables defined in :root in _variables.scss
// e.g., name 'blue' will use var(--accent-blue-light-bg-color), var(--accent-blue-dark-color) etc.
export const ACCENT_COLOR_DEFINITIONS = {
    blue: {
        name: "Default (Blue)",
        light: { color: 'var(--accent-blue-light-color)', bg: 'var(--accent-blue-light-bg-color)', fg: 'var(--accent-blue-light-fg-color)', hover: 'var(--accent-blue-light-hover-bg-color)', active: 'var(--accent-blue-light-active-bg-color)' },
        dark:  { color: 'var(--accent-blue-dark-color)',  bg: 'var(--accent-blue-dark-bg-color)',  fg: 'var(--accent-blue-dark-fg-color)',  hover: 'var(--accent-blue-dark-hover-bg-color)',  active: 'var(--accent-blue-dark-active-bg-color)'  }
    },
    green: {
        name: "Green",
        light: { color: 'var(--accent-green-light-color)', bg: 'var(--accent-green-light-bg-color)', fg: 'var(--accent-green-light-fg-color)', hover: 'var(--accent-green-light-hover-bg-color)', active: 'var(--accent-green-light-active-bg-color)' },
        dark:  { color: 'var(--accent-green-dark-color)',  bg: 'var(--accent-green-dark-bg-color)',  fg: 'var(--accent-green-dark-fg-color)',  hover: 'var(--accent-green-dark-hover-bg-color)',  active: 'var(--accent-green-dark-active-bg-color)'  }
    },
    yellow: {
        name: "Yellow",
        light: { color: 'var(--accent-yellow-light-color)', bg: 'var(--accent-yellow-light-bg-color)', fg: 'var(--accent-yellow-light-fg-color)', hover: 'var(--accent-yellow-light-hover-bg-color)', active: 'var(--accent-yellow-light-active-bg-color)' },
        dark:  { color: 'var(--accent-yellow-dark-color)',  bg: 'var(--accent-yellow-dark-bg-color)',  fg: 'var(--accent-yellow-dark-fg-color)',  hover: 'var(--accent-yellow-dark-hover-bg-color)',  active: 'var(--accent-yellow-dark-active-bg-color)'  }
    },
    orange: {
        name: "Orange",
        light: { color: 'var(--accent-orange-light-color)', bg: 'var(--accent-orange-light-bg-color)', fg: 'var(--accent-orange-light-fg-color)', hover: 'var(--accent-orange-light-hover-bg-color)', active: 'var(--accent-orange-light-active-bg-color)' },
        dark:  { color: 'var(--accent-orange-dark-color)',  bg: 'var(--accent-orange-dark-bg-color)',  fg: 'var(--accent-orange-dark-fg-color)',  hover: 'var(--accent-orange-dark-hover-bg-color)',  active: 'var(--accent-orange-dark-active-bg-color)'  }
    },
    purple: {
        name: "Purple",
        light: { color: 'var(--accent-purple-light-color)', bg: 'var(--accent-purple-light-bg-color)', fg: 'var(--accent-purple-light-fg-color)', hover: 'var(--accent-purple-light-hover-bg-color)', active: 'var(--accent-purple-light-active-bg-color)' },
        dark:  { color: 'var(--accent-purple-dark-color)',  bg: 'var(--accent-purple-dark-bg-color)',  fg: 'var(--accent-purple-dark-fg-color)',  hover: 'var(--accent-purple-dark-hover-bg-color)',  active: 'var(--accent-purple-dark-active-bg-color)'  }
    },
    red: {
        name: "Red",
        light: { color: 'var(--accent-red-light-color)', bg: 'var(--accent-red-light-bg-color)', fg: 'var(--accent-red-light-fg-color)', hover: 'var(--accent-red-light-hover-bg-color)', active: 'var(--accent-red-light-active-bg-color)' },
        dark:  { color: 'var(--accent-red-dark-color)',  bg: 'var(--accent-red-dark-bg-color)',  fg: 'var(--accent-red-dark-fg-color)',  hover: 'var(--accent-red-dark-hover-bg-color)',  active: 'var(--accent-red-dark-active-bg-color)'  }
    },
    teal: {
        name: "Teal",
        light: { color: 'var(--accent-teal-light-color)', bg: 'var(--accent-teal-light-bg-color)', fg: 'var(--accent-teal-light-fg-color)', hover: 'var(--accent-teal-light-hover-bg-color)', active: 'var(--accent-teal-light-active-bg-color)' },
        dark:  { color: 'var(--accent-teal-dark-color)',  bg: 'var(--accent-teal-dark-bg-color)',  fg: 'var(--accent-teal-dark-fg-color)',  hover: 'var(--accent-teal-dark-hover-bg-color)',  active: 'var(--accent-teal-dark-active-bg-color)'  }
    },
    pink: {
        name: "Pink",
        light: { color: 'var(--accent-pink-light-color)', bg: 'var(--accent-pink-light-bg-color)', fg: 'var(--accent-pink-light-fg-color)', hover: 'var(--accent-pink-light-hover-bg-color)', active: 'var(--accent-pink-light-active-bg-color)' },
        dark:  { color: 'var(--accent-pink-dark-color)',  bg: 'var(--accent-pink-dark-bg-color)',  fg: 'var(--accent-pink-dark-fg-color)',  hover: 'var(--accent-pink-dark-hover-bg-color)',  active: 'var(--accent-pink-dark-active-bg-color)'  }
    },
    brown: { // For "Slate"
        name: "Brown",
        light: { color: 'var(--accent-brown-light-color)', bg: 'var(--accent-brown-light-bg-color)', fg: 'var(--accent-brown-light-fg-color)', hover: 'var(--accent-brown-light-hover-bg-color)', active: 'var(--accent-brown-light-active-bg-color)' },
        dark:  { color: 'var(--accent-brown-dark-color)',  bg: 'var(--accent-brown-dark-bg-color)',  fg: 'var(--accent-brown-dark-fg-color)',  hover: 'var(--accent-brown-dark-hover-bg-color)',  active: 'var(--accent-brown-dark-active-bg-color)'  }
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

    root.style.setProperty('--chosen-accent-light-bg-color', accent.light.bg);
    root.style.setProperty('--chosen-accent-light-fg-color', accent.light.fg);
    root.style.setProperty('--chosen-accent-light-color', accent.light.color); // Was 'standalone'
    root.style.setProperty('--chosen-accent-light-hover-bg-color', accent.light.hover || accent.light.bg); // Fallback for hover/active
    root.style.setProperty('--chosen-accent-light-active-bg-color', accent.light.active || accent.light.bg);

    root.style.setProperty('--chosen-accent-dark-bg-color', accent.dark.bg);
    root.style.setProperty('--chosen-accent-dark-fg-color', accent.dark.fg);
    root.style.setProperty('--chosen-accent-dark-color', accent.dark.color); // Was 'standalone'
    root.style.setProperty('--chosen-accent-dark-hover-bg-color', accent.dark.hover || accent.dark.bg);
    root.style.setProperty('--chosen-accent-dark-active-bg-color', accent.dark.active || accent.dark.bg);

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

        const docEl = document.documentElement;
        if (savedTheme === 'light') {
            docEl.classList.add('light-theme');
            docEl.classList.remove('dark-theme'); // Ensure dark is removed
        } else if (savedTheme === 'dark') {
            docEl.classList.add('dark-theme');
            docEl.classList.remove('light-theme'); // Ensure light is removed
        } else {
            // No saved theme, rely on the inline script's initial assessment or system preference.
            // The inline script should have already set a theme.
            // This function, when run on DOMContentLoaded, will primarily handle accent color
            // and ensure localStorage is updated if the inline script made a choice based on prefers-color-scheme.
            // If inline script somehow failed, this could be a fallback.
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                if (!docEl.classList.contains('light-theme') && !docEl.classList.contains('dark-theme')) {
                    docEl.classList.add('light-theme');
                }
            } else {
                 if (!docEl.classList.contains('light-theme') && !docEl.classList.contains('dark-theme')) {
                    docEl.classList.add('dark-theme');
                }
            }
        }

        // Persist the theme choice if it was determined by prefers-color-scheme and not in localStorage yet
        // or if the inline script set it.
        // The inline script sets the class but doesn't write to localStorage to avoid premature storage write.
        if (!savedTheme) {
            try {
                if (docEl.classList.contains('light-theme')) {
                    localStorage.setItem('theme', 'light');
                } else if (docEl.classList.contains('dark-theme')) {
                    localStorage.setItem('theme', 'dark');
                }
            } catch (e) {
                console.warn("Could not save initial theme to localStorage:", e);
            }
        }

        setAccentColor(savedAccentName || DEFAULT_ACCENT_COLOR_NAME);

    } catch (e) {
        console.warn("Could not load theme from localStorage:", e);
        const docEl = document.documentElement;
        // Fallback logic if everything else fails
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            docEl.classList.add('light-theme');
            docEl.classList.remove('dark-theme');
        } else {
            docEl.classList.add('dark-theme');
            docEl.classList.remove('light-theme');
        }
        try { localStorage.setItem('theme', docEl.classList.contains('light-theme') ? 'light' : 'dark'); } catch (lserror) { /* ignore */ }
        setAccentColor(DEFAULT_ACCENT_COLOR_NAME); // Fallback to default blue
    }
}

export function toggleTheme() {
    const docEl = document.documentElement;
    // If light-theme is present, switch to dark. Otherwise, switch to light.
    if (docEl.classList.contains('light-theme')) {
        docEl.classList.remove('light-theme');
        docEl.classList.add('dark-theme');
        try { localStorage.setItem('theme', 'dark'); } catch (e) { console.warn("LS Error", e); }
    } else {
        docEl.classList.remove('dark-theme');
        docEl.classList.add('light-theme');
        try { localStorage.setItem('theme', 'light'); } catch (e) { console.warn("LS Error", e); }
    }
}

// Global event listener
window.addEventListener("DOMContentLoaded", () => {
    // The inline script in <head> handles initial theme application from localStorage or prefers-color-scheme.
    // loadSavedTheme here will now mostly ensure accent color is applied and
    // potentially sync localStorage if the theme was determined by prefers-color-scheme by the inline script
    // (which doesn't write to localStorage to avoid disk write before critical render path).
    loadSavedTheme();

    // Add listener for system theme changes
    const lightSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    try { // Some browsers might not support addEventListener on MediaQueryList
        lightSchemeMediaQuery.addEventListener('change', (e) => {
            const currentStoredTheme = localStorage.getItem('theme');
            // Only react if no theme is explicitly set by the user in localStorage
            if (!currentStoredTheme) {
                console.log("System theme changed, and no user preference stored. Applying new system theme.");
                if (e.matches) { // System changed to light
                    document.documentElement.classList.add('light-theme');
                    document.documentElement.classList.remove('dark-theme');
                } else { // System changed to dark
                    document.documentElement.classList.add('dark-theme');
                    document.documentElement.classList.remove('light-theme');
                }
                // No need to write to localStorage here, as we want to keep respecting system changes
                // if the user hasn't made an explicit choice.
            }
        });
    } catch (e1) {
        try { // Fallback for older browsers
            lightSchemeMediaQuery.addListener((e) => { // Deprecated but common fallback
                 const currentStoredTheme = localStorage.getItem('theme');
                 if (!currentStoredTheme) {
                    if (e.matches) {
                        document.documentElement.classList.add('light-theme');
                        document.documentElement.classList.remove('dark-theme');
                    } else {
                        document.documentElement.classList.add('dark-theme');
                        document.documentElement.classList.remove('light-theme');
                    }
                }
            });
        } catch (e2) {
            console.warn("Failed to add listener for system theme changes.", e1, e2);
        }
    }
});


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

// Centralized Adopted Stylesheet Logic
let adwCommonSheet = null;
let sheetPromise = null;

/**
 * Fetches the common Adwaita stylesheet and returns it as a CSSStyleSheet object.
 * Caches the sheet after the first successful fetch.
 * Relies on `Adw.config.cssPath` being set.
 * @returns {Promise<CSSStyleSheet|null>} A promise that resolves to the CSSStyleSheet object or null if fetching fails.
 * @internal
 */
export async function getAdwCommonStyleSheet() {
    if (adwCommonSheet) {
        return adwCommonSheet;
    }
    if (sheetPromise) {
        return sheetPromise;
    }

    const cssPath = (typeof Adw !== 'undefined' && Adw.config && Adw.config.cssPath) ? Adw.config.cssPath : '';
    if (!cssPath) {
        console.error("getAdwCommonStyleSheet: Adw.config.cssPath is not defined. Cannot load styles.");
        return null;
    }

    sheetPromise = new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(cssPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch stylesheet from ${cssPath}: ${response.statusText}`);
            }
            const cssText = await response.text();
            const sheet = new CSSStyleSheet();
            await sheet.replace(cssText);
            adwCommonSheet = sheet;
            console.info(`Adwaita common stylesheet loaded and processed from: ${cssPath}`);
            resolve(adwCommonSheet);
        } catch (error) {
            console.error("getAdwCommonStyleSheet: Error loading common stylesheet:", error);
            adwCommonSheet = null; // Ensure it's null on error so next attempt tries again (or stays null if path is bad)
            reject(error); // Propagate error for components to handle (e.g. fallback)
        } finally {
            sheetPromise = null; // Clear promise regardless of outcome to allow retries if needed (e.g. path changes)
        }
    });
    return sheetPromise;
}

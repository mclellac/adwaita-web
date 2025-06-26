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
    console.log(new Date().toISOString(), 'UTILS.JS: setAccentColor - Applied CSS variables for accent:', accentName);

    try {
        localStorage.setItem('accentColorName', accentName);
        console.log(new Date().toISOString(), 'UTILS.JS: setAccentColor - Saved accentColorName to localStorage:', accentName);
    } catch (e) {
        console.warn(new Date().toISOString(), "UTILS.JS: setAccentColor - Could not save accent color name to localStorage:", e);
    }
}

export function loadSavedTheme() {
    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Function start');
    try {
        const savedTheme = localStorage.getItem('theme');
        const savedAccentName = localStorage.getItem('accentColorName');
        console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Retrieved from localStorage - theme:', savedTheme, 'accentName:', savedAccentName);

        const docEl = document.documentElement;
        if (savedTheme === 'light') {
            docEl.classList.add('light-theme');
            docEl.classList.remove('dark-theme'); // Ensure dark is removed
            console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Applied light-theme from localStorage.');
        } else if (savedTheme === 'dark') {
            docEl.classList.add('dark-theme');
            docEl.classList.remove('light-theme'); // Ensure light is removed
            console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Applied dark-theme from localStorage.');
        } else {
            console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - No theme in localStorage, checking prefers-color-scheme.');
            // No saved theme, rely on the inline script's initial assessment or system preference.
            // The inline script should have already set a theme.
            // This function, when run on DOMContentLoaded, will primarily handle accent color
            // and ensure localStorage is updated if the inline script made a choice based on prefers-color-scheme.
            // If inline script somehow failed, this could be a fallback.
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                if (!docEl.classList.contains('light-theme') && !docEl.classList.contains('dark-theme')) {
                    docEl.classList.add('light-theme');
                    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Applied light-theme from prefers-color-scheme.');
                }
            } else {
                 if (!docEl.classList.contains('light-theme') && !docEl.classList.contains('dark-theme')) {
                    docEl.classList.add('dark-theme');
                    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Applied dark-theme from prefers-color-scheme (or default).');
                }
            }
        }

        // Persist the theme choice if it was determined by prefers-color-scheme and not in localStorage yet
        // or if the inline script set it.
        // The inline script sets the class but doesn't write to localStorage to avoid premature storage write.
        if (!savedTheme) {
            console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - No savedTheme in localStorage, attempting to save current theme.');
            try {
                if (docEl.classList.contains('light-theme')) {
                    localStorage.setItem('theme', 'light');
                    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Saved current light-theme to localStorage.');
                } else if (docEl.classList.contains('dark-theme')) {
                    localStorage.setItem('theme', 'dark');
                    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Saved current dark-theme to localStorage.');
                }
            } catch (e) {
                console.warn(new Date().toISOString(), "UTILS.JS: loadSavedTheme - Could not save initial theme to localStorage:", e);
            }
        }

        setAccentColor(savedAccentName || DEFAULT_ACCENT_COLOR_NAME);
        console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Called setAccentColor with:', savedAccentName || DEFAULT_ACCENT_COLOR_NAME);

    } catch (e) {
        console.warn(new Date().toISOString(), "UTILS.JS: loadSavedTheme - Error during execution:", e);
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
        console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Fallback: applied theme and default accent.');
    }
    console.log(new Date().toISOString(), 'UTILS.JS: loadSavedTheme - Function end.');
}

export function toggleTheme() {
    console.log(new Date().toISOString(), 'UTILS.JS: toggleTheme - Function start.');
    const docEl = document.documentElement;
    // If light-theme is present, switch to dark. Otherwise, switch to light.
    if (docEl.classList.contains('light-theme')) {
        docEl.classList.remove('light-theme');
        docEl.classList.add('dark-theme');
        try { localStorage.setItem('theme', 'dark'); console.log(new Date().toISOString(), 'UTILS.JS: toggleTheme - Switched to dark, saved to localStorage.'); }
        catch (e) { console.warn(new Date().toISOString(), "UTILS.JS: toggleTheme - LS Error (dark):", e); }
    } else {
        docEl.classList.remove('dark-theme');
        docEl.classList.add('light-theme');
        try { localStorage.setItem('theme', 'light'); console.log(new Date().toISOString(), 'UTILS.JS: toggleTheme - Switched to light, saved to localStorage.'); }
        catch (e) { console.warn(new Date().toISOString(), "UTILS.JS: toggleTheme - LS Error (light):", e); }
    }
    console.log(new Date().toISOString(), 'UTILS.JS: toggleTheme - Function end.');
}

// Global event listener for DOMContentLoaded is removed.
// Theme and accent application will be explicitly called by components.js.

// Listener for system theme changes should be set up once.
// We'll attach it inside applyFinalThemeAndAccent to ensure it's set after initial decisions.
let systemThemeListenerAttached = false;
console.log(new Date().toISOString(), 'UTILS.JS: systemThemeListenerAttached initialized to false.');

/**
 * Applies the definitive theme and accent color to the application.
 * Order of precedence for theme:
 * 1. Server-provided (via `document.body.dataset.themePreference`)
 * 2. localStorage ('theme')
 * 3. System preference (prefers-color-scheme)
 * 4. Default ('dark')
 *
 * Order of precedence for accent color:
 * 1. Server-provided (via `document.body.dataset.accentPreference`)
 * 2. localStorage ('accentColorName')
 * 3. Default (DEFAULT_ACCENT_COLOR_NAME)
 *
 * This function also updates localStorage for theme and calls setAccentColor (which handles its own localStorage).
 * It should be called once the main Adw object is ready and DOM is available (e.g., DOMContentLoaded or module script end).
 */
export function applyFinalThemeAndAccent() {
    console.log(new Date().toISOString(), '[Theme Debug] applyFinalThemeAndAccent called');
    const docEl = document.documentElement;
    const bodyDataSet = document.body ? document.body.dataset : {};
    console.log(new Date().toISOString(), '[Theme Debug] bodyDataSet:', JSON.stringify(bodyDataSet));

    let finalTheme = 'dark'; // Default theme
    const dbTheme = bodyDataSet.themePreference;
    const lsTheme = localStorage.getItem('theme');
    let themeSource = 'default';
    console.log(new Date().toISOString(), '[Theme Debug] Initial values - dbTheme:', dbTheme, 'lsTheme:', lsTheme);

    if (dbTheme && (dbTheme === 'light' || dbTheme === 'dark')) {
        finalTheme = dbTheme;
        themeSource = 'db';
        console.log(new Date().toISOString(), `[Theme Debug] Using theme from DB: ${finalTheme}`);
        try {
            // Always update localStorage to reflect DB state as highest non-session truth
            localStorage.setItem('theme', finalTheme);
            console.log(new Date().toISOString(), `[Theme Debug] Updated localStorage theme to ${finalTheme} from DB.`);
        } catch (e) { console.warn(new Date().toISOString(), "[Theme Debug] Could not save DB theme to localStorage:", e); }
    } else if (lsTheme && (lsTheme === 'light' || lsTheme === 'dark')) {
        finalTheme = lsTheme;
        themeSource = 'localStorage';
        console.log(new Date().toISOString(), `[Theme Debug] Using theme from localStorage: ${finalTheme}`);
    } else if (window.matchMedia) {
        console.log(new Date().toISOString(), '[Theme Debug] Checking prefers-color-scheme.');
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            finalTheme = 'light';
            themeSource = 'prefers-color-scheme';
            console.log(new Date().toISOString(), `[Theme Debug] Using theme from prefers-color-scheme: light`);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            finalTheme = 'dark';
            themeSource = 'prefers-color-scheme';
            console.log(new Date().toISOString(), `[Theme Debug] Using theme from prefers-color-scheme: dark`);
        }
        // Save the derived system preference to localStorage if it's the source
        if (themeSource === 'prefers-color-scheme') {
             try { localStorage.setItem('theme', finalTheme); console.log(new Date().toISOString(), `[Theme Debug] Saved derived system theme ${finalTheme} to localStorage.`); }
             catch (e) { console.warn(new Date().toISOString(), "[Theme Debug] Could not save system theme to localStorage:", e); }
        }
    } else {
        console.log(new Date().toISOString(), `[Theme Debug] Using default theme: ${finalTheme} (window.matchMedia not available)`);
    }
    console.log(new Date().toISOString(), `[Theme Debug] Final theme decision: ${finalTheme} (Source: ${themeSource})`);

    // Apply the final theme
    // Only change classes if necessary to avoid redundant DOM manipulation / potential flicker
    const needsLightTheme = finalTheme === 'light';
    const needsDarkTheme = finalTheme === 'dark'; // Or finalTheme !== 'light'
    console.log(new Date().toISOString(), `[Theme Debug] Needs light: ${needsLightTheme}, Needs dark: ${needsDarkTheme}. Current classes: ${docEl.className}`);

    if (needsLightTheme && (!docEl.classList.contains('light-theme') || docEl.classList.contains('dark-theme'))) {
        docEl.classList.add('light-theme');
        docEl.classList.remove('dark-theme');
        console.log(new Date().toISOString(), '[Theme Debug] Applied light-theme class.');
    } else if (needsDarkTheme && (!docEl.classList.contains('dark-theme') || docEl.classList.contains('light-theme'))) {
        docEl.classList.add('dark-theme');
        docEl.classList.remove('light-theme');
        console.log(new Date().toISOString(), '[Theme Debug] Applied dark-theme class.');
    } else {
        console.log(new Date().toISOString(), '[Theme Debug] Theme classes already correctly set, no change made.');
    }


    // Accent Color
    let finalAccent = DEFAULT_ACCENT_COLOR_NAME;
    const dbAccent = bodyDataSet.accentPreference;
    const lsAccent = localStorage.getItem('accentColorName');
    let accentSource = 'default (blue)';
    console.log(new Date().toISOString(), '[Theme Debug] Accent values - dbAccent:', dbAccent, 'lsAccent:', lsAccent);


    if (dbAccent) {
        finalAccent = dbAccent;
        accentSource = 'db';
        console.log(new Date().toISOString(), `[Theme Debug] Using accent from DB: ${finalAccent}`);
        // setAccentColor will update localStorage
    } else if (lsAccent) {
        finalAccent = lsAccent;
        accentSource = 'localStorage';
        console.log(new Date().toISOString(), `[Theme Debug] Using accent from localStorage: ${finalAccent}`);
    } else {
        console.log(new Date().toISOString(), `[Theme Debug] Using default accent: ${finalAccent}`);
    }
    console.log(new Date().toISOString(), `[Theme Debug] Final accent decision: ${finalAccent} (Source: ${accentSource})`);
    setAccentColor(finalAccent); // This also saves to localStorage

    // Setup listener for system theme changes AFTER initial setup
    if (window.matchMedia && !systemThemeListenerAttached) {
        console.log(new Date().toISOString(), '[Theme Debug] Setting up system theme change listener.');
        const lightSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        const systemThemeChangeHandler = (e) => {
            console.log(new Date().toISOString(), '[Theme Debug] System theme change event fired. Matches light:', e.matches);
            const currentDbTheme = document.body ? document.body.dataset.themePreference : null;
            const currentLsTheme = localStorage.getItem('theme');
            console.log(new Date().toISOString(), '[Theme Debug] System theme change - currentDbTheme:', currentDbTheme, 'currentLsTheme:', currentLsTheme);

            if (!currentDbTheme && !currentLsTheme) {
                console.log(new Date().toISOString(), "[Theme Debug] System theme changed, and no user preference stored. Applying new system theme.");
                const newSystemTheme = e.matches ? 'light' : 'dark';
                if (newSystemTheme === 'light') {
                    if (!docEl.classList.contains('light-theme') || docEl.classList.contains('dark-theme')) {
                        docEl.classList.add('light-theme');
                        docEl.classList.remove('dark-theme');
                        console.log(new Date().toISOString(), '[Theme Debug] System change: Applied light-theme.');
                    }
                } else {
                     if (!docEl.classList.contains('dark-theme') || docEl.classList.contains('light-theme')) {
                        docEl.classList.add('dark-theme');
                        docEl.classList.remove('light-theme');
                        console.log(new Date().toISOString(), '[Theme Debug] System change: Applied dark-theme.');
                    }
                }
            } else {
                console.log(new Date().toISOString(), "[Theme Debug] System theme changed, but a user preference (DB or localStorage) exists. Ignoring system change for automatic application.");
            }
        };

        try {
            lightSchemeMediaQuery.addEventListener('change', systemThemeChangeHandler);
            systemThemeListenerAttached = true;
            console.log(new Date().toISOString(), "[Theme Debug] Attached system theme change listener.");
        } catch (e1) {
            try {
                lightSchemeMediaQuery.addListener(systemThemeChangeHandler); // Deprecated
                systemThemeListenerAttached = true;
                console.log(new Date().toISOString(), "[Theme Debug] Attached system theme change listener (fallback).");
            } catch (e2) {
                console.warn(new Date().toISOString(), "[Theme Debug] Failed to add listener for system theme changes.", e1, e2);
            }
        }
    } else if (systemThemeListenerAttached) {
        console.log(new Date().toISOString(), '[Theme Debug] System theme change listener already attached.');
    } else {
        console.log(new Date().toISOString(), '[Theme Debug] window.matchMedia not available, cannot attach system theme listener.');
    }
    console.log(new Date().toISOString(), '[Theme Debug] applyFinalThemeAndAccent finished.');
}


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
        console.error(new Date().toISOString(), "UTILS.JS: getAdwCommonStyleSheet - Adw.config.cssPath is not defined. Cannot load styles.");
        return null;
    }
    console.log(new Date().toISOString(), `UTILS.JS: getAdwCommonStyleSheet - Fetching CSS from: ${cssPath}`);

    sheetPromise = new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(cssPath);
            console.log(new Date().toISOString(), `UTILS.JS: getAdwCommonStyleSheet - Fetch response status: ${response.status} for ${cssPath}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch stylesheet from ${cssPath}: ${response.statusText}`);
            }
            const cssText = await response.text();
            console.log(new Date().toISOString(), `UTILS.JS: getAdwCommonStyleSheet - CSS text fetched (length: ${cssText.length}) from ${cssPath}`);
            const sheet = new CSSStyleSheet();
            await sheet.replace(cssText);
            adwCommonSheet = sheet;
            console.info(new Date().toISOString(), `UTILS.JS: getAdwCommonStyleSheet - Adwaita common stylesheet loaded and processed from: ${cssPath}`);
            resolve(adwCommonSheet);
        } catch (error) {
            console.error(new Date().toISOString(), "UTILS.JS: getAdwCommonStyleSheet - Error loading common stylesheet:", error);
            adwCommonSheet = null; // Ensure it's null on error so next attempt tries again (or stays null if path is bad)
            reject(error); // Propagate error for components to handle (e.g. fallback)
        } finally {
            sheetPromise = null; // Clear promise regardless of outcome to allow retries if needed (e.g. path changes)
            console.log(new Date().toISOString(), `UTILS.JS: getAdwCommonStyleSheet - Cleared sheetPromise for ${cssPath}`);
        }
    });
    return sheetPromise;
}

/**
 * Finds all focusable elements within a given parent element.
 * @param {HTMLElement} parentElement - The element to search within.
 * @returns {HTMLElement[]} An array of focusable elements.
 */
export function adwMakeFocusable(parentElement) {
    if (!parentElement || typeof parentElement.querySelectorAll !== 'function') {
        return [];
    }
    // Common focusable elements. Note: [tabindex] must not be negative.
    // Elements with tabindex="-1" are focusable by script but not by keyboard.
    // We exclude them here as this is typically for keyboard navigation trapping.
    const focusableSelectors = [
        'a[href]:not([tabindex^="-"])',
        'button:not([disabled]):not([tabindex^="-"])',
        'input:not([disabled]):not([tabindex^="-"])',
        'select:not([disabled]):not([tabindex^="-"])',
        'textarea:not([disabled]):not([tabindex^="-"])',
        '[tabindex]:not([tabindex^="-"])' // Catches elements with tabindex="0" or positive
    ];
    const elements = parentElement.querySelectorAll(focusableSelectors.join(', '));

    // Filter out elements that are not visible or are inert
    return Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        const inert = el.hasAttribute('inert') || (el.closest && el.closest('[inert]'));
        const hidden = el.hasAttribute('hidden') || (el.closest && el.closest('[hidden]'));

        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               el.offsetParent !== null && // Check if it's rendered and has layout
               !inert && // Check for inert attribute on element or ancestors
               !hidden; // Check for hidden attribute on element or ancestors
    });
}

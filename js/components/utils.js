// js/components/utils.js
export function adwGenerateId(prefix = 'adw-id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Theme related functions (moved from bottom of original components.js)
export const DEFAULT_ACCENT_COLOR = { name: "Default (Blue)", primary: "#3584e4", standalone: "#1c71d8" };

export function getAccentColors() {
    // Simplified, actual colors would be fetched from SCSS variables or a config
    // These should ideally match the definitions in _variables.scss
    return [
        DEFAULT_ACCENT_COLOR,
        { name: "Green", primary: "#2ec27e", standalone: "#1b8553" }, // --accent-green-light-bg, --accent-green-standalone
        { name: "Yellow", primary: "#e5a50a", standalone: "#9c6e03" },// --accent-yellow-light-bg, --accent-yellow-standalone
        { name: "Orange", primary: "#ff7800", standalone: "#e66100" },// --accent-orange-light-bg, --accent-orange-standalone
        { name: "Purple", primary: "#9141ac", standalone: "#813d9c" },// --accent-purple-light-bg, --accent-purple-standalone
        { name: "Red", primary: "#e01b24", standalone: "#c01c28" }    // --accent-red-light-bg, --accent-red-standalone
    ];
}

export function setAccentColor(primaryColor, standaloneColor) {
    const root = document.documentElement;
    if (primaryColor) {
        root.style.setProperty('--accent-bg-color', primaryColor);
    }
    if (standaloneColor) {
        root.style.setProperty('--accent-color', standaloneColor);
    }
    localStorage.setItem('accentColor', JSON.stringify({ primary: primaryColor, standalone: standaloneColor }));
}

export function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const savedAccent = JSON.parse(localStorage.getItem('accentColor'));

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
        document.body.classList.remove('light-theme');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.body.classList.add('light-theme');
    }

    if (savedAccent && savedAccent.primary) {
        setAccentColor(savedAccent.primary, savedAccent.standalone);
    } else {
        setAccentColor(DEFAULT_ACCENT_COLOR.primary, DEFAULT_ACCENT_COLOR.standalone);
    }
}

export function toggleTheme() {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Global event listener from original components.js
window.addEventListener("DOMContentLoaded", loadSavedTheme);


const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:', './', '../', '/', '#'];
/**
 * Sanitizes an href value to prevent javascript: URLs and other unsafe protocols.
 * @param {string} url The URL to sanitize.
 * @returns {string|null} The sanitized URL, or null if disallowed.
 */
export function sanitizeHref(url) {
    if (typeof url !== 'string') return null;
    try {
        const parsedUrl = new URL(url, window.location.origin); // Resolve relative URLs against current origin
        if (ALLOWED_PROTOCOLS.includes(parsedUrl.protocol.toLowerCase())) {
            return parsedUrl.href;
        }
        // For relative paths without explicit protocol, URL constructor might use base.
        // Additional check for common relative path starts if URL parsing is tricky.
        if (ALLOWED_PROTOCOLS.some(p => url.startsWith(p) && p.endsWith(':') === false )) { // e.g. './', '/', '#'
             return url;
        }
    } catch (e) {
        // Invalid URL
        return null;
    }
    return null; // Disallow if protocol not in whitelist
}

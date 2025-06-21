// js/components/utils.js
export function adwGenerateId(prefix = 'adw-id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Theme related functions
export const DEFAULT_ACCENT_COLOR = { name: "Default (Blue)", primary: "#3584e4", standalone: "#1c71d8" };

export function getAccentColors() {
    return [
        DEFAULT_ACCENT_COLOR,
        { name: "Green", primary: "#2ec27e", standalone: "#1b8553" },
        { name: "Yellow", primary: "#e5a50a", standalone: "#9c6e03" },
        { name: "Orange", primary: "#ff7800", standalone: "#e66100" },
        { name: "Purple", primary: "#9141ac", standalone: "#813d9c" },
        { name: "Red", primary: "#e01b24", standalone: "#c01c28" }
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
    try { // localStorage can fail in some environments (e.g. sandboxed iframes)
        localStorage.setItem('accentColor', JSON.stringify({ primary: primaryColor, standalone: standaloneColor }));
    } catch (e) {
        console.warn("Could not save accent color to localStorage:", e);
    }
}

export function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        const savedAccent = JSON.parse(localStorage.getItem('accentColor'));

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else if (savedTheme === 'dark') {
            document.body.classList.remove('light-theme'); // Ensure it's removed if explicitly dark
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches && !document.body.classList.contains('light-theme') && savedTheme !== 'dark') {
            // Apply light theme if OS prefers light AND no theme is set OR theme is not explicitly dark
            document.body.classList.add('light-theme');
        }


        if (savedAccent && savedAccent.primary) {
            setAccentColor(savedAccent.primary, savedAccent.standalone);
        } else {
            setAccentColor(DEFAULT_ACCENT_COLOR.primary, DEFAULT_ACCENT_COLOR.standalone);
        }
    } catch (e) {
        console.warn("Could not load theme from localStorage:", e);
        // Fallback to default if localStorage fails
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.classList.add('light-theme');
        }
        setAccentColor(DEFAULT_ACCENT_COLOR.primary, DEFAULT_ACCENT_COLOR.standalone);
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

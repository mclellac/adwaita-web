// adwaita-web/js/banner.js

// Ensure Adw namespace exists
window.Adw = window.Adw || {};

(function(Adw) {
    'use strict';

    const BANNER_ANIMATION_DURATION = 200; // Should match SCSS transition duration for hiding, if any specific to hiding

    /**
     * Initializes banner functionality, attaching event listeners to dismiss buttons.
     * This function can be called multiple times, but event listeners are added only once.
     */
    Adw.initBanners = function() {
        const banners = document.querySelectorAll('.adw-banner');
        banners.forEach(banner => {
            // Check if already initialized to prevent multiple listeners
            if (banner.dataset.adwBannerInitialized) {
                return;
            }

            const dismissButton = banner.querySelector('.adw-banner-dismiss-button, .adw-banner-dismiss'); // Support both specific and general class
            if (dismissButton) {
                dismissButton.addEventListener('click', () => {
                    Adw.dismissBanner(banner);
                });
            }
            banner.dataset.adwBannerInitialized = 'true';
        });
    };

    /**
     * Dismisses a given banner.
     * @param {HTMLElement} bannerElement - The banner element to dismiss.
     */
    Adw.dismissBanner = function(bannerElement) {
        if (!bannerElement || !bannerElement.parentNode) {
            return;
        }

        // If the banner has fixed positioning and animation, use class-based hiding
        // For banners that are statically positioned (like antisocialnet flash messages),
        // direct removal might be fine, but class-based is more flexible.
        if (bannerElement.classList.contains('visible')) {
            bannerElement.classList.remove('visible');
            // Add a 'hiding' class if specific hiding animations are defined for it
            // bannerElement.classList.add('hiding');

            // Wait for animation before removing, only if it was initially animated (.visible implies it was)
            setTimeout(() => {
                if (bannerElement.parentNode) {
                    bannerElement.parentNode.removeChild(bannerElement);
                }
            }, BANNER_ANIMATION_DURATION); // Match this with CSS transition duration
        } else {
            // If not using the 'visible' animation pattern (e.g., statically displayed), just remove
            bannerElement.parentNode.removeChild(bannerElement);
        }
    };

    // Self-initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Adw.initBanners);
    } else {
        Adw.initBanners(); // Already loaded
    }

})(window.Adw);

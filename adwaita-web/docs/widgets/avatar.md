# Avatar

Avatars are used to display a user's profile picture or a placeholder with initials. Adwaita-Web provides `Adw.createAvatar()` for JavaScript creation and the `<adw-avatar>` Web Component.

Avatars are used to display a user's profile picture or a placeholder with initials. Adwaita Web provides styling for avatars via the `.adw-avatar` CSS class and an `<adw-avatar>` Web Component.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createAvatar()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on the CSS classes with manual HTML structure, or the `<adw-avatar>` Web Component.)*

## HTML Structure (for CSS Styling)

To create an avatar manually, you would use a `div` with the class `.adw-avatar` and potentially other size or content-specific classes or inline styles.

```html
<!-- Avatar with image -->
<div class="adw-avatar" style="width: 64px; height: 64px; background-image: url('path/to/image.png');"></div>

<!-- Avatar with text initials -->
<div class="adw-avatar" style="width: 48px; height: 48px; background-color: var(--accent-bg-color);">
  <span class="adw-avatar-text" style="color: var(--accent-fg-color); font-size: 18px;">JD</span>
</div>

<!-- Avatar with an icon (ensure icon is styled and sized appropriately) -->
<div class="adw-avatar size-32"> <!-- .size-32 is an example utility or direct style -->
  <span class="adw-icon icon-status-avatar-default-symbolic"></span>
</div>
```
*   The `adw-avatar-text` class can be used for text initials, which then needs to be sized and centered.
*   Specific sizes (like `.size-24`, `.size-32`, etc.) are defined in `_avatar.scss` or can be set with inline styles.

## Web Component: `<adw-avatar>`

A declarative way to use Adwaita avatars.

**HTML Tag:** `<adw-avatar>`

**Attributes:**

*   `size` (Number, optional): The size (width and height) of the avatar in pixels. Defaults to `48`.
*   `image-src` (String, optional): URL of the image to display.
*   `text` (String, optional): Text to display as initials if no image or if the image fails to load.
*   `alt` (String, optional): Alternative text for the image. Defaults to "Avatar".
*   `background-color` (String, optional): Custom CSS background color.
*   `text-color` (String, optional): Custom CSS text color for initials.

**Slots:**

*   No slots are typically used; content is determined by attributes.

**Example:**

```html
<!-- Avatar with image -->
<adw-avatar size="72" image-src="app-demo/static/img/default_avatar.png" alt="Profile Picture"></adw-avatar>

<!-- Avatar with text initials and custom colors -->
<adw-avatar size="50" text="AW" background-color="var(--adw-purple-3)" text-color="#fff"></adw-avatar>

<!-- Default size avatar with text -->
<adw-avatar text="UI"></adw-avatar>
```

## Styling

*   Primary SCSS: `scss/_avatar.scss`
*   Variables:
    *   `--avatar-bg-color`: Default background color when no image and no specific `backgroundColor` is set.
    *   `--avatar-text-color`: Default text color for initials.
*   The JavaScript factory and Web Component might apply inline styles for `width`, `height`, `font-size`, `background-color`, and `color` based on attributes/options.

---
Next: [Entry](./entry.md)

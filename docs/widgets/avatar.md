# Avatar

Avatars are used to display a user's profile picture or a placeholder with initials. Adwaita-Web provides `Adw.createAvatar()` for JavaScript creation and the `<adw-avatar>` Web Component.

## JavaScript Factory: `Adw.createAvatar()`

Creates an Adwaita-styled avatar.

**Signature:**

```javascript
Adw.createAvatar(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `size` (Number, optional): The size (width and height) of the avatar in pixels. Defaults to `48`.
    *   `imageSrc` (String, optional): URL of the image to display. If not provided or if the image fails to load, text initials will be shown.
    *   `text` (String, optional): Text to display as initials if no image is provided or loads. Typically 1 to 3 characters. If not provided, a generic icon might be shown (styling dependent).
    *   `alt` (String, optional): Alternative text for the image, for accessibility. Defaults to "Avatar".
    *   `backgroundColor` (String, optional): Custom background color for the avatar (e.g., if `imageSrc` is not set or fails).
    *   `textColor` (String, optional): Custom text color for the initials.

**Returns:**

*   `(HTMLDivElement)`: The created avatar `<div>` element.

**Example:**

```html
<div id="js-avatar-container" style="display: flex; align-items: center; gap: 10px;"></div>
<script>
  const container = document.getElementById('js-avatar-container');

  // Avatar with image
  const avatarWithImage = Adw.createAvatar({
    size: 64,
    imageSrc: "app-demo/static/img/default_avatar.png", // Replace with a valid image path
    alt: "User Avatar"
  });
  container.appendChild(avatarWithImage);

  // Avatar with text initials
  const avatarWithText = Adw.createAvatar({
    size: 48,
    text: "JD", // John Doe
    backgroundColor: "var(--accent-bg-color)", // Use theme accent
    textColor: "var(--accent-fg-color)"
  });
  container.appendChild(avatarWithText);

  // Smaller avatar with text
  const smallAvatar = Adw.createAvatar({
    size: 32,
    text: "A"
  });
  container.appendChild(smallAvatar);

  // Avatar that will show fallback (if image path is wrong)
  const fallbackAvatar = Adw.createAvatar({
    size: 48,
    imageSrc: "path/to/nonexistent-image.png",
    text: "??",
    alt: "Fallback Avatar"
  });
  container.appendChild(fallbackAvatar);
</script>
```

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

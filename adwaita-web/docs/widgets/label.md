# Label

An `AdwLabel` is used to display text. It can be configured for various text behaviors like wrapping, justification, and ellipsization. Adwaita Web provides CSS classes like `.adw-label` and its variants (e.g., `.title-1`, `.dim-label`) for styling text, and an `<adw-label>` Web Component.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createLabel()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on applying CSS classes to standard HTML text elements like `<span>`, `<p>`, `<label>`, or by using the `<adw-label>` Web Component.)*

## HTML Structure (for CSS Styling)

You can style various HTML elements as labels by applying the `.adw-label` class and modifier classes.

```html
<span class="adw-label">This is a basic label.</span>
<p class="adw-label title-1">This is a Title 1 Label.</p>
<label class="adw-label" for="some-input">Input Label:</label>
<span class="adw-label dim-label">This is a dimmed label.</span>
```

## Web Component: `<adw-label>`

A declarative way to create Adwaita labels.

**HTML Tag:** `<adw-label>`

**Attributes:**

*   `mnemonic-for` (String, optional): The ID of an activatable widget this label is for. Renders as `<label for="...">`.
*   `selectable` (Boolean, optional): If present, allows text selection.
*   `wrap` (Boolean, optional): If present, enables text wrapping.
*   `lines` (Number, optional): Preferred number of lines.
*   `justify` (String, optional): Text alignment: `'left'`, `'center'`, `'right'`, `'fill'`.
*   `ellipsize` (String, optional): Ellipsization mode: `'none'`, `'start'`, `'middle'`, `'end'`.

**Properties:**
*   `text` (String): Gets or sets the text content of the label.

**Slots:**

*   Default slot: For the text content if not set via `text` attribute or property.

**Example:**

```html
<adw-label>This is a basic label.</adw-label>
<br/>
<adw-label selectable wrap style="max-width: 150px; border: 1px solid #eee;">
  This label is selectable and will wrap if the text is too long to fit.
</adw-label>
<br/>
<label for="input-id">Traditional Label:</label> <input id="input-id" type="text" />
<br/>
<adw-label mnemonic-for="input-id">_Mnemonic for Input:</adw-label>
```

## Styling

*   Primary SCSS: `scss/_label.scss` (or general text styles in `_base.scss`).
*   Variables used: `--body-font-family`, `--font-size-base`, text colors like `--window-fg-color`.
*   `selectable` style adds `user-select: text; cursor: text;`.
*   `wrap` style adds `white-space: normal;` (or `pre-wrap` depending on desired behavior).
*   `ellipsize` styles can be complex, often involving `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` for single line, or `-webkit-line-clamp` for multi-line.
*   Mnemonic underlines are typically handled by browser or via JS adding `<u>` tags.

---
Next: [ListBox](./listbox.md)

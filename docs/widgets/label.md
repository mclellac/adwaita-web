# Label

An `AdwLabel` is used to display text. It can be configured for various text behaviors like wrapping, justification, and ellipsization. Adwaita-Web provides `Adw.createLabel()` and the `<adw-label>` Web Component.

## JavaScript Factory: `Adw.createLabel()`

Creates an Adwaita-styled label.

**Signature:**

```javascript
Adw.createLabel(text, options = {}) -> HTMLLabelElement | HTMLSpanElement
```
*(Returns `HTMLLabelElement` if `mnemonicFor` is provided, otherwise `HTMLSpanElement`)*

**Parameters:**

*   `text` (String): The text content of the label.
*   `options` (Object, optional): Configuration options:
    *   `mnemonicFor` (String, optional): The ID of an activatable widget that this label is for. If provided, an `<label>` element is created with a `for` attribute, and the first character of the text that can be a mnemonic will be underlined.
    *   `selectable` (Boolean, optional): If `true`, allows the text to be selected by the user. Defaults to `false`.
    *   `wrap` (Boolean, optional): If `true`, the text will wrap if it exceeds the available width. Defaults to `false`. CSS `white-space: normal` is applied.
    *   `lines` (Number, optional): The number of lines to display. If set, and text exceeds this, ellipsization might occur based on `ellipsize` mode (though primarily works with `wrap: true`).
    *   `justify` (String, optional): Text alignment. Accepts `'left'`, `'center'`, `'right'`, `'fill'`. Defaults to `'left'`. (CSS `text-align`)
    *   `ellipsize` (String, optional): How to ellipsize text if it overflows. Accepts `'none'`, `'start'`, `'middle'`, `'end'`. Defaults to `'none'`. (CSS `text-overflow`, often requires `overflow: hidden` and `white-space: nowrap` or line-clamping for multi-line)
    *   `cssClass` (Array<String>, optional): Additional CSS classes to apply to the label element.
    *   `id` (String, optional): A specific ID to set on the label element.

**Returns:**

*   `(HTMLLabelElement | HTMLSpanElement)`: The created label element.

**Example:**

```html
<div id="js-label-container" style="width: 200px; border: 1px solid #ccc;"></div>
<input type="text" id="my-input" />
<script>
  const container = document.getElementById('js-label-container');

  const simpleLabel = Adw.createLabel("This is a simple label.");
  container.appendChild(simpleLabel);
  container.appendChild(document.createElement('br'));

  const wrappedLabel = Adw.createLabel("This is a longer label that will wrap within its container.", { wrap: true });
  container.appendChild(wrappedLabel);
  container.appendChild(document.createElement('br'));

  const selectableLabel = Adw.createLabel("This text is selectable.", { selectable: true });
  container.appendChild(selectableLabel);
  container.appendChild(document.createElement('br'));

  const mnemonicLabel = Adw.createLabel("User_name:", { mnemonicFor: "my-input" });
  // Assuming my-input is an existing input field
  const inputEl = document.getElementById('my-input');
  if (inputEl) inputEl.insertAdjacentElement('beforebegin', mnemonicLabel);

</script>
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

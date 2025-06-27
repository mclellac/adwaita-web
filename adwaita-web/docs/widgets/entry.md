# Entry

Entries are input fields that allow users to enter a single line of text. Adwaita-Web provides `Adw.createEntry()` for JavaScript creation and the `<adw-entry>` Web Component.

For multi-line text input, a standard `<textarea>` styled appropriately or a custom component would be used.

## JavaScript Factory: `Adw.createEntry()`

Creates an Adwaita-styled text entry field.

**Signature:**

```javascript
Adw.createEntry(options = {}) -> HTMLInputElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `placeholder` (String, optional): Placeholder text to display when the entry is empty.
    *   `value` (String, optional): Initial value for the entry.
    *   `onInput` (Function, optional): Callback function executed when the `input` event occurs on the entry.
    *   `disabled` (Boolean, optional): If `true`, disables the entry. Defaults to `false`.
    *   `name` (String, optional): The `name` attribute for the input element, useful for forms.
    *   `type` (String, optional): The `type` attribute for the input element (e.g., "text", "password", "email", "search"). Defaults to "text".

**Returns:**

*   `(HTMLInputElement)`: The created `<input>` element.

**Example:**

```html
<div id="js-entry-container" style="display: flex; flex-direction: column; gap: 10px; max-width: 300px;"></div>
<script>
  const container = document.getElementById('js-entry-container');

  // Simple text entry
  const nameEntry = Adw.createEntry({
    placeholder: "Enter your name",
    name: "username"
  });
  container.appendChild(Adw.createLabel("Name:", {for: nameEntry.id || undefined})); // Assuming id might be auto-generated
  container.appendChild(nameEntry);

  // Password entry
  const passwordEntry = Adw.createEntry({
    placeholder: "Enter password",
    type: "password",
    name: "password"
  });
  container.appendChild(Adw.createLabel("Password:"));
  container.appendChild(passwordEntry);
  passwordEntry.addEventListener('input', (event) => {
    console.log("Password input:", event.target.value);
  });


  // Disabled entry with initial value
  const disabledEntry = Adw.createEntry({
    value: "Cannot change this",
    disabled: true
  });
  container.appendChild(Adw.createLabel("Disabled:"));
  container.appendChild(disabledEntry);
</script>
```

## Web Component: `<adw-entry>`

A declarative way to use Adwaita text entry fields.

**HTML Tag:** `<adw-entry>`

**Attributes:**

*   `placeholder` (String, optional): Placeholder text.
*   `value` (String, optional): Initial value. Can be dynamically updated.
*   `disabled` (Boolean, optional): Disables the entry.
*   `name` (String, optional): The `name` attribute for the input, useful in forms.
*   `type` (String, optional): The input type (e.g., "text", "password", "email", "search"). Defaults to "text".
*   `required` (Boolean, optional): Standard HTML `required` attribute.

**Properties:**

*   `value`: Gets or sets the current value of the entry.

**Events:**

*   Standard input events like `input`, `change`, `focus`, `blur` can be listened to.

**Example:**

```html
<div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px;">
  <label for="wc-name">Name (WC):</label>
  <adw-entry id="wc-name" placeholder="Your Full Name" name="fullname"></adw-entry>

  <label for="wc-email">Email (WC):</label>
  <adw-entry id="wc-email" type="email" placeholder="user@example.com" name="email_address" required></adw-entry>

  <adw-entry value="Initial Value" disabled></adw-entry>
</div>

<script>
  const wcNameEntry = document.getElementById('wc-name');
  wcNameEntry.addEventListener('input', () => {
    console.log("WC Name Entry value:", wcNameEntry.value);
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_entry.scss`
*   Variables: Uses general theme variables from `scss/_variables.scss` (e.g., `--view-bg-color`, `--view-fg-color`, `--borders-color`, `--accent-bg-color` for focus outline).
*   Focus styling is typically an outline using the accent color.

---
Next: [HeaderBar](./headerbar.md)

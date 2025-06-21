# EntryRow

An EntryRow is a specialized `AdwRow` that combines a label (title and optional subtitle) with an `AdwEntry` input field. It's commonly used in forms within an `AdwListBox` for a consistent layout.

## JavaScript Factory: `Adw.createEntryRow()`

Creates an Adwaita-styled row with a label and a text entry.

**Signature:**

```javascript
Adw.createEntryRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, required): The main title/label for the entry.
    *   `subtitle` (String, optional): Additional descriptive text displayed below the title.
    *   `entryOptions` (Object, optional): An object containing options to be passed directly to the underlying `Adw.createEntry()` factory function. Common `entryOptions` include:
        *   `placeholder` (String): Placeholder text for the entry.
        *   `value` (String): Initial value for the entry.
        *   `name` (String): The `name` attribute for the input element.
        *   `type` (String): Input type (e.g., "text", "email", "search"). Defaults to "text".
        *   `disabled` (Boolean): Disables only the entry field.
        *   `onInput` (Function): Input event handler for the entry.
    *   `disabled` (Boolean, optional): If `true`, disables the entire row including the label and the entry. This is distinct from `entryOptions.disabled` which only disables the input field.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element representing the entry row. The internal `<input>` element can be accessed by querying within this div (e.g., `entryRowElement.querySelector('input.adw-entry')`).

**Example:**

```html
<div id="js-entryrow-listbox" style="max-width: 450px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-entryrow-listbox');

  // Basic EntryRow
  const nameRow = Adw.createEntryRow({
    title: "Full Name",
    entryOptions: {
      placeholder: "Enter your full name",
      name: "fullName"
    }
  });
  container.appendChild(nameRow);

  // EntryRow with subtitle and initial value
  const emailRow = Adw.createEntryRow({
    title: "Email Address",
    subtitle: "We'll never share your email.",
    entryOptions: {
      placeholder: "user@example.com",
      type: "email",
      name: "email",
      value: "test@example.com"
    }
  });
  container.appendChild(emailRow);

  // Disabled EntryRow (entire row)
  const disabledRow = Adw.createEntryRow({
    title: "Confirmation Code",
    subtitle: "Sent to your email",
    disabled: true,
    entryOptions: {
      placeholder: "XXX-XXX"
    }
  });
  container.appendChild(disabledRow);

  // EntryRow with only the input disabled
  const inputDisabledRow = Adw.createEntryRow({
    title: "Read-only Value",
    entryOptions: {
      value: "This is a fixed value",
      disabled: true // Only input is disabled
    }
  });
  container.appendChild(inputDisabledRow);

  // Accessing the input value
  nameRow.querySelector('input.adw-entry').addEventListener('input', (e) => {
    console.log("Name input:", e.target.value);
  });
</script>
```

## Web Component: `<adw-entry-row>`

A declarative way to define Adwaita entry rows.

**HTML Tag:** `<adw-entry-row>`

**Attributes:**

*   `title` (String, required): The main title/label for the entry.
*   `subtitle` (String, optional): Subtitle text.
*   `placeholder` (String, optional): Placeholder text for the input field.
*   `value` (String, optional): Initial value for the input field.
*   `name` (String, optional): The `name` attribute for the internal input element.
*   `type` (String, optional): The type for the internal input (e.g., "text", "email", "password"). Defaults to "text".
*   `disabled` (Boolean, optional): If present, disables the entire row (label and input).
*   `required` (Boolean, optional): If present, marks the internal input as required (for form validation).
*   *Note: To disable only the input field but keep the label active, you would typically not use the `disabled` attribute on `<adw-entry-row>` but would need a way to pass this to the internal entry, which might require a specific attribute like `input-disabled` or rely on the factory's more granular control if used internally.* The current Web Component implementation might directly map `disabled` to the internal Adw.createEntryRow's `disabled` option, which disables the whole row.

**Properties:**
*   `value`: Gets or sets the value of the internal input field.

**Events:**
*   Standard input events from the internal entry (like `input`, `change`) will bubble up if not stopped.

**Example:**

```html
<adw-list-box style="max-width: 500px;">
  <adw-entry-row
    title="Username"
    subtitle="Choose a unique username"
    placeholder="e.g., ada_lovelace"
    name="username"
    required>
  </adw-entry-row>

  <adw-entry-row
    title="Website"
    type="url"
    placeholder="https://example.com"
    value="https://gnome.org"
    name="user_website">
  </adw-entry-row>

  <adw-entry-row
    title="API Key"
    subtitle="This field is disabled"
    value=" preset-key-cannot-change"
    disabled> <!-- Disables the whole row -->
  </adw-entry-row>
</adw-list-box>

<script>
  const usernameRow = document.querySelector('adw-entry-row[name="username"]');
  usernameRow.addEventListener('input', (event) => {
    // The event.target will be the <adw-entry-row> itself.
    // To get the input's value, you'd use the .value property of the custom element.
    console.log("Username:", usernameRow.value);
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_entry_row.scss` (and inherits from `_listbox.scss` / `_row_types.scss`).
*   The layout typically places the title/subtitle block to the left and the entry field to the right, often with the entry taking available flexible space.
*   The `disabled` state affects the appearance of both the label and the input field.

---
Next: [PasswordEntryRow](./passwordentryrow.md)

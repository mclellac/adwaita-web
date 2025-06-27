# PasswordEntryRow

A PasswordEntryRow is a specialized `AdwEntryRow` designed for password input. It typically includes a text entry that masks input and might offer a button to toggle password visibility.

## JavaScript Factory: `Adw.createPasswordEntryRow()`

Creates an Adwaita-styled row with a label and a password entry field.

**Signature:**

```javascript
Adw.createPasswordEntryRow(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `title` (String, required): The main title/label for the password entry.
    *   `subtitle` (String, optional): Additional descriptive text displayed below
        the title.
    *   `entryOptions` (Object, optional): An object containing options for the
        password input field itself. These are similar to `Adw.createEntry()`
        options but will default `type` to "password".
        *   `placeholder` (String): Placeholder text.
        *   `value` (String): Initial value.
        *   `name` (String): The `name` attribute.
        *   `disabled` (Boolean): Disables only the entry field.
        *   `showPeekButton` (Boolean, optional): If `true` (often the default for
            this component), includes a button to toggle password visibility.
    *   `disabled` (Boolean, optional): If `true`, disables the entire row.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element for the row. It contains the
    label and the password input mechanism (input field and optional peek
    button).

**Example:**

```html
<div id="js-passwordentryrow-listbox" style="max-width: 450px;">
  <!-- AdwListBox would typically wrap these -->
</div>
<script>
  const container = document.getElementById('js-passwordentryrow-listbox');

  const passwordRow = Adw.createPasswordEntryRow({
    title: "Password",
    subtitle: "Minimum 8 characters",
    entryOptions: {
      placeholder: "Enter your password",
      name: "user_password",
      // showPeekButton: true // Assuming this is default or handled internally
    }
  });
  container.appendChild(passwordRow);

  const confirmPasswordRow = Adw.createPasswordEntryRow({
    title: "Confirm Password",
    entryOptions: {
      placeholder: "Re-enter your password",
      name: "confirm_user_password"
    }
  });
  container.appendChild(confirmPasswordRow);

  // Accessing the input value (the input element is usually type="password")
  // Input type might change if peek is active
  const inputInRow = passwordRow.querySelector('input[type="password"], input[type="text"]');
  if (inputInRow) {
    inputInRow.addEventListener('input', (e) => {
      console.log("Password field value:", e.target.value);
    });
  }
</script>
```

## Web Component: `<adw-password-entry-row>`

A declarative way to define Adwaita password entry rows.

**HTML Tag:** `<adw-password-entry-row>`

**Attributes:**

*   `title` (String, required): The main title/label.
*   `subtitle` (String, optional): Subtitle text.
*   `placeholder` (String, optional): Placeholder for the input field.
*   `value` (String, optional): Initial value.
*   `name` (String, optional): The `name` attribute for the internal input.
*   `disabled` (Boolean, optional): If present, disables the entire row.
*   `required` (Boolean, optional): Marks the internal input as required.
*   `show-peek-button` (Boolean, optional): If present and not `"false"`, enables the password visibility toggle button. (Behavior might be default true).

**Properties:**
*   `value`: Gets or sets the value of the internal password input field.

**Events:**
*   Standard input events from the internal entry will bubble.

**Example:**

```html
<adw-list-box style="max-width: 500px;">
  <adw-password-entry-row
    title="New Password"
    subtitle="Must include letters and numbers"
    placeholder="Choose a strong password"
    name="new_pass"
    required
    show-peek-button> <!-- Explicitly show peek button -->
  </adw-password-entry-row>

  <adw-password-entry-row
    title="Current Password"
    placeholder="Enter current password"
    name="current_pass"
    disabled> <!-- Whole row disabled -->
  </adw-password-entry-row>
</adw-list-box>

<script>
  const newPassRow = document.querySelector('adw-password-entry-row[name="new_pass"]');
  newPassRow.addEventListener('input', () => {
    console.log("New Password field value:", newPassRow.value);
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_password_entry_row.scss` (and inherits from `_entry_row.scss`, `_listbox.scss`, `_row_types.scss`).
*   Includes styling for the text input (often `type="password"`) and the "peek" button to toggle visibility.
*   The peek button is typically an icon button.
*   Disabled state styles apply to the entire row.

---
Next: [ExpanderRow](./expanderrow.md)

# BottomSheet

An AdwBottomSheet is a modal sheet that slides up from the bottom of the screen, typically used on mobile or in narrow views to present contextual actions, navigation, or simple forms.

## JavaScript Factory: `Adw.createBottomSheet()`

Creates and manages an Adwaita-styled bottom sheet.

**Signature:**

```javascript
Adw.createBottomSheet(options = {}) -> { sheet: HTMLDivElement, backdrop: HTMLDivElement, open: function, close: function, isOpen: function }
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `content` (HTMLElement, required): The HTML element to display within the bottom sheet. *Security: Ensure trusted/sanitized HTML.*
    *   `isOpen` (Boolean, optional): Initial open state. Defaults to `false`.
    *   `onOpen` (Function, optional): Callback executed when the sheet opens.
    *   `onClose` (Function, optional): Callback executed when the sheet closes.
    *   `closeOnBackdropClick` (Boolean, optional): If `true` (default), clicking the backdrop overlay will close the sheet.

**Returns:**

*   An `Object` with the following properties:
    *   `sheet` (HTMLDivElement): The main bottom sheet DOM element.
    *   `backdrop` (HTMLDivElement): The backdrop overlay element.
    *   `open` (Function): Method to call to display the bottom sheet.
    *   `close` (Function): Method to call to hide the bottom sheet.
    *   `isOpen` (Getter Function): Returns `true` if the sheet is currently open/visible, `false` otherwise.

**Example:**

```html
<div id="js-bottomsheet-trigger"></div>
<script>
  const triggerContainer = document.getElementById('js-bottomsheet-trigger');

  // Create content for the bottom sheet
  const sheetContent = document.createElement('div');
  sheetContent.style.padding = "var(--spacing-m)";
  sheetContent.style.maxHeight = "70vh"; // Allow content to scroll if too tall
  sheetContent.style.overflowY = "auto";

  const title = Adw.createLabel("Sheet Title", {title: 2}); // Assuming AdwLabel with title option
  const action1 = Adw.createButton("Action 1", {flat: true, onClick: () => {mySheet.close(); Adw.createToast("Action 1 chosen");} });
  const action2 = Adw.createButton("Action 2", {flat: true, onClick: () => {mySheet.close(); Adw.createToast("Action 2 chosen");} });
  const cancelAction = Adw.createButton("Cancel", {suggested: true, onClick: () => mySheet.close() });

  const contentBox = Adw.createBox({orientation: "vertical", spacing: "s", children: [title, action1, action2, Adw.createLabel("---"), cancelAction]});
  sheetContent.appendChild(contentBox);


  const mySheet = Adw.createBottomSheet({
    content: sheetContent,
    onOpen: () => console.log("Bottom sheet opened."),
    onClose: () => console.log("Bottom sheet closed.")
  });

  const openSheetButton = Adw.createButton("Open JS BottomSheet", {
    onClick: () => mySheet.open()
  });
  triggerContainer.appendChild(openSheetButton);
</script>
```

## Web Component: `<adw-bottom-sheet>`

A declarative way to define Adwaita bottom sheets.

**HTML Tag:** `<adw-bottom-sheet>`

**Attributes:**

*   `open` (Boolean, optional): Controls visibility. Add attribute to open, remove to close.
*   `close-on-backdrop-click` (Boolean, optional): If set to `"false"`, clicking the backdrop will not close the sheet. Defaults to `true`.

**Slots:**

*   Default slot: The content to be displayed within the bottom sheet.

**Events:**

*   `open`: Fired when the sheet opens.
*   `close`: Fired when the sheet closes.

**Methods:**

*   `open()`: Shows the bottom sheet.
*   `close()`: Hides the bottom sheet.

**Example:**

```html
<adw-button id="wc-sheet-btn">Open WC BottomSheet</adw-button>

<adw-bottom-sheet id="my-wc-sheet">
  <div style="padding: var(--spacing-l); text-align: center;">
    <h3>Options</h3>
    <adw-box orientation="vertical" spacing="m" align="stretch">
        <adw-button flat>Edit Profile</adw-button>
        <adw-button flat>View Activity</adw-button>
        <adw-button destructive flat>Log Out</adw-button>
    </adw-box>
  </div>
</adw-bottom-sheet>

<script>
  const wcSheet = document.getElementById('my-wc-sheet');
  const wcSheetBtn = document.getElementById('wc-sheet-btn');

  wcSheetBtn.addEventListener('click', () => {
    wcSheet.open(); // Or wcSheet.setAttribute('open', '');
  });

  // Example: Close sheet if a button inside it is clicked
  wcSheet.addEventListener('click', (event) => {
    if (event.target.closest('adw-button')) { // If any adw-button inside is clicked
      wcSheet.close();
      Adw.createToast(`WC Sheet action: ${event.target.textContent}`);
    }
  });

  wcSheet.addEventListener('close', () => {
    console.log('WC BottomSheet was closed.');
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_bottom_sheet.scss`.
*   The sheet itself (`.adw-bottom-sheet`) is typically positioned fixed at the bottom of the viewport and animates sliding up/down.
*   A backdrop (`.adw-bottom-sheet-backdrop`) is used to overlay the rest of the page content.
*   The sheet usually has rounded top corners and specific shadow/elevation.
*   Content within the sheet should be managed for scrolling if it exceeds available height.

---
Next: [Bin](./bin.md) (A simple layout container)

# BottomSheet

An AdwBottomSheet is a widget that slides up from the bottom of the screen, typically used to display contextual actions or more detailed information related to the current view. It can contain arbitrary content and often includes a bottom bar that might be visible when the sheet is closed.

## Web Component: `<adw-bottom-sheet>`

A declarative way to define an Adwaita BottomSheet.

**HTML Tag:** `<adw-bottom-sheet>`

**Attributes:**

*   `open` (Boolean attribute): Controls whether the sheet is visible (open) or hidden (closed). Add the attribute to open, remove to close.
*   `modal` (Boolean attribute, default: `true`): If present (or not set to `"false"`), the bottom sheet will be modal, typically showing a backdrop that blocks interaction with underlying content. Set `modal="false"` for a non-modal sheet.
*   `show-drag-handle` (Boolean attribute, default: `true`): If present (or not set to `"false"`), a drag handle is shown at the top of the sheet. Set `show-drag-handle="false"` to hide it.
*   `reveal-bottom-bar` (Boolean attribute, default: `true`): If present (or not set to `"false"`), the content slotted into `bottom-bar` is visible when the sheet is closed. Set `reveal-bottom-bar="false"` to hide the bottom bar always, or when the sheet is closed.
*   `can-open` (Boolean attribute, default: `true`): If set to `"false"`, user interactions (like clicking bottom bar or drag handle, or swiping - if implemented) cannot open the sheet. Programmatic opening via `open` attribute/property still works.
*   `can-close` (Boolean attribute, default: `true`): If set to `"false"`, user interactions (like backdrop click, Escape key, drag handle click, or swiping - if implemented) cannot close the sheet. Programmatic closing works.
*   `full-width` (Boolean attribute, default: `true`): If present (or not set to `"false"`), the sheet and bottom bar take the full width of their container. If `full-width="false"`, they take a portion of the width and can be aligned using the `align` attribute.
*   `align` (String, default: `fill` or `center`): If `full-width` is `false`, this attribute controls horizontal alignment. Possible values: `"start"`, `"center"`, `"end"`. (`fill` might imply full width within its constraints).

**Slots:**

*   Default slot: The main content of the screen/area that the bottom sheet overlays.
*   `sheet` (Named slot): Content to be displayed inside the sheet when it's open.
*   `bottom-bar` (Named slot): Content for the bottom bar, visible when the sheet is closed and `reveal-bottom-bar` is true.

**Events:**

*   `open`: Fired when the bottom sheet transitions to the open state.
*   `close`: Fired when the bottom sheet transitions to the closed state.
*   `close-attempt`: Fired if a user interaction tries to close the sheet but `can-close` is `false`.

**Methods (via JavaScript):**

*   `open()`: Programmatically opens the sheet by setting the `open` property to `true`.
*   `close()`: Programmatically closes the sheet by setting the `open` property to `false`.

**Properties (via JavaScript):**
*   `open` (Boolean): Gets or sets the open state.
*   `modal` (Boolean): Gets or sets the modal state.
*   `showDragHandle` (Boolean): Gets or sets the visibility of the drag handle.
*   `revealBottomBar` (Boolean): Gets or sets the visibility of the bottom bar when sheet is closed.
*   `canOpen` (Boolean): Gets or sets whether user interaction can open the sheet.
*   `canClose` (Boolean): Gets or sets whether user interaction can close the sheet.
*   `fullWidth` (Boolean): Gets or sets whether the sheet is full width.
*   `align` (String): Gets or sets the alignment when not full width.


**Example:**

```html
<adw-button id="open-bs-btn">Show BottomSheet</adw-button>

<adw-bottom-sheet id="my-bottom-sheet">
  <!-- This is the main page content over which the sheet appears -->
  <p>This is the main content of the page.</p>
  <p>More content here to demonstrate the sheet overlaying it.</p>

  <div slot="bottom-bar" style="display: flex; justify-content: space-around; align-items: center; padding: var(--spacing-xs);">
    <span>Now Playing: Song Title</span>
    <adw-button icon-name="media-playback-start-symbolic" circular flat title="Play"></adw-button>
  </div>

  <div slot="sheet" style="padding: var(--spacing-m);">
    <h4>Sheet Title</h4>
    <p>This is the content of the bottom sheet.</p>
    <adw-list-box>
      <adw-action-row title="Action 1"></adw-action-row>
      <adw-action-row title="Action 2"></adw-action-row>
    </adw-list-box>
    <adw-button id="close-bs-btn" style="margin-top: var(--spacing-m);">Close Sheet</adw-button>
  </div>
</adw-bottom-sheet>

<script>
  const bottomSheet = document.getElementById('my-bottom-sheet');
  const openBtn = document.getElementById('open-bs-btn');
  const closeBtn = document.getElementById('close-bs-btn'); // Assuming this button is inside the sheet slot

  if (openBtn) openBtn.addEventListener('click', () => bottomSheet.open = true);
  if (closeBtn) closeBtn.addEventListener('click', () => bottomSheet.open = false);

  bottomSheet.addEventListener('open', () => console.log('BottomSheet opened'));
  bottomSheet.addEventListener('close', () => console.log('BottomSheet closed'));
</script>
```

## JavaScript Factory: `createAdwBottomSheet()`

Creates an `<adw-bottom-sheet>` Web Component instance.

**Signature:**
```javascript
createAdwBottomSheet(options = {}) -> AdwBottomSheetElement // AdwBottomSheetElement is the class for <adw-bottom-sheet>
```

**Parameters:**
*   `options` (Object, optional): Configuration options, mapped to attributes of `<adw-bottom-sheet>`:
    *   `open`, `modal`, `showDragHandle`, `revealBottomBar`, `canOpen`, `canClose`, `fullWidth` (Booleans): Sets corresponding attributes. For boolean attributes, `true` means presence of attribute, `false` means absence (or `attr="false"` if explicit false is different from absence for the component). Factory typically sets attribute if option is true, or `attr="false"` if option is explicitly false and that's distinct.
    *   `align` (String): Sets the `align` attribute.
    *   `content` (Node): Node for the default slot (main page content).
    *   `sheetContent` (Node): Node for the `sheet` slot.
    *   `bottomBarContent` (Node): Node for the `bottom-bar` slot.
    *   `onOpen`, `onClose`, `onCloseAttempt` (Functions): Event listeners for corresponding events.

**Returns:**
*   `(AdwBottomSheetElement)`: The created `<adw-bottom-sheet>` instance.

## Styling

*   Primary SCSS: `scss/_bottom_sheet.scss`
*   Uses CSS variables for theming (background, shadows, border-radius, etc.).
*   The sheet animates from the bottom of the screen.
*   A backdrop is shown if `modal` is true and the sheet is open.
*   The drag handle is a small visual indicator at the top of the sheet.
---
Next: Documentation for other components like `Icon`, `WindowTitle`, etc.

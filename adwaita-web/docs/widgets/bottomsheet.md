# BottomSheet

The `.adw-bottom-sheet` class styles a container to appear as a bottom sheet, a panel that slides up from the bottom of the screen. This component is based on Libadwaita's `AdwBottomSheet`.

A backdrop element, styled with `.adw-bottom-sheet-backdrop`, is often used in conjunction with the bottom sheet.

## Basic Usage

The HTML structure typically involves a main container for the sheet and an optional backdrop. JavaScript is required to toggle the `.open` class for animations and visibility.

```html
<!-- Backdrop for the bottom sheet -->
<div class="adw-bottom-sheet-backdrop" id="myBottomSheetBackdrop"></div>

<!-- Bottom Sheet -->
<div class="adw-bottom-sheet" id="myBottomSheet">
  <div class="adw-bottom-sheet-drag-handle-area">
    <div class="adw-bottom-sheet-drag-handle"></div>
  </div>
  <div class="adw-bottom-sheet-header">
    <!-- Optional: AdwHeaderBar or custom header content -->
    <div class="adw-header-bar">
      <span class="adw-header-bar-title">Sheet Title</span>
    </div>
  </div>
  <div class="adw-bottom-sheet-content">
    <p>This is the content of the bottom sheet.</p>
    <p>It can be scrollable if the content exceeds the available height.</p>
    <!-- Add more content here -->
  </div>
</div>

<script>
  // Example JS to toggle the bottom sheet (you'll need more robust logic)
  const sheet = document.getElementById('myBottomSheet');
  const backdrop = document.getElementById('myBottomSheetBackdrop');
  // Add event listener to a button or trigger:
  // myTriggerButton.addEventListener('click', () => {
  //   sheet.classList.toggle('open');
  //   backdrop.classList.toggle('open');
  // });
  // backdrop.addEventListener('click', () => { // Close on backdrop click
  //   sheet.classList.remove('open');
  //   backdrop.classList.remove('open');
  // });
</script>
```

## Appearance

-   **Positioning:** Fixed to the bottom of the viewport.
-   **Background & Color:** Uses `--dialog-bg-color` and `--dialog-fg-color` by default, similar to dialogs.
-   **Shape:** Top corners are rounded using `var(--window-radius)`.
-   **Shadow:** Uses `var(--dialog-box-shadow)`.
-   **Animation:** Slides up from the bottom and fades in when the `.open` class is applied. Slides down and fades out when `.open` is removed.
-   **Max Height:** Limited to `90vh` to prevent covering the entire screen.

## Structure

-   **`.adw-bottom-sheet`**: The main container.
    -   **`.adw-bottom-sheet-drag-handle-area`** (Optional): Contains the `.adw-bottom-sheet-drag-handle` for a visual cue.
    -   **`.adw-bottom-sheet-header`** (Optional): Can contain an `.adw-header-bar` or other header content.
    -   **`.adw-bottom-sheet-content`**: The main scrollable content area.
-   **`.adw-bottom-sheet-backdrop`**: A separate element for the overlay behind the sheet.

## CSS Variables Used

-   `--dialog-bg-color`, `--dialog-fg-color`
-   `--window-radius`
-   `--dialog-box-shadow`
-   `--border-color` (for drag handle)
-   `--z-index-dialog` (or a dedicated bottom sheet z-index)
-   Animation variables (e.g., `--animation-duration-medium`, `--animation-ease-out-cubic`)

## Interactivity

All interactivity (showing, hiding, handling drag gestures if desired) must be implemented with JavaScript. Adwaita Skin provides the styling for the open and closed states.
The `.open` class on both the sheet and backdrop elements controls their visibility and triggers animations.

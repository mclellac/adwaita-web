# ProgressBar

An AdwProgressBar is used to display the progress of an operation, either as a determinate value (percentage) or as an indeterminate animation.

## JavaScript Factory: `Adw.createProgressBar()`

Creates an Adwaita-styled progress bar.

**Signature:**

```javascript
Adw.createProgressBar(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `value` (Number, optional): The current progress value, typically between 0 and 1 (or 0 and 100, implementation might vary, but 0-1 is common for progress elements). If provided, the progress bar is determinate.
    *   `isIndeterminate` (Boolean, optional): If `true`, the progress bar shows an indeterminate animation, ignoring the `value` property. Defaults to `false`.
    *   `disabled` (Boolean, optional): If `true`, may alter the appearance (e.g., muted colors), though progress bars are typically not interactive. Defaults to `false`.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the progress bar. This often wraps an inner element that represents the actual progress fill.

**Example:**

```html
<div id="js-progressbar-container" style="padding: 20px; max-width: 400px;"></div>
<script>
  const container = document.getElementById('js-progressbar-container');

  // Determinate ProgressBar
  container.appendChild(Adw.createLabel("Download Progress:"));
  const determinateBar = Adw.createProgressBar({ value: 0.3 }); // 30%
  container.appendChild(determinateBar);

  // Update progress after a delay
  setTimeout(() => {
    // Assuming the factory returns an element where we can update a CSS var or child width
    const fillElement = determinateBar.querySelector('.adw-progress-bar-fill');
    if (fillElement) fillElement.style.width = '75%';
    // Or, if the factory itself has an update method (not standard for this simple one):
    // determinateBar.setValue(0.75);
  }, 2000);

  container.appendChild(document.createElement('br'));

  // Indeterminate ProgressBar
  container.appendChild(Adw.createLabel("Processing... (Indeterminate):"));
  const indeterminateBar = Adw.createProgressBar({ isIndeterminate: true });
  container.appendChild(indeterminateBar);

  container.appendChild(document.createElement('br'));

  // Disabled ProgressBar
  container.appendChild(Adw.createLabel("Disabled Progress:"));
  const disabledBar = Adw.createProgressBar({ value: 0.5, disabled: true });
  container.appendChild(disabledBar);
</script>
```

## Web Component: `<adw-progress-bar>`

A declarative way to define Adwaita progress bars.

**HTML Tag:** `<adw-progress-bar>`

**Attributes:**

*   `value` (Number, optional): Current progress value (e.g., 0 to 1, or 0 to 100 - check component's expected range). If present, bar is determinate.
*   `indeterminate` (Boolean, optional): If present, shows indeterminate animation.
*   `disabled` (Boolean, optional): If present, may alter appearance.

**Properties:**
*   `value` (Number): Gets or sets the progress value.
*   `indeterminate` (Boolean): Gets or sets the indeterminate state.

**Example:**

```html
<div style="padding: 20px; max-width: 400px; display: flex; flex-direction: column; gap: 10px;">
  <div>
    <label for="wc-pbar1">Task Progress:</label>
    <adw-progress-bar id="wc-pbar1" value="0.65"></adw-progress-bar> <!-- 65% -->
  </div>

  <div>
    <p>Loading data (indeterminate):</p>
    <adw-progress-bar indeterminate></adw-progress-bar>
  </div>

  <div>
    <p>Old Task (disabled):</p>
    <adw-progress-bar value="0.9" disabled></adw-progress-bar>
  </div>
</div>

<script>
  const wcPbar1 = document.getElementById('wc-pbar1');
  let currentProgress = 0.65;
  // Simulate progress update for determinate bar
  // setInterval(() => {
  //   currentProgress += 0.05;
  //   if (currentProgress > 1) currentProgress = 0.1;
  //   wcPbar1.value = currentProgress; // Update property
  // }, 1000);
</script>
```

## Styling

*   Primary SCSS: `scss/_progressbar.scss`.
*   The progress bar consists of an outer track (`.adw-progress-bar-track`) and an inner fill element (`.adw-progress-bar-fill`).
*   **Determinate:** The width of the `.adw-progress-bar-fill` is set based on the `value`.
*   **Indeterminate:** The `.adw-progress-bar-fill` (or a child of it) has a continuous animation (e.g., a sliding bar or pulsing effect).
*   CSS variables like `--progress-bar-track-color` and `--progress-bar-fill-color` (often an accent color) are used.
*   The bar usually has rounded corners.

---
Next: [Checkbox](./checkbox.md)

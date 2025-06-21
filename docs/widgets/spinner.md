# Spinner

A Spinner is used to indicate that an operation is in progress and its duration is indeterminate. It's an animated visual cue.

## JavaScript Factory: `Adw.createSpinner()`

Creates an Adwaita-styled animated spinner.

**Signature:**

```javascript
Adw.createSpinner(options = {}) -> HTMLDivElement
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `size` (String, optional): A predefined size for the spinner (e.g., `"small"`, `"medium"`, `"large"`). If not provided, it uses a default size. These map to CSS classes or directly set dimensions. Alternatively, a direct CSS size (e.g. "24px") might be supported if the SCSS is flexible.
    *   `active` (Boolean, optional): If `true` (default), the spinner is visible and animating. If `false`, it might be hidden or stop animating (implementation dependent). The Web Component handles this via a `hidden` class.

**Returns:**

*   `(HTMLDivElement)`: The `<div>` element representing the spinner. The animation is typically CSS-driven.

**Example:**

```html
<div id="js-spinner-container" style="display: flex; align-items: center; gap: 20px; padding: 10px;"></div>
<script>
  const container = document.getElementById('js-spinner-container');

  // Default size spinner
  const spinner1 = Adw.createSpinner(); // Implicitly active
  container.appendChild(spinner1);

  // Small spinner
  const spinnerSmall = Adw.createSpinner({ size: "small" });
  container.appendChild(spinnerSmall);

  // Large spinner, initially inactive (will be hidden by WC logic)
  const spinnerLargeInactive = Adw.createSpinner({ size: "large", active: false });
  container.appendChild(spinnerLargeInactive);
  // Note: The JS factory itself might not add 'hidden'. The WC <adw-spinner active="false"> does.
  // For JS factory, you might need to manually hide it if active: false is passed.
  // spinnerLargeInactive.style.display = 'none'; // Manual hide for factory if active:false

  // Button to toggle spinner visibility/activity (conceptual)
  const loadingButton = Adw.createButton("Load Data");
  const loadingSpinner = Adw.createSpinner({ size: "small" });
  loadingSpinner.style.display = 'none'; // Start hidden for JS factory
  loadingSpinner.style.marginLeft = 'var(--spacing-xs)';

  const loadingBox = Adw.createBox({children: [loadingButton, loadingSpinner], align: 'center'});
  container.appendChild(loadingBox);

  let isLoading = false;
  loadingButton.addEventListener('click', () => {
    isLoading = !isLoading;
    loadingSpinner.style.display = isLoading ? '' : 'none';
    // For Web Component: loadingSpinner.active = isLoading;
    loadingButton.disabled = isLoading;
    loadingButton.textContent = isLoading ? "Loading..." : "Load Data";
    if (isLoading) {
        setTimeout(() => {
            isLoading = false;
            loadingSpinner.style.display = 'none';
            loadingButton.disabled = false;
            loadingButton.textContent = "Load Data";
            Adw.createToast("Data loaded!");
        }, 2000);
    }
  });
</script>
```

## Web Component: `<adw-spinner>`

A declarative way to use Adwaita spinners.

**HTML Tag:** `<adw-spinner>`

**Attributes:**

*   `size` (String, optional): Predefined size (e.g., `"small"`, `"medium"`, `"large"`).
*   `active` (Boolean, optional): If present and not `"false"`, the spinner is visible and animating. If `"false"` or attribute is absent, the spinner is hidden (via `.hidden` class). Defaults to `true` if attribute is present without a value.

**Example:**

```html
<div style="display: flex; align-items: center; gap: 20px; padding: 10px;">
  <p>Processing: </p>
  <adw-spinner active></adw-spinner>

  <p>Small task: </p>
  <adw-spinner active size="small"></adw-spinner>

  <p>Large task: </p>
  <adw-spinner active size="large"></adw-spinner>

  <p>Initially inactive: </p>
  <adw-spinner id="my-inactive-spinner" active="false" size="medium"></adw-spinner>
</div>

<adw-button id="toggle-spinner-btn">Toggle Inactive Spinner</adw-button>
<script>
  const inactiveSpinner = document.getElementById('my-inactive-spinner');
  const toggleBtn = document.getElementById('toggle-spinner-btn');
  toggleBtn.addEventListener('click', () => {
    const currentlyActive = inactiveSpinner.getAttribute('active') !== 'false';
    inactiveSpinner.setAttribute('active', currentlyActive ? 'false' : 'true');
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_spinner.scss`.
*   The animation is typically achieved using CSS animations (e.g., `@keyframes` rotating an element or SVG).
*   `--spinner-color` or similar CSS variable might be used, often defaulting to `currentColor` or `--accent-fg-color` / `--accent-bg-color` depending on context.
*   Size classes (e.g., `.adw-spinner-small`) will set appropriate `width` and `height`.
*   The `.hidden` class (applied when `active="false"`) sets `display: none;`.

---
Next: [StatusPage](./statuspage.md)

# Flap

An AdwFlap is a container with two children: a "flap" and a "main content" area. The flap can be revealed or hidden, often used for sidebars or secondary information panels that can slide in and out or be folded away.

## JavaScript Factory: `Adw.createFlap()`

Creates an Adwaita-styled flap container.

**Signature:**

```javascript
Adw.createFlap(options = {}) -> { element: HTMLDivElement, toggleFlap: function, setFolded: function(boolean), isFolded: function }
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `flapContent` (HTMLElement, required): The HTML element for the flap area.
    *   `mainContent` (HTMLElement, required): The HTML element for the main content area.
    *   `isFolded` (Boolean, optional): If `true`, the flap is initially folded (hidden or in its compact state). Defaults to `false`.
    *   `flapWidth` (String, optional): CSS value for the width of the flap when revealed (e.g., "250px", "30%"). Defaults to a value defined in SCSS (e.g., `var(--flap-default-width)`).
    *   `transitionSpeed` (String, optional): CSS transition duration for the fold/unfold animation (e.g., "0.3s"). Defaults to SCSS defined speed.
    *   `onToggle` (Function, optional): Callback when the flap's folded state changes. Receives a boolean `isFolded` argument.

**Returns:**

*   An `Object` with the following properties:
    *   `element` (HTMLDivElement): The main `<div>` element of the flap container.
    *   `toggleFlap(explicitState?: boolean)`: Method to toggle the flap's folded state. Optionally accepts a boolean to explicitly set the state (`true` for folded, `false` for unfolded).
    *   `setFolded(isFolded: boolean)`: Method to set the flap's state.
    *   `isFolded()`: Method that returns `true` if the flap is currently folded, `false` otherwise.

**Example:**

```html
<div id="js-flap-container"
     style="height: 250px; border: 1px solid var(--borders-color);
            position: relative; overflow: hidden;">
  <!-- Button to trigger flap will be added here -->
</div>
<script>
  const flapDemoContainer = document.getElementById('js-flap-container');
  const triggerButtonContainer = document.createElement('div');
  triggerButtonContainer.style.padding = "var(--spacing-s)";


  const flapContentEl = document.createElement('div');
  flapContentEl.innerHTML = '<h4>Flap Content</h4><p>This is the flap area. ' +
                            'It can contain navigation or tools.</p>';
  flapContentEl.style.padding = "var(--spacing-m)";
  flapContentEl.style.backgroundColor = "var(--sidebar-bg-color)"; // Example background
  flapContentEl.style.height = "100%";


  const mainContentEl = document.createElement('div');
  mainContentEl.innerHTML = '<h3>Main Content Area</h3><p>This is where the ' +
                            'primary content goes.</p>';
  mainContentEl.style.padding = "var(--spacing-m)";

  const myFlap = Adw.createFlap({
    flapContent: flapContentEl,
    mainContent: mainContentEl,
    isFolded: true, // Start folded
    flapWidth: "200px",
    onToggle: (isFolded) => {
      Adw.createToast(`Flap is now ${isFolded ? 'folded' : 'unfolded'}`);
      toggleBtn.textContent = isFolded ? "Show Flap" : "Hide Flap";
    }
  });

  const toggleBtn = Adw.createButton("Show Flap", {
    onClick: () => myFlap.toggleFlap()
  });
  triggerButtonContainer.appendChild(toggleBtn);

  // Add the flap element to its container, and the trigger button outside or as part of main content
  flapDemoContainer.appendChild(triggerButtonContainer); // Button outside flap for this demo
  flapDemoContainer.appendChild(myFlap.element);
  myFlap.element.style.height = "calc(100% - 50px)"; // Adjust height if button is inside container
</script>
```

## Web Component: `<adw-flap>`

A declarative way to define Adwaita flaps.

**HTML Tag:** `<adw-flap>`

**Attributes:**

*   `folded` (Boolean, optional): If present, the flap is initially folded.
*   `flap-width` (String, optional): CSS width for the flap when revealed (e.g., "250px").
*   `transition-speed` (String, optional): CSS transition duration (e.g., "0.3s").

**Slots:**

*   `flap`: Content for the flap panel.
*   `main` (or default slot): Content for the main area.

**Events:**

*   `toggled`: Fired when the flap's `folded` state changes. `event.detail` may contain `{ isFolded: boolean }`. (Verify event details).

**Methods:**

*   `toggleFlap(explicitState?: boolean)`: Toggles or sets the folded state.
*   `setFolded(isFolded: boolean)`: Sets the folded state.
*   `isFolded()`: Returns the current folded state.

**Example:**

```html
<adw-button id="wc-flap-toggle-btn">Toggle Flap</adw-button>
<adw-flap id="my-wc-flap" folded flap-width="280px"
          style="height: 300px; border: 1px solid var(--borders-color);
                 margin-top: 5px;">
  <div slot="flap"
       style="background-color: var(--popover-bg-color);
              padding: var(--spacing-m); height: 100%;">
    <h4>Sidebar Flap</h4>
    <ul>
      <li>Navigation Item 1</li>
      <li>Navigation Item 2</li>
    </ul>
  </div>

  <div slot="main" style="padding: var(--spacing-m);"> <!-- Or use default slot -->
    <h3>Main Application Content</h3>
    <p>This content remains visible, and the flap slides over or reflows next
    to it.</p>
  </div>
</adw-flap>

<script>
  const wcFlap = document.getElementById('my-wc-flap');
  const wcFlapToggleBtn = document.getElementById('wc-flap-toggle-btn');

  wcFlapToggleBtn.addEventListener('click', () => {
    wcFlap.toggleFlap();
  });

  wcFlap.addEventListener('toggled', (event) => { // Assuming 'toggled' event
    // const isNowFolded = event.detail.isFolded;
    const isNowFolded = wcFlap.isFolded(); // Or check property/attribute
    Adw.createToast(`WC Flap is now ${isNowFolded ? 'folded' : 'unfolded'}`);
    wcFlapToggleBtn.textContent = isNowFolded ? 'Show Flap' : 'Hide Flap';
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_flap.scss`.
*   The component uses CSS transitions for the folding/sliding animation.
*   Layout typically involves `position: absolute` or `flexbox` to manage the flap and content areas.
*   The flap might overlay content or cause the main content to reflow, depending on its specific implementation and styling (e.g., `reveal-type` property in native Adwaita). This web version usually implements a slide-over or simple fold.

---
Next: [Spinner](./spinner.md)

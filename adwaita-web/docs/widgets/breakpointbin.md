# BreakpointBin

An AdwBreakpointBin is a container that displays one of its children based on the available width. It allows for responsive layouts where different child elements are shown at different breakpoints (e.g., a narrow view for small screens, a wider view for larger screens).

## JavaScript Factory: `Adw.createBreakpointBin()`

Creates an Adwaita-styled breakpoint bin container.

**Signature:**

```javascript
Adw.createBreakpointBin(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, required): Configuration options:
    *   `children` (Array<Object>, required): An array of child objects. Each
        object defines a child view and its condition:
        *   `name` (String, required): A unique name for this child/breakpoint.
        *   `element` (HTMLElement, required): The HTML element to display for this
            breakpoint.
        *   `condition` (String | Number, required): The condition for displaying
            this child.
            *   If a Number, it's interpreted as the minimum width in pixels
                (e.g., `600`).
            *   If a String, it should be a valid media query condition, typically
                `min-width` (e.g., `"min-width: 768px"`). The factory primarily
                parses numerical min-width from this string.
    *   `defaultChildName` (String, optional): The `name` of the child to show if
        no conditions match or if `ResizeObserver` is unavailable. Usually, this
        would be the child intended for the smallest screen size. If not specified,
        the child with the smallest `min-width` condition is often chosen as a
        fallback.

**Returns:**

*   `(HTMLDivElement)`: The created `<div>` element for the breakpoint bin. It's augmented with methods:
    *   `updateVisibility()`: Manually triggers a re-evaluation of which child to display.
    *   `startObserving()`: Starts the `ResizeObserver` to automatically update visibility on resize. (Called internally if element is in DOM).
    *   `stopObserving()`: Stops the `ResizeObserver`.

**Example:**

```html
<div id="js-breakpointbin-container"
     style="border: 1px solid var(--borders-color); padding: var(--spacing-s);
            resize: horizontal; overflow: auto; width: 500px;
            min-width: 250px; max-width: 800px;">
  <p><em>Resize this container horizontally to see different children.</em></p>
</div>
<script>
  const container = document.getElementById('js-breakpointbin-container');

  // Define children for different breakpoints
  const childSmall = Adw.createLabel("Small View (<400px)", {title: 2});
  childSmall.style.padding="10px"; childSmall.style.backgroundColor="var(--adw-red-1)";

  const mediumChildren = [Adw.createButton("Medium A"), Adw.createButton("Medium B")];
  const childMedium = Adw.createBox({ orientation: "horizontal", spacing: "m", children: mediumChildren});
  childMedium.style.padding="10px"; childMedium.style.backgroundColor="var(--adw-yellow-1)";

  const childLarge = Adw.createStatusPage({
    title: "Large View (>=600px)", description: "Showing full details."
  });
  childLarge.style.backgroundColor="var(--adw-green-1)";


  const breakpointBin = Adw.createBreakpointBin({
    children: [
      { name: "small", element: childSmall, condition: 0 }, // Smallest, effectively default if no defaultChildName
      { name: "medium", element: childMedium, condition: 400 }, // Show if width >= 400px
      { name: "large", element: childLarge, condition: "min-width: 600px" } // Show if width >= 600px
    ],
    // defaultChildName: "small" // Explicitly set default
  });

  container.appendChild(breakpointBin);

  // The factory usually tries to start observing if ResizeObserver is available.
  // If manual control is needed or it's added to DOM later:
  if (breakpointBin.startObserving) {
      // Ensure it's in DOM before observing, or use a small timeout
      // requestAnimationFrame(() => breakpointBin.startObserving());
  }
</script>
```

## Web Component: `<adw-breakpoint-bin>`

A declarative way to use Adwaita breakpoint bins.

**HTML Tag:** `<adw-breakpoint-bin>`

**Attributes:**

*   `default-child-name` (String, optional): The `data-name` of the child element to show by default if no other condition matches.

**Slots:**

*   Default slot: Place child elements here. Each direct child element intended for breakpoint switching **must** have:
    *   `data-name` (String, required): A unique name for this view/breakpoint.
    *   `data-condition` (String or Number, required): The condition for displaying this child (e.g., `600` for min-width 600px, or `"min-width: 768px"`).

**Events:**
*   `child-changed`: Fired when the visible child changes. `event.detail` may contain `{ visibleChildName: String }`.

**Example:**

```html
<adw-breakpoint-bin default-child-name="mobile"
      style="border: 1px solid var(--borders-color); padding: var(--spacing-s);
             resize: horizontal; overflow: auto; width: 500px;
             min-width: 200px; max-width: 100%;">
  <p><em>Resize this container horizontally.</em></p>

  <div data-name="mobile" data-condition="0"
       style="background-color: var(--adw-blue-1); padding: 10px;">
    <h4>Mobile View</h4>
    <p>Content for small screens.</p>
  </div>

  <div data-name="tablet" data-condition="500" style="background-color: var(--adw-orange-1); padding: 10px;">
    <h4>Tablet View (>=500px)</h4>
    <adw-button>Tablet Action 1</adw-button>
    <adw-button>Tablet Action 2</adw-button>
  </div>

  <div data-name="desktop" data-condition="min-width: 800px"
       style="background-color: var(--adw-green-1); padding: 10px;">
    <h4>Desktop View (>=800px)</h4>
    <p>Full content with more details shown here.</p>
    <adw-entry-row title="Search Desktop Content"></adw-entry-row>
  </div>
</adw-breakpoint-bin>

<script>
  const wcBreakpointBin = document.querySelector('adw-breakpoint-bin');
  wcBreakpointBin.addEventListener('child-changed', (event) => {
    console.log("BreakpointBin visible child:", event.detail.visibleChildName);
  });
</script>
```

## Styling & Behavior

*   **Styling:** There is no dedicated SCSS file (`_breakpoint_bin.scss`) for `AdwBreakpointBin` itself in Adwaita Web. The component is primarily JavaScript-driven.
    *   The `AdwBreakpointBin` container is typically a simple `div` (`display: block;`). Its own styling (borders, padding, etc.) should be applied manually or via utility classes if needed for visual presentation (as seen in the `index.html` showcase).
    *   The appearance of the children is determined by their own content and styling.
*   **Behavior:**
    *   It uses a `ResizeObserver` (if available) to monitor its own width.
    *   Based on its width, it dynamically changes the `display` style of its direct child elements that have `data-name` and `data-condition` attributes (setting `display: none` for hidden children and restoring the original display style or setting `display: block` for the visible one).
*   Children are evaluated based on their `condition` (sorted by min-width), and the largest one that matches the current width is displayed.

---
Next: [ToolbarView](./toolbarview.md)

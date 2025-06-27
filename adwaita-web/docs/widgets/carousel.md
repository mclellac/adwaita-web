# Carousel

An AdwCarousel widget is used to display a series of slides (typically images or rich content) in a cyclic view, often with indicators and navigation buttons.

## JavaScript Factory: `Adw.createAdwCarousel()`

Creates an Adwaita-styled carousel.

**Signature:**

```javascript
Adw.createAdwCarousel(options = {}) -> HTMLDivElement (with methods)
```

**Parameters:**

*   `options` (Object, optional): Configuration options:
    *   `slides` (Array<HTMLElement | Object>, optional): Array of slide elements or objects.
        *   If HTMLElement: it's directly used as a slide.
        *   If Object: `{ content: HTMLElement, thumbnail?: string (URL for indicator thumbnail) }`.
    *   `showIndicators` (Boolean, optional): Whether to show dot/thumbnail indicators. Defaults to `true`.
    *   `showNavButtons` (Boolean, optional): Whether to show previous/next navigation buttons. Defaults to `false`.
    *   `loop` (Boolean, optional): Whether the carousel should loop. Defaults to `true`.
    *   `autoplay` (Boolean, optional): Whether the carousel should play automatically. Defaults to `false`.
    *   `autoplayInterval` (Number, optional): Interval for autoplay in milliseconds. Defaults to `5000`.
    *   `indicatorStyle` (String, optional): Style of indicators. Can be `'dots'` (default) or `'thumbnails'`.

**Returns:**

*   `(HTMLDivElement)`: The main `<div>` element for the carousel. It's augmented with methods:
    *   `goTo(index: number)`
    *   `next()`
    *   `prev()`
    *   `getCurrentIndex() -> number`
    *   `stopAutoplay()`
    *   `startAutoplay()`

**Example:**

```html
<div id="js-carousel-container" style="max-width: 500px; margin: auto;"></div>
<script>
  const container = document.getElementById('js-carousel-container');

  const slide1 = document.createElement('div');
  slide1.style.cssText = "background-color: var(--adw-blue-1); height: 200px; " +
    "display:flex; align-items:center; justify-content:center; " +
    "color: var(--adw-blue-5); font-size: 2em;";
  slide1.textContent = "Slide 1";

  const slide2 = document.createElement('img');
  slide2.src = "app-demo/static/img/default_avatar.png"; // Replace with actual image
  slide2.alt = "Slide 2 Image";
  slide2.style.cssText = "object-fit: cover; width: 100%; height: 200px;";

  const slide3Content = Adw.createStatusPage({title: "Slide 3", description:"This is a status page in a slide."});

  const myCarousel = Adw.createAdwCarousel({
    slides: [
      slide1,
      { content: slide2, thumbnail: "app-demo/static/img/default_avatar.png" }, // Thumbnail for image slide
      { content: slide3Content }
    ],
    showNavButtons: true,
    autoplay: true,
    autoplayInterval: 3000,
    indicatorStyle: "dots" // or "thumbnails" if you have thumbnail URLs for all
  });

  container.appendChild(myCarousel);

  // Example of external control
  // setTimeout(() => myCarousel.goTo(0), 10000); // Go to first slide after 10s
</script>
```

## Web Component: `<adw-carousel>`

A declarative way to define Adwaita carousels.

**HTML Tag:** `<adw-carousel>`

**Attributes:**

*   `show-indicators` (Boolean, optional): Default `true`. Set to `"false"` to hide.
*   `show-nav-buttons` (Boolean, optional): Default `false`. Add attribute to show.
*   `loop` (Boolean, optional): Default `true`. Set to `"false"` to disable looping.
*   `autoplay` (Boolean, optional): Default `false`. Add attribute to enable autoplay.
*   `autoplay-interval` (Number, optional): Autoplay interval in ms. Default `5000`.
*   `indicator-style` (String, optional): `'dots'` (default) or `'thumbnails'`.

**Slots:**

*   Default slot: Place child elements here that will act as slides. Each direct child is treated as a slide.
    *   To provide a thumbnail for a slide when `indicator-style="thumbnails"`, add a `data-thumbnail="URL_TO_THUMBNAIL_IMAGE"` attribute to the slide element.

**Events:**

*   `slide-changed`: Fired when the active slide changes. `event.detail` contains `{ currentIndex: Number }`.

**Methods:**

*   `goTo(index: number)`
*   `next()`
*   `prev()`
*   `getCurrentIndex() -> number`
*   `stopAutoplay()`
*   `startAutoplay()`

**Example:**

```html
<adw-carousel show-nav-buttons autoplay autoplay-interval="3500"
              indicator-style="dots" id="wc-carousel"
              style="max-width: 600px; margin: auto;
                     border: 1px solid var(--borders-color);">
  <div style="background-color: var(--adw-purple-1); height: 250px;
              display:flex; align-items:center; justify-content:center;
              color: var(--adw-purple-5); font-size: 2.5em;">
    First Slide (Declarative)
  </div>
  <img src="app-demo/static/img/default_avatar.png" alt="Image Slide"
       data-thumbnail="app-demo/static/img/default_avatar.png"
       style="width:100%; height:250px; object-fit:contain;
              background-color: var(--shade-color);">
  <div style="background-color: var(--adw-green-1); height: 250px; padding: 20px;">
    <h4>Rich Content Slide</h4>
    <p>This slide contains various HTML elements.</p>
    <adw-button suggested>Click Me</adw-button>
  </div>
</adw-carousel>

<script>
  const wcCarousel = document.getElementById('wc-carousel');
  wcCarousel.addEventListener('slide-changed', (event) => {
    console.log("WC Carousel changed to slide:", event.detail.currentIndex);
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_carousel.scss`.
*   The carousel uses a flex container (`.adw-carousel-content-area`) for slides, translating it horizontally for transitions.
*   Indicators (`.adw-carousel-indicators`) and navigation buttons (`.adw-carousel-nav-button`) are positioned absolutely over the content area.
*   Thumbnail indicators require `background-image` to be set on indicator buttons.
*   CSS transitions are used for the sliding effect.

---
Next: [ToggleButton](./togglebutton.md)

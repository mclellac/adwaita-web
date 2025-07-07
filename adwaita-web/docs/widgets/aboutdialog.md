# AboutDialog

An AboutDialog displays information about an application, such as its name, version, copyright, website, developers, and license. Adwaita Web provides the `<adw-about-dialog>` Web Component for this purpose.

*(Note: Previous versions of this documentation may have described a JavaScript factory like `Adw.createAboutDialog()`. As of the current review, this specific factory function was not found in the core `adwaita-web/js` source. Usage should primarily rely on the Web Component.)*

## Web Component: `<adw-about-dialog>`

A declarative way to define Adwaita "About" dialogs. This component encapsulates the structure and behavior of an about dialog.

**HTML Tag:** `<adw-about-dialog>`

**Attributes:**

*   `app-name` (String)
*   `app-icon` (String - URL or class)
*   `logo` (String - URL)
*   `version` (String)
*   `copyright` (String)
*   `developer-name` (String)
*   `website` (String - URL)
*   `website-label` (String)
*   `license-type` (String - SPDX identifier)
*   `comments` (String)
*   `open` (Boolean): Controls visibility.

**Slots:**

*   `app-icon`: For a more complex app icon (e.g., an `<img>` tag if `app-icon` attribute isn't used).
*   `logo`: For a more complex logo element (e.g., an `<img>` tag if `logo` attribute isn't used).
*   `comments`: For the main application description if not provided via attribute.
*   `license-text`: For the full license text.
*   `developers`: An `<ul>` or `<ol>` or comma-separated text for the list of developers.
*   `designers`: List of designers.
*   `documenters`: List of documenters.
*   `artists`: List of artists.
*   `translator-credits`: Text for translator credits.
*   `acknowledgements`: For acknowledgements. Each direct child can be a simple text/paragraph, or a `<div>` with a `title` attribute for grouped acknowledgements (names as text content, comma-separated).

**Events:**

*   `open`: Fired when the dialog opens.
*   `close`: Fired when the dialog closes.

**Methods:**

*   `open()`: Shows the dialog.
*   `close()`: Hides the dialog.

**Example:**

```html
<adw-button id="wc-about-btn">About This App (WC)</adw-button>

<adw-about-dialog id="my-wc-about"
  app-name="My Web App"
  version="0.9.0"
  copyright="© 2023 ACME Corp"
  developer-name="The ACME Team"
  website="https://acme.example.com"
  license-type="MIT">
  <!-- Logo via slot -->
  <img slot="logo" src="app-demo/static/img/default_avatar.png" alt="App Logo"
       style="width: 64px; height: 64px; border-radius: var(--border-radius-default);">
  <!-- Comments via slot -->
  <p slot="comments">
    This is a demonstration of the Adwaita-Web About Dialog using Web Components.
    It showcases how to provide various pieces of information about an application.
  </p>
  <ul slot="developers">
    <li>Alice Wonderland</li>
    <li>Bob The Builder</li>
  </ul>
  <div slot="acknowledgements">
    <div title="Frameworks Used">Adwaita-Web, CoolLib.js</div>
    <p>Special thanks to everyone who tested this.</p>
  </div>
  <pre slot="license-text">
The MIT License (MIT)
Copyright (c) 2023 ACME Corp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software")...
  </pre>
</adw-about-dialog>

<script>
  const wcAbout = document.getElementById('my-wc-about');
  const wcAboutBtn = document.getElementById('wc-about-btn');

  wcAboutBtn.addEventListener('click', () => {
    wcAbout.open();
  });

  wcAbout.addEventListener('close', () => {
    console.log('WC About Dialog closed.');
  });
</script>
```

## Styling

*   Primary SCSS: `scss/_about_dialog.scss` (builds on `_dialog.scss`).
*   Features distinct sections for app info, logo, main details, and often an expander for credits/license.
*   Styling aims to match the native GTK Adwaita About Dialog.

---
Next: [PreferencesDialog](./preferencesdialog.md)

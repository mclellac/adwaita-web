# AboutDialog

An AboutDialog displays information about an application, such as its name, version, copyright, website, developers, and license.

## JavaScript Factory: `Adw.createAboutDialog()`

Creates and manages an Adwaita-styled "About" dialog.

**Signature:**

```javascript
Adw.createAboutDialog(options = {}) -> { dialog: HTMLDivElement, open: function, close: function }
```

**Parameters:**

*   `options` (Object, required): Configuration options for the about dialog. Many fields are optional but providing more information makes the dialog richer.
    *   `appName` (String, optional): The name of the application.
    *   `appIcon` (String, optional): URL or CSS class for the application icon (small icon).
    *   `logo` (String, optional): URL for a larger logo image displayed prominently.
    *   `version` (String, optional): Application version string.
    *   `copyright` (String, optional): Copyright information (e.g., "© 2023 Your Name").
    *   `developerName` (String | Array<String>, optional): Name(s) of the primary
        developer(s).
    *   `website` (String, optional): URL of the application's or developer's website.
    *   `websiteLabel` (String, optional): Custom label for the website link
        (defaults to the URL itself).
    *   `licenseType` (String, optional): SPDX license identifier (e.g., "MIT",
        "GPL-3.0-or-later"). Will attempt to link to spdx.org.
    *   `licenseText` (String, optional): The full text of the license, if not
        using a standard SPDX type or for custom licenses. Often displayed in a
        scrollable area or expander.
    *   `comments` (String, optional): General comments or a brief description of the
        application.
    *   `developers` (Array<String>, optional): List of developers.
    *   `designers` (Array<String>, optional): List of designers.
    *   `documenters` (Array<String>, optional): List of documenters.
    *   `translatorCredits` (String, optional): Credits for translators.
    *   `artists` (Array<String>, optional): List of artists.
    *   `acknowledgements` (Array<String | Object>, optional): List of
        acknowledgements. Can be strings or objects like
        `{title: "Group Name", names: ["Person A", "Library B"]}`.
    *   `onClose` (Function, optional): Callback executed when the dialog is closed.

**Returns:**

*   An `Object` with dialog instance (`dialog`), `open()` and `close()` methods.

**Example:**

```html
<div id="js-aboutdialog-trigger"></div>
<script>
  const triggerContainer = document.getElementById('js-aboutdialog-trigger');

  const showAboutBtn = Adw.createButton("About This App (JS)", {
    onClick: () => {
      const aboutDialog = Adw.createAboutDialog({
        appName: "My Awesome App",
        appIcon: "antisocialnet/static/img/default_avatar.png", // Path to a small icon
        logo: "antisocialnet/static/img/default_avatar.png",    // Path to a larger logo
        version: "1.2.3",
        copyright: "© 2023 Developer Name",
        developerName: "The Developer Team",
        website: "https://example.com",
        websiteLabel: "Visit our Website",
        comments: "This application helps you do amazing things with web " +
                  "technologies, styled with Adwaita!",
        licenseType: "GPL-3.0-or-later",
        // licenseText: "Full license text here if not using SPDX or for custom details...",
        developers: ["Dev A", "Dev B"],
        designers: ["Designer X"],
        acknowledgements: [
            "Special thanks to the Adwaita-Web project.",
            { title: "Powered By", names: ["Coffee", "Determination"] }
        ],
        onClose: () => console.log("About dialog closed.")
      });
      aboutDialog.open();
    }
  });
  triggerContainer.appendChild(showAboutBtn);
</script>
```

## Web Component: `<adw-about-dialog>`

A declarative way to define Adwaita "About" dialogs.

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
  <img slot="logo" src="antisocialnet/static/img/default_avatar.png" alt="App Logo"
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

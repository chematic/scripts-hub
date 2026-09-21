# Azuno Frontend

Static frontend for the Azuno Script Hub.

## Included

- Animated glass UI with cursor tilt and diagonal light sweep
- Script cards with stable bottom actions even with long descriptions
- Search and category filters
- Dual accent colors for cards
- SVG favicon and web manifest
- Discord social preview metadata and local OG image
- Creator callout with Discord copy button
- Admin dashboard with cleaner card editor

## Configure

`site-config.js` points to the current Worker:

```js
window.AZU_CONFIG = Object.freeze({
  API_BASE: "https://azuscripts-api.zizicacadelafrance.workers.dev",
  BRAND: "Azuno",
  SITE_TITLE: "Azuno | Script Hub"
});
```

For the best Discord preview, keep `assets/og-card.png` on the same public site path.

## HWID

A normal browser cannot read a genuine Windows machine serial. The included `get-hwid.ps1` helper creates the local 64-character fingerprint used by the hub.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\get-hwid.ps1
```

## Admin

Open `admin.html` and sign in with the User ID and HWID already authorized by the backend.

Cards now support:

- preset gradients
- custom accent start and end colors
- separate Game and Category fields
- status and version
- thumbnail and HTTPS redirect
- tags


## Discord preview

Discord can read the OG image from your public site. Once you know the final site origin, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\set-site-origin.ps1 -Origin "https://your-domain.example"
```

This writes the absolute `og:image`, `twitter:image`, and `og:url` values into the static HTML.

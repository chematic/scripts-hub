# AzuScripts Frontend

Static frontend for the AzuScripts hub.

## Configure

`site-config.js` already points at the current Worker:

```js
window.AZU_CONFIG = Object.freeze({
  API_BASE: "https://azuscripts-api.zizicacadelafrance.workers.dev",
  BRAND: "AzuScripts",
  SITE_TITLE: "AzuScripts — Script Hub"
});
```

Upload this folder to your GitHub Pages repository or another static host.

## Admin

Open `admin.html`.

Sign in with your User ID and 64-character HWID fingerprint. The API checks the user, authorized device and current IP before issuing a 12-hour session.

The admin area includes:

- card creation/editing/deletion
- separate Game + Category fields
- live card preview
- gradient presets + custom accent
- user role/status controls
- device authorization/revocation
- session revocation
- daily quota reset
- recent activity

## HWID

A normal browser cannot read a genuine Windows machine serial/HWID. `get-hwid.ps1` creates the local fingerprint used by the hub.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\get-hwid.ps1
```

## Security

The browser is treated as untrusted. It cannot grant itself an admin role, edit another user's card or change the creator quota.

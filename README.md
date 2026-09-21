# AzuScripts Frontend

Static frontend for the AzuScripts hub. It contains no database credentials and no GitHub token.

## Configure

Edit `site-config.js`:

```js
window.AZU_CONFIG = Object.freeze({
  API_BASE: "https://YOUR-WORKER.workers.dev",
  BRAND: "AzuScripts",
  SITE_TITLE: "AzuScripts — Script Hub"
});
```

Upload the folder to a GitHub repository and enable GitHub Pages, or deploy it to Cloudflare Pages.

## HWID

Browsers cannot directly read a Windows machine HWID. `get-hwid.ps1` hashes several Windows hardware identifiers locally and copies the resulting SHA-256 fingerprint. A user can run it, then provide the fingerprint to the hub owner for authorization.

The website's “Copy HWID command” button copies:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\get-hwid.ps1
```

## Important

`admin.html` is a static file, so it can technically be downloaded from a static host. Security is enforced by the backend API: every authenticated read/write checks the session, device authorization, IP and ownership/role rules. A user who modifies the frontend cannot grant themselves backend permissions.

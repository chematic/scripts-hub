# Azuno Frontend

Static frontend for the Azuno script hub and dashboard.

This build keeps the existing backend API contract. No Worker or D1 changes are required.

## API

`site-config.js` points to the existing Worker:

```js
window.AZU_CONFIG = Object.freeze({
  API_BASE: "https://azuscripts-api.zizicacadelafrance.workers.dev",
  BRAND: "AzuScripts",
  SITE_TITLE: "AzuScripts | Script Hub"
});
```

## Deploy

Upload the contents of `FRONTEND` to the GitHub Pages repository. After pushing, hard refresh once if the browser keeps an older CSS or JS cache.

## Existing API routes used

Public: `/api/catalog`

Admin: `/api/auth/login`, `/api/auth/logout`, `/api/me`, `/api/me/cards`, `/api/me/ip`, `/api/cards`, `/api/admin/stats`, `/api/admin/users`, `/api/admin/devices`, `/api/admin/audit`, plus the existing card, quota, session, user and device mutation routes.

The UI does not require any backend migration. The editor sends the same existing card fields. The second accent color is shown in the UI for visual use when supported by the current card data, while the existing `accent` field remains the write-time value sent to the backend.

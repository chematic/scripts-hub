# Azuno Frontend

Frontend-only redesign. The existing Cloudflare Worker, D1 database, secrets and API contract are unchanged.

## Pages
- `index.html` public hub
- `admin.html` creator/admin dashboard
- `docs.html` FAQ and usage guide

## API
The frontend keeps the existing API base and routes. No backend migration is required for this frontend update.

## Themes
Night, Spring, Summer, Autumn and Winter are client-side themes saved in the current browser.

## HWID command
The dashboard copies a self-contained Command Prompt / PowerShell command that computes the same SHA-256 based HWID format used by the existing helper.

## Deploy
Upload the frontend files to the existing GitHub Pages repository. No Worker or D1 changes are required.

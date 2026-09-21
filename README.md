

## GitHub Pages animation fix
This build cache-busts static assets and initializes cursor tilt before the API request. Card motion uses mouseenter/mousemove/mouseleave and remains active even if the catalog API is slow or unavailable. Public API access still requires the Worker CORS allow-list to include the GitHub Pages origin.

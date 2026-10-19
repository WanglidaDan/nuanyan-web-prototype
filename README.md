# 暖言小站 · 员工建议平台

`src/` contains the desktop and mobile frontend for lidawang.work. The main feedback workflow uses the existing FastAPI service for employee login, registration, password reset, feedback submission, and viewing personal feedback. API requests use same-origin `/api/v1` paths and HttpOnly session cookies.

## Preview

```sh
python3 build.py
python3 -m http.server -d dist 8787
```

Open <http://localhost:8787> for a visual preview. The preview server does not provide the API; authentication and feedback actions work only when `/api/v1` is routed to the FastAPI service over HTTPS.

## Deployment

Build `dist/` and serve it from the same HTTPS origin as the API. Configure the reverse proxy to serve the frontend at `/` and forward `/api/` to the FastAPI service. The backend's production Secure cookie setting requires HTTPS. Use the API service's deployment instructions for database backups, secrets, mail delivery, allowed email domains, and admin account setup.

The current API does not provide a public discussion pool or file uploads. The pool is therefore read-only and its cards are clearly marked as examples; the feedback form explains that attachments are unavailable. Do not enable publishing, reactions, reports, or uploads until server endpoints and moderation rules are implemented.

## Content to confirm before opening to employees

- Confirm that department names and routing match the organization's current structure.
- Publish the approved retention period, administrator scope, and a real support contact in the help page.
- Replace the illustrative mailbox and resolved-feedback cards with approved examples or live API data.
- Verify the emergency contact details for the deployment site.

## CSP rule

- Do not add inline `<style>`, inline `<script>`, or `style="..."` attributes.
- Keep CSS and JavaScript in external files.
- Do not update element styles through JavaScript; use existing CSS classes.
- `python3 build.py` checks these constraints before copying the frontend into `dist/`.

## Checks

```sh
python3 build.py
node --check src/js/app.js
```

# JobPortal Apps Script (deploy)

An alternative to `server/services/googleDrive.js` + `googleSheets.js` that
needs no service-account key or running server — it runs on Google's
infrastructure under your own account.

## Deploy

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the default `Code.gs` content and paste in [Code.gs](Code.gs).
3. **Deploy → New deployment**.
4. Type: **Web app**.
5. Execute as: **Me**.
6. Who has access: **Anyone** (needed so your frontend/server can call it without a login prompt).
7. Click **Deploy**, authorize the requested Drive/Sheets permissions, and copy the **Web app URL** (ends in `/exec`).

Re-running **Deploy → New deployment** after edits gives a new URL — use
**Manage deployments → Edit → New version** instead to keep the same URL.

## Call it

Send a POST with the `action` name and its fields as JSON. To avoid a CORS
preflight (Apps Script doesn't answer `OPTIONS` requests), send the body as
`text/plain` — `doPost` parses `e.postData.contents` as JSON regardless of
the declared content type:

```js
async function callAppsScript(action, payload) {
  const res = await fetch('https://script.google.com/macros/s/XXXXX/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  })
  return res.json()
}

// Developer signup
await callAppsScript('registerDeveloper', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '01711111111',
  image: 'data:image/png;base64,....',   // optional
  jobID: 'data:image/png;base64,....',   // optional
  nid: 'data:image/png;base64,....',     // optional
})

// Client signup
await callAppsScript('registerClient', {
  name: 'Acme Ltd',
  email: 'acme@example.com',
  phone: '01722222222',
  image: 'data:image/png;base64,....',   // optional, company logo
})

// Job posting
await callAppsScript('postJob', {
  clientId: '...', clientName: 'Acme Ltd',
  title: 'Build a landing page', details: '...',
  phone: '01722222222', budget: 5000, duration: '2 weeks',
})

// Admin approval
await callAppsScript('approveUser', { id: '...', type: 'developer', status: 'approved' })
```

## What it creates

- **Drive**: `JobPortal/Developers/<name> (<id>)/` with `Photos`, `Job ID Cards`,
  `NID Cards` subfolders; `JobPortal/Clients/<name> (<id>)/` with a `Photos`
  subfolder — each populated as that person registers.
- **Sheets**: a spreadsheet named `JobPortal Data` (auto-created on first
  call, found in the `JobPortal` Drive folder) with `Developers`, `Clients`,
  `Jobs`, and `Approvals` tabs. Open it and use **File → Download → Microsoft
  Excel (.xlsx)** any time to get an Excel copy.

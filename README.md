# Magpie

Magpie is a local-first virtual notebook and tracker app. It runs in the browser, works offline as a PWA, and stores data locally in IndexedDB on each device.

## Requirements

- Node.js `24.11.0`
- npm, via `npm.cmd` on this Windows machine

PowerShell blocks the `npm.ps1` shim on this machine, so use `npm.cmd` in commands below.

## Install

```powershell
npm.cmd ci
```

Use `npm.cmd ci` instead of `npm install` for reproducible installs. It uses `package-lock.json` exactly, which helps keep Magpie insulated from dependency/version changes in other projects.

## Run locally

```powershell
npm.cmd run dev
```

Then open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173
```

There is also a Windows shortcut in this folder:

```text
Magpie.lnk
```

It runs `Run Magpie.ps1`, starts the dev server if needed, and opens the app.

## Build

```powershell
npm.cmd run build
```

The packaged app is written to:

```text
dist/
```

The `dist` folder can be deployed to a static host such as Netlify, Vercel, GitHub Pages, Cloudflare Pages, or a local web server.

## Mobile/Desktop Install

After deploying or serving the built app over HTTP/HTTPS, open it in a browser and install it as a PWA:

- Desktop Chrome/Edge: use the install icon in the address bar.
- Mobile Chrome/Safari: use Add to Home Screen.

Data is stored in the browser's local IndexedDB. Each browser/device has its own data unless import/export or sync is added later.

## Data Model Notes

- Daily notebook text is stored by date key, e.g. `2026-06-18`.
- Slash tags in daily notes update tracker artifacts in real time.
- Supported tags: `/action`, `/event`, `/decision`, `/question`, `/risk`, `/reminder`.
- Typed dates are recognized as `yyyy-mm-dd` or `ddmmyy`.
- Markdown-style headings such as `# Bob's meeting` are used as context for tagged items below them.

## Source Control Notes

Commit these files/directories:

```text
src/
public/
index.html
package.json
package-lock.json
tsconfig*.json
vite.config.ts
tailwind.config.ts
README.md
.nvmrc
.gitignore
```

Do not commit:

```text
node_modules/
dist/
*.tsbuildinfo
```

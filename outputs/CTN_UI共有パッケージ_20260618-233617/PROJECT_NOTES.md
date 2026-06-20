# Project Notes for Codex

## Local preview rule

This workspace is under OneDrive on Windows. `vite preview` and ad-hoc background Python servers have repeatedly become unstable in this thread.

For human review, prefer the standalone file first:

```text
team-site.html
```

It embeds the latest Operations UI directly, so it remains visible even if iframe/server loading fails.

Use this flow only when an HTTP server is specifically needed:

```powershell
npm.cmd run build:site
npm.cmd run serve:static
```

The static server serves `dist/` on:

```text
http://127.0.0.1:4173/
```

Important pages:

- `/ctn-operations-ui.html`: latest light/dark Operations UI
- `/team-site.html`: team sharing site
- `/portal.html`: integrated portal
- `/docs-html/index.html`: generated documentation viewer

When editing standalone HTML files outside `dist/`, copy them into `dist/` before testing:

```powershell
Copy-Item -LiteralPath ctn-operations-ui.html -Destination dist\ctn-operations-ui.html -Force
```

Do not rely on `npm run dev` or `vite preview` for this project unless specifically debugging React hot reload.

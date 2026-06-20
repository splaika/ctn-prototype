---
name: direct-html-mock-share
description: Export a React/Vite frontend mock as one direct-share HTML file for email or local browser review. Use when the user asks to share a mock with internal members, make a downloadable mock, avoid ZIP/multi-file sharing, create CTN_UX_Mock_DIRECT.html, embed CSS/JavaScript into one HTML file, or ensure recipients can save the file and open it in Edge/Chrome without a server.
---

# Direct HTML Mock Share

## Goal

Produce one self-contained HTML file that can be attached or handed to reviewers directly.
The reviewer must only need to save the HTML file locally and open it in Microsoft Edge or Google Chrome.

## Non-Negotiable Rules

- Do not create a ZIP as the primary mock-sharing artifact.
- Do not deliver a multi-file mock with separate `assets/`, `.js`, or `.css` dependencies.
- Do not tell reviewers to use a `C:/Users/...` local path as a share link.
- Do not rely on Outlook, Teams, SharePoint, or OneDrive preview.
- Do not rely on localhost, a dev server, or Azure for this direct-share artifact.
- Name the main output `CTN_UX_Mock_DIRECT.html`.
- Verify the output has no external `<script src=...>` or stylesheet `<link href=...>` references.

## Workflow

1. Build the React/Vite app.

   ```powershell
   npm.cmd run build
   ```

   If this project has a site-specific build script and the user needs docs as well, run that separately. For direct mock sharing, `dist/index.html` plus its built assets are the required input.

2. Export one direct-share HTML file.

   ```powershell
   node codex-skills/direct-html-mock-share/scripts/export-direct-html-mock.mjs
   ```

   Default input:
   - `dist/index.html`

   Default output:
   - `outputs/email-direct/CTN_UX_Mock_DIRECT.html`

3. Validate the generated HTML.

   Confirm:
   - The file exists.
   - It contains `<div id="root"></div>`.
   - It contains inline `<style>` and inline `<script type="module">`.
   - It does not contain external `<script ... src=...>`.
   - It does not contain external stylesheet `<link ... href=...>`.

4. Give the user only the final direct-share file as the artifact to send:

   ```text
   outputs/email-direct/CTN_UX_Mock_DIRECT.html
   ```

## Recipient Instructions

Use this wording when explaining how reviewers should open the file:

```text
添付の CTN_UX_Mock_DIRECT.html をPCに保存し、Microsoft Edge または Google Chrome で開いてください。
Outlook、Teams、SharePoint上のプレビューでは正しく動かない場合があります。
```

## Expected Scope

This file is for visual and interaction review only.

It can support:
- menu navigation
- React state transitions
- form input
- tabs, buttons, and mock workflows

It does not support:
- persistent storage
- shared editing
- server-side workflow execution
- real authentication
- real backend integration

## If Email Blocks HTML Attachments

If the user's company blocks `.html` attachments, do not fall back to ZIP automatically unless the user explicitly accepts that risk.
Recommend a hosted static site instead, such as Azure Static Web Apps, or ask an internal owner with upload rights to publish the single HTML through an approved channel.

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.cwd(), "dist");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".sql": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function resolveRequestPath(url) {
  const parsed = new URL(url, `http://${host}:${port}`);
  const decoded = decodeURIComponent(parsed.pathname);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const filePath = path.resolve(root, `.${cleanPath}`);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

const server = http.createServer(async (req, res) => {
  try {
    let filePath = resolveRequestPath(req.url || "/");
    if (!filePath) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const stat = await fs.stat(filePath).catch(() => null);
    if (stat?.isDirectory()) filePath = path.join(filePath, "index.html");

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, host);

/** 静态文件服务器 — 用于 demo.html */
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const ROOT = import.meta.dir;

Bun.serve({
  port: 3002,
  fetch(req) {
    let path = new URL(req.url).pathname;
    if (path === "/") path = "/demo.html";

    const filePath = join(ROOT, path);
    if (!existsSync(filePath)) {
      return new Response("Not found: " + path, { status: 404 });
    }

    const ext = extname(filePath);
    const mime = MIME[ext] || "application/octet-stream";
    const content = readFileSync(filePath);
    return new Response(content, { headers: { "Content-Type": mime } });
  },
});

console.log("🚀 http://localhost:3002");

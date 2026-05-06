/**
 * 开发服务器：用 Bun 即时 bundle 并预览
 * 运行: bun run dev
 */
import { build } from "bun";
import { readFileSync, existsSync } from "fs";

// 先 bundle 一次
async function bundleApp() {
  const result = await build({
    entrypoints: ["./src/index.ts"],
    outdir: "./.dev-out",
    format: "esm",
    target: "browser",
    minify: false,
    sourcemap: "inline",
  });
  if (!result.success) {
    console.error("Bundle failed:", result.logs);
    process.exit(1);
  }
  console.log("✓ Bundled successfully");
}

await bundleApp();

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>md-live-preview dev</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1e1e1e; color: #d4d4d4; height: 100vh; }
    #editor { height: 100vh; overflow-y: auto; }
    :root {
      --cm-live-cursor: #d4d4d4;
      --cm-live-link-color: #6ab0f3;
      --cm-live-muted: #888;
      --cm-live-quote-border: #555;
      --cm-live-border: #444;
    }
    .cm-editor { height: 100%; }
    .cm-scroller { overflow: auto; }
    .cm-editor .cm-content { color: #d4d4d4; }
    .cm-editor .cm-line { padding: 0 4px; }
  </style>
</head>
<body>
  <div id="editor"></div>
  <script type="module">
    import { createLivePreviewEditor } from "/bundle.js";
    
    const sampleDoc = \`# Hello Live Preview

This is a **bold text** and this is *italic text* and this is ~~strikethrough~~.

Here is some \\\`inline code\\\` in a sentence.

## Links and Images

Check out [this link](https://example.com) for more info.

![A sample image](https://picsum.photos/600/200)

---

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Code Block

\\\`\\\`\\\`javascript
const x = 42;
console.log(x);
\\\`\\\`\\\`

### Lists

- Item one
- Item two with **bold**
- Item three with [a link](https://example.com)

1. First ordered
2. Second ordered
3. Third with *emphasis*

---

Try clicking around — when your cursor enters a formatted region,
you'll see the raw markdown. When it leaves, it renders.
\`;
    
    const editor = createLivePreviewEditor({
      parent: document.getElementById("editor"),
      doc: sampleDoc,
      onChange: (doc) => {}
    });
  </script>
</body>
</html>`;

Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    if (url.pathname === "/bundle.js") {
      // 每次请求时重新 bundle（开发模式）
      await bundleApp();
      const js = readFileSync("./.dev-out/index.js", "utf-8");
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    
    return new Response("Not found", { status: 404 });
  },
});

console.log("🚀 Dev server running at http://localhost:3001");

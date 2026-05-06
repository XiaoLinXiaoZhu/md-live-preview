# md-live-preview

基于 Obsidian CM6 引擎的 Markdown Live Preview 编辑器。

## 运行

```bash
bun install
bun run dev
```

Vite 开发服务器启动后打开 `index.html`，即可体验完整的 Obsidian 风格 live preview 编辑。

## 架构

项目直接使用 Obsidian 桌面端的 CodeMirror 6 扩展（`public/vendor/obsidian-app.patched.js`），通过 mock 必要的 Obsidian App 接口在浏览器中独立运行。

关键文件：

- `index.html` — 主入口，包含 mock 层和编辑器初始化逻辑
- `public/vendor/` — Obsidian 运行时依赖（CM6 bundle、i18next、markdown parser 等）
- `public/app.css` — Obsidian 主题样式
- `scripts/extract-obsidian.ts` — 从 Obsidian 安装目录提取运行时的工具脚本

## 核心行为

1. **WYSIWYG**：光标不在的区域隐藏 markdown 语法符号，直接显示渲染效果
2. **Markdown-first**：底层数据始终是纯 markdown 文本
3. **光标即模式**：光标进入某区域显示原始 markdown，离开后渲染

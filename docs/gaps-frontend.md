# 前端功能缺失 — 已全部修复

以下功能已在 commit `20fdb97` 中全部修复。

| # | 功能 | 修复方式 | 状态 |
|---|------|---------|------|
| 1 | 代码块语法高亮 | 加载 CM5 `meta.min.js` + `modes.min.js`，hypermd 的 `fencedCodeBlockHighlighting` 可正确解析语言 | ✅ 已修复 |
| 2 | 粘贴 HTML 转 Markdown | 实现 `clipboardManager.handlePaste`，检测 `text/html` 后用 Turndown.js 转 markdown 插入 | ✅ 已修复 |
| 3 | i18n UI 文案 | 从 Obsidian 提取 `en.json` / `zh.json`，异步加载到 i18next | ✅ 已修复 |
| 4 | MathJax 公式渲染 | 用真实 `tex-chtml-full.js` 替换 stub，加入全套 CHTML woff 字体 | ✅ 已修复 |
| 5 | DOMPurify HTML 净化 | 保持透传 mock（不影响编辑功能，仅安全相关） | ⚠️ 保持现状 |
| 6 | 字体显示 | CSS 变量设置系统字体栈（`--font-interface` / `--font-text` / `--font-monospace`） | ✅ 已修复 |
| 7 | 拖拽悬停反馈 | 实现 `handleDragOver`/`handleDrop`/`dragleave`，通过 `EditorView.domEventHandlers` 接入 | ✅ 已修复 |

## 资源来源

从 `D:\Program Files\Obsidian\resources\obsidian.asar` 提取：
- `lib/codemirror/meta.min.js` — CM5 语言注册表（12 KB）
- `lib/codemirror/modes.min.js` — CM5 语言 modes 合集（550 KB）
- `lib/mathjax/tex-chtml-full.js` — MathJax 渲染引擎（1.3 MB）
- `lib/mathjax/output/chtml/fonts/woff-v2/` — MathJax 字体（24 个 woff 文件）
- `i18n/en.json` — 英文翻译（115 KB）
- `i18n/zh.json` — 中文翻译（116 KB）

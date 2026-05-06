# 前端可修复的功能缺失

以下功能仅需前端改动即可恢复，不依赖任何后端/文件系统服务。

| # | 功能 | 当前状态 | 修复方式 | 影响程度 |
|---|------|---------|---------|---------|
| 1 | 代码块语法高亮 | 所有语言显示为纯文本 | 加载 CM5 语言 modes（javascript, python, css, html, json 等）+ meta.js（提供 `CodeMirror.findModeByName`） | ❌ 高 |
| 2 | 粘贴 HTML 转 Markdown | 外部粘贴保持原始 HTML 文本 | 实现 `clipboardManager.handlePaste`：检测 HTML 类型时调用 Turndown.js 转换为 markdown 再插入 | ❌ 高 |
| 3 | i18n UI 文案 | tooltip/按钮文案为空字符串 | 从 Obsidian 安装目录提取 `app.json` 翻译文件，通过 `i18next.addResourceBundle` 加载 | ⚠️ 中 |
| 4 | MathJax 公式渲染 | 公式 widget 可能渲染但样式异常 | 确认 MathJax 的 CHTML 输出 CSS 正确加载；可能需要手动调用 `MathJax.startup.promise` 初始化 | ⚠️ 中 |
| 5 | DOMPurify HTML 净化 | 直接透传（不过滤危险 HTML） | 加载真实 DOMPurify 库替换 mock；编辑功能无损，但防止恶意内容注入 | ⚠️ 低 |
| 6 | 字体显示 | 回退到系统字体 | 方案 A：将 Inter 等字体文件放入 public/fonts/；方案 B：CSS 变量直接指定系统字体 | ⚠️ 低 |
| 7 | 拖拽悬停反馈 | 拖拽文件到编辑器无视觉提示 | 实现 `handleDragOver`：添加/移除 `.drop-target` CSS class | ⚠️ 低 |

## 修复优先级

```
高优先：1 → 2（最明显的编辑体验缺陷）
中优先：3 → 4（功能完整性）
低优先：5 → 6 → 7（打磨细节）
```

## 第 1 项详细说明：代码块语法高亮

当前流程：
1. `JB` = hypermd language mode，`fencedCodeBlockHighlighting: true`
2. 遇到 ` ```javascript ` 时调用 `getMode("javascript")`
3. `getMode` 内部先调用 `CodeMirror.findModeByName("javascript")`（不存在，跳过）
4. 再调用 `CodeMirror.getMode({}, "javascript")`（无注册 mode，返回 null mode）
5. 结果：代码块内容不做任何 tokenization

修复方案：
- 从 Obsidian 安装目录或 CM5 npm 包获取 `mode/meta.js`（语言注册表）
- 加载常用语言 modes：`javascript`, `python`, `css`, `htmlmixed`, `json`, `typescript`, `markdown`, `xml`, `sql`, `shell`
- 在 `<script src="/vendor/obsidian-app.patched.js">` 之前加载

## 第 2 项详细说明：粘贴转换

当前流程：
1. 用户从网页复制内容 → 粘贴
2. `handlePaste` 为空 → 浏览器默认行为（插入纯文本或 HTML 原文）

修复方案：
- Turndown.js 已加载（`/vendor/lib/turndown.js`）
- 实现 `handlePaste`：检查 `event.clipboardData` 中是否有 `text/html`
- 有则用 Turndown 转为 markdown，替换当前选区
- 注意保留纯文本粘贴的 fallback

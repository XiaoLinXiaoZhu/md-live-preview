# 集成指南：在外部项目中使用 md-live-preview

md-live-preview 提供了 `createEditor()` 入口函数，允许外部项目嵌入一个完整的 Obsidian 风格 Markdown 所见即所得编辑器。

## 快速开始

```typescript
import { createEditor } from 'md-live-preview/src/create';
import type { EditorBackend, EditorOptions, EditorInstance } from 'md-live-preview/src/types';

// 1. 准备容器
const container = document.getElementById('editor');

// 2. 可选：实现后端接口
const backend: EditorBackend = {
  getResourceUrl(path) { return `/assets/${path}`; },
  openFile(path) { window.location.hash = path; },
};

// 3. 创建编辑器
const editor: EditorInstance = createEditor(container, {
  doc: '# Hello World\n\nStart writing...',
  filePath: 'notes/hello.md',
  onChange(doc) { autoSave(doc); },
  onSave(doc) { saveToServer(doc); },
}, backend);

// 4. 之后可以用 editor 实例操作
editor.setDoc('# New content');
console.log(editor.getDoc());
editor.focus();
editor.destroy(); // 清理
```

## 前置依赖

`createEditor()` 依赖 Obsidian 运行时在 `window` 上暴露的全局变量。调用前需在页面中按顺序加载以下脚本：

```html
<!-- 顺序重要 -->
<link rel="stylesheet" href="md-live-preview/public/app.css">
<script src="md-live-preview/public/vendor/lib/i18next.min.js"></script>
<script src="md-live-preview/public/vendor/lib/codemirror.js"></script>
<script src="md-live-preview/public/vendor/lib/meta.min.js"></script>
<script src="md-live-preview/public/vendor/lib/modes.min.js"></script>
<script src="md-live-preview/public/vendor/lib/markdown.js"></script>
<script src="md-live-preview/public/vendor/lib/turndown.js"></script>
<script src="md-live-preview/public/vendor/enhance.js"></script>
<script src="md-live-preview/public/src/mock.js"></script>
<script src="md-live-preview/public/vendor/obsidian-app.patched.js"></script>
```

> 如果你在 VSCode Webview 中使用，需要把上述脚本通过 `webview.asWebviewUri()` 转为 webview 可访问的 URI。

## API

### `createEditor(container, options?, backend?): EditorInstance`

| 参数 | 类型 | 说明 |
|------|------|------|
| container | `HTMLElement` | 编辑器挂载的 DOM 容器 |
| options | `EditorOptions` | 编辑器配置（均可选） |
| backend | `EditorBackend` | 后端能力实现（均可选） |

### EditorOptions

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| doc | string | `''` | 初始文档内容 |
| filePath | string | `'untitled.md'` | 当前文件路径（链接解析上下文） |
| tabSize | number | 4 | Tab 宽度 |
| useTab | boolean | true | 使用 Tab 还是空格缩进 |
| readableLineWidth | boolean | true | 限制可读行宽 |
| showLineNumber | boolean | true | 显示行号 |
| showIndentGuide | boolean | true | 显示缩进指引 |
| foldHeading | boolean | true | 启用标题折叠 |
| foldIndent | boolean | true | 启用缩进折叠 |
| autoPairBrackets | boolean | true | 自动配对括号 |
| autoPairMarkdown | boolean | true | 自动配对 Markdown 标记 |
| spellcheck | boolean | false | 拼写检查 |
| theme | 'dark' \| 'light' | 'dark' | 主题 |
| cssVariables | `Record<string, string>` | `{}` | CSS 变量覆写，注入到容器 style（见下方"自定义样式"） |
| onChange | `(doc: string) => void` | — | 文档变更回调 |
| onSave | `(doc: string) => void` | — | Ctrl+S 保存回调 |

### EditorBackend

所有方法均可选。未提供的方法会使用无操作的默认实现。

| 方法 | 签名 | 作用 |
|------|------|------|
| listLinkTargets | `() => Promise<LinkTarget[]>` | `[[` 自动补全的候选列表 |
| resolveLinkPath | `(linktext, sourcePath) => string \| null` | 检查链接目标是否存在 |
| getResourceUrl | `(path) => string` | vault 路径 → 可加载 URL |
| readFile | `(path) => Promise<string>` | 读取文件内容（笔记嵌入） |
| openFile | `(path) => void` | 打开/导航到文件 |
| saveAttachment | `(name, data) => Promise<string>` | 保存粘贴/拖拽的附件 |

### EditorInstance

| 方法/属性 | 说明 |
|-----------|------|
| view | CM6 EditorView 实例（高级用途） |
| getDoc() | 获取当前文档文本 |
| setDoc(content) | 替换整个文档 |
| getSelection() | 获取选中文本 |
| focus() | 聚焦编辑器 |
| destroy() | 销毁编辑器，释放资源 |

## 场景示例

### 场景 1：简单 TODO 应用

```typescript
const editor = createEditor(container, {
  doc: localStorage.getItem('todo') || '# TODO\n\n- [ ] ',
  onChange(doc) { localStorage.setItem('todo', doc); },
});
```

不需要提供 backend——文档变更通过 `onChange` 回调自行持久化即可。

### 场景 2：md-annotate VSCode 插件

在 webview 中嵌入编辑器，通过 `postMessage` 桥接后端：

```typescript
// webview 端
const vscodeApi = acquireVsCodeApi();

const backend: EditorBackend = {
  getResourceUrl(path) {
    // 通过 vscode webview 的资源协议访问
    return webviewUri(path);
  },
  openFile(path) {
    vscodeApi.postMessage({ type: 'openFile', path });
  },
  async saveAttachment(name, data) {
    vscodeApi.postMessage({ type: 'saveAttachment', name, data: Array.from(new Uint8Array(data)) });
    // 等待响应...
    return await waitForResponse('attachmentSaved');
  },
};

const editor = createEditor(container, {
  doc: initialMarkdown,
  filePath: currentFilePath,
  onChange(doc) {
    vscodeApi.postMessage({ type: 'docChanged', doc });
  },
}, backend);

// 接收来自 extension 的消息
window.addEventListener('message', (e) => {
  if (e.data.type === 'setDoc') {
    editor.setDoc(e.data.content);
  }
});
```

### 场景 3：Web 应用 + 服务端文件系统

```typescript
const backend: EditorBackend = {
  async listLinkTargets() {
    const res = await fetch('/api/notes');
    return res.json();
  },
  resolveLinkPath(link) {
    // 同步判断——如果需要异步，可以预加载索引
    return noteIndex.has(link) ? noteIndex.get(link) : null;
  },
  getResourceUrl(path) {
    return `/api/files/${encodeURIComponent(path)}`;
  },
  async readFile(path) {
    const res = await fetch(`/api/files/${encodeURIComponent(path)}`);
    return res.text();
  },
  openFile(path) {
    router.push(`/note/${path}`);
  },
  async saveAttachment(name, data) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': name },
      body: data,
    });
    const { path } = await res.json();
    return path;
  },
};

const editor = createEditor(container, { doc, filePath }, backend);
```

## 自定义样式

### 主题

容器的 `body` 或祖先元素需添加 `theme-dark` 或 `theme-light` class 来启用对应主题。`app.css` 中的 CSS 变量会根据这个 class 切换配色。

```html
<body class="theme-dark">
  <div id="editor"></div>
</body>
```

### CSS 变量覆写

编辑器的样式完全基于 CSS 变量。通过 `cssVariables` 选项可以覆写任何变量，无需修改 `app.css`：

```typescript
const editor = createEditor(container, {
  doc: '# Hello',
  cssVariables: {
    '--font-text': '"LXGW WenKai", "Noto Serif SC", serif',
    '--font-monospace': '"JetBrains Mono", "Fira Code", monospace',
    '--font-text-size': '18px',
    '--font-interface': '"Inter", sans-serif',
    '--bold-modifier': '300',
  },
});
```

常用可覆写变量：

| 变量 | 作用 | 默认值 |
|------|------|--------|
| `--font-text` | 正文字体 | 系统默认 |
| `--font-interface` | UI 字体（行号等） | 系统默认 |
| `--font-monospace` | 代码字体 | ui-monospace, SFMono-Regular, ... |
| `--font-text-size` | 正文字号 | 16px |
| `--bold-modifier` | 粗体额外 weight | 200 |
| `--line-height` | 行高 | 1.5 |
| `--background-primary` | 编辑器背景色 | 主题决定 |
| `--text-normal` | 正文颜色 | 主题决定 |

你也可以直接通过外部 CSS 覆写这些变量，而不使用 `cssVariables` 选项：

```css
.markdown-source-view {
  --font-text: "My Custom Font", serif;
  --font-text-size: 20px;
}
```

两种方式等效，`cssVariables` 的优先级更高（inline style）。

## 打包建议

如果需要将 md-live-preview 打包为单文件分发（如 VSCode 插件 webview），建议：

1. 将 `public/vendor/` 下的脚本拼接为一个 `runtime.js`
2. 将 `src/create.ts` 编译为 ES module
3. `app.css` 单独引入或内联

示例 build 脚本（参考）：
```bash
# 拼接运行时
cat public/vendor/lib/i18next.min.js \
    public/vendor/lib/codemirror.js \
    public/vendor/lib/meta.min.js \
    public/vendor/lib/modes.min.js \
    public/vendor/lib/markdown.js \
    public/vendor/lib/turndown.js \
    public/vendor/enhance.js \
    public/src/mock.js \
    public/vendor/obsidian-app.patched.js > dist/runtime.js

# 编译入口
bun build src/create.ts --outdir dist --format esm
```

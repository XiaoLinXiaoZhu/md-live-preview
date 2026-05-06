# md-live-preview

Obsidian-style markdown live preview 编辑器组件。

## 核心行为

1. **WYSIWYG**：光标不在的区域，markdown 语法符号隐藏，直接显示渲染效果
2. **Markdown-first**：底层数据始终是纯 markdown 文本，没有额外状态层
   - 光标进入某区域 → 显示原始 markdown 符号，可直接编辑
   - 光标离开 → 渲染为可视化效果
   - 删除操作作用于原始字符（删 `**` 而不是删"加粗格式"）

## 技术栈

- CodeMirror 6（编辑器核心）
- @lezer/markdown（语法解析）
- 纯 ESM，无框架依赖

## 使用

```ts
import { createLivePreviewEditor } from "md-live-preview";

const editor = createLivePreviewEditor({
  parent: document.getElementById("editor"),
  doc: "# Hello\n\nThis is **bold** and *italic*.",
  onChange: (markdown) => {
    // markdown 是纯文本，不是 AST/状态对象
    console.log(markdown);
  },
});
```

## 开发

```bash
bun install
bun run dev      # 启动开发服务器 http://localhost:3001
bun run typecheck
```

## 当前支持的渲染

| 语法 | 效果 |
|------|------|
| `**bold**` | 隐藏 `**`，加粗显示 |
| `*italic*` | 隐藏 `*`，斜体显示 |
| `~~strike~~` | 隐藏 `~~`，删除线显示 |
| `` `code` `` | 隐藏反引号，代码样式 |
| `# Heading` | 隐藏 `#`，放大显示 |
| `[text](url)` | 隐藏 `[]()` 语法，链接样式 |
| `![alt](url)` | 替换为实际图片 |
| `---` | 替换为水平线 |
| `> quote` | 隐藏 `>`，左边框样式 |

## 设计原则

- 光标在哪里，哪里就是"编辑态"（显示原始 markdown）
- 其他地方是"渲染态"（隐藏符号，显示效果）
- 没有模式切换，没有额外状态，完全跟随光标位置

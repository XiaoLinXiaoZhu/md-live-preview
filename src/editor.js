/**
 * Demo 页面入口 —— 使用 createEditor() 初始化编辑器。
 * 这是 md-live-preview 独立运行时的样例代码。
 */
import { createEditor } from './create.ts';

const status = document.getElementById('status');

const sampleDoc = `# Live Preview Demo

This is **bold text** and *italic text* and ~~strikethrough~~.

Inline \`code\` looks like this.

## Links

[Click here](https://example.com) to visit a link.

[[Internal link]] to another note.

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

> [!NOTE]
> This is a note callout.

> [!WARNING]
> This is a warning callout.
> Pay attention to this content.

> [!TIP]
> Here's a helpful tip for you.

## Lists

- Item one
- Item two with **bold**
- [ ] Unchecked task
- [x] Completed task

1. First ordered
2. Second ordered

## Code Block

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

---

## Math

$$E = mc^2$$

Inline math: $a^2 + b^2 = c^2$

## Tags

#tag1 #tag2

Try editing — cursor reveals raw markdown and moving away renders it.
`;

export function initDemo() {
  const container = document.querySelector('.markdown-source-view');
  if (!container) {
    status.textContent = '✗ Container not found';
    status.className = 'status err';
    return;
  }

  try {
    const editor = createEditor(container, {
      doc: sampleDoc,
      filePath: 'demo.md',
      theme: 'dark',
      onChange(doc) {
        // Demo: 仅打印长度
        console.log(`[demo] doc changed, length=${doc.length}`);
      },
      onSave(doc) {
        console.log('[demo] save requested, length=', doc.length);
      },
    });

    status.textContent = '✓ Live preview active';
    status.className = 'status ok';
    console.log('Live preview editor ready!');

    // 暴露到全局方便调试
    window.__editorInstance = editor;
  } catch (e) {
    console.error('Editor creation error:', e);
    status.textContent = '✗ ' + e.message;
    status.className = 'status err';
  }
}

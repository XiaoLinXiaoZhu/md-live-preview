import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { EditorState, Range, Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Tree } from "@lezer/common";

/**
 * Live Preview 扩展：核心逻辑
 * 
 * 规则：
 * - 光标所在的 syntax node：显示原始 markdown（不做任何 decoration）
 * - 光标不在的 syntax node：用 Decoration.replace 隐藏语法符号，
 *   用 Decoration.widget 插入渲染后的 DOM
 */

// ─── 需要处理的 Markdown 语法节点 ───

type NodeHandler = {
  // 返回需要隐藏的 ranges 和需要插入的 widgets
  handle(
    state: EditorState,
    from: number,
    to: number,
    nodeType: string
  ): Range<Decoration>[];
};

// 加粗: **text** → 隐藏前后的 **
class BoldHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    const text = state.sliceDoc(from, to);
    const marker = text.startsWith("__") ? "__" : "**";
    const mLen = marker.length;
    return [
      Decoration.replace({}).range(from, from + mLen),
      Decoration.replace({}).range(to - mLen, to),
      Decoration.mark({ class: "cm-live-bold" }).range(from + mLen, to - mLen),
    ];
  }
}

// 斜体: *text* or _text_ → 隐藏前后的 * 或 _
class ItalicHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    return [
      Decoration.replace({}).range(from, from + 1),
      Decoration.replace({}).range(to - 1, to),
      Decoration.mark({ class: "cm-live-italic" }).range(from + 1, to - 1),
    ];
  }
}

// 删除线: ~~text~~ → 隐藏 ~~
class StrikethroughHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    return [
      Decoration.replace({}).range(from, from + 2),
      Decoration.replace({}).range(to - 2, to),
      Decoration.mark({ class: "cm-live-strikethrough" }).range(from + 2, to - 2),
    ];
  }
}

// 行内代码: `code` → 隐藏反引号，加样式
class InlineCodeHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    return [
      Decoration.replace({}).range(from, from + 1),
      Decoration.replace({}).range(to - 1, to),
      Decoration.mark({ class: "cm-live-code" }).range(from + 1, to - 1),
    ];
  }
}

// 标题: # heading → 隐藏 # 和空格，设置标题样式
class HeadingHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    const text = state.sliceDoc(from, to);
    const match = text.match(/^(#{1,6})\s/);
    if (!match) return [];
    const level = match[1].length;
    const markerEnd = from + match[0].length;
    return [
      Decoration.replace({}).range(from, markerEnd),
      Decoration.mark({ class: `cm-live-heading cm-live-h${level}` }).range(markerEnd, to),
    ];
  }
}

// 链接: [text](url) → 隐藏 []() 语法，只显示文本带链接样式
class LinkHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    const text = state.sliceDoc(from, to);
    const match = text.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
    if (!match) return [];
    const textStart = from + 1;
    const textEnd = textStart + match[1].length;
    const urlPartStart = textEnd; // ] 的位置
    return [
      Decoration.replace({}).range(from, textStart), // 隐藏 [
      Decoration.mark({ class: "cm-live-link", attributes: { title: match[2] } }).range(textStart, textEnd),
      Decoration.replace({}).range(urlPartStart, to), // 隐藏 ](url)
    ];
  }
}

// 图片: ![alt](url) → 替换为实际图片 widget
class ImageWidget extends WidgetType {
  constructor(private url: string, private alt: string) { super(); }
  toDOM(): HTMLElement {
    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.className = "cm-live-image";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "4px";
    img.style.margin = "4px 0";
    return img;
  }
}

class ImageHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    const text = state.sliceDoc(from, to);
    const match = text.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
    if (!match) return [];
    return [
      Decoration.replace({
        widget: new ImageWidget(match[2], match[1]),
      }).range(from, to),
    ];
  }
}

// 水平线: --- / *** / ___ → 替换为 hr widget
class HrWidget extends WidgetType {
  toDOM(): HTMLElement {
    const hr = document.createElement("hr");
    hr.className = "cm-live-hr";
    return hr;
  }
}

class HrHandler implements NodeHandler {
  handle(_state: EditorState, from: number, to: number): Range<Decoration>[] {
    return [
      Decoration.replace({ widget: new HrWidget() }).range(from, to),
    ];
  }
}

// blockquote: > text → 隐藏 > ，加左边框样式
class BlockquoteLineHandler implements NodeHandler {
  handle(state: EditorState, from: number, to: number): Range<Decoration>[] {
    const text = state.sliceDoc(from, to);
    const match = text.match(/^>\s?/);
    if (!match) return [];
    return [
      Decoration.replace({}).range(from, from + match[0].length),
      Decoration.line({ class: "cm-live-blockquote" }).range(from),
    ];
  }
}

// ─── Node type → Handler 映射 ───

const handlers: Record<string, NodeHandler> = {
  StrongEmphasis: new BoldHandler(),
  Emphasis: new ItalicHandler(),
  Strikethrough: new StrikethroughHandler(),
  InlineCode: new InlineCodeHandler(),
  // ATXHeading 在行级处理
  Link: new LinkHandler(),
  Image: new ImageHandler(),
  HorizontalRule: new HrHandler(),
};

// ─── 判断光标是否在某个 range 内 ───

function cursorInRange(state: EditorState, from: number, to: number): boolean {
  const { head } = state.selection.main;
  // 扩展范围到整行，让同一行的编辑更自然
  const lineFrom = state.doc.lineAt(from);
  const lineTo = state.doc.lineAt(to);
  return head >= lineFrom.from && head <= lineTo.to;
}

// ─── ViewPlugin：核心装饰逻辑 ───

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const { state } = view;
      const allDecos: Range<Decoration>[] = [];
      const tree = syntaxTree(state);

      // 遍历可见范围内的语法节点
      for (const { from, to } of view.visibleRanges) {
        tree.iterate({
          from,
          to,
          enter: (node) => {
            const handler = handlers[node.type.name];
            if (!handler) return;

            // 光标在这个 node 的范围内 → 不添加 decoration，显示原始 markdown
            if (cursorInRange(state, node.from, node.to)) return;

            const decos = handler.handle(state, node.from, node.to, node.type.name);
            allDecos.push(...decos);
          },
        });

        // 行级处理：标题和 blockquote
        this.handleLineLevel(state, tree, from, to, allDecos);
      }

      // Decoration 必须按 from 排序
      allDecos.sort((a, b) => a.from - b.from || a.to - b.to);

      // 去除重叠的 decorations
      return Decoration.set(allDecos, true);
    }

    handleLineLevel(
      state: EditorState,
      tree: Tree,
      from: number,
      to: number,
      allDecos: Range<Decoration>[]
    ) {
      // ATXHeading 处理
      tree.iterate({
        from,
        to,
        enter: (node) => {
          if (node.type.name === "ATXHeading1" || node.type.name === "ATXHeading2" ||
              node.type.name === "ATXHeading3" || node.type.name === "ATXHeading4" ||
              node.type.name === "ATXHeading5" || node.type.name === "ATXHeading6") {
            if (cursorInRange(state, node.from, node.to)) return;

            const text = state.sliceDoc(node.from, node.to);
            const match = text.match(/^(#{1,6})\s/);
            if (!match) return;
            const level = match[1].length;
            const markerEnd = node.from + match[0].length;

            allDecos.push(
              Decoration.replace({}).range(node.from, markerEnd),
              Decoration.line({ class: `cm-live-heading cm-live-h${level}` }).range(node.from),
            );
          }

          if (node.type.name === "Blockquote") {
            if (cursorInRange(state, node.from, node.to)) return;
            // 处理 blockquote 中的每一行
            const startLine = state.doc.lineAt(node.from).number;
            const endLine = state.doc.lineAt(node.to).number;
            for (let ln = startLine; ln <= endLine; ln++) {
              const line = state.doc.line(ln);
              const lineText = line.text;
              const qMatch = lineText.match(/^>\s?/);
              if (qMatch) {
                allDecos.push(
                  Decoration.replace({}).range(line.from, line.from + qMatch[0].length),
                  Decoration.line({ class: "cm-live-blockquote" }).range(line.from),
                );
              }
            }
          }
        },
      });
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ─── 样式 ───

const livePreviewTheme = EditorView.baseTheme({
  ".cm-live-bold": { fontWeight: "bold" },
  ".cm-live-italic": { fontStyle: "italic" },
  ".cm-live-strikethrough": { textDecoration: "line-through" },
  ".cm-live-code": {
    fontFamily: "monospace",
    background: "rgba(135, 131, 120, 0.15)",
    borderRadius: "3px",
    padding: "1px 4px",
    fontSize: "0.9em",
  },
  ".cm-live-heading": { fontWeight: "bold" },
  ".cm-live-h1": { fontSize: "1.8em", lineHeight: "1.3" },
  ".cm-live-h2": { fontSize: "1.4em", lineHeight: "1.3" },
  ".cm-live-h3": { fontSize: "1.2em", lineHeight: "1.3" },
  ".cm-live-h4": { fontSize: "1.1em" },
  ".cm-live-h5": { fontSize: "1.05em" },
  ".cm-live-h6": { fontSize: "1em", color: "var(--cm-live-muted, #666)" },
  ".cm-live-link": {
    color: "var(--cm-live-link-color, #4078f2)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  ".cm-live-blockquote": {
    borderLeft: "3px solid var(--cm-live-quote-border, #ddd)",
    paddingLeft: "12px",
    color: "var(--cm-live-muted, #666)",
  },
  ".cm-live-hr": {
    border: "none",
    borderTop: "1px solid var(--cm-live-border, #ddd)",
    margin: "16px 0",
  },
  ".cm-live-image": {
    maxWidth: "100%",
    borderRadius: "4px",
    display: "block",
    margin: "8px 0",
  },
});

// ─── 导出 ───

export function livePreview(): Extension {
  return [livePreviewPlugin, livePreviewTheme];
}

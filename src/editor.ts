import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { livePreview } from "./live-preview";

export interface LivePreviewOptions {
  /** 挂载目标 DOM 元素 */
  parent: HTMLElement;
  /** 初始 markdown 内容 */
  doc?: string;
  /** 内容变化回调 */
  onChange?: (doc: string) => void;
}

/**
 * 创建一个 Obsidian-style live preview markdown 编辑器
 * 
 * 底层数据始终是纯 markdown 文本。
 * 光标所在行显示原始 markdown 语法，光标离开后渲染为可视化效果。
 */
export function createLivePreviewEditor(options: LivePreviewOptions): EditorView {
  const { parent, doc = "", onChange } = options;

  const updateListener = onChange
    ? EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      })
    : [];

  const state = EditorState.create({
    doc,
    extensions: [
      // 基础编辑能力
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),

      // Markdown 语言支持（语法高亮 + 解析）
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(defaultHighlightStyle),

      // Live Preview 核心：隐藏/渲染语法符号
      livePreview(),

      // 编辑器基础样式
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "15px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        ".cm-content": {
          maxWidth: "720px",
          margin: "0 auto",
          padding: "32px 16px",
          lineHeight: "1.7",
        },
        ".cm-focused": { outline: "none" },
        ".cm-cursor": { borderLeftColor: "var(--cm-live-cursor, #333)" },
      }),

      // 变更回调
      updateListener,
    ],
  });

  return new EditorView({ state, parent });
}

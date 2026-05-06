/**
 * md-live-preview 对外接口定义
 *
 * 外部项目通过实现 EditorBackend 来对接自己的文件系统、导航、资源管理等能力。
 * 所有方法均可选——未提供的能力会优雅降级（如不提供 listLinkTargets 则 `[[` 补全不弹出）。
 */

// ─── 后端接口 ───

export interface LinkTarget {
  path: string;
  name: string;
  aliases?: string[];
}

export interface EditorBackend {
  /** 返回所有可链接目标（用于 `[[` 自动补全） */
  listLinkTargets?(): Promise<LinkTarget[]>;

  /** 解析内部链接路径 → 实际文件路径；null 表示目标不存在 */
  resolveLinkPath?(linktext: string, sourcePath: string): string | null;

  /** 将 vault 内路径转为可加载的资源 URL（图片等） */
  getResourceUrl?(path: string): string;

  /** 读取文件内容（用于笔记嵌入 `![[note]]`） */
  readFile?(path: string): Promise<string>;

  /** 打开/导航到指定文件 */
  openFile?(path: string): void;

  /** 保存附件（粘贴/拖拽图片），返回 vault 内最终路径 */
  saveAttachment?(name: string, data: ArrayBuffer): Promise<string>;
}

// ─── 编辑器选项 ───

export interface EditorOptions {
  /** 初始文档内容 */
  doc?: string;

  /** 当前文件路径（用于链接解析的上下文） */
  filePath?: string;

  /** Tab 宽度，默认 4 */
  tabSize?: number;
  /** 是否使用 Tab 缩进（否则空格），默认 true */
  useTab?: boolean;
  /** 是否限制行宽使其可读，默认 true */
  readableLineWidth?: boolean;
  /** 是否显示行号，默认 true */
  showLineNumber?: boolean;
  /** 是否显示缩进指引，默认 true */
  showIndentGuide?: boolean;
  /** 是否启用标题折叠，默认 true */
  foldHeading?: boolean;
  /** 是否启用缩进折叠，默认 true */
  foldIndent?: boolean;
  /** 是否启用自动配对括号，默认 true */
  autoPairBrackets?: boolean;
  /** 是否启用自动配对 Markdown 标记，默认 true */
  autoPairMarkdown?: boolean;
  /** 拼写检查，默认 false */
  spellcheck?: boolean;
  /** 主题：'dark' | 'light'，默认 'dark' */
  theme?: 'dark' | 'light';

  /** 自定义 CSS 变量覆写（如字体、字号等），会注入到编辑器容器的 style 属性 */
  cssVariables?: Record<string, string>;

  /** 文档内容变更回调 */
  onChange?(doc: string): void;
  /** 保存动作回调（Ctrl+S） */
  onSave?(doc: string): void;
}

// ─── 编辑器实例 ───

export interface EditorInstance {
  /** CodeMirror EditorView 实例（高级用途） */
  readonly view: any;

  /** 获取当前文档文本 */
  getDoc(): string;

  /** 替换整个文档内容 */
  setDoc(content: string): void;

  /** 获取选中文本 */
  getSelection(): string;

  /** 销毁编辑器，释放 DOM 和事件 */
  destroy(): void;

  /** 聚焦编辑器 */
  focus(): void;
}

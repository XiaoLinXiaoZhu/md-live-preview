/**
 * 默认后端实现——无文件系统、无导航。
 * 用于独立预览页面或不需要后端能力的场景。
 */
import type { EditorBackend, EditorOptions } from './types.js';

export const defaultBackend: EditorBackend = {
  resolveLinkPath() { return null; },
  getResourceUrl(path: string) { return path; },
  async listLinkTargets() { return []; },
  async readFile() { return ''; },
  openFile() {},
  async saveAttachment() { return ''; },
};

export const defaultOptions: Required<Omit<EditorOptions, 'doc' | 'filePath' | 'onChange' | 'onSave' | 'onLinkClick' | 'onExternalLinkClick'>> = {
  tabSize: 4,
  useTab: true,
  readableLineWidth: true,
  showLineNumber: true,
  showIndentGuide: true,
  foldHeading: true,
  foldIndent: true,
  autoPairBrackets: true,
  autoPairMarkdown: true,
  spellcheck: false,
  theme: 'dark',
  cssVariables: {},
};

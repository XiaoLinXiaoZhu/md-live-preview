# Mock 影响分析

下表列出当前所有 mock 项，说明其对应的 Obsidian 功能，以及对编辑体验的实际影响。

## 全局 Mock（src/mock.js）

| Mock | 对应功能 | 编辑体验影响 |
|------|----------|-------------|
| `OBSIDIAN_DEFAULT_I18N = {}` | Obsidian UI 文案的国际化数据 | ⚠️ 中等 — 所有 tooltip/按钮文案显示为空或 key 名，如代码块右上角复制按钮的 tooltip |
| `i18next.init(...)` + 空 bundle | 国际化框架初始化 | 同上，是 i18n 空数据的配套 |
| `DOMPurify = { sanitize(h){ return h } }` | HTML 净化（防 XSS） | ✅ 无影响 — 不过滤 HTML 意味着所有渲染内容直接注入，编辑功能不受损 |
| `initVimMode = () => ({ Vim: {} })` | Vim 键绑定模式 | ✅ 无影响 — mockApp.isVimEnabled() 返回 false，不会加载 |
| `CodeMirrorAdapter = {}` | Vim 模式的 CM 适配器 | ✅ 无影响 — 同上 |
| `process = { platform: 'win32', ... }` | Electron 进程对象 | ✅ 无影响 — 仅用于平台判断 |
| `window.ready = function(){}` | Obsidian 启动完成回调 | ✅ 无影响 — 阻止 app 初始化流程 |
| `Event.prototype.detach` | Obsidian 事件解除绑定 | ✅ 无影响 — 防止脚本加载错误时报错 |

## App Mock（src/editor.js — mockApp）

| Mock | 对应功能 | 编辑体验影响 |
|------|----------|-------------|
| `vault.getConfig(...)` | 编辑器配置读取 | ✅ 无影响 — 返回合理默认值，所有配置已正确覆盖 |
| `vault.adapter.getResourcePath(p)` → 原样返回 | 将 vault 路径转为可加载的 URL | ⚠️ 中等 — 图片/附件嵌入无法正确解析路径（`![[image.png]]` 不会显示） |
| `vault.getAbstractFileByPath()` → null | 通过路径查找文件对象 | ⚠️ 中等 — 内部链接 `[[note]]` 无法验证目标是否存在 |
| `workspace.openLinkText()` → 空 | 点击链接跳转到目标文件 | ⚠️ 中等 — 链接点击无反应（仅视觉，不影响编辑） |
| `workspace.editorExtensions = []` | 第三方插件注册的 CM6 扩展 | ✅ 无影响 — 无插件环境 |
| `workspace.trigger()` → 空 | 事件广播（如文档变更通知） | ✅ 无影响 — 不影响编辑器本身行为 |
| `workspace.on()` → `{ id: 0 }` | 事件监听注册 | ✅ 无影响 — yH 插件监听 post-processor-change 但无需实际触发 |
| `metadataCache.getFirstLinkpathDest()` → null | 解析链接路径找到目标文件 | ⚠️ 低 — 所有内部链接都会被标记为"未解析"（显示不同颜色 `.is-unresolved`） |
| `metadataCache.getFileCache()` → null | 获取文件的解析缓存（标题、链接等） | ⚠️ 低 — embed widget 无法获取目标文件内容 |
| `internalPlugins.getPluginById()` → null | 获取内置插件（搜索、图谱等） | ✅ 无影响 — 仅在搜索/图谱场景使用 |
| `plugins.getPlugin()` → null | 获取社区插件 | ✅ 无影响 — 无插件环境 |
| `keymap.pushScope/popScope()` → 空 | Obsidian 快捷键作用域管理 | ✅ 无影响 — 不影响 CM6 内部快捷键 |
| `commands.executeCommandById()` → 空 | 通过 ID 执行命令 | ✅ 无影响 — 编辑相关命令已通过 CM6 keymap 直接绑定 |
| `isVimEnabled()` → false | Vim 模式检测 | ✅ 无影响 — 正确禁用 Vim |

## Editor Mock（src/editor.js — mockEditor）

| Mock | 对应功能 | 编辑体验影响 |
|------|----------|-------------|
| `clipboardManager.handlePaste()` → 空 | 粘贴处理（图片上传、富文本转 md） | ❌ **有影响** — 从外部粘贴 HTML/图片时不会转为 markdown，使用浏览器默认粘贴 |
| `clipboardManager.handleDrop()` → 空 | 拖拽文件处理 | ⚠️ 中等 — 拖拽文件到编辑器不会插入链接/嵌入 |
| `clipboardManager.handleDragOver()` → 空 | 拖拽悬停反馈 | ⚠️ 低 — 无拖拽视觉反馈 |
| `addChild(c)` / `removeChild(c)` → 空 | Widget 组件生命周期管理 | ⚠️ 低 — Widget 的子组件不会被正确销毁（内存泄漏可能） |
| `editorSuggest.close/isShowingSuggestion()` | 自动补全建议面板 | ❌ **有影响** — 无自动补全（`[[` 输入后不弹出笔记列表，`/` 不弹出命令面板） |
| `editTableCell(...)` → 最简 mock | 表格单元格内联编辑 | ⚠️ 中等 — 表格内编辑可能异常（无完整子编辑器功能） |
| `mockEditor.editor.getLine(n)` → '' | CM5 兼容层读取行内容 | ⚠️ 低 — 仅在 updateEvent 的 editorSuggest 触发时用到 |
| `mockEditor.editor.expandText()` → 空 | 文本扩展/模板替换 | ⚠️ 低 — 不支持文本扩展功能（如自定义 snippet） |
| `onUpdate()` → 空 | 编辑器更新回调（保存提示等） | ✅ 无影响 — 独立编辑器无需触发保存/UI 更新 |

## 缺失的外部依赖

| 缺失项 | 对应功能 | 编辑体验影响 |
|--------|----------|-------------|
| CodeMirror 5 语言 modes（javascript、python 等） | Fenced code block 内语法高亮 | ❌ **有影响** — 代码块内无语法着色，所有语言都显示为纯文本 |
| `CodeMirror.findModeByName`（meta.js） | 语言名到 MIME 类型映射 | 同上，是代码高亮失效的配套原因 |
| Prism.js 主题 CSS | 渲染模式的代码高亮样式 | ⚠️ 低 — 仅在 oH（可渲染代码块如 mermaid）中使用 |
| 字体文件（Inter、Avenir Next 等） | Obsidian 默认 UI/编辑器字体 | ⚠️ 低 — 回退到系统字体，视觉差异但不影响编辑 |
| MathJax CSS（tex-chtml-full.js 已加载但样式可能缺失） | 数学公式渲染样式 | ⚠️ 中等 — 公式可能渲染但样式不完整 |

## 影响等级说明

- ✅ **无影响** — 功能不需要或已正确处理
- ⚠️ **低/中等** — 特定场景下有影响，但不妨碍基本编辑体验
- ❌ **有影响** — 明显损害了常用编辑功能

## 优先修复建议

1. **代码块语法高亮**：加载 CM5 常用语言 modes（javascript, python, css, html 等）+ meta.js
2. **自动补全**：实现基础的 `[[` 链接补全（即使只是个空面板框架）
3. **粘贴处理**：实现 HTML→Markdown 转换（Turndown.js 已加载）
4. **i18n 文案**：从 Obsidian 提取翻译文件填充实际文案

# md-live-preview

基于 Obsidian CM6 引擎的 Markdown Live Preview 编辑器。

## 运行

```bash
bun install
bun run dev
```

Vite 开发服务器启动后访问 `http://localhost:3002`，即可体验完整的 Obsidian 风格 live preview 编辑。

## 架构

项目直接使用 Obsidian 桌面端的 CodeMirror 6 扩展，通过 mock 必要的 Obsidian App 接口在浏览器中独立运行。

```
index.html              主入口（DOM 结构 + 脚本加载顺序）
src/
  types.ts              对外接口定义（EditorBackend, EditorOptions, EditorInstance）
  create.ts             createEditor() 主入口——外部项目的唯一调用点
  defaults.ts           默认后端实现（无文件系统时使用）
  editor.js             Demo 页面入口（调用 createEditor）
  mock.js               Obsidian 运行所需的浏览器全局 mock
  style.css             页面级布局样式
public/
  app.css               Obsidian 主题样式
  vendor/               Obsidian 运行时核心
    obsidian-app.patched.js   Obsidian app.js（已 patch 暴露内部 API）
    enhance.js                全局原型扩展
    lib/
      codemirror.js           CM5 核心（hypermd mode 依赖）
      meta.min.js             CM5 语言注册表
      modes.min.js            CM5 语言 modes（代码块高亮）
      markdown.js             hypermd markdown mode
      i18next.min.js          国际化框架
      turndown.js             HTML → Markdown 转换
  i18n/                 翻译文件（en.json, zh.json）
  lib/mathjax/          MathJax 渲染引擎 + 字体
scripts/
  extract-obsidian.ts   从 Obsidian 安装目录提取运行时的工具脚本
docs/
  gaps-frontend.md      前端功能缺失分析（已修复）
  gaps-backend.md       需要后端适配的功能分析
```

## 作为库使用

md-live-preview 可以作为组件嵌入到外部项目中。核心入口是 `createEditor()`：

```typescript
import { createEditor } from 'md-live-preview/src/create';

const editor = createEditor(container, { doc, onChange }, backend);
```

详细集成说明见 [docs/integration.md](docs/integration.md)。

## 核心行为

1. **WYSIWYG**：光标不在的区域隐藏 markdown 语法符号，直接显示渲染效果
2. **Markdown-first**：底层数据始终是纯 markdown 文本
3. **光标即模式**：光标进入某区域显示原始 markdown，离开后渲染

## 已实现的功能

- Live Preview 渲染（标题、加粗、斜体、链接、图片、代码块、公式、callout 等）
- 代码块语法高亮（所有 CM5 支持的语言）
- MathJax 数学公式渲染
- 行号 + 当前行高亮
- 代码折叠（标题折叠 + 缩进折叠）
- 缩进指引
- 自动配对括号和 Markdown 标记（`**`, `_`, `` ` ``）
- 智能列表续行（Enter 自动插入列表标记）
- Tab 缩进/反缩进
- 粘贴 HTML 自动转 Markdown
- 拖拽视觉反馈
- i18n 界面文案

## 仍需后端适配的功能

详见 [docs/gaps-backend.md](docs/gaps-backend.md)：
- `[[` 链接自动补全（需要笔记列表）
- 链接点击跳转（需要路由/导航）
- 图片/附件显示（需要资源 URL 解析）
- 笔记嵌入（需要文件读取）
- 粘贴/拖拽图片保存（需要文件上传）

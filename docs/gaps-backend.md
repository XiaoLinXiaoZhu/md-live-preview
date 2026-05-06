# 需要后端适配的功能缺失

以下功能需要服务端（文件系统、笔记索引、资源管理等）配合才能恢复。

| # | 功能 | 当前状态 | 后端需要提供什么 | 影响程度 |
|---|------|---------|----------------|---------|
| 1 | `[[` 链接自动补全 | 输入 `[[` 无补全弹窗 | 笔记列表 API（文件名 + 路径 + 别名） | ❌ 高 |
| 2 | 链接点击跳转 | 点击链接无反应 | 路由/导航能力（打开指定路径的文件） | ⚠️ 中 |
| 3 | 内部链接解析状态 | 所有 `[[link]]` 显示为未解析（特殊颜色） | 文件存在性检查 API（给定路径 → bool） | ⚠️ 中 |
| 4 | 图片/附件嵌入显示 | `![[image.png]]` 不显示图片 | 资源 URL 解析（vault 路径 → 可访问的 HTTP URL） | ⚠️ 中 |
| 5 | `![[note]]` 笔记嵌入 | embed 区域为空 | 读取目标文件内容 + 渲染为 HTML | ⚠️ 中 |
| 6 | 拖拽文件插入 | 拖拽文件到编辑器无效果 | 文件上传 + 返回 vault 内路径 | ⚠️ 中 |
| 7 | 粘贴图片保存 | 粘贴截图不会插入图片链接 | 图片 blob → 保存到 vault → 返回路径 | ⚠️ 中 |
| 8 | 文本扩展/模板 | 自定义 snippet 不生效 | 用户 snippet 配置读取 | ⚠️ 低 |
| 9 | 全局搜索高亮联动 | 搜索结果不在编辑器中高亮 | 搜索服务 API（查询 → 匹配位置列表） | ⚠️ 低 |

## 后端接口设计建议

### 核心接口（覆盖 #1-#5）

```typescript
interface VaultBackend {
  // #1: 自动补全 — 返回所有可链接的目标
  listLinkTargets(): Promise<{
    path: string;       // "folder/note.md"
    name: string;       // "note"
    aliases: string[];  // 别名列表
  }[]>;

  // #3: 链接解析 — 检查路径是否存在
  resolveLinkPath(linktext: string, sourcePath: string): string | null;

  // #4: 资源 URL — 将 vault 路径转为可加载的 URL
  getResourceUrl(path: string): string;

  // #5: 读取文件内容
  readFile(path: string): Promise<string>;

  // #2: 导航
  openFile(path: string): void;
}
```

### 文件管理接口（覆盖 #6-#7）

```typescript
interface FileManager {
  // #6 #7: 保存附件到 vault，返回最终路径
  saveAttachment(name: string, data: ArrayBuffer): Promise<string>;
}
```

### 可选接口（#8-#9）

```typescript
interface OptionalServices {
  // #8: 获取用户 snippet 列表
  getSnippets(): { trigger: string; replacement: string }[];

  // #9: 搜索
  search(query: string): { path: string; from: number; to: number }[];
}
```

## 适配策略

实现时无需一次性适配所有接口。建议分阶段：

**第一阶段**（可独立运行）：
- 实现 `getResourceUrl`（让图片显示）
- 实现 `resolveLinkPath`（让链接颜色正确）

**第二阶段**（交互增强）：
- 实现 `listLinkTargets` + editorSuggest 适配（`[[` 补全）
- 实现 `openFile`（链接跳转）

**第三阶段**（完整功能）：
- 实现 `saveAttachment`（粘贴/拖拽图片）
- 实现 `readFile`（笔记嵌入）

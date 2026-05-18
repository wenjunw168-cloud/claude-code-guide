# Claude Code 共学手册

## 文件结构

```
claude-code-guide/
├── index.html      ← 页面（基本不用动）
├── content.json    ← 所有章节内容（需要更新时只改这个）
├── proxy.py        ← 本地服务器（启动用这个）
└── README.md       ← 本文件
```

**内容更新只需改 `content.json`，刷新页面即可生效，不需要动 `index.html`。**

## 如何本地运行

页面通过 `fetch` 加载 `content.json`，需要本地服务器（直接双击会有跨域限制）：

```bash
cd ~/Desktop/claude-code-guide
python3 proxy.py
# 浏览器访问 http://localhost:8080
```

> `proxy.py` 同时提供静态文件服务和 AI API 代理转发，解决浏览器 CORS 限制。
> 直接用 `python3 -m http.server` 或 Live Server 打开时 AI 对话功能无法使用。

## 如何更新内容

### 方式一：直接在网页上编辑（推荐）

1. 打开页面，鼠标悬停在任意小节上
2. 点击右侧出现的 **✏ 编辑** 按钮
3. 修改 Markdown 文本，点击 **✓ 保存**
4. 编辑内容自动存入浏览器 localStorage，刷新后仍保留
5. 确认满意后，点击右上角设置图标 → **⬇ 导出 content.json**，覆盖本地文件

### 方式二：直接编辑 content.json

找到对应章节的 `id`，修改 `sections` 里的 `body` 字段（支持 Markdown），保存后刷新页面即可。

```json
{
  "id": "new-chapter",
  "title": "章节标题",
  "icon": "◆",
  "summary": "一句话描述这章讲什么",
  "sections": [
    {
      "heading": "小节标题",
      "body": "正文内容，支持 **Markdown** 格式"
    }
  ],
  "keypoints": ["要点一", "要点二"],
  "quiz": "这章的思考题"
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，英文，用于书签存储，**不要改已有章节的 id** |
| `title` | 导航栏显示的章节名 |
| `icon` | 导航栏图标，用 Unicode 符号 |
| `summary` | 章节副标题 |
| `sections` | 章节内的小节数组 |
| `sections[].heading` | 小节标题 |
| `sections[].body` | 正文，支持 Markdown |
| `keypoints` | 本章要点列表 |
| `quiz` | 思考题文字 |

## AI 对话功能

首次提问时会弹出输入 API Key 的弹窗。

- Key 只存在当前标签页的 sessionStorage，关闭后自动清除
- 支持 Anthropic（`claude-sonnet-4-6`）、OpenAI、Kimi、自定义 OpenAI 兼容接口
- 每次切换章节后，AI 自动获得新章节的上下文
- 编辑内容保存后，AI 的回答也会基于修改后的内容

## 功能说明

- **章节导航**：左侧点击切换章节
- **内联编辑**：悬停小节 → 点击 ✏ 编辑 → 修改 Markdown → 保存，刷新后保留
- **导出内容**：设置面板 → ⬇ 导出 content.json，下载含所有编辑的 JSON
- **标记难点**：「标记为难点」按钮，导航栏橙点标记，存在 localStorage
- **阅读进度**：顶部进度条记录读过的章节数
- **思考题**：每章末尾可直接向 AI 发起讨论

## 今日技术栈总结（2026-05-11）

今天的改动全部基于原生技术，没有引入任何新依赖。

### 前端（index.html）

| 功能 | 技术 |
|------|------|
| 可拖动分栏 | CSS Flexbox、`mousedown/mousemove/mouseup` 事件、`localStorage` |
| 文字选中检测 | `Selection API`（`window.getSelection()`）、`Range.getBoundingClientRect()` |
| 正文标记还原 | `DOM TreeWalker`（遍历文本节点）、`DocumentFragment`、动态创建 `<mark>` 元素 |
| 角标样式 | CSS `position: relative` + `::after` 伪元素 + `content: attr(data-num)` |
| 数据持久化 | `localStorage`（JSON 序列化） |
| 浮层定位 | CSS `position: fixed` + JS 动态计算坐标 |

### 后端（proxy.py）

| 功能 | 技术 |
|------|------|
| 静态文件服务 | Python 标准库 `http.server.SimpleHTTPRequestHandler` |
| API 转发 | `subprocess` 调用系统 `curl`，继承环境变量代理设置 |
| 错误处理 | 检测空响应，返回结构化 JSON 错误 |

### 说明

proxy.py 的作用是解决浏览器 CORS 跨域限制——浏览器不能直接请求第三方
API，通过本地服务器转发后，服务器之间不受 CORS 约束。等效方案包括
Next.js API Routes 部署到 Vercel，优势是用户无需本地启动任何服务。

## 分享给他人

最简单：把整个文件夹发给对方（ZIP 压缩后），对方用同样方式启动本地服务器即可。

长期分享：推送到 GitHub，开启 GitHub Pages（Settings → Pages → main 分支根目录），获得永久可访问的 URL。

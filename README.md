# Claude Code 共学手册

## 文件结构

```
claude-code-guide/
├── index.html      ← 页面（基本不用动）
├── content.json    ← 所有章节内容（需要更新时只改这个）
└── README.md       ← 本文件
```

## 如何本地运行

直接双击 index.html 在浏览器打开会因为跨域限制无法加载 JSON，需要用本地服务器：

```bash
# 方法一：Python（推荐）
cd claude-code-guide
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080

# 方法二：Node.js
npx serve .

# 方法三：VS Code 安装 Live Server 插件后右键 index.html → Open with Live Server
```

## 如何更新内容

只需要编辑 `content.json`，不用动 `index.html`。

### 修改现有章节

找到对应章节的 `id`，修改 `sections` 里的 `body` 字段。`body` 支持 Markdown 格式。

### 新增章节

在 `chapters` 数组末尾添加一个新对象，格式如下：

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
  "keypoints": [
    "要点一",
    "要点二"
  ],
  "quiz": "这章的思考题"
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识，英文，用于书签存储，不要改已有章节的 id |
| `title` | 导航栏显示的章节名 |
| `icon` | 导航栏的图标，用 Unicode 符号 |
| `summary` | 章节副标题 |
| `sections` | 章节内的小节数组 |
| `sections[].heading` | 小节标题 |
| `sections[].body` | 正文，支持 Markdown |
| `keypoints` | 本章要点列表 |
| `quiz` | 思考题文字 |

## AI 对话功能

首次提问时会弹出输入 API Key 的弹窗。

- Key 只存在当前标签页的 sessionStorage，关闭标签页后自动清除
- 需要 Anthropic API Key，在 console.anthropic.com 创建
- 每次切换章节后，AI 会自动获得新章节的上下文

## 功能说明

- **章节导航**：左侧点击切换章节
- **标记难点**：右上角「标记为难点」按钮，导航栏会显示橙色圆点，数据存在 localStorage
- **阅读进度**：顶部进度条记录读过的章节数
- **思考题**：每章末尾，可点击「向 AI 讨论」直接发起对话
- **快速提问**：对话框上方有常用问题快捷按钮

# MimoCode WebUI

MimoCode CLI (`mimo`) 的独立全功能 WebUI 平台，通过 HTTP REST + SSE 连接 `mimo serve` 后端。

**作者**：logy | **协议**：MIT | **仓库**：https://github.com/logy/MimoCodeWebUI

## 功能

- **AI 对话** — 流式输出、Markdown 实时渲染、代码块语法高亮
- **工具调用可视化** — 状态指示、展开/折叠查看输入输出
- **Session 管理** — 创建、切换、删除、导出 JSON
- **模型切换** — 从已连接 Provider 中选择模型
- **Agent 切换** — build / plan / compose 三种模式
- **统计面板** — Token 用量、成本、模型分布
- **设置面板** — Provider、Agent、MCP 服务器信息
- **右键菜单** — Session 删除/导出、消息复制/重新生成
- **自动连接** — 扫描本地端口，一键启动 `mimo serve`
- **键盘驱动** — ⌘K 新建、⌘1/2/3 切换 Agent、⌘M 切换模型

## 快速开始

### 前置条件

- Node.js 18+
- MimoCode CLI：`npm install -g @mimo-ai/cli`

### 启动

```bash
# 安装依赖
npm install

# 启动开发服务器（自动检测 mimo serve）
npm run dev

# 或手动启动 mimo serve
mimo serve --port 4096
```

打开 `http://localhost:5173`，点击 "Start mimo serve" 或手动输入服务器地址连接。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS 4（CSS 变量主题系统）
- Zustand（状态管理）
- lucide-react（图标）

## 项目结构

```
src/
├── api/           # REST 客户端、SSE 客户端、类型定义
├── store/         # Zustand stores (connection, session, message, ui)
├── components/    # 通用组件 (Sidebar, Header, ModelPicker, ContextMenu)
├── views/         # 页面 (StatsView, SettingsView)
├── features/
│   └── chat/      # 对话功能 (MessageItem, MessageInput, TextPart, ToolCallPart)
├── styles/        # globals.css (Tailwind + 设计 tokens)
├── App.tsx        # 主壳
└── main.tsx       # 入口
```

## 设计规范

详见 [DESIGN.md](./DESIGN.md)

## License

MIT

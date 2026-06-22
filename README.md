# MimoCodeHub

MimoCode CLI (`mimo`) 的独立全功能 WebUI 平台，通过 HTTP REST + SSE 连接 `mimo serve` 后端。

**作者**：TetrahedronAY | **协议**：MIT | **仓库**：https://github.com/TetrahedronAY/MimoCodeHub

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

## 安装与使用

### 方式一：npm 一键启动（推荐）

```bash
npx mimocodehub
```

自动启动本地服务器并打开浏览器。需要已安装 MimoCode CLI。

### 方式二：GitHub Release 静态包

1. 从 [Releases](https://github.com/logy/MimoCodeHub/releases) 下载 `mimocodehub.zip`
2. 解压后双击 `index.html`
3. 在连接对话框中输入 `mimo serve` 的地址

### 方式三：源码构建

```bash
git clone https://github.com/logy/MimoCodeHub.git
cd MimoCodeHub
npm install
npm run dev
```

### 前置条件

所有方式都需要 MimoCode CLI 已安装并可运行 `mimo serve`：

```bash
npm install -g @mimo-ai/cli
mimo serve --port 4096
```

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

## License

MIT

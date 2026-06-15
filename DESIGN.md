# MimoCode WebUI 设计文档

## 1. 项目定位

MimoCode CLI (`mimo`) 的独立全功能 WebUI 平台。通过 HTTP REST API + SSE 连接 `mimo serve` 后端，提供 AI 对话、Session 管理、统计面板、设置管理等功能。

**设计方向**：Terminal Brutalism — 终端美学与现代 Web UI 的融合。信息密集、极简、键盘驱动。像一台高性能仪器，而非消费级产品。

---

## 2. 架构

```
Browser (SPA)  ←——HTTP REST + SSE——→  mimo serve (headless server)
     │                                        │
     ├─ REST: /project /session /provider ...  ├─ LLM Provider API
     └─ SSE:  /event (实时事件流)              └─ SQLite (mimocode.db)
```

- **纯客户端 SPA** — 无后端代理，浏览器直接连接 `mimo serve`
- **连接管理** — 用户输入服务器地址，前端存储于 localStorage
- **SSE 实时更新** — 事件驱动 UI 更新，无需轮询

---

## 3. 技术选型

| 层面 | 选择 | 理由 |
|------|------|------|
| 构建 | **Vite** | HMR 极快，SPA 开发体验最佳 |
| 框架 | **React 19 + TypeScript** | 生态最大，流式 chat UI 成熟方案最多；TS 保证 API 层类型安全 |
| 样式 | **Tailwind CSS 4** | utility-first，暗色主题只需 CSS 变量；无需组件库 |
| 状态 | **Zustand** | 极简 API，无 action/reducer 样板，4 个独立 store 足够 |
| Markdown | **react-markdown + remark-gfm** | 成熟稳定，支持 GFM、数学公式 |
| 代码高亮 | **Shiki** | 基于 VS Code TextMate 语法，支持暗色主题 |
| 图标 | **lucide-react** | Tree-shakable，风格统一 |

**不引入**：React Router（state 切换视图）、Redux（Zustand 足够）、shadcn/ui（Tailwind 直写更灵活）、Framer Motion（CSS 动画即可）

---

## 4. 色彩系统

### 暗色主题（默认）

基于暖色深灰蓝，搭配酸性黄绿作为强调色。

```css
:root {
  /* 基础色阶 — 暖色深灰蓝 */
  --bg-0: #0c0e14;    /* 最深层：主背景 */
  --bg-1: #11141c;    /* 侧边栏、头部 */
  --bg-2: #181c26;    /* 卡片、hover 状态 */
  --bg-3: #1f2430;    /* 输入框、badge 背景 */
  --bg-4: #272d3a;    /* 最浅层：kbd、分隔 */

  /* 强调色 — 酸性黄绿 */
  --accent: #b4f04e;
  --accent-dim: #b4f04e33;   /* 20% 透明度 */
  --accent-mid: #b4f04e66;   /* 40% 透明度 */

  /* 语义色 */
  --green: #b4f04e;    /* 成功、完成、连接正常 */
  --amber: #f0c14e;    /* 警告、运行中 */
  --red: #f05e4e;      /* 错误、断开连接 */
  --blue: #5e9ef0;     /* 用户消息、链接 */
  --purple: #a87ef0;   /* 推理、系统消息 */

  /* 文本层级 */
  --text-1: #e8ecf4;   /* 主文本 */
  --text-2: #8b95a8;   /* 次要文本 */
  --text-3: #545e72;   /* 辅助文本、时间戳 */

  /* 边框与表面 */
  --border: #232a36;       /* 默认边框 */
  --border-bright: #333d4e; /* 交互态边框 */
  --surface: #161a24;      /* 工具卡片背景 */
}
```

### 色彩使用规范

| 元素 | 颜色 |
|------|------|
| 用户消息 badge | `--blue` (rgba 10% 背景) |
| 助手消息 badge | `--accent` (dim 背景) |
| 系统消息 badge | `--purple` (rgba 10% 背景) |
| 工具完成状态 | `--green` |
| 工具运行中状态 | `--amber` + pulse 动画 |
| 工具错误状态 | `--red` |
| 工具待执行状态 | `--text-3` 边框圆点 |
| 内联代码 | `--accent` 文字 + `--bg-3` 背景 |
| 代码块 | `--bg-1` 背景 + `--border` 边框 |
| Agent: build | `#fb8147` (橙) |
| Agent: plan | `#c7e2a8` (浅绿) |
| Agent: compose | `#a7a3d8` (紫) |

---

## 5. 字体系统

```css
--font-mono: 'IBM Plex Mono', 'Menlo', monospace;     /* UI 主字体 */
--font-code: 'JetBrains Mono', 'Menlo', monospace;     /* 代码块 */
--font-ui: 'Manrope', -apple-system, sans-serif;        /* 品牌、标题 */
```

| 用途 | 字体 | 字号 |
|------|------|------|
| UI 正文 | IBM Plex Mono | 12px |
| 代码块 | JetBrains Mono | 11px |
| 品牌/标题 | Manrope | 13px, weight 700 |
| 标签/小字 | IBM Plex Mono | 10-11px |
| 极小字 | IBM Plex Mono | 9px |
| kbd 快捷键 | IBM Plex Mono | 8-9px |

### 排版规范

- **行高**：1.55（正文）、1.4（紧凑元素）
- **字间距**：大写标签 `letter-spacing: 0.08em`
- **文本转换**：分组标签、工具区标签使用 `text-transform: uppercase`
- **数字**：使用 `font-variant-numeric: tabular-nums` 等宽数字

---

## 6. 布局

### 主布局

```
┌──────────────┬──────────────────────────────────────┐
│              │  Header (40px)                       │
│  Sidebar     │  SessionTitle · AgentTabs · Controls │
│  (260px)     ├──────────────────────────────────────┤
│              │                                      │
│  Brand       │          Chat / Stats / Settings     │
│  Connection  │          (flex: 1, overflow-y)       │
│  NewSession  │                                      │
│  SessionList │                                      │
│              ├──────────────────────────────────────┤
│  ModelBadge  │  InputArea                           │
│              │  MetaTags · TextArea · SendBtn · Hints│
└──────────────┴──────────────────────────────────────┘
```

### 尺寸规范

| 元素 | 尺寸 |
|------|------|
| Sidebar 宽度 | 260px |
| Header 高度 | 40px |
| 消息内边距 | 10px 20px |
| 工具卡片内边距 | 6px 10px |
| 代码块内边距 | 8px 10px |
| 边框宽度 | 1px |
| 圆角 | 0px（全直角） |
| 滚动条宽度 | 5px |

---

## 7. 组件规范

### 命名规则

- **文件名**：PascalCase（`ToolCallPart.tsx`）
- **组件名**：PascalCase
- **Store**：camelCase（`useConnectionStore`）
- **CSS 类名**：BEM 风格或 Tailwind utility
- **类型前缀**：`I` 前缀用于接口（`ISession`, `IMessage`）

### 关键组件

#### 消息部件渲染器 (PartRenderer)

根据 `part.type` 分发渲染：

```
text     → TextPart      (Markdown 渲染)
reasoning → ReasoningPart (可折叠灰色区域，默认收起)
tool     → ToolCallPart  (卡片式，可展开查看 I/O)
```

#### 工具调用卡片 (ToolCallPart)

```
┌─────────────────────────────────────────────┐
│ ● read_file  src/middleware/auth.ts    0.3s ▶│  ← header（可点击展开）
├─────────────────────────────────────────────┤
│ Output                                      │  ← body（展开后可见）
│ ┌─────────────────────────────────────────┐ │
│ │ import { Request, ... } from 'express'  │ │  ← 代码块
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- 状态圆点：completed=绿 / running=琥珀+pulse / error=红 / pending=空心
- 工具名称：JetBrains Mono，500 weight
- 详情路径：截断显示，max-width 300px
- 耗时：等宽数字，右对齐
- 展开/折叠：chevron 图标旋转 90°

#### 推理块 (ReasoningBlock)

```
┌─────────────────────────────────────────────┐
│ ▶ REASONING                    8s · 342 tok │  ← 默认收起
├─────────────────────────────────────────────┤
│ 斜体灰色文本...                              │  ← 展开后
└─────────────────────────────────────────────┘
```

#### 输入区

```
┌─ [mimo-v2.5-pro ⌘M] ─ [● build ⌘1] ─────┐
│ ┌──────────────────────────────────────┐ ↑ │
│ │ Send a message...                    │   │  ← 绿色发送按钮
│ └──────────────────────────────────────┘   │
│ Enter send  Shift+Enter newline  ⌘K new   │
└───────────────────────────────────────────┘
```

---

## 8. 数据模型

### MimoCode API 核心类型

```typescript
interface Session {
  id: string;
  slug: string;
  projectID: string;
  directory: string;
  title: string;
  version: number;
  time: { created: number; updated: number };
}

interface Message {
  info: {
    role: 'user' | 'assistant' | 'system';
    agent?: string;
    model?: string;
    time: number;
    cost?: number;
    tokens?: { input: number; output: number };
  };
  parts: Part[];
}

type Part = TextPart | ReasoningPart | ToolPart;

interface TextPart { type: 'text'; text: string; }
interface ReasoningPart { type: 'reasoning'; text: string; }
interface ToolPart {
  type: 'tool';
  callID: string;
  name: string;
  state: {
    status: 'running' | 'completed' | 'error';
    input?: Record<string, unknown>;
    output?: string;
  };
}
```

### SSE 事件类型

| 事件 | 负载 | 处理 |
|------|------|------|
| `session.updated` | Session | 更新/新增 session |
| `session.deleted` | { id } | 从列表移除 |
| `message.updated` | Message | 更新消息列表 |
| `message.part.updated` | Part | 流式追加 / 更新工具状态 |
| `message.part.removed` | { id } | 移除部件 |
| `metrics.model_call` | 统计数据 | 更新统计面板 |

---

## 9. 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `⌘K` / `Ctrl+K` | 新建 Session |
| `⌘,` / `Ctrl+,` | 打开设置 |
| `⌘1` / `Ctrl+1` | 切换到 build agent |
| `⌘2` / `Ctrl+2` | 切换到 plan agent |
| `⌘3` / `Ctrl+3` | 切换到 compose agent |
| `⌘4` / `Ctrl+4` | 打开统计面板 |
| `⌘5` / `Ctrl+5` | 返回对话视图 |
| `Esc` | 关闭弹窗 / 返回对话 |
| `Enter` | 发送消息 |
| `Shift+Enter` | 换行 |

---

## 10. 动效规范

| 场景 | 动效 |
|------|------|
| 工具运行中 | 状态圆点 pulse 动画 (1.2s ease-in-out infinite) |
| 流式文本 | 逐字追加 (18-43ms 随机间隔) |
| 流式光标 | 酸性黄绿色块 blink (0.8s step-end) |
| 展开/折叠 | chevron rotate 90° (0.15s) |
| hover 交互 | border-color 过渡 (0.12s) |
| 选中状态 | 左侧 border accent (2px) |

### 噪点纹理覆盖

通过 SVG feTurbulence 生成全局噪点纹理，opacity 0.025，为纯色背景增加质感。覆盖在最顶层（z-index: 9999），pointer-events: none。

---

## 11. 开发规范

### Git 提交

- 按功能模块分提交，每个 Phase 完成后一个 milestone commit
- 提交信息格式：`<type>: <description>`（type: feat/fix/style/refactor/docs）

### 代码风格

- 无注释（代码自解释）
- 组件 Props 使用 interface 定义
- Store 使用 Zustand 的 `create<T>()((set, get) => ({...}))` 模式
- API 调用统一通过 `src/api/client.ts`，不在组件中直接 fetch

### 文件组织

- 一个组件一个文件
- 按功能模块分目录（features/chat/、features/sessions/ 等）
- 公共组件放 components/
- 自定义 hooks 放 hooks/

# MimoCode WebUI

## 项目概述

MimoCode CLI 的独立全功能 WebUI，通过 HTTP REST + SSE 连接 `mimo serve` 后端。

- **作者**：logy (895812718@qq.com)
- **协议**：MIT
- **仓库**：https://github.com/logy/MimoCodeWebUI

## 协作规范

- 所有对外变更（push、tag、release）必须经用户确认后执行
- 小迭代直接提交到 main，阶段性版本打 tag 发布
- 提交信息格式：`feat:` / `fix:` / `docs:` / `refactor:` + 中文简述

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS 4（CSS 变量主题系统）
- Zustand（状态管理）
- lucide-react（图标）

## 常用命令

```bash
npm run dev        # 启动开发服务器 (Vite)
npm run build      # 生产构建
npx tsc --noEmit   # 类型检查
```

## 项目结构

```
src/
  api/        # REST 客户端、SSE 客户端、类型定义
  store/      # Zustand stores (connection, session, message, ui)
  components/ # 通用组件 (Sidebar, Header, ConnectionDialog)
  hooks/      # 自定义 hooks
  lib/        # 工具函数
  styles/     # globals.css (Tailwind + 设计 tokens)
  App.tsx     # 主壳
  main.tsx    # 入口
```

## 设计规范

详见 [DESIGN.md](./DESIGN.md)

## 已知问题

- `mimo serve` 默认端口随机，需手动指定 `--port`
- SSE 事件处理尚在完善中，部分事件类型可能未完全映射

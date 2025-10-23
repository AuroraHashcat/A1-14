# Crypto Eval Frontend

基于 React + TypeScript + Vite + Mantine 构建的全新前端界面，覆盖评测任务、证据管理、知识库查询与报告展示等核心功能。

## 快速开始

```bash
npm install
npm run dev
```

默认后端接口代理到 `http://localhost:5000`，可在 `.env` 或启动命令中设置 `VITE_BACKEND_URL` 指定实际后端地址。

## 主要特性

- 🎯 **全局仪表盘**：首页与后台提供实时统计视图，快速掌握评测进展；
- 🧠 **知识助手**：集成问答、语义检索与题库生成功能；
- 📁 **拖拽上传**：支持批量证据上传与状态跟踪；
- 📊 **报告中心**：结构化展示评测报告、建议与关联任务；
- 💡 **响应式设计**：完善的移动端导航与色彩体系。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 产出生产构建并执行 TypeScript 检查 |
| `npm run preview` | 预览生产构建 |

## 目录结构

```
frontend/
  ├─ src/
  │  ├─ api/          # HTTP 客户端与业务接口封装
  │  ├─ components/   # 复用组件（统计卡片、布局等）
  │  ├─ context/      # 全局状态（如认证状态）
  │  ├─ hooks/        # React Query 数据 hook
  │  ├─ pages/        # 页面级组件
  │  ├─ styles/       # 全局样式
  │  └─ utils/        # 工具函数
  └─ vite.config.ts   # Vite 配置（代理后端接口）
```

## 与后端集成

- 默认通过 Vite 的代理将 `/api`、`/login` 等请求转发至 Flask 服务；
- 上传接口会携带 Cookie，确保与现有会话机制兼容；
- 某些统计数据需后端补充专用接口时，可在 `src/api` 中扩展。

如需调整主题或品牌色，可修改 `src/theme.ts` 以及 `src/styles/global.css`。

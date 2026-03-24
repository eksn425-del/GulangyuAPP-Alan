# Gulangyu Main Monorepo

## 项目说明

该目录用于统一管理两个子项目，作为后续 Monorepo 的主入口：

- `web/`：无障碍导览 Web 应用（React 19 + Vite + FastAPI + SQLite）
- `unity/`：Unity 3D 虚拟仿真客户端（后续复用统一后端）

## 当前阶段

当前仅完成 Monorepo 骨架初始化，不包含代码迁移与目录移动。

## 后续整合路线

1. 合并 Web 与 Unity 的 FastAPI 后端能力到单一后端
2. 统一危险事件上报数据模型与 SQLite 持久化表结构
3. 重构 Unity 网络通信层为异步队列与重试机制

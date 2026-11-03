# 🍳 家常菜入门指南

一个个人使用的家常菜入门指南网页应用，帮助厨房新手系统化地学习做菜全流程——从认识食材、购买、储存、处理，到完整菜品的制作。核心特色是**菜品与食材的双向关联导航**。

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Vue 3 + Vite |
| 路由 | Vue Router 4 |
| 本地存储 | IndexedDB（Dexie.js） |
| PWA | vite-plugin-pwa（离线 + 手机安装） |
| UI | 自定义 CSS（清新简约风） |
| 部署 | GitHub Pages（纯静态托管，无需服务器） |

## 项目结构

```
cook/
├── README.md              # 项目总说明（当前文件）
├── src/                   # 源码
│   ├── assets/            # 静态资源（CSS、图片等）
│   ├── components/        # Vue 组件
│   ├── views/             # 页面组件
│   ├── router/            # 路由配置
│   ├── stores/            # 状态管理
│   └── db/                # IndexedDB 数据层封装
├── doc/                   # 文档（按类别划分）
│   ├── 需求/               # 需求文档
│   ├── 设计/               # 设计文档
│   ├── 开发/               # 开发文档
│   └── 使用/               # 使用手册
├── third_party/           # 三方库（非 npm 管理的依赖）
└── data/                  # 数据文件
    ├── ingredients/       # 食材初始数据
    └── dishes/            # 菜品初始数据
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 部署

1. `npm run build` 构建静态文件
2. 推送到 GitHub 仓库
3. 开启 GitHub Pages 自动部署
4. 手机浏览器打开 URL → 安装为 PWA

## 数据同步

数据存储在浏览器本地（IndexedDB），各设备独立。
同步方式：应用内导出 JSON → 传到另一设备 → 导入。

## 文档索引

- [需求文档](doc/需求/README.md) — 项目需求规格（做什么）
- [设计文档](doc/设计/README.md) — 技术设计方案（怎么做）
- [开发文档](doc/开发/README.md) — 开发过程记录
  - [Git协作规范](doc/开发/Git协作规范.md) — Commit 格式、分支管理、合并策略
- [使用手册](doc/使用/README.md) — 最终用户使用说明

---

*项目状态：已部署，v1.0*

## 访问地址

部署完成后访问：
- 桌面端：`https://g-aliang.github.io/cook-guide/`
- 手机端：同一 WiFi 下 `http://192.168.1.7:4173/`，可安装为 PWA

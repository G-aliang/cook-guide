# GitHub Pages 部署指南

> 适用项目：家常菜入门指南（cook-guide）
> 日期：2026-11-01

---

## 一、什么是 GitHub Pages

GitHub Pages 是 GitHub 提供的免费静态网站托管服务。它可以将仓库中的静态文件（HTML、CSS、JS、图片等）发布为公网可访问的网站。

### 核心特点

| 特点 | 说明 |
|------|------|
| 免费 | 无需付费，个人项目完全够用 |
| 稳定 | 由 GitHub 官方维护，可靠性高 |
| 自动 CDN | 全球 CDN 加速，访问速度快 |
| 零运维 | 无需管理服务器，推送代码自动发布 |
| HTTPS | 自动提供 HTTPS 安全连接 |
| 自定义域名 | 支持绑定自己的域名（需验证） |

### 访问地址格式

| 类型 | 地址格式 |
|------|----------|
| 用户站点 | `https://用户名.github.io/` |
| 项目站点 | `https://用户名.github.io/仓库名/` |

本项目访问地址：**https://g-aliang.github.io/cook-guide/**

---

## 二、两种部署方式对比

GitHub Pages 支持两种部署方式：

| 对比项 | 分支部署（Branch） | GitHub Actions 部署 |
|--------|-------------------|---------------------|
| 原理 | 从指定分支的目录发布 | 通过 CI/CD 工作流构建后发布 |
| 配置 | Source 选 "Deploy from a branch" | Source 选 "GitHub Actions" |
| 适用场景 | 已有构建产物直接推送 | 代码推送后自动构建部署 |
| 灵活性 | 低，直接推送文件 | 高，可自定义构建步骤 |
| 本项目使用 | ✅ 当前方式（gh-pages 分支） | 代码构建通过 Actions |

### 本项目的实际部署流程

```
代码修改 → npm run build → dist/ 目录生成
  → 推送代码到 main 分支（触发 GitHub Actions 构建验证）
  → 手动推送 dist/ 到 gh-pages 分支
  → GitHub Pages 自动发布 gh-pages 分支的文件
```

---

## 三、分支说明

### main 分支（源代码）

- 存放项目源代码（src/、package.json、vite.config.js 等）
- 每次修改代码后推送到这里
- 触发 GitHub Actions 工作流进行构建验证

### gh-pages 分支（部署产物）

- 存放构建后的静态文件（dist/ 目录内容）
- 推送到这里后 GitHub Pages 自动发布
- 每次更新网站内容都需要推送这个分支

### 两个分支的关系

```
main 分支（源代码）
  ↓ npm run build
dist/ 目录（静态文件）
  ↓ 推送
gh-pages 分支（部署产物）
  ↓ GitHub Pages 自动发布
  ↓ https://g-aliang.github.io/cook-guide/
```

---

## 四、配置步骤

### 初始配置（已完成）

1. 打开仓库页面：https://github.com/G-aliang/cook-guide
2. 进入 **Settings → Pages**
3. **Source** 选择 **Deploy from a branch**
4. **Branch** 选择 **gh-pages** / 目录 **/ (root)**
5. 保存

配置完成后，GitHub Pages 会自动发布 gh-pages 分支中的文件。

### 后续更新配置（无需再改）

配置只需做一次，后续更新只需推送 gh-pages 分支即可。

---

## 五、更新部署的完整流程

### 每次更新代码后的操作

**步骤 1：提交源代码**

```bash
cd D:\code\cook
git add -A
git commit -m "更新说明"
git push origin main
```

这会触发 GitHub Actions 工作流，验证代码能否正常构建。

**步骤 2：构建生产版本**

```bash
npm run build
```

生成 `dist/` 目录。

**步骤 3：推送到 gh-pages 分支**

```bash
cd dist
git init
git add -A
git commit -m "更新: 说明"
git push --force https://github.com/G-aliang/cook-guide.git HEAD:gh-pages
cd ..
```

**步骤 4：等待发布**

约 1-2 分钟后，访问 https://g-aliang.github.io/cook-guide/ 确认更新已生效。

---

## 六、常见问题

### Q: 仓库名能改吗？

可以。在 Settings → General → Repository name 修改。修改后：
- 旧地址会自动重定向到新地址
- git remote URL 需要更新
- Pages 访问地址会变化（用户名不变，仓库名变了）

> ⚠️ 仓库名不建议以 `-` 开头，可能导致 Pages 设置页 UI 异常。

### Q: 修改了代码但网站没变化？

可能的原因：
1. 没有推送 gh-pages 分支（代码改了但没部署）
2. 浏览器缓存（清除缓存或用 Ctrl+F5 强制刷新）
3. GitHub Pages 还在发布中（等待 1-2 分钟）

### Q: 能用 GitHub Actions 全自动部署吗？

可以。修改部署方式为 "GitHub Actions"，然后修改工作流文件 `.github/workflows/deploy.yml`，让它自动推送 dist 到 gh-pages 分支。这样每次推送 main 分支后，GitHub Actions 会自动构建并部署，无需手动操作。

### Q: 有流量限制吗？

GitHub Pages 有软限制（约 100GB/月 流量），个人项目完全够用。不会因流量超额而停止服务。

### Q: 网站会下线吗？

只要仓库保持公开（Public），GitHub Pages 就会持续运行。如果将仓库改为私有，Pages 会停止服务。

### Q: 能绑定自定义域名吗？

可以。在 Settings → Pages → Custom domain 中添加域名，然后需要在域名服务商处添加 CNAME 记录指向 `用户名.github.io`。添加后需要验证域名所有权。

---

## 七、从零开始配置 GitHub Pages

如果你要为新项目配置 GitHub Pages：

### 1. 创建 GitHub 仓库

- 仓库名：如 `my-website`
- 公开（Public）
- 不要勾选 README（避免空仓库）

### 2. 推送代码

```bash
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/用户名/my-website.git
git push -u origin main
```

### 3. 配置 Pages

- Settings → Pages → Source → Deploy from a branch
- Branch → main / (root) 或 gh-pages / (root)

### 4. 上传静态文件

如果是纯静态网站（无构建步骤）：
- 直接把 HTML/CSS/JS 文件放到仓库根目录或 gh-pages 分支
- 推送后 GitHub Pages 自动发布

如果有构建步骤：
- `npm run build` 生成 dist
- 推送 dist 到 gh-pages 分支
- Pages 配置使用 gh-pages 分支

### 5. 验证

访问 `https://用户名.github.io/仓库名/` 确认网站可访问。

---

## 八、项目部署相关文件

| 文件 | 说明 |
|------|------|
| `.github/workflows/deploy.yml` | GitHub Actions 工作流（代码构建验证） |
| `vite.config.js` | Vite 配置（含 PWA 和 base 路径设置） |
| `public/import-data.json` | 初始数据文件（自动导入到浏览器） |
| `dist/` | 构建产物（推送到 gh-pages 分支） |

---

*文档结束*

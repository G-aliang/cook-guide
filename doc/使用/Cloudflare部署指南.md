# 家常菜入门指南 — Cloudflare Pages + Access 部署指南

> 版本：v1.1  
> 日期：2026-11-01  
> 状态：待实施  
> 目标：把项目从 GitHub Pages 迁移到 Cloudflare Pages，并加登录鉴权，实现「只有自己能访问」——外网可用、手机端与电脑端均可、私有仓库也能免费部署  
> 更新：v1.1 新增「改版前后流程对比」总览  
> 关联文档：[使用文档](./使用文档.md)、[GitHub Pages 指南](./GitHub%20Pages指南.md)

---

## 一、改版前后流程对比（总览）

### 1.1 访问流程

**现在（GitHub Pages，公开）：**

```
任何人 → 浏览器打开 g-aliang.github.io/cook-guide
   → 直接加载页面（无验证）
   → 数据从各自的本地 IndexedDB 读取
```

**改版后（Cloudflare Pages + Access，私有）：**

```
你 → 打开 cook.你的域名.com
   → Cloudflare Access 拦截 → 登录页（邮箱验证码 / Google）
   → 验证通过 → 放行 → 加载页面
   → 数据仍从本地 IndexedDB 读取
```

### 1.2 更新流程

| | 步骤 |
|---|------|
| 现在 | 改代码 → `npm run build` → 手动推 `dist` 到 gh-pages 分支 → GitHub Pages 发布 |
| 改版后 | 改代码 → `git push` → Cloudflare 自动「拉取 + 构建 + 发布」|

### 1.3 逐项对比

| 维度 | 现在（GitHub Pages）| 改版后（Cloudflare + Access）|
|------|---------------------|------------------------------|
| 访问地址 | `g-aliang.github.io/cook-guide` | `cook.你的域名.com`（自有域名）|
| 谁能访问 | 任何人 | 仅登录者 |
| 打开时发生什么 | 直接加载 | 先过登录门禁 |
| 仓库可见性 | 公开 | 可转私有 |
| 登录 / 鉴权 | ❌ 无 | ✅ Access（邮箱验证码 / Google）|
| 谁当「服务器」 | GitHub Pages | Cloudflare Pages |
| 更新部署 | 手动推 gh-pages 分支 | push 即自动部署 |
| 数据存储 | 本地 IndexedDB | 本地 IndexedDB（不变）|
| 跨设备同步 | 手动导出/导入 JSON | 手动导出/导入 JSON（不变）|
| 成本 | 免费 | 域名 ¥30–100/年，其余免费 |
| 旧地址 | 有效 | 失效（转私有 / 关 Pages 后）|

### 1.4 改版带来的变化

| 方面 | 变化 |
|------|------|
| 门禁 | 从「谁都能进」→「登录才进」|
| 源码 | 从「公开」→「可私有」|
| 部署 | 从「手动推分支」→「push 自动部署」|
| 地址 | 从 `github.io` 子路径 → 自己的域名 |
| 成本 | 从 0 → 域名年费 |
| 数据 | 不变（仍本地、手动同步）|
| 服务器 | 不变（仍不用自己开电脑）|

> 一句话：**代码还是放 GitHub、数据还是存本地、电脑还是不用当服务器；变的是——加了登录门禁、换成自有域名、部署自动化、源码可私有；代价是一个域名年费。**

---

## 二、为什么选 Cloudflare

项目当前部署在 GitHub Pages，但它有三个绕不开的限制。Cloudflare Pages + Access 正好一一对应地解决：

| 诉求 | GitHub Pages | Cloudflare Pages + Access |
|------|--------------|---------------------------|
| 手机在外也能访问 | ✅ | ✅ |
| 加登录 + 鉴权，避免他人访问 | ❌ 无访问控制功能 | ✅ Access 邮箱登录门禁 |
| 私有仓库也要能免费部署 | ❌ 免费账户私有仓库无法启用 Pages（需 Pro） | ✅ 免费支持从私有仓库部署 |

补充优势：

- 仍然是**纯静态托管**，无需自建或维护任何后端服务器
- 自带全球 CDN 与 HTTPS，访问快
- 保留 PWA（离线、安装到桌面）能力
- 推送代码后**自动构建部署**，比原来的手动推送 gh-pages 更省事

---

## 三、整体架构

```
手机 / 电脑（外网）
        │  https://cook.你的域名.com
        ▼
Cloudflare Access（登录门禁：邮箱验证码）
        │   未登录 → 直接拦截
        │   已登录 → 放行
        ▼
Cloudflare Pages（静态站点：102 食材 / 756 菜品）
        │
        ▼
浏览器 IndexedDB（个人数据，各设备本地存储，互不干扰）
```

**安全要点：** Access 在 Cloudflare 的**边缘网关**拦截请求，未登录的人**连前端 JS 文件都下载不到**，从根本上看不到应用逻辑。这比在页面里做「前端登录页」安全得多——前端登录的校验代码是公开的，可以被绕过。

---

## 四、前置准备

| 项目 | 说明 |
|------|------|
| Cloudflare 账号 | 免费注册：https://dash.cloudflare.com/sign-up |
| 一个自己的域名 | 约 ¥30–100/年，用于绑定站点并承载 Access 策略 |
| GitHub 仓库 | `G-aliang/cook-guide`（现有仓库） |
| Node 版本 | 项目根目录已添加 `.nvmrc`（内容 `20`），Cloudflare 构建时会读取 |

---

## 五、实施步骤

### 第 0 步：购买域名

- 可选注册商：**Namecheap / Porkbun / Cloudflare Registrar**（约 $10/年），国内阿里云、腾讯云亦可
- 建议后缀：`.com` 或更便宜的 `.top` / `.xyz`
- 国内注册商购买的域名**无需备案**——因为站点托管在 Cloudflare（境外），备案仅针对境内服务器

### 第 1 步：把域名接入 Cloudflare

1. 登录 Cloudflare → **Add a site** → 输入你的域名
2. 选择 **Free** 计划
3. Cloudflare 会给出 **2 个 Nameserver**（形如 `xxx.ns.cloudflare.com`）
4. 到域名注册商后台，把域名的 DNS 服务器改成这两个
5. 等待几分钟到几小时，Cloudflare 显示「Active」即生效

### 第 2 步：创建 Pages 项目并连接仓库

1. Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权 GitHub，选择仓库 `cook-guide`
3. 构建配置：

   | 配置项 | 值 |
   |--------|-----|
   | Framework preset | Vue |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | 环境变量 | `NODE_VERSION` = `20` |

4. 点击 **Save and Deploy**
5. 首次构建完成后，会得到一个预览地址，形如 `cook-guide-xxx.pages.dev`

> 说明：`vite.config.js` 中的 `base: './'`、Hash 路由、PWA 配置均与 Cloudflare Pages 兼容，**无需改动代码**。

### 第 3 步：绑定自定义域名

1. 进入 Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入 `cook.你的域名.com`（或直接用主域名）
3. Cloudflare 会自动创建对应的 DNS 记录
4. 等待证书签发（通常几分钟）

### 第 4 步：配置 Access 登录门禁（核心步骤）

1. Cloudflare 控制台 → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**
2. 填写应用基本信息：

   | 字段 | 值 |
   |------|-----|
   | Application name | 家常菜入门指南 |
   | Application domain | `cook.你的域名.com` |

3. 新建访问策略（Policy）：

   | 字段 | 值 |
   |------|-----|
   | Action | Allow |
   | Rule type | Emails |
   | Value | 你的邮箱地址 |

4. 登录方式（Identity providers）：勾选 **One-time PIN**（邮箱验证码）
   - 免费，无需额外账号，一个邮箱即可
5. 保存

配置完成后，任何访问 `cook.你的域名.com` 的人都会先被要求登录；只有名单内的邮箱收到验证码并通过后，才能进入应用。

### 第 5 步：验证

1. 浏览器打开 `https://cook.你的域名.com`
2. 出现登录页 → 输入邮箱 → 收到验证码 → 填入 → 进入应用
3. 手机用**蜂窝网络**（非 WiFi）访问同一地址，确认同样需要登录、同样可用
4. 手机浏览器菜单 →「添加到主屏幕」，即可像 App 一样使用（支持离线）

### 第 6 步：把 GitHub 仓库转为私有（可选）

1. GitHub 仓库 → **Settings** → **General** → 拉到底 **Danger zone**
2. **Change repository visibility** → **Private** → 按提示确认
3. 影响：
   - ✅ 源码不再公开
   - ⚠️ 旧的公开站 `https://g-aliang.github.io/cook-guide/` 会**随之停止**（正是我们想要的效果）
   - ✅ Cloudflare Pages 仍能正常构建部署（已授权 GitHub 访问）

> 如果暂时不想转私有，也可以先在 GitHub 仓库 Settings → Pages 里把 Pages 关掉，让旧公开地址失效。

### 第 7 步：日常更新流程

迁移后，日常更新变得很简单：

1. 修改 `src/` 下的代码
2. 本地验证：`npm run dev`
3. 推送到 GitHub：`git add -A; git commit -m "更新说明"; git push`
4. Cloudflare Pages 自动拉取、构建、发布，约 1–2 分钟后生效

> 不再需要手动推送 `dist` 到 `gh-pages` 分支，也无需 `.github/workflows/deploy.yml` 的构建验证步骤（可保留，也可删除）。

---

## 六、成本清单

| 项目 | 费用 |
|------|------|
| 域名 | ¥30–100 / 年 |
| Cloudflare Pages 托管 | 免费 |
| Cloudflare Access 鉴权 | 免费（≤ 50 用户） |
| DNS 托管 | 免费 |
| HTTPS 证书 | 免费 |

---

## 七、常见问题

**Q：Cloudflare 免费额度够用吗？**  
够。个人低频使用，Pages 免费版提供每月 500 次构建、无限带宽；Access 免费版支持 50 个用户。

**Q：需要备案吗？**  
不需要。站点托管在 Cloudflare（境外），未使用境内服务器，无需 ICP 备案。

**Q：手机上能用 PWA 离线吗？**  
可以。首次登录访问后，Service Worker 会缓存静态资源；断网后仍可打开已缓存内容。注意首次使用必须联网并完成登录。

**Q：能只允许登录、不用密码吗？**  
可以。使用 One-time PIN（邮箱验证码）登录方式，每次输入邮箱收验证码即可，无需记密码。

**Q：换了域名，数据会丢吗？**  
不会。个人数据存在各设备浏览器的 IndexedDB 中，与域名无关；如需跨设备迁移，用应用内「设置 → 导出/导入 JSON」。

**Q：旧 GitHub Pages 地址还能访问吗？**  
仓库转私有或关闭 Pages 后即失效，这正是私有化的目的。

---

## 八、关键提醒

| 事项 | 说明 |
|------|------|
| Service Worker 缓存 | 更新后如发现网站没变化，强制刷新（Ctrl+F5）或清除缓存 |
| 首次访问需联网 | Access 登录与 PWA 注册都要求首次联网 |
| 登录态保持 | 同一浏览器登录后，短期内无需反复验证 |
| 数据独立性 | 各设备数据独立，跨设备靠导出/导入同步 |

---

*文档结束 — 按本指南即可完成私有化迁移*

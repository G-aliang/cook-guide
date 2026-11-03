# Git 协作规范

本规范适用于 cook-guide 项目的版本管理与协作流程。基于业界主流的 Conventional Commits 约定，并结合本项目的实际场景（数据批量生成、双分支部署、个人低频使用）做定制。

---

## 一、提交信息格式

每条 commit message 必须遵循以下结构：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 1.1 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | ✅ | 提交类型，见下方类型表 |
| `scope` | 可选 | 影响范围，如模块名、数据类型 |
| `subject` | ✅ | 一句话简述，不超过 50 字，用祈使句（如"新增菜品筛选"而非"新增了菜品筛选"） |
| `body` | 可选 | 详细描述，说明「为什么」做这次改动，而非「做了什么」（代码本身已记录做了什么） |
| `footer` | 可选 | 破坏性变更说明或关联 issue |

### 1.2 提交类型

| type | 说明 | 示例 |
|------|------|------|
| `feat` | 新增功能 | `feat(dish): 增加菜品图片上传` |
| `fix` | 修复缺陷 | `fix(router): 修复刷新后路由丢失` |
| `docs` | 文档变更 | `docs(deploy): 补充 Cloudflare 迁移步骤` |
| `style` | 代码格式（不影响逻辑） | `style: 统一缩进为 2 空格` |
| `refactor` | 重构（非新功能、非修 bug） | `refactor(db): 拆分 IndexedDB 仓储层` |
| `perf` | 性能优化 | `perf(list): 菜品列表虚拟滚动` |
| `test` | 测试相关 | `test(match): 补充选菜匹配算法测试` |
| `chore` | 构建/工具/依赖 | `chore: 升级 vite 至 5.x` |
| `data` | 数据更新（本项目定制） | `data(dish): 扩充菜品至 523 道，版本 2026110401` |
| `build` | 构建系统/外部依赖 | `build: 配置 Cloudflare Pages 部署` |
| `ci` | CI/CD 配置 | `ci: 新增 Build Verification 工作流` |

> **`data` 类型说明**：本项目菜品/食材数据由 `ai-gen` 流水线批量生成，数据更新频繁且带版本号，单独用 `data` 类型便于追踪数据变更历史。body 中必须注明数据版本号（`YYYYMMDDNN` 格式）。

> **多类型提交规则**：若一次提交确实涉及两个类型，可用加号 `+` 拼接，**最多两个类型**，例如 `feat(dish)+perf(list): 增加筛选并优化列表滚动`。但 **`data` 类型必须单独成一条提交**，不得与其他类型拼接，以保证数据变更历史可独立追踪。

### 1.3 书写示例

✅ 正确：
```
feat(dish): 增加菜品按烹饪时间筛选

菜品列表页新增"烹饪时间"筛选维度，支持按 ≤15 分钟、15-30 分钟、>30 分钟三档筛选，
便于新手按时间预算选菜。

关联数据结构：dishes.cooking_time（单位：分钟）
```

```
data(dish): 扩充菜品至 523 道，版本 2026110401

本次扩充新增 63 道菜品，关联 356 条，无重名、无效关联 0。
通过 ai-gen 流水线生成，已做去重与命名校验。
旧数据版本 2026110302。
```

❌ 错误：
```
更新了一下菜品
```
```
fix
```
```
feat: 添加功能，修改了菜品和食材和路由
```

---

## 二、分支管理

### 2.1 分支模型

本项目采用精简的双主干 + 临时分支模型：

| 分支 | 说明 | 约定 |
|------|------|------|
| `main` | 主分支，存放源码、数据、文档。始终可部署。 | 小型项目，可直接推送（无需开分支/走 PR） |
| `gh-pages` | 构建产物分支（内容来自 `dist/`），线上站点由其提供 | 只承载构建产物，不手改；本地构建后从 `dist/` 推送更新 |
| `feature/*` | 功能开发分支 | 临时，合并后删除 |
| `hotfix/*` | 紧急修复分支 | 临时，合并后删除 |
| `ai-gen/*` | 数据批量生成分支（本项目定制） | 临时，合并后删除 |

### 2.2 分支命名

```
feature/<简短描述>       例：feature/dish-filter
hotfix/<简短描述>         例：hotfix/sw-cache
ai-gen/<数据类型>-<批次>  例：ai-gen/dish-20261104
```

### 2.3 分支流转

```
main ──────────────────────────────────────────▶ main（Build Verification 仅验证）
  │                                                        ▲
  │ feature/*                                            │ 合并（squash）
  │   ├─开发─▶ 自测 ─▶ PR ─▶ 评审 ─┘                     │
  │                                                        │
  │ hotfix/*                                           merge
  │   └─修复─▶ 自测 ─▶ 直接合入 main ───────────────────┘
  │
  │ ai-gen/*（数据生成分支）
  │   └─生成─▶ 校验─▶ 合并至 main ─▶ 触发 Build Verification（仅构建验证，不部署）
```

**发布流程（与上面的 CI 解耦，独立执行）：**

```
本地 npm run build ─▶ 生成 dist/ ─▶ 在 dist 仓库提交 ─▶ 推送 dist 的 master 到远程 gh-pages ─▶ 线上更新
```

> `gh-pages` 不由 GitHub Actions 自动更新，而是本地构建后手动推送 `dist/` 的内容。

> **个人开发说明**：本项目以个人开发为主、低频使用，`feature/*` 分支可简化——小改动直接在本地提交后推送 `main` 即可，不必每次都开分支。涉及多文件重构或数据大批量更新时建议开分支。

---

## 三、合并策略

### 3.1 合并方式选择

| 场景 | 方式 | 说明 |
|------|------|------|
| `feature/*` → `main` | **Squash Merge** | 将分支上所有提交压成一条，保持 `main` 历史整洁 |
| `hotfix/*` → `main` | **Merge Commit** | 保留修复的独立提交记录 |
| `ai-gen/*` → `main` | **Squash Merge** | 数据批量生成的多次提交压成一条 `data` 提交 |
| `main` → `feature/*` | **定期 Rebase 或 Merge** | 开发期间同步 `main` 的更新，避免合并冲突堆积 |

### 3.2 Squash Merge 注意事项

Squash 合并时，commit message 即为最终留在 `main` 上的信息，务必按规范填写。合并后原始分支提交会被丢弃，提交历史不可逆。

### 3.3 冲突解决

- 优先在本地解决冲突，避免在 GitHub 网页端操作
- 解决后分别 `git add` 各文件，再 `git commit`
- 冲突解决提交使用 `fixup! <原提交>` 前缀，squash 时自动合并

---

## 四、数据更新特别约定

本项目的菜品/食材数据有独立的版本管理机制，提交数据更新时需额外注意：

### 4.1 数据版本号

- 版本号格式：`YYYYMMDDNN`（8 位日期 + 2 位当日序号）
- 同一天多次生成序号递增（`2026110401` → `2026110402`）
- 跨天重置为 `01`
- 旧毫秒时间戳会自动识别为旧格式并重置为当天 `01`

### 4.2 数据提交流程

1. 在 `ai-gen/*` 分支上运行生成流水线
2. 校验数据质量（去重、命名、关联有效性）
3. 更新 `import-data.json` 及数据版本号
4. 提交时使用 `data` 类型，body 注明新旧版本号
5. 合并至 `main` 后触发 Build Verification（仅构建验证）；需要发布时，再在本地构建并推送 `dist/` 到 `gh-pages`

### 4.3 数据回滚

如发现新数据有问题：
- `git revert` 对应的 `data` 提交，回到上一版本
- 版本号机制保证前端能识别旧数据，无需手动清 IndexedDB

> **重要**：`ai-gen/ai-output/` 下的批次产出（`batch-*.json`）属于工作文件，已由 `.gitignore` 忽略，该目录内容整体不入库。提交前确认未误提交生成中间产物。

---

## 五、Revert 与回滚

### 5.1 Revert vs Reset

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| `git revert` | 已推送到 `main` 的提交 | 创建反向提交，安全可逆，**`main` 上只允许用 revert** |
| `git reset` | 本地未推送的提交 | 改写历史，仅限本地使用 |
| `git revert --no-commit` | 批量回滚多个提交 | 合并到一次提交中 |

### 5.2 Revert 提交格式

```
revert: revert "feat(dish): 增加菜品图片上传"

该功能导致图片加载异常，暂时回退，后续修复后重新引入。

This reverts commit <原提交 hash>.
```

### 5.3 Service Worker 缓存处理

本项目注册了 Service Worker，会缓存旧版本文件。代码更新部署后：
- 数据层有版本检测机制，数据更新无需手动清 IndexedDB
- 代码更新后**必须强制刷新**（`Ctrl+Shift+R`）才能加载新 JS
- 验证新版本时建议使用**无痕窗口**（全新环境，不动原数据）

---

## 六、提交前检查清单

每次提交前，确认以下事项：

### 代码类提交
- [ ] 代码能通过 `npm run build` 构建（Build Verification 工作流会验证）
- [ ] 无语法错误、无明显逻辑错误
- [ ] 新增功能有对应的组件/路由/数据结构调整
- [ ] 修改未引入不必要的副作用

### 数据类提交
- [ ] 数据已做去重与命名校验
- [ ] 版本号已正确递增
- [ ] `ai-gen/ai-output/` 未误提交
- [ ] 关联数据有效性已校验（无效关联 = 0）

### 文档类提交
- [ ] 变更已同步更新到 `doc/` 下对应文档
- [ ] 根 `README.md` 的文档索引已更新

---

## 七、常用命令速查

### 日常开发
```bash
# 创建功能分支
git switch -c feature/dish-filter

# 查看改动
git status
git diff

# 暂存部分改动
git add -p

# 提交（按规范填写 message）
git commit -m "feat(dish): 增加菜品按烹饪时间筛选"

# 推送到远程
git push -u origin feature/dish-filter
```

### 合并到 main
```bash
# 切换到 main，拉取最新
git switch main
git pull

# squash 合并（GitHub 网页操作或本地）
git merge --squash feature/dish-filter
git commit -m "feat(dish): 增加菜品按烹饪时间筛选"
git push
```

### 数据更新
```bash
git switch -c ai-gen/dish-20261104
# ...运行生成流水线、校验、更新数据...
git add data/ import-data.json
git commit -m "data(dish): 扩充菜品至 523 道，版本 2026110401"
git push -u origin ai-gen/dish-20261104
# 合并后删除分支
```

### 回滚
```bash
# revert 最近一条提交
git revert HEAD
git commit -m "revert: revert "feat(dish): xxx""
git push

# 本地 reset（未推送时）
git reset --soft HEAD~1
```

### 版本检查
```bash
# 查看提交历史
git log --oneline -10

# 查看某次提交详情
git show <hash>

# 查看分支差异
git diff main..feature/dish-filter --stat
```

---

## 八、CI/CD 集成

### 8.1 Build Verification 工作流

向 `main` 推送后会触发仓库内的 Build Verification 工作流：
- `npm ci` → `npm run build` → 上传 artifact
- **仅做验证，不部署**
- 部署由 `gh-pages` 分支提供线上站点

### 8.2 提交信息与自动化

- commit message 的 type 可用于触发自动化（如 `data` 类型可触发数据版本通知）
- 当前未接入自动部署，构建验证失败时需先修复再推送

---

## 版本记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-11-04 | 初版规范，涵盖提交格式、分支管理、合并策略、数据更新约定、Revert 与检查清单 |
| 1.1 | 2026-11-04 | 校正与仓库现状不符的 3 处：`main` 分支保护、`gh-pages` 更新方式、`ai-gen/ai-output/` 忽略规则 |
| 1.2 | 2026-11-04 | 明确「小型项目可直接推送 `main`」；新增多类型提交规则（`+` 拼接最多两个，`data` 必须单独一条） |

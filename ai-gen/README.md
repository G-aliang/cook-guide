# AI 菜谱数据生成工具

> 从菜品名单 → AI 生成详细教程 → 汇入系统
> 用途：为应用批量补充精确到克数、火候、时长的详细菜谱数据

---

## 目录结构

```
ai-gen/
├── README.md              # 本文档（唯一说明）
├── run.js                 # 总控脚本（统一入口）
├── prompts.md             # 提示词文件（AI 用，自动生成）
├── scripts/               # 脚本
│   ├── export-list.js     #   导出名单 + 生成提示词
│   ├── batch-generate.js  #   解析 AI 输出
│   ├── analyze-status.js  #   分析进度
│   └── check-pipeline.js  #   流程自检
├── data/                  # 数据文件（自动生成）
│   ├── dishes-list.json   #   全部名单（含生成状态）
│   ├── dishes-todo.json   #   待生成名单
│   └── dishes-generated.json  # 解析后的数据
└── ai-output/             # 【你保存 AI 结果到这里】
    └── _example.json      #   格式示例
```

---

## 数据流

```
data/import-data.json (460 道，系统数据源)
   │ node ai-gen/run.js export
   ▼
ai-gen/data/dishes-todo.json (待生成 450 道)
ai-gen/prompts.md (通用模板 + 90 批名单)
   │ 【你复制提示词到 AI 工具，保存结果到 ai-output/】
   ▼
ai-gen/ai-output/batch-001.json ...
   │ node ai-gen/run.js parse
   ▼
ai-gen/data/dishes-generated.json
   │ node ai-gen/run.js merge
   ▼
data/import-data.json + public/import-data.json (已更新)
   │ node ai-gen/run.js build
   ▼
dist/ → 推送 → GitHub Pages
```

---

## 操作步骤

### 1. 导出名单 + 生成提示词

```bash
cd D:\code\cook
node ai-gen/run.js export
```

一次产出三个文件：
- `ai-gen/data/dishes-list.json`（全部 460 道，含状态）
- `ai-gen/data/dishes-todo.json`（待生成 450 道）
- `ai-gen/prompts.md`（一份通用提示词 + 90 批菜名名单）

### 2. AI 生成（人工）

1. 打开 `ai-gen/prompts.md`（含"通用提示词"+"分批名单"）
2. 复制「通用提示词」，把 `【此处填入菜名】` 替换为某批的菜名（如"第 001 批"）
3. 粘贴到 AI 工具（ChatGPT / Claude / 通义千问）
4. AI 返回 JSON 数组
5. 保存到 `ai-gen/ai-output/batch-001.json`

> ⚠️ 只保留 JSON 内容，不要含额外说明文字。

### 3. 解析校验

```bash
node ai-gen/run.js parse
```

输出示例：
```
✓ 酸辣土豆丝 - 12步, 12种食材, 5条避坑
已保存 5 道菜到: ai-gen/data/dishes-generated.json
```

### 4. 合并进系统

```bash
node ai-gen/run.js merge
```

按菜名匹配，用详细数据覆盖，写入 `data/` 和 `public/`。

### 5. 构建部署

```bash
node ai-gen/run.js build
cd dist
git init && git add -A && git commit -m "更新菜品数据"
git push --force https://github.com/G-aliang/cook-guide.git HEAD:gh-pages
cd ..
```

---

## 端到端串联

一条完整流水线，三份流转数据：**名单 → 提示词 → 详细数据**。

### 三份流转数据

| 数据 | 位置 | 作用 |
|------|------|------|
| 数据源 | `data/import-data.json` | 应用的唯一数据源（起点也是终点） |
| 名单 | `ai-gen/data/dishes-list.json` | 从数据源导出的菜品清单 |
| 提示词 | `ai-gen/prompts.md` | 给 AI 的生成指令（90 批） |
| 详细数据 | `ai-gen/data/dishes-generated.json` | AI 生成并经校验的数据 |

### 完整命令序列（可直接复制）

```bash
cd D:\code\cook

# ── 准备 ──
node ai-gen/run.js export     # 导出名单 + 生成提示词

# ── 人工 ──
# 打开 ai-gen/prompts.md，复制一批提示词 → AI 工具 → 存到 ai-output/batch-XXX.json

# ── 汇入 ──
node ai-gen/run.js parse      # 解析 AI 输出
node ai-gen/run.js merge      # 合并进系统

# ── 上线 ──
node ai-gen/run.js build      # 构建
cd dist && git init && git add -A && git commit -m "更新菜品数据" && git push --force <仓库地址> HEAD:gh-pages && cd ..
```

### 每步验证点

| 步骤 | 看到什么算成功 |
|------|---------------|
| export | "待生成 450 道"、"共 90 批" |
| parse | "✓ 菜名 - X步, Y种食材, Z条避坑" |
| merge | "更新菜品 X 道" |
| build | "files generated" |

### 三条回路

| 回路 | 触发场景 | 命令 |
|------|----------|------|
| **数据生成环** | 补充详细菜谱 | export → [AI] → parse → merge |
| **质量修复环** | 数据有重复/异常名 | `node ai-gen/run.js clean` |
| **部署环** | 任何变更后上线 | `node ai-gen/run.js build` → 推送 dist |

> 💡 支持**滚动执行**：不用等 450 道全生成完，每跑 5 道就能 merge → build → 部署一次，随时看到效果。

---

## 命令对照

| 命令 | 作用 |
|------|------|
| `node ai-gen/run.js status` | 查看进度（含导出名单+提示词） |
| `node ai-gen/run.js export` | ① 导出名单 + 生成提示词 |
| `node ai-gen/run.js parse` | ② 解析 AI 输出 |
| `node ai-gen/run.js merge` | ③ 合并进系统 |
| `node ai-gen/run.js clean` | 清理目录（去重） |
| `node ai-gen/run.js version` | 查看数据版本号（加 `--apply` 生成新版本号） |
| `node ai-gen/run.js check` | 流程自检 |
| `node ai-gen/run.js build` | 构建 |
| `node ai-gen/run.js all` | 一键（除 AI 生成外） |
| `node ai-gen/run.js help` | 帮助 |

---

## 提示词模板

完整模板在 `prompts.md` 中（脚本自动生成），此处不重复。

**核心约束速查：**
- 食材清单精确到克，标注约等于多少个/勺/瓣
- 每步含：操作描述 + 火候 + 时间 + 用量 + 注意事项
- 避坑指南 3-5 条
- 输出为 JSON 数组，字段见下节「数据格式」

> 要修改模板：编辑 `scripts/export-list.js` 里的 `TEMPLATE` 变量，再跑 `node ai-gen/run.js export` 重新生成。

---

## 数据格式

AI 输出的 JSON 对应应用的 `dishes` 表字段：

| 字段 | 说明 | 示例 |
|------|------|------|
| `name` | 菜名 | 酸辣土豆丝 |
| `category` | 主分类 | 热炒 |
| `difficulty` | 难度 | 入门 |
| `duration` | 总时长 | 20分钟 |
| `intro` | 简介 | 爽脆开胃 |
| `ingredients[].name` | 食材名 | 土豆 |
| `ingredients[].amount` | 用量（含克数） | 400g（约2个） |
| `ingredients[].note` | 选购建议 | 选光滑偏圆的 |
| `steps[].order` | 步骤序号 | 1 |
| `steps[].desc` | 步骤描述 | 土豆去皮切丝 |
| `steps[].heat` | 火候 | 中火 |
| `steps[].time` | 时间 | 5分钟 |
| `steps[].amount` | 用量 | 油20g |
| `steps[].note` | 注意事项 | 切成3mm均匀细丝 |
| `pitfalls[]` | 避坑指南 | `{ mistake, solution }` |
| `tags` | 分类标签 | `{ cooking, diet, ... }` |

### 校验规则

| 校验项 | 规则 |
|--------|------|
| 食材数量 | ≥ 3 |
| 步骤数量 | ≥ 3 |
| JSON 格式 | 可正确解析 |

---

## 当前进度

| 项目 | 数量 |
|------|------|
| 系统菜品总数 | 460 道 |
| 已生成详细数据 | 10 道 |
| 待生成 | 450 道（90 批） |

| 批次 | 分类 | 菜品数 |
|------|------|--------|
| 001-064 | 热炒 | 317 道 |
| 065-076 | 汤羹 | 57 道 |
| 077-082 | 主食 | 30 道 |
| 083-088 | 凉菜 | 25 道 |
| 089-090 | 甜点 | 21 道 |

---

## 常见问题

**Q: 数据从哪导出？**
从 `data/import-data.json`（应用的唯一数据源）。

**Q: AI 格式不对怎么办？**
脚本会自动提取 JSON（匹配最外层 `{}` 或 `[]`），原样保存即可。

**Q: 如何只生成部分菜品？**
手动编辑 `data/dishes-todo.json`，删掉不想生成的，再运行 prompts。

**Q: 重复运行会怎样？**
`export`/`prompts` 覆盖输出；`parse` 读全部 ai-output；`merge` 按菜名覆盖不重复。

**Q: 能换 AI 工具吗？**
可以，提示词是标准的，任何 AI 都能用。

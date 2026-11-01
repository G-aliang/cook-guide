/**
 * 提示词生成脚本
 * 用途：生成"一份通用提示词 + 一份分批名单"的提示词文件
 *
 * 设计：提示词模板只出现一次，名单以紧凑列表呈现，避免重复
 *
 * 使用：
 *   node ai-gen/scripts/gen-prompts.js
 */

import { readFileSync, writeFileSync } from 'fs'

const BATCH_SIZE = 5  // 每批菜品数

const data = JSON.parse(readFileSync('D:/code/cook/data/import-data.json', 'utf8'))
const dishes = data.data.dishes

// 待生成 = 没有 pitfalls 字段的菜品
const todo = dishes.filter(d => !d.pitfalls || d.pitfalls.length === 0)

console.log(`待生成菜品: ${todo.length} 道`)

// 按分类排序
const categoryOrder = ['热炒', '凉菜', '汤羹', '主食', '甜点']
todo.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

// 更新待生成名单
writeFileSync('D:/code/cook/ai-gen/data/dishes-todo.json', JSON.stringify(todo.map(d => ({
  name: d.name, category: d.category, difficulty: d.difficulty
})), null, 2), 'utf8')

// 分批
const batches = []
for (let i = 0; i < todo.length; i += BATCH_SIZE) {
  batches.push(todo.slice(i, i + BATCH_SIZE))
}

// ========== 通用提示词模板（只出现一次）==========
const template = `你是一位经验丰富的家常菜厨师，擅长将菜谱转化为新手也能完全照做的详细教程。

请依次生成以下这组菜的详细教程（每道菜都要完整生成，不要省略）：

【此处填入菜名，建议一次 5 道】

## 每道菜的内容要求
1. 食材清单：精确到克数，标注约等于多少个/勺/瓣，每项附一句选购或处理建议
2. 制作步骤：分步详细说明，每一步包含操作描述、火候、时间、用量、注意事项
3. 避坑指南：列出 3-5 个新手最容易犯的错误及正确做法
4. 总时长：从备菜到出锅的总时间
5. 难度等级：入门/进阶/挑战
6. 分类标签：烹饪方式、荤素、菜系、用餐时段

## 输出格式
严格按以下 JSON 数组格式输出，不要输出任何其他内容：

[
  {
    "name": "菜名",
    "category": "热炒/凉菜/汤羹/主食/甜点",
    "difficulty": "入门/进阶/挑战",
    "duration": "如：20分钟",
    "intro": "一句话简介",
    "ingredients": [
      { "name": "食材名", "amount": "400g（约2个）", "note": "选购或处理建议" }
    ],
    "steps": [
      {
        "order": 1,
        "desc": "步骤描述，具体到细节",
        "heat": "火候，如：中火/大火/小火",
        "time": "时间，如：1分钟/90秒",
        "amount": "用量，如：油20g",
        "note": "注意事项或关键细节"
      }
    ],
    "pitfalls": [
      { "mistake": "常见错误", "solution": "正确做法" }
    ],
    "tags": {
      "cooking": ["烹饪方式"],
      "diet": ["荤菜/素菜/..."],
      "cuisine": ["菜系"],
      "meal": ["用餐时段"],
      "custom": []
    }
  }
]

## 注意事项
- 所有用量必须精确到克或毫升，不要只写"适量"
- 每一步的时间必须精确到秒或分钟
- 火候必须明确，并说明判断方法（如"油温六成热约180℃，蒜末周围冒小气泡"）
- 注意事项要针对新手容易翻车的地方，给出具体解决方案
- 步骤顺序必须符合实际烹饪流程
- 不同菜品类型自行调整侧重点：热炒重火候、凉菜重焯水、汤羹重炖煮、主食重手法、甜点重泡发`

// ========== 生成 Markdown ==========
let md = `# 菜谱生成提示词

> 待生成 ${todo.length} 道菜，分 ${batches.length} 批（每批 ${BATCH_SIZE} 道）
> 用法：复制"一、通用提示词"，把【此处填入菜名】替换为"二、名单"里某批的菜名，粘贴到 AI 工具

---

## 一、通用提示词（每个批次都用这一份）

\`\`\`
${template}
\`\`\`

---

## 二、待生成名单（${batches.length} 批）

`

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i]
  const num = String(i + 1).padStart(3, '0')
  md += `**第 ${num} 批**　${batch.map(d => d.name).join('、')}\n\n`
}

md += `---

## 三、使用步骤

1. 从"二、名单"里选一批（如第 001 批）
2. 复制"一、通用提示词"
3. 把 \`【此处填入菜名，建议一次 5 道】\` 替换为该批菜名，例如：
   \`酸辣土豆丝、清炒时蔬、醋溜白菜、韭菜炒蛋、回锅肉\`
4. 粘贴到 AI 工具（ChatGPT / Claude / 通义千问）生成
5. 把 AI 返回的 JSON 数组保存到 \`ai-gen/ai-output/batch-001.json\`
6. 全部批次完成后运行：
   \`\`\`bash
   node ai-gen/run.js parse
   node ai-gen/run.js merge
   \`\`\`

---

## 附：待生成分布

`

// 分类统计
const byCat = {}
for (const d of todo) byCat[d.category] = (byCat[d.category] || 0) + 1
for (const [cat, count] of Object.entries(byCat)) {
  md += `- ${cat}: ${count} 道\n`
}

writeFileSync('D:/code/cook/ai-gen/prompts.md', md, 'utf8')

const sizeKB = (Buffer.byteLength(md, 'utf8') / 1024).toFixed(1)
console.log(`\n✓ 已生成: ai-gen/prompts.md (${sizeKB}KB，从原 919KB 精简)`)
console.log(`✓ 待生成名单: ai-gen/data/dishes-todo.json`)
console.log(`✓ 共 ${batches.length} 批（每批 ${BATCH_SIZE} 道）`)

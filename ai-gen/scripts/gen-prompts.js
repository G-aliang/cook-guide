/**
 * 提示词批量生成脚本
 * 用途：为待生成的菜品生成 AI 提示词，按批次输出到文件
 *
 * 使用：
 *   node ai-gen/scripts/gen-prompts.js       # 生成所有批次
 *   node ai-gen/scripts/gen-prompts.js 1 10  # 只生成第1-10批
 */

import { readFileSync, writeFileSync } from 'fs'

const BATCH_SIZE = 5  // 每批菜品数

const data = JSON.parse(readFileSync('D:/code/cook/data/import-data.json', 'utf8'))
const dishes = data.data.dishes

// 待生成 = 没有 pitfalls 字段的菜品
const todo = dishes.filter(d => !d.pitfalls || d.pitfalls.length === 0)

console.log(`待生成菜品: ${todo.length} 道`)

// 导出清单
writeFileSync('D:/code/cook/ai-gen/data/dishes-todo.json', JSON.stringify(todo.map(d => ({
  name: d.name, category: d.category, difficulty: d.difficulty
})), null, 2), 'utf8')

// 按分类排序，让用户按类批量生成
const categoryOrder = ['热炒', '凉菜', '汤羹', '主食', '甜点']
todo.sort((a, b) => {
  const ca = categoryOrder.indexOf(a.category)
  const cb = categoryOrder.indexOf(b.category)
  if (ca !== cb) return ca - cb
  return 0
})

// 分批
const batches = []
for (let i = 0; i < todo.length; i += BATCH_SIZE) {
  batches.push(todo.slice(i, i + BATCH_SIZE))
}

console.log(`共 ${batches.length} 批（每批 ${BATCH_SIZE} 道）`)

// 提示词模板
function buildPrompt(dish) {
  const typeHints = {
    '热炒': '强调大火快炒、火候控制、翻炒手法',
    '凉菜': '强调焯水时间、过凉水、调料混合顺序',
    '汤羹': '强调焯水去血沫、炖煮火候、调味时机',
    '主食': '强调米饭/面条处理、火候控制、翻炒手法',
    '甜点': '强调食材泡发、炖煮火候、调味时机',
  }

  return `你是一位经验丰富的家常菜厨师，擅长将菜谱转化为新手也能完全照做的详细教程。

请帮我生成一份详细的【${dish.name}】（${dish.category}类）的制作过程，要求如下：

## 内容要求
1. 食材清单：精确到克数，标注约等于多少个/勺/瓣，每项附一句选购或处理建议
2. 制作步骤：分步详细说明，每一步包含操作描述、火候、时间、用量、注意事项
3. 避坑指南：列出 3-5 个新手最容易犯的错误及正确做法
4. 总时长：从备菜到出锅的总时间
5. 难度等级：入门/进阶/挑战
6. 分类标签：烹饪方式、荤素、菜系、用餐时段

## 格式要求
严格按以下 JSON 格式输出，不要输出任何其他内容：

{
  "name": "${dish.name}",
  "category": "${dish.category}",
  "difficulty": "入门/进阶/挑战",
  "duration": "如：20分钟",
  "intro": "一句话简介",
  "ingredients": [
    { "name": "食材名", "amount": "精确用量，如：400g（约2个）", "note": "选购或处理建议" }
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
    "custom": ["自定义标签"]
  }
}

## 注意事项
- 所有用量必须精确到克或毫升，不要只写"适量"
- 每一步的时间必须精确到秒或分钟
- 火候必须明确，并说明判断方法
- 注意事项要针对新手容易翻车的地方
- 步骤顺序必须符合实际烹饪流程

额外要求：${typeHints[dish.category] || typeHints['热炒']}`
}

// 生成 Markdown 文件
let md = `# 菜品详细数据生成提示词

> 共 ${todo.length} 道待生成菜品，分 ${batches.length} 批（每批 ${BATCH_SIZE} 道）
> 使用方法：
> 1. 复制某一批的提示词到 AI 工具（ChatGPT/Claude 等）
> 2. 将 AI 返回的 JSON 保存到 \`ai-gen/ai-output/\` 目录（文件名如 \`batch-01.json\`）
> 3. 所有批次完成后运行：\`node ai-gen/scripts/batch-generate.js --manual\`
> 4. 再运行合并：\`node merge-dishes.js\`

---

`

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i]
  const batchNum = String(i + 1).padStart(3, '0')
  md += `## 第 ${batchNum} 批（${batch.map(d => d.name).join('、')}）\n\n`
  md += '```\n'
  md += `请依次生成以下 ${batch.length} 道菜的详细教程，每道菜按指定 JSON 格式输出，用数组包裹：\n\n`
  for (const dish of batch) {
    md += buildPrompt(dish) + '\n\n' + '─'.repeat(40) + '\n\n'
  }
  md += '```\n\n---\n\n'
}

writeFileSync('D:/code/cook/ai-gen/prompts.md', md, 'utf8')
console.log(`\n✓ 已生成: ai-gen/prompts.md`)
console.log(`✓ 待生成清单: ai-gen/data/dishes-todo.json`)

// 按分类统计
console.log(`\n待生成分布:`)
const byCat = {}
for (const d of todo) byCat[d.category] = (byCat[d.category] || 0) + 1
for (const [cat, count] of Object.entries(byCat)) {
  console.log(`  ${cat}: ${count} 道`)
}

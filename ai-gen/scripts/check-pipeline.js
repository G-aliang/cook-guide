/**
 * 数据流程自检脚本
 * 用途：验证数据流各环节是否正常、文件是否齐全、数据是否一致
 *
 * 使用：
 *   node ai-gen/scripts/check-pipeline.js
 */

import { readFileSync, existsSync } from 'fs'

const P = 'D:/code/cook/'
let ok = true

function check(name, condition, detail = '') {
  const mark = condition ? '✓' : '✗'
  if (!condition) ok = false
  console.log(`  ${mark} ${name}${detail ? '  → ' + detail : ''}`)
}

console.log('=== 数据流程自检 ===\n')

// ── 1. 数据源 ──
console.log('[1] 数据源')
const mainPath = P + 'data/import-data.json'
check('data/import-data.json 存在', existsSync(mainPath))
const main = JSON.parse(readFileSync(mainPath, 'utf8'))
const dishes = main.data.dishes
const generated = dishes.filter(d => d.pitfalls && d.pitfalls.length > 0)
console.log(`      菜品 ${dishes.length} 道 | 已生成 ${generated.length} 道 | 待生成 ${dishes.length - generated.length} 道`)
console.log(`      食材 ${main.data.ingredients.length} 种 | 关联 ${main.data.dish_ingredients.length} 条\n`)

// ── 2. public 副本 ──
console.log('[2] public 副本')
const pubPath = P + 'public/import-data.json'
check('public/import-data.json 存在', existsSync(pubPath))
const pub = JSON.parse(readFileSync(pubPath, 'utf8'))
check('与 data 菜品数一致', pub.data.dishes.length === dishes.length, `${pub.data.dishes.length} vs ${dishes.length}`)
console.log()

// ── 3. 工具链文件 ──
console.log('[3] 工具链文件')
check('名单 dishes-list.json', existsSync(P + 'ai-gen/data/dishes-list.json'))
check('待生成 dishes-todo.json', existsSync(P + 'ai-gen/data/dishes-todo.json'))
check('解析产物 dishes-generated.json', existsSync(P + 'ai-gen/data/dishes-generated.json'))
check('提示词 prompts.md', existsSync(P + 'ai-gen/prompts.md'))
check('AI 输出目录 ai-output/', existsSync(P + 'ai-gen/ai-output/'))
console.log()

// ── 4. 脚本 ──
console.log('[4] 脚本')
for (const s of ['export-list.js', 'batch-generate.js', 'analyze-status.js', 'check-pipeline.js']) {
  check(`ai-gen/scripts/${s}`, existsSync(P + 'ai-gen/scripts/' + s))
}
check('run.js（总控）', existsSync(P + 'ai-gen/run.js'))
check('merge-dishes.js（合并）', existsSync(P + 'merge-dishes.js'))
check('clean-dishes.js（清理）', existsSync(P + 'clean-dishes.js'))
console.log()

// ── 5. 隐患 ──
console.log('[5] 隐患提示')
if (existsSync(P + 'generate-data.js')) {
  console.log('  ⚠ generate-data.js 存在：它是"从零生成"脚本，重跑会覆盖 import-data.json（含 AI 合并数据）')
  console.log('    → 只有需要彻底重建时才用它；日常补充数据请用 export/parse/merge 流程')
}
console.log()

console.log(ok ? '=== ✓ 流程完整，所有环节就绪 ===' : '=== ✗ 存在问题，请检查上面标 ✗ 的项 ===')

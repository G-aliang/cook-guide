/**
 * 菜品名单导出脚本
 * 用途：从系统数据中导出菜品名单为独立 JSON 文件
 *
 * 使用：
 *   node ai-gen/export-list.js           # 导出全部（含状态标记）
 *   node ai-gen/export-list.js --pending # 只导出待生成的
 */

import { readFileSync, writeFileSync } from 'fs'

const DATA_FILE = 'D:/code/cook/data/import-data.json'
const OUTPUT_ALL = 'D:/code/cook/ai-gen/data/dishes-list.json'
const OUTPUT_PENDING = 'D:/code/cook/ai-gen/data/dishes-todo.json'

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const dishes = data.data.dishes

const onlyPending = process.argv.includes('--pending')

// 构建名单
const list = dishes.map(d => ({
  id: d.id,
  name: d.name,
  category: d.category,
  difficulty: d.difficulty,
  generated: !!(d.pitfalls && d.pitfalls.length > 0),  // 是否已生成详细数据
}))

const generatedCount = list.filter(d => d.generated).length
const pendingCount = list.length - generatedCount

// 全部名单
const allOutput = {
  exportedAt: new Date().toISOString(),
  total: list.length,
  generated: generatedCount,
  pending: pendingCount,
  dishes: list,
}
writeFileSync(OUTPUT_ALL, JSON.stringify(allOutput, null, 2), 'utf8')

// 待生成名单
const pending = list.filter(d => !d.generated).map(d => ({
  name: d.name,
  category: d.category,
  difficulty: d.difficulty,
}))
writeFileSync(OUTPUT_PENDING, JSON.stringify({
  exportedAt: new Date().toISOString(),
  total: pending.length,
  dishes: pending,
}, null, 2), 'utf8')

// 统计输出
console.log('='.repeat(60))
console.log('菜品名单导出')
console.log('='.repeat(60))
console.log(`总菜品: ${list.length} 道`)
console.log(`已生成: ${generatedCount} 道`)
console.log(`待生成: ${pendingCount} 道`)
console.log(`\n✓ 全部名单: ${OUTPUT_ALL}`)
console.log(`✓ 待生成名单: ${OUTPUT_PENDING}`)

// 按分类统计
const byCat = {}
for (const d of pending) byCat[d.category] = (byCat[d.category] || 0) + 1
console.log(`\n待生成分布:`)
for (const [cat, c] of Object.entries(byCat)) console.log(`  ${cat}: ${c} 道`)

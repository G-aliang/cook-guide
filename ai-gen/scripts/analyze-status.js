/**
 * 菜品数据状态分析脚本
 * 用途：统计哪些菜品已有详细数据（AI生成），哪些还是简单数据（待生成）
 */

import { readFileSync } from 'fs'

const dataFile = 'D:/code/cook/data/import-data.json'
const data = JSON.parse(readFileSync(dataFile, 'utf8'))
const dishes = data.data.dishes

// 分类统计
const detailed = []   // 有 pitfalls 字段 = AI 详细生成
const simple = []     // 无 pitfalls = 简单数据

for (const d of dishes) {
  if (d.pitfalls && d.pitfalls.length > 0) {
    detailed.push(d)
  } else {
    simple.push(d)
  }
}

// 判断详细程度（步骤是否有 heat/time/amount）
const trulyDetailed = detailed.filter(d =>
  d.steps?.some(s => s.heat || s.time || s.amount)
)

console.log('='.repeat(60))
console.log('菜品数据状态分析')
console.log('='.repeat(60))
console.log(`总菜品数: ${dishes.length}`)
console.log(`\n✓ 已有详细数据 (含避坑指南): ${detailed.length} 道`)
console.log(`✓ 步骤含火候/时间/用量: ${trulyDetailed.length} 道`)
console.log(`✗ 待生成详细数据: ${simple.length} 道`)

// 按分类统计待生成的
console.log('\n' + '='.repeat(60))
console.log('待生成的菜品（按分类）')
console.log('='.repeat(60))

const byCategory = {}
for (const d of simple) {
  const cat = d.category || '其他'
  if (!byCategory[cat]) byCategory[cat] = []
  byCategory[cat].push(d)
}

for (const [cat, list] of Object.entries(byCategory)) {
  console.log(`\n【${cat}】${list.length} 道`)
  // 只显示前20个，避免输出过长
  const display = list.slice(0, 20)
  console.log('  ' + display.map(d => d.name).join('、'))
  if (list.length > 20) {
    console.log(`  ... 还有 ${list.length - 20} 道`)
  }
}

// 按难度统计
console.log('\n' + '='.repeat(60))
console.log('待生成菜品（按难度）')
console.log('='.repeat(60))
const byDifficulty = {}
for (const d of simple) {
  const diff = d.difficulty || '未标注'
  byDifficulty[diff] = (byDifficulty[diff] || 0) + 1
}
for (const [diff, count] of Object.entries(byDifficulty)) {
  console.log(`  ${diff}: ${count} 道`)
}

// 导出待生成名单
const todoList = simple.map(d => ({
  name: d.name,
  category: d.category,
  difficulty: d.difficulty,
}))
console.log(`\n待生成名单已可导出到 ai-gen/data/dishes-list.json`)

/**
 * 菜品目录清理脚本
 * 用途：去重 + 修复异常菜名 + 重建关联关系
 *
 * 清理规则：
 * 1. 同名菜品保留数据最完整的一条（优先级：有避坑指南 > 步骤多 > 第一个）
 * 2. 删除异常菜名（重复拼接如"鸡肉鸡肉"，结尾单字如"茄子蒜"）
 * 3. 重建 dish_ingredients 关联，删除孤儿关联
 *
 * 使用：
 *   node clean-dishes.js --dry-run  # 预览
 *   node clean-dishes.js            # 执行
 */

import { readFileSync, writeFileSync } from 'fs'

const dataFile = 'D:/code/cook/data/import-data.json'
const publicFile = 'D:/code/cook/public/import-data.json'
const dryRun = process.argv.includes('--dry-run')

const data = JSON.parse(readFileSync(dataFile, 'utf8'))
const dishes = data.data.dishes

// ========== 1. 标记异常菜名 ==========
function isAbnormal(name) {
  // 重复拼接（如"鸡肉鸡肉"）
  const half = name.length / 2
  if (Number.isInteger(half) && name.slice(0, half) === name.slice(half)) return true
  // 结尾单字异常（如"茄子蒜"）
  if (/[蒜姜葱]$/.test(name) && name.length <= 3 && !['大蒜', '生姜', '大葱', '小葱'].includes(name)) return true
  // 无意义占位名
  if (/^(蔬菜|肉类|食材|鸡肉|牛肉|猪肉|排骨|虾仁|带鱼)(蔬菜|肉类|食材|鸡肉|牛肉|猪肉|排骨|虾仁|带鱼)$/.test(name)) return true
  return false
}

// ========== 2. 评分（用于去重时保留最完整的）==========
function score(dish) {
  let s = 0
  if (dish.pitfalls && dish.pitfalls.length > 0) s += 1000  // 有避坑指南优先
  s += (dish.steps?.length || 0) * 10                       // 步骤越多越完整
  s += (dish.ingredients?.length || 0) * 5                  // 食材越多越完整
  return s
}

// ========== 3. 去重 ==========
const nameMap = new Map()  // name -> best dish
const removed = { abnormal: [], duplicate: [] }

for (const dish of dishes) {
  if (isAbnormal(dish.name)) {
    removed.abnormal.push(dish.name)
    continue
  }
  const existing = nameMap.get(dish.name)
  if (!existing) {
    nameMap.set(dish.name, dish)
  } else {
    // 保留评分高的
    if (score(dish) > score(existing)) {
      removed.duplicate.push(`${existing.name}(id=${existing.id})`)
      nameMap.set(dish.name, dish)
    } else {
      removed.duplicate.push(`${dish.name}(id=${dish.id})`)
    }
  }
}

const cleanDishes = [...nameMap.values()]
const keptIds = new Set(cleanDishes.map(d => d.id))

// ========== 4. 重建关联 ==========
const oldRelations = data.data.dish_ingredients
const cleanRelations = oldRelations.filter(r => keptIds.has(r.dishId))

// 重新编号
cleanRelations.forEach((r, i) => { r.id = i + 1 })

// ========== 5. 统计 ==========
console.log('='.repeat(60))
console.log('菜品目录清理')
console.log('='.repeat(60))
console.log(`原始菜品: ${dishes.length} 道`)
console.log(`删除异常: ${removed.abnormal.length} 道`)
console.log(`删除重复: ${removed.duplicate.length} 道`)
console.log(`清理后: ${cleanDishes.length} 道`)
console.log(`\n关联关系: ${oldRelations.length} → ${cleanRelations.length} 条`)

if (removed.abnormal.length) {
  console.log(`\n删除的异常菜名:`)
  console.log('  ' + removed.abnormal.join('、'))
}

// 按分类统计
const byCat = {}
for (const d of cleanDishes) {
  byCat[d.category] = (byCat[d.category] || 0) + 1
}
console.log(`\n清理后分类分布:`)
for (const [cat, count] of Object.entries(byCat)) {
  console.log(`  ${cat}: ${count} 道`)
}

if (dryRun) {
  console.log('\n[预览模式] 未写入文件')
} else {
  data.data.dishes = cleanDishes
  data.data.dish_ingredients = cleanRelations
  data.exportedAt = Date.now()
  writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8')
  writeFileSync(publicFile, JSON.stringify(data, null, 2), 'utf8')
  console.log(`\n✓ 已写入: ${dataFile}`)
  console.log(`✓ 已同步: ${publicFile}`)
}

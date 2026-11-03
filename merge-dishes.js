/**
 * AI 菜谱数据合并脚本
 * 用途：将 ai-gen/dishes-generated.json 中的详细菜品数据合并到 data/import-data.json
 *
 * 合并规则：
 * - 同名菜品：用 AI 生成的详细数据覆盖 ingredients / steps / pitfalls / duration / intro
 * - 新菜品：追加到菜品列表
 * - 自动更新 dish_ingredients 关联关系
 *
 * 使用：
 *   node merge-dishes.js            # 合并并输出到 data/import-data.json
 *   node merge-dishes.js --dry-run  # 仅预览，不写入
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { nextDataVersion } from './ai-gen/lib/data-version.js'

const CONFIG = {
  generatedFile: 'D:/code/cook/ai-gen/data/dishes-generated.json',
  mainDataFile: 'D:/code/cook/data/import-data.json',
  outputFile: 'D:/code/cook/data/import-data.json',
  publicFile: 'D:/code/cook/public/import-data.json',
}

const dryRun = process.argv.includes('--dry-run')

// ========== 读取数据 ==========
function loadData() {
  if (!existsSync(CONFIG.generatedFile)) {
    console.error(`找不到 AI 生成数据: ${CONFIG.generatedFile}`)
    console.error('请先运行: node ai-gen/scripts/batch-generate.js --manual')
    process.exit(1)
  }

  const generated = JSON.parse(readFileSync(CONFIG.generatedFile, 'utf8'))
  const mainData = JSON.parse(readFileSync(CONFIG.mainDataFile, 'utf8'))

  return { generated, mainData }
}

// ========== 合并 ==========
function merge(generated, mainData) {
  const dishes = mainData.data.dishes
  const ingredients = mainData.data.ingredients
  const dishIngredients = mainData.data.dish_ingredients

  let updated = 0
  let added = 0

  for (const genDish of generated) {
    // 查找同名菜品
    const existingIdx = dishes.findIndex(d => d.name === genDish.name)

    if (existingIdx >= 0) {
      // 覆盖：保留 id / imageId / videoUrl / createdAt，更新详细内容
      const existing = dishes[existingIdx]
      dishes[existingIdx] = {
        ...existing,
        difficulty: genDish.difficulty || existing.difficulty,
        duration: genDish.duration || existing.duration,
        intro: genDish.intro || existing.intro,
        ingredients: genDish.ingredients,   // 覆盖为详细版
        steps: genDish.steps,               // 覆盖为详细版
        pitfalls: genDish.pitfalls || [],   // 新增避坑指南
        nutrition: genDish.nutrition || existing.nutrition,
        tags: genDish.tags || existing.tags,
        updatedAt: Date.now(),
      }
      updated++
      console.log(`  更新: ${genDish.name} (${genDish.steps.length}步)`)
    } else {
      // 新增
      const newId = Math.max(...dishes.map(d => d.id), 0) + 1
      dishes.push({
        ...genDish,
        id: newId,
        imageId: null,
        videoUrl: '',
        nutrition: genDish.nutrition || { perUnit: '1份', calories: '', fat: '', protein: '', carbs: '', healthNotes: '' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      added++
      console.log(`  新增: ${genDish.name} (${genDish.steps.length}步)`)
    }
  }

  // 重建 dish_ingredients 关联
  // 先删除被更新菜品的旧关联
  const updatedNames = new Set(generated.map(d => d.name))
  const updatedDishIds = new Set(dishes.filter(d => updatedNames.has(d.name)).map(d => d.id))

  const keptRelations = dishIngredients.filter(r => !updatedDishIds.has(r.dishId))

  // 为新数据生成关联
  let newRelations = []
  const maxRelId = Math.max(...dishIngredients.map(r => r.id), 0)

  for (const dish of dishes) {
    if (!updatedDishIds.has(dish.id)) continue
    for (const ing of dish.ingredients) {
      // 匹配食材 ID
      const found = ingredients.find(i =>
        i.name === ing.name ||
        (ing.name && i.name && (i.name.includes(ing.name) || ing.name.includes(i.name)))
      )
      if (found) {
        newRelations.push({
          id: maxRelId + newRelations.length + 1,
          dishId: dish.id,
          ingredientId: found.id,
          amount: ing.amount,
        })
      }
    }
  }

  mainData.data.dish_ingredients = [...keptRelations, ...newRelations]
  mainData.data.dishes = dishes
  mainData.dataVersion = nextDataVersion(mainData.dataVersion)
  mainData.exportedAt = new Date().toISOString()

  console.log(`\n合并完成:`)
  console.log(`  更新菜品: ${updated} 道`)
  console.log(`  新增菜品: ${added} 道`)
  console.log(`  关联关系: ${mainData.data.dish_ingredients.length} 条`)

  return mainData
}

// ========== 主流程 ==========
function main() {
  console.log('读取数据...')
  const { generated, mainData } = loadData()
  console.log(`  AI 生成数据: ${generated.length} 道菜`)
  console.log(`  主数据: ${mainData.data.dishes.length} 道菜\n`)

  console.log('开始合并...')
  const merged = merge(generated, mainData)

  if (dryRun) {
    console.log('\n[预览模式] 未写入文件')
    return
  }

  writeFileSync(CONFIG.outputFile, JSON.stringify(merged, null, 2), 'utf8')
  console.log(`\n✓ 已写入: ${CONFIG.outputFile}`)

  // 同步到 public
  if (existsSync('D:/code/cook/public')) {
    writeFileSync(CONFIG.publicFile, JSON.stringify(merged, null, 2), 'utf8')
    console.log(`✓ 已同步: ${CONFIG.publicFile}`)
  }
}

main()

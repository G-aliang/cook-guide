/**
 * AI 输出解析脚本
 * 用途：读取 ai-output/ 目录中 AI 生成的菜谱 JSON，校验并汇总
 *
 * 使用：
 *   node ai-gen/scripts/batch-generate.js            # 解析并汇总
 *   node ai-gen/scripts/batch-generate.js --validate # 仅校验，不写文件
 *
 * 提示词见 ai-gen/prompts.md，生成结果保存到 ai-gen/ai-output/
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const CONFIG = {
  aiOutputDir: 'D:/code/cook/ai-gen/ai-output/',
  outputFile: 'D:/code/cook/ai-gen/data/dishes-generated.json',
}

// ========== 数据校验 ==========
function validateDish(data) {
  const errors = []
  if (!data.name) errors.push('缺少菜名')
  if (!data.category) errors.push('缺少分类')
  if (!data.difficulty) errors.push('缺少难度')
  if (!data.steps || data.steps.length < 3) errors.push('步骤少于3步')
  if (!data.ingredients || data.ingredients.length < 3) errors.push('食材少于3种')
  for (const step of data.steps || []) {
    if (!step.desc) errors.push(`步骤${step.order}缺少描述`)
  }
  return { valid: errors.length === 0, errors }
}

// ========== 解析 AI 输出 ==========
function parseOutput() {
  if (!existsSync(CONFIG.aiOutputDir)) {
    console.error('AI 输出目录不存在: ' + CONFIG.aiOutputDir)
    return []
  }

  const files = readdirSync(CONFIG.aiOutputDir).filter(f => f.endsWith('.json'))
  const dishes = []

  for (const file of files) {
    try {
      const content = readFileSync(join(CONFIG.aiOutputDir, file), 'utf8')
      let data = JSON.parse(content)

      // 数组：逐个处理
      if (Array.isArray(data)) {
        for (const dish of data) {
          if (!dish.name) continue
          const v = validateDish(dish)
          if (v.valid) {
            dishes.push(dish)
            console.log(`✓ ${dish.name} - ${dish.steps.length}步, ${dish.ingredients.length}种食材, ${dish.pitfalls?.length || 0}条避坑`)
          } else {
            console.warn(`✗ ${dish.name} - ${v.errors.join(', ')}`)
          }
        }
        continue
      }

      // 单个菜品（或代码块包裹）
      if (!data.name) {
        const match = content.match(/\{[\s\S]+\}/)
        if (match) data = JSON.parse(match[0])
      }
      const v = validateDish(data)
      if (v.valid) {
        dishes.push(data)
        console.log(`✓ ${data.name} - ${data.steps.length}步, ${data.ingredients.length}种食材, ${data.pitfalls?.length || 0}条避坑`)
      } else {
        console.warn(`✗ ${data.name} - ${v.errors.join(', ')}`)
      }
    } catch (e) {
      console.error(`✗ ${file} - 解析失败: ${e.message}`)
    }
  }

  return dishes
}

// ========== 主流程 ==========
function main() {
  const validateOnly = process.argv.includes('--validate')
  const dishes = parseOutput()

  if (dishes.length === 0) {
    console.log('没有找到有效的 AI 输出文件')
    console.log('请把 AI 生成的 JSON 保存到: ' + CONFIG.aiOutputDir)
    return
  }

  if (validateOnly) {
    console.log(`\n校验完成: ${dishes.length} 道菜通过`)
    return
  }

  writeFileSync(CONFIG.outputFile, JSON.stringify(dishes, null, 2), 'utf8')
  console.log(`\n已保存 ${dishes.length} 道菜到: ${CONFIG.outputFile}`)
}

main()

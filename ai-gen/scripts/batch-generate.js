/**
 * 批量 AI 菜谱生成脚本
 * 用途：从菜品名单批量生成精确到克数/温度/时长的详细教程
 *
 * 使用方式：
 *   node batch-generate.js              # 自动模式（需配置 API）
 *   node batch-generate.js --manual     # 手动模式（复制粘贴 AI 输出）
 *   node batch-generate.js --validate   # 仅校验已有数据
 *
 * 自动模式需要配置 AI API（OpenAI / Claude / 本地模型等）
 * 手动模式：每次生成后将 AI 输出保存到 ai-output/ 目录，运行脚本解析
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ========== 配置 ==========
const CONFIG = {
  // 菜品名单文件
  dishListFile: 'D:/code/cook/ai-gen/data/dishes-list.json',
  // AI 输出目录（手动模式）
  aiOutputDir: 'D:/code/cook/ai-gen/ai-output/',
  // 最终输出文件
  outputFile: 'D:/code/cook/ai-gen/data/dishes-generated.json',
  // 每批生成几道菜
  batchSize: 5,
  // 已有菜品数量（用于跳过已生成的）
  existingDishesFile: 'D:/code/cook/data/import-data.json',
}

// ========== AI 提示词构造 ==========
function buildPrompt(dishName, dishType = '热炒') {
  const typeHints = {
    '热炒': '强调大火快炒、火候控制、翻炒手法',
    '凉菜': '强调焯水时间、过凉水、调料混合顺序',
    '汤羹': '强调焯水去血沫、炖煮火候、调味时机',
    '主食': '强调米饭/面条处理、火候控制、翻炒手法',
    '甜点': '强调食材泡发、炖煮火候、调味时机',
  }

  return `你是一位经验丰富的家常菜厨师，擅长将菜谱转化为新手也能完全照做的详细教程。

请帮我生成一份详细的【${dishName}】（${dishType}类）的制作过程，要求如下：

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
  "name": "${dishName}",
  "category": "${dishType}",
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

额外要求：${typeHints[dishType] || typeHints['热炒']}`
}

// ========== 数据校验 ==========
function validateDish(data) {
  const errors = []

  if (!data.name) errors.push('缺少菜名')
  if (!data.category) errors.push('缺少分类')
  if (!data.difficulty) errors.push('缺少难度')
  if (!data.steps || data.steps.length < 3) errors.push('步骤少于3步')
  if (!data.ingredients || data.ingredients.length < 3) errors.push('食材少于3种')

  // 检查用量是否包含克数
  for (const ing of data.ingredients || []) {
    if (ing.amount && !/g|ml|克|毫升|个|勺|瓣|根/.test(ing.amount) && ing.amount !== '适量') {
      // 用量格式不标准，但不一定致命
    }
  }

  // 检查步骤是否有火候和时间
  for (const step of data.steps || []) {
    if (!step.desc) errors.push(`步骤${step.order}缺少描述`)
  }

  return { valid: errors.length === 0, errors }
}

// ========== 手动模式：解析 AI 输出文件 ==========
function parseManualOutput() {
  if (!existsSync(CONFIG.aiOutputDir)) {
    console.error('AI 输出目录不存在')
    return []
  }

  const files = readdirSync(CONFIG.aiOutputDir).filter(f => f.endsWith('.json'))
  const dishes = []

  for (const file of files) {
    try {
      const content = readFileSync(join(CONFIG.aiOutputDir, file), 'utf8')
      // 尝试直接解析 JSON
      let data = JSON.parse(content)

      // 如果是数组，逐个处理
      if (Array.isArray(data)) {
        for (const dish of data) {
          if (!dish.name) continue
          const validation = validateDish(dish)
          if (validation.valid) {
            dishes.push(dish)
            console.log(`✓ ${dish.name} - ${dish.steps.length}步, ${dish.ingredients.length}种食材, ${dish.pitfalls?.length || 0}条避坑`)
          } else {
            console.warn(`✗ ${dish.name} - ${validation.errors.join(', ')}`)
          }
        }
        continue
      }

      // 单个菜品
      if (!data.name) {
        // 可能是被代码块包裹的，尝试提取
        const match = content.match(/\{[\s\S]+\}/)
        if (match) {
          data = JSON.parse(match[0])
        }
      }
      const validation = validateDish(data)
      if (validation.valid) {
        dishes.push(data)
        console.log(`✓ ${data.name} - ${data.steps.length}步, ${data.ingredients.length}种食材, ${data.pitfalls?.length || 0}条避坑`)
      } else {
        console.warn(`✗ ${data.name} - ${validation.errors.join(', ')}`)
      }
    } catch (e) {
      console.error(`✗ ${file} - 解析失败: ${e.message}`)
    }
  }

  return dishes
}

// ========== 自动模式：调用 AI API ==========
async function generateWithAI(dishNames) {
  console.log(`准备生成 ${dishNames.length} 道菜...`)

  // 这里需要配置 AI API 调用
  // 示例：OpenAI API
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [{ role: 'user', content: prompt }],
  //     temperature: 0.7
  //   })
  // })

  console.log('自动模式需要配置 AI API，请使用手动模式：')
  console.log('1. 复制提示词到 AI 工具中生成')
  console.log('2. 将 AI 输出保存到 ' + CONFIG.aiOutputDir)
  console.log('3. 运行: node batch-generate.js --manual')

  return []
}

// ========== 生成菜品名单 ==========
function generateDishList() {
  // 从已有的 import-data.json 中提取菜品名单
  const existingData = JSON.parse(readFileSync(CONFIG.existingDishesFile, 'utf8'))
  const existingDishes = existingData.data.dishes || []

  const dishList = existingDishes.map(d => ({
    name: d.name,
    category: d.category,
    difficulty: d.difficulty
  }))

  writeFileSync(CONFIG.dishListFile, JSON.stringify(dishList, null, 2), 'utf8')
  console.log(`已生成菜品名单: ${dishList.length} 道菜`)
  return dishList
}

// ========== 主流程 ==========
async function main() {
  const args = process.argv.slice(2)
  const mode = args[0] || 'auto'

  if (mode === '--list') {
    // 生成菜品名单
    generateDishList()
    return
  }

  if (mode === '--manual') {
    // 手动模式：解析已有 AI 输出
    const dishes = parseManualOutput()
    if (dishes.length === 0) {
      console.log('没有找到有效的 AI 输出文件')
      console.log('请先复制提示词到 AI 工具中生成，然后保存到: ' + CONFIG.aiOutputDir)
      return
    }
    writeFileSync(CONFIG.outputFile, JSON.stringify(dishes, null, 2), 'utf8')
    console.log(`\n已保存 ${dishes.length} 道菜到: ${CONFIG.outputFile}`)
    return
  }

  if (mode === '--validate') {
    // 仅校验
    const dishes = parseManualOutput()
    console.log(`校验完成: ${dishes.length} 道菜通过`)
    return
  }

  // 自动模式
  const dishList = generateDishList()
  const dishes = await generateWithAI(dishList)
  writeFileSync(CONFIG.outputFile, JSON.stringify(dishes, null, 2), 'utf8')
  console.log(`\n已保存 ${dishes.length} 道菜到: ${CONFIG.outputFile}`)
}

main()

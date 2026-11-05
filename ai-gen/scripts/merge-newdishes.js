/**
 * 新菜品合并脚本（可复用）
 *
 * 用途：把 ai-gen/ai-output/newdish-*.json 里的菜品合并进主数据
 * 特性：
 *   - 按名称去重（已存在则跳过），可反复运行
 *   - 统一食材命名口径（大蒜→蒜、小葱/大葱→葱 等），保证与食材库能关联
 *   - 自动分配菜品 id、relatedIngredientIds，并写入 dish_ingredients
 *   - 同步写入 data/ 与 public/
 *
 * 用法：
 *   node ai-gen/scripts/merge-newdishes.js            # 合并全部 newdish-*.json
 *   node ai-gen/scripts/merge-newdishes.js sx-01 db-01  # 只合并指定批次
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, copyFileSync } from 'fs'

const ROOT = 'D:/code/cook'
const OUTPUT_DIR = `${ROOT}/ai-gen/ai-output`
const DATA_FILE = `${ROOT}/data/import-data.json`
const PUBLIC_FILE = `${ROOT}/public/import-data.json`

// 食材命名统一（菜谱里写口语名 → 食材库标准名）
const RENAME = {
  '大蒜': '蒜', '小葱': '葱', '大葱': '葱', '青红椒': '青椒', '嫩豆腐': '豆腐',
  '红薯淀粉': '淀粉', '米饭': '大米', '温水': '水', '熟芝麻': '芝麻',
  '西红柿': '番茄', '小西红柿': '番茄', '尖椒': '青椒'
}

const args = process.argv.slice(2)
let files = readdirSync(OUTPUT_DIR).filter(f => /^newdish-.*\.json$/.test(f)).sort()
if (args.length) files = files.filter(f => args.some(a => f.includes(a)))
files = files.map(f => `${OUTPUT_DIR}/${f}`)

const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const data = raw.data
const now = Date.now()

const imap = {}
data.ingredients.forEach(i => { imap[i.name] = i.id })

let dishId = Math.max(...data.dishes.map(x => x.id || 0))
let diId = Math.max(...data.dish_ingredients.map(x => x.id || 0))
const have = new Set(data.dishes.map(x => x.name))

let added = 0, links = 0, renamed = 0, fixedKeys = 0
const skipped = []
const unlinked = {}

for (const file of files) {
  if (!existsSync(file)) { console.log('跳过不存在的文件: ' + file); continue }
  // 文本层修复：属性名少写收尾引号的笔误（如 "note: "" / "time: "30秒"）
  let text = readFileSync(file, 'utf8')
  // 通用修复：属性名少了收尾引号（如 "note: " / "duration: " / "time: "）
  text = text.replace(/"([A-Za-z]+): "/g, '"$1": "')
  // 值里多写冒号的情况："note": ": "xxx"
  text = text.split('": ": "').join('": "')
  const dishes = JSON.parse(text)
  for (const d of dishes) {
    if (have.has(d.name)) { skipped.push(d.name); continue }
    // 清洗字段名笔误（如 "note:" / "heat:"）
    for (const key of ['ingredients', 'steps', 'pitfalls']) {
      for (const obj of (d[key] || [])) {
        for (const k of Object.keys(obj)) {
          if (k.endsWith(':')) { obj[k.slice(0, -1)] = obj[k]; delete obj[k]; fixedKeys++ }
        }
      }
    }
    for (const ing of d.ingredients) {
      if (RENAME[ing.name]) { ing.name = RENAME[ing.name]; renamed++ }
    }
    dishId += 1
    const related = []
    for (const ing of d.ingredients) {
      const iid = imap[ing.name]
      if (iid) {
        related.push(iid)
        diId += 1
        data.dish_ingredients.push({ id: diId, dishId, ingredientId: iid, amount: ing.amount })
        links++
      } else {
        unlinked[ing.name] = (unlinked[ing.name] || 0) + 1
      }
    }
    data.dishes.push({
      name: d.name, category: d.category, difficulty: d.difficulty, duration: d.duration,
      intro: d.intro, ingredients: d.ingredients, steps: d.steps,
      nutrition: d.nutrition, tags: d.tags,
      id: dishId, imageId: null, videoUrl: '',
      relatedIngredientIds: [...new Set(related)],
      createdAt: now, updatedAt: now, pitfalls: d.pitfalls
    })
    have.add(d.name)
    added++
  }
}

writeFileSync(DATA_FILE, JSON.stringify(raw), 'utf8')
if (existsSync(PUBLIC_FILE)) copyFileSync(DATA_FILE, PUBLIC_FILE)

console.log('合并文件 ' + files.length + ' 个')
console.log('新增菜品 ' + added + ' 道；跳过已存在 ' + skipped.length + ' 道')
if (skipped.length) console.log('  跳过: ' + skipped.join('、'))
console.log('食材命名统一 ' + renamed + ' 处；字段名修正 ' + fixedKeys + ' 处；新增关联 ' + links + ' 条')
console.log('菜品总数: ' + data.dishes.length + ' | 食材总数: ' + data.ingredients.length + ' | 关联总数: ' + data.dish_ingredients.length)
const top = Object.entries(unlinked).sort((a, b) => b[1] - a[1]).slice(0, 10)
if (top.length) console.log('未匹配食材名（食材库没有，正常）: ' + top.map(([k, v]) => k + '(' + v + ')').join('、'))


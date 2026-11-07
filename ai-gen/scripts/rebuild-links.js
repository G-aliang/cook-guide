/**
 * 菜品-食材关联重建脚本
 *
 * 背景：早期合并时用了「子串模糊匹配」，导致错配（葱→洋葱、番茄酱→番茄）
 *       且同一食材可能重复关联，使匹配度虚高；后来才入库的食材也漏连。
 *
 * 做法：按「精确名称 + 别名表」重建全部关联，同名去重，并同步 relatedIngredientIds。
 * 用法：node ai-gen/scripts/rebuild-links.js
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs'

const MAIN = 'D:/code/cook/data/import-data.json'
const PUBLIC = 'D:/code/cook/public/import-data.json'

// 菜谱里的口语写法 → 食材库标准名（空字符串表示库里没有、不关联）
const ALIAS = {
  // 香辛/调味
  '大蒜': '蒜', '蒜末': '蒜', '小葱': '葱', '大葱': '葱', '葱花': '葱', '生姜': '姜',
  '白糖': '糖', '冰糖': '糖', '郫县豆瓣酱': '豆瓣酱', '黄灯笼辣椒酱': '辣椒酱',
  '黑胡椒': '黑胡椒粉', '黑胡椒碎': '黑胡椒粉', '孜然粉': '孜然',
  '腐乳汁': '腐乳', '淀粉水': '淀粉', '水淀粉': '淀粉',
  // 蔬菜
  '白萝卜': '萝卜', '白菜': '大白菜', '白菜心': '大白菜', '青红椒': '青椒',
  '薄皮青椒': '青椒', '青尖椒': '青椒', '尖椒': '青椒', '长豆角': '豆角', '长茄子': '茄子',
  '铁棍山药': '山药', '藕片': '莲藕', '马蹄': '荸荠', '荸荠或藕': '荸荠', '马蹄或藕': '荸荠',
  '西红柿': '番茄', '小西红柿': '番茄', '蒜苔': '蒜苗', '绿豆芽': '豆芽',
  '玉米粒': '玉米', '甜玉米': '玉米', '青菜': '', '花菜': '', '混合菌菇': '',
  // 豆制品
  '嫩豆腐': '豆腐', '老豆腐': '豆腐', '内酯豆腐': '豆腐', '豆干': '豆腐干', '香干': '豆腐干', '豆皮': '豆腐皮',
  // 干货
  '干木耳': '木耳', '干香菇': '香菇', '干紫菜': '紫菜', '干银耳': '银耳', '干腐竹': '腐竹',
  '干茶树菇': '茶树菇', '干墨鱼': '墨鱼', '干黄花菜': '黄花菜', '芽菜': '梅干菜',
  '熟芝麻': '芝麻', '黑芝麻': '芝麻', '白芝麻': '芝麻',
  '熟花生碎': '花生', '花生碎': '花生', '花生米': '花生',
  '红薯粉条': '宽粉', '红薯粉丝': '宽粉', '粉条': '宽粉', '龙口粉丝': '粉丝',
  '海带结': '海带', '海带丝': '海带', '海带结或海带': '海带',
  '燕麦片': '燕麦', '即食燕麦': '燕麦', '燕麦米': '燕麦',
  // 肉禽蛋
  '猪排骨': '排骨', '猪肋排': '排骨', '猪里脊肉': '猪里脊', '牛腱子肉': '牛腱子',
  '羊腿肉': '羊肉', '鸡腿肉': '鸡腿', '鸡翅中': '鸡翅', '鸭腿肉': '鸭腿',
  '带皮五花肉': '五花肉', '五花肉或后腿肉': '五花肉', '五花肉或腊肉': '五花肉',
  '三黄鸡或鸡腿': '鸡腿', '土鸡或鸡腿': '鸡腿', '鸡腿或整鸡': '鸡腿',
  '牛腩或牛腱': '牛腩', '牛腩或牛里脊': '牛腩',
  '火腿或肉丝': '火腿', '火腿或鸡肉': '火腿', '鸭腿或半只鸭': '鸭腿',
  '蛋清': '鸡蛋', '鸡蛋清': '鸡蛋',
  // 水产
  '鲜虾': '基围虾', '大虾': '基围虾', '虾': '基围虾', '虾仁粒': '虾仁', '鲜墨鱼': '墨鱼',
  // 主食 / 奶
  '米饭': '大米', '隔夜米饭': '大米', '米线': '米粉', '意面': '意大利面', '碱水面': '面条',
  '中筋面粉': '面粉', '高筋面粉': '面粉',
  '全脂牛奶': '牛奶', '芝士片': '芝士', '芝士粉': '芝士',
  '口蘑或平菇': '口蘑', '红葱头或洋葱': '洋葱', '蜂蜜或炼乳': '蜂蜜'
}

const raw = JSON.parse(readFileSync(MAIN, 'utf8'))
const data = raw.data
const now = Date.now()

const idByName = {}
data.ingredients.forEach(i => { idByName[i.name] = i.id })

// 重建：每个菜品最多保留一条 (dishId, ingredientId)
const rows = []
let relId = 0
const perDish = []
let skipped = 0
const unmatched = {}

for (const dish of data.dishes) {
  const seen = new Set()
  const ids = []
  for (const ing of dish.ingredients) {
    const mapped = Object.prototype.hasOwnProperty.call(ALIAS, ing.name) ? ALIAS[ing.name] : ing.name
    const iid = idByName[mapped]
    if (!iid) { unmatched[ing.name] = (unmatched[ing.name] || 0) + 1; skipped++; continue }
    if (seen.has(iid)) continue
    seen.add(iid)
    ids.push(iid)
    relId++
    rows.push({ id: relId, dishId: dish.id, ingredientId: iid, amount: ing.amount })
  }
  dish.relatedIngredientIds = ids
  dish.updatedAt = now
  perDish.push(ids.length)
}

const before = data.dish_ingredients.length
data.dish_ingredients = rows
writeFileSync(MAIN, JSON.stringify(raw), 'utf8')
copyFileSync(MAIN, PUBLIC)

const avg = (perDish.reduce((a, b) => a + b, 0) / perDish.length).toFixed(1)
console.log('关联重建完成')
console.log('  行数: ' + before + ' → ' + rows.length)
console.log('  平均每道菜关联食材: ' + avg + ' 个')
console.log('  未能匹配（库里没有的写法）: ' + skipped + ' 处')
const top = Object.entries(unmatched).sort((a, b) => b[1] - a[1]).slice(0, 12)
console.log('  主要未匹配: ' + top.map(([k, v]) => k + '(' + v + ')').join('、'))
console.log('  dataVersion 保持不变: ' + raw.dataVersion)

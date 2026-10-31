// 初始数据导入脚本 — 首次使用时自动导入
// 如果数据库为空，从 public/import-data.json 导入初始数据

import { db } from './database'

export async function importInitialData() {
  try {
    // 检查数据库是否已有数据
    const count = await db.ingredients.count()
    if (count > 0) {
      console.log('数据库已有数据，跳过导入')
      return false
    }

    // 从 public 目录获取数据文件
    const response = await fetch('./import-data.json')
    if (!response.ok) {
      console.warn('数据文件不可用，跳过导入')
      return false
    }

    const data = await response.json()
    console.log('开始导入初始数据...')

    // 导入食材
    const ingredients = data.data.ingredients || []
    if (ingredients.length) {
      await db.ingredients.bulkPut(ingredients)
      console.log(`导入 ${ingredients.length} 个食材`)
    }

    // 导入菜品
    const dishes = data.data.dishes || []
    if (dishes.length) {
      await db.dishes.bulkPut(dishes)
      console.log(`导入 ${dishes.length} 个菜品`)
    }

    // 导入关联关系
    const dishIngredients = data.data.dish_ingredients || []
    if (dishIngredients.length) {
      await db.dish_ingredients.bulkPut(dishIngredients)
      console.log(`导入 ${dishIngredients.length} 条关联关系`)
    }

    console.log('初始数据导入完成')
    return true
  } catch (e) {
    console.error('导入失败:', e)
    return false
  }
}

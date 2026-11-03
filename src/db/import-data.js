// 数据同步脚本
// 职责：
//   1. 首次访问：导入全部基础数据（食材/菜品/关联）
//   2. 版本变化：更新基础数据，保留个人数据（备注/收藏/浏览/进度/图片）
//   3. 版本相同：跳过
//
// 原理：import-data.json 带 dataVersion，本地用 localStorage 记录已导入版本，
//       两者不同即触发「只更新基础数据」的增量同步。

import { db } from './database'

const VERSION_KEY = 'cook-data-version'

// 只重写基础数据表，不触碰个人数据
async function replaceBaseData(data) {
  await db.ingredients.clear()
  await db.dishes.clear()
  await db.dish_ingredients.clear()
  if (data.ingredients?.length) await db.ingredients.bulkPut(data.ingredients)
  if (data.dishes?.length) await db.dishes.bulkPut(data.dishes)
  if (data.dish_ingredients?.length) await db.dish_ingredients.bulkPut(data.dish_ingredients)
}

// 清理指向已删除实体的个人数据（避免孤儿）
async function cleanOrphans(data) {
  const dishIds = new Set((data.dishes || []).map(d => d.id))
  const ingredientIds = new Set((data.ingredients || []).map(i => i.id))
  const validByType = { dish: dishIds, ingredient: ingredientIds }

  await db.favorites.filter(f => !dishIds.has(f.dishId)).delete()
  await db.learning_progress.filter(p => !dishIds.has(p.dishId)).delete()
  await db.notes.filter(n => {
    const set = validByType[n.refType]
    return set ? !set.has(n.refId) : false
  }).delete()
  await db.browsing_history.filter(h => {
    const set = validByType[h.refType]
    return set ? !set.has(h.refId) : false
  }).delete()
}

export async function syncInitialData() {
  try {
    const baseUrl = import.meta.env.BASE_URL
    const response = await fetch(`${baseUrl}import-data.json`)
    if (!response.ok) {
      console.warn(`数据文件不可用 (${response.status})，跳过同步`)
      return false
    }

    const payload = await response.json()
    const data = payload.data
    const remoteVersion = String(payload.dataVersion || payload.exportedAt || '')

    const isEmpty = (await db.ingredients.count()) === 0
    const localVersion = localStorage.getItem(VERSION_KEY) || ''

    // ① 首次访问：全量导入基础数据
    if (isEmpty) {
      await replaceBaseData(data)
      localStorage.setItem(VERSION_KEY, remoteVersion)
      console.log('✓ 首次导入基础数据')
      return true
    }

    // ② 版本变化：更新基础数据，个人数据保留
    if (remoteVersion && remoteVersion !== localVersion) {
      await replaceBaseData(data)
      await cleanOrphans(data)
      localStorage.setItem(VERSION_KEY, remoteVersion)
      console.log('✓ 检测到新版本，基础数据已更新（个人数据保留）')
      return true
    }

    // ③ 已是最新
    console.log('数据已是最新')
    return false
  } catch (e) {
    console.error('数据同步失败:', e)
    return false
  }
}

// 兼容旧调用名
export const importInitialData = syncInitialData

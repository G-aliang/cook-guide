import { db } from './database'

// ========== 食材模型 ==========
export const ingredientModel = {
  getAll: () => db.ingredients.toArray(),
  getById: (id) => db.ingredients.get(id),
  getByCategory: (category) =>
    db.ingredients.where('category').equals(category).toArray(),
  search: (keyword) =>
    db.ingredients.where('name').anyOf(keyword).toArray(),
  insert: (data) => db.ingredients.add({ ...data, createdAt: Date.now() }),
  update: (id, data) =>
    db.ingredients.update(id, { ...data, updatedAt: Date.now() }),
  remove: (id) => db.ingredients.delete(id),
  getRelatedDishes: (ingredientId) =>
    db.dish_ingredients
      .where('ingredientId').equals(ingredientId)
      .toArray()
      .then(rels =>
        Promise.all(rels.map(r => db.dishes.get(r.dishId)))
      ),
}

// ========== 菜品模型 ==========
export const dishModel = {
  getAll: () => db.dishes.toArray(),
  getById: (id) => db.dishes.get(id),
  getByCategory: (category) =>
    db.dishes.where('category').equals(category).toArray(),
  getByDifficulty: (difficulty) =>
    db.dishes.where('difficulty').equals(difficulty).toArray(),
  search: (keyword) =>
    db.dishes.where('name').anyOf(keyword).toArray(),
  insert: (data) => db.dishes.add({ ...data, createdAt: Date.now() }),
  update: (id, data) =>
    db.dishes.update(id, { ...data, updatedAt: Date.now() }),
  remove: (id) => {
    return Promise.all([
      db.dish_ingredients.where('dishId').equals(id).delete(),
      db.notes.where('refId').equals(id).delete(),
      db.favorites.where('dishId').equals(id).delete(),
      db.learning_progress.where('dishId').equals(id).delete(),
      db.browsing_history.where('refId').equals(id).delete(),
      db.images.where('refId').equals(id).delete(),
      db.dishes.delete(id),
    ])
  },
  getRelatedIngredients: (dishId) =>
    db.dish_ingredients
      .where('dishId').equals(dishId)
      .toArray()
      .then(rels =>
        Promise.all(rels.map(r => db.ingredients.get(r.ingredientId)))
      ),
  // 食材匹配推荐（调味料视为常备品，不参与匹配与计数）
  async matchByIngredients(ingredientIds) {
    if (!ingredientIds || ingredientIds.length === 0) return []

    // 调味项（盐/糖/生抽/葱姜蒜/番茄酱…）不计入匹配
    const seasonings = await db.ingredients.where('category').equals('调味项').toArray()
    const seasoningIds = new Set(seasonings.map(i => i.id))
    const usable = ingredientIds.filter(id => !seasoningIds.has(id))
    if (usable.length === 0) return []

    const allRels = await db.dish_ingredients
      .where('ingredientId')
      .anyOf(usable)
      .toArray()

    const dishMatchMap = new Map()
    for (const rel of allRels) {
      if (seasoningIds.has(rel.ingredientId)) continue
      if (!dishMatchMap.has(rel.dishId)) {
        dishMatchMap.set(rel.dishId, {
          dishId: rel.dishId,
          matchedIngredientIds: [],
        })
      }
      const entry = dishMatchMap.get(rel.dishId)
      // 同一食材只计一次，避免重复关联把匹配度算高
      if (!entry.matchedIngredientIds.includes(rel.ingredientId)) {
        entry.matchedIngredientIds.push(rel.ingredientId)
      }
    }

    const sorted = [...dishMatchMap.values()]
      .sort((a, b) => b.matchedIngredientIds.length - a.matchedIngredientIds.length)

    const results = await Promise.all(
      sorted.map(item =>
        db.dishes.get(item.dishId).then(dish => ({
          ...dish,
          matchInfo: {
            matchedCount: item.matchedIngredientIds.length,
            totalSelected: usable.length,
            matchedIngredientIds: item.matchedIngredientIds,
          },
        }))
      )
    )

    return results
  },
}

// ========== 备注模型 ==========
export const noteModel = {
  getByRef: (refType, refId) =>
    db.notes
      .where('refId').equals(refId)
      .and(db.notes.where('refType').equals(refType))
      .toArray()
      .then(notes => notes.sort((a, b) => b.createdAt - a.createdAt)),
  insert: (data) =>
    db.notes.add({ ...data, createdAt: Date.now(), updatedAt: Date.now() }),
  update: (id, content) =>
    db.notes.update(id, { content, updatedAt: Date.now() }),
  remove: (id) => db.notes.delete(id),
}

// ========== 浏览记录模型 ==========
export const browsingHistoryModel = {
  async record(refType, refId) {
    const existing = await db.browsing_history
      .where('refId').equals(refId)
      .and(db.browsing_history.where('refType').equals(refType))
      .first()
    if (existing) {
      await db.browsing_history.update(existing.id, { viewedAt: Date.now() })
    } else {
      await db.browsing_history.add({ refType, refId, viewedAt: Date.now() })
    }
    const all = await db.browsing_history.orderBy('viewedAt').reverse().toArray()
    if (all.length > 50) {
      await db.browsing_history.bulkDelete(all.slice(50).map(r => r.id))
    }
  },
  getRecent: (limit = 50) =>
    db.browsing_history.orderBy('viewedAt').reverse().limit(limit).toArray(),
  remove: (id) => db.browsing_history.delete(id),
  clear: () => db.browsing_history.clear(),
}

// ========== 收藏模型 ==========
export const favoriteModel = {
  getAll: () => db.favorites.toArray(),
  isFavorited: (dishId) => db.favorites.where('dishId').equals(dishId).first(),
  add: (dishId) => db.favorites.add({ dishId, createdAt: Date.now() }),
  remove: (dishId) => db.favorites.where('dishId').equals(dishId).delete(),
  toggle: async (dishId) => {
    const existing = await db.favorites.where('dishId').equals(dishId).first()
    if (existing) {
      await db.favorites.delete(existing.id)
      return false
    } else {
      await db.favorites.add({ dishId, createdAt: Date.now() })
      return true
    }
  },
}

// ========== 学习进度模型 ==========
export const progressModel = {
  getByStatus: (status) =>
    db.learning_progress.where('status').equals(status).toArray(),
  getByDishId: (dishId) =>
    db.learning_progress.where('dishId').equals(dishId).first(),
  setStatus: async (dishId, status, note = '') => {
    const existing = await db.learning_progress.where('dishId').equals(dishId).first()
    if (existing) {
      await db.learning_progress.update(existing.id, { status, note, updatedAt: Date.now() })
    } else {
      await db.learning_progress.add({ dishId, status, note, updatedAt: Date.now() })
    }
  },
  remove: (dishId) => db.learning_progress.where('dishId').equals(dishId).delete(),
  getCounts: async () => {
    const all = await db.learning_progress.toArray()
    const done = all.filter(p => p.status === 'done').length
    const want = all.filter(p => p.status === 'want').length
    return { done, want }
  },
}

// ========== 图片模型 ==========
export const imageModel = {
  getByRef: (refType, refId) =>
    db.images.where('refId').equals(refId).toArray(),
  getById: (id) => db.images.get(id),
  insert: (data) => db.images.add({ ...data, createdAt: Date.now() }),
  remove: (id) => db.images.delete(id),
  removeByRef: (refType, refId) =>
    db.images.where('refId').equals(refId).delete(),
}

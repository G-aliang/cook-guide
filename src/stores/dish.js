import { defineStore } from 'pinia'
import { dishModel, imageModel } from '../db/models'

export const useDishStore = defineStore('dish', {
  state: () => ({
    dishes: [],
    currentDish: null,
    relatedIngredients: [],
    filter: { category: '', difficulty: '', tags: {} },
    keyword: '',
    loading: false,
    page: 1,
    pageSize: 12,
    hasMore: true,
  }),
  actions: {
    async loadAll() {
      this.loading = true
      try {
        this.dishes = await dishModel.getAll()
      } finally {
        this.loading = false
      }
    },
    async loadById(id) {
      this.currentDish = await dishModel.getById(id)
      this.relatedIngredients = await dishModel.getRelatedIngredients(id)
    },
    async save(data) {
      const imageData = data._imageBase64
      delete data._imageBase64
      if (data.id) {
        await dishModel.update(data.id, data)
        if (imageData) {
          await imageModel.removeByRef('dish', data.id)
          const imgId = await imageModel.insert({ refType: 'dish', refId: data.id, role: 'main', dataType: 'image', data: imageData })
          await dishModel.update(data.id, { imageId: imgId })
        }
      } else {
        const id = await dishModel.insert(data)
        if (imageData) {
          const imgId = await imageModel.insert({ refType: 'dish', refId: id, role: 'main', dataType: 'image', data: imageData })
          await dishModel.update(id, { imageId: imgId })
        }
        await this.loadAll()
      }
    },
    async remove(id) {
      await dishModel.remove(id)
      await this.loadAll()
    },
    setFilter(filter) {
      this.filter = { ...this.filter, ...filter }
      this.page = 1
      this.hasMore = true
    },
    // 切换某维度下的标签（维度内多选，维度间为「且」）
    toggleTag(dim, value) {
      const tags = { ...this.filter.tags }
      const arr = tags[dim] ? [...tags[dim]] : []
      const i = arr.indexOf(value)
      if (i >= 0) arr.splice(i, 1)
      else arr.push(value)
      if (arr.length) tags[dim] = arr
      else delete tags[dim]
      this.filter = { ...this.filter, tags }
      this.page = 1
      this.hasMore = true
    },
    setKeyword(keyword) {
      this.keyword = keyword
      this.page = 1
      this.hasMore = true
    },
    nextPage() {
      if (this.hasMore) this.page++
    },
    prevPage() {
      if (this.page > 1) this.page--
    },
  },
  getters: {
    filtered: (state) => applyFilters(state),
    paged: (state) => {
      const result = applyFilters(state)
      const start = (state.page - 1) * state.pageSize
      const end = start + state.pageSize
      return {
        items: result.slice(start, end),
        hasMore: end < result.length,
      }
    },
  },
})

// 统一筛选逻辑：分类 / 难度 → 关键词 → 多维标签（维度内 OR、维度间 AND）
function applyFilters(state) {
  let result = state.dishes
  const { category, difficulty, tags } = state.filter
  if (category) result = result.filter(d => d.category === category)
  if (difficulty) result = result.filter(d => d.difficulty === difficulty)
  if (tags) {
    for (const [dim, values] of Object.entries(tags)) {
      if (Array.isArray(values) && values.length) {
        result = result.filter(d => (d.tags?.[dim] || []).some(t => values.includes(t)))
      }
    }
  }
  if (state.keyword && state.keyword.trim()) {
    const kw = state.keyword.trim().toLowerCase()
    result = result.filter(d => {
      // 先比菜名
      if (d.name?.toLowerCase().includes(kw)) return true
      // 再比食材名：菜品记录里自带 ingredients 列表（导入与手动录入都有 name）
      // 「或」式食材的备选也算命中，搜「鸡腿」也能找到「土鸡或鸡腿」的菜
      return (d.ingredients || []).some(
        ing =>
          String(ing.name || '').toLowerCase().includes(kw) ||
          (ing.alternatives || []).some(a => String(a || '').toLowerCase().includes(kw))
      )
    })
  }
  return result
}

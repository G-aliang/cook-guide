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
    filtered: (state) => {
      let result = state.dishes
      if (state.filter.category) {
        result = result.filter(d => d.category === state.filter.category)
      }
      if (state.filter.difficulty) {
        result = result.filter(d => d.difficulty === state.filter.difficulty)
      }
      const tags = state.filter.tags
      if (tags.cooking && tags.cooking.length) {
        result = result.filter(d => d.tags?.cooking?.some(t => tags.cooking.includes(t)))
      }
      if (tags.cuisine && tags.cuisine.length) {
        result = result.filter(d => d.tags?.cuisine?.some(t => tags.cuisine.includes(t)))
      }
      if (tags.meal && tags.meal.length) {
        result = result.filter(d => d.tags?.meal?.some(t => tags.meal.includes(t)))
      }
      if (state.keyword) {
        const kw = state.keyword.toLowerCase()
        result = result.filter(d => d.name?.toLowerCase().includes(kw))
      }
      return result
    },
    paged: (state, getters) => {
      const filtered = getters.filtered
      const start = (state.page - 1) * state.pageSize
      const end = start + state.pageSize
      return {
        items: filtered.slice(start, end),
        hasMore: end < filtered.length,
      }
    },
  },
})

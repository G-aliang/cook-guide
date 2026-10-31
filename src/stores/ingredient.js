import { defineStore } from 'pinia'
import { ingredientModel, imageModel } from '../db/models'
import { CATEGORIES } from '../db/database'

export const useIngredientStore = defineStore('ingredient', {
  state: () => ({
    ingredients: [],
    currentIngredient: null,
    relatedDishes: [],
    filter: { category: '', keyword: '' },
    loading: false,
    page: 1,
    pageSize: 12,
    hasMore: true,
  }),
  actions: {
    async loadAll() {
      this.loading = true
      try {
        this.ingredients = await ingredientModel.getAll()
      } finally {
        this.loading = false
      }
    },
    async loadById(id) {
      this.currentIngredient = await ingredientModel.getById(id)
      this.relatedDishes = await ingredientModel.getRelatedDishes(id)
    },
    async save(data) {
      const imageData = data._imageBase64
      delete data._imageBase64
      if (data.id) {
        await ingredientModel.update(data.id, data)
        if (imageData) {
          await imageModel.removeByRef('ingredient', data.id)
          const imgId = await imageModel.insert({ refType: 'ingredient', refId: data.id, role: 'main', dataType: 'image', data: imageData })
          await ingredientModel.update(data.id, { imageId: imgId })
        }
      } else {
        const id = await ingredientModel.insert(data)
        if (imageData) {
          const imgId = await imageModel.insert({ refType: 'ingredient', refId: id, role: 'main', dataType: 'image', data: imageData })
          await ingredientModel.update(id, { imageId: imgId })
        }
        await this.loadAll()
      }
    },
    async remove(id) {
      await ingredientModel.remove(id)
      await this.loadAll()
    },
    setFilter(filter) {
      this.filter = { ...this.filter, ...filter }
      this.page = 1
      this.hasMore = true
    },
    get filtered() {
      let result = this.ingredients
      if (this.filter.category) {
        result = result.filter(i => i.category === this.filter.category)
      }
      if (this.filter.keyword) {
        const kw = this.filter.keyword.toLowerCase()
        result = result.filter(i => i.name?.toLowerCase().includes(kw))
      }
      return result
    },
    get paged() {
      const filtered = this.filtered
      const start = (this.page - 1) * this.pageSize
      const end = start + this.pageSize
      this.hasMore = end < filtered.length
      return filtered.slice(start, end)
    },
    nextPage() {
      if (this.hasMore) this.page++
    },
    prevPage() {
      if (this.page > 1) this.page--
    },
  },
})

export { CATEGORIES }

import { defineStore } from 'pinia'
import { favoriteModel, progressModel } from '../db/models'

export const useProgressStore = defineStore('progress', {
  state: () => ({
    favorites: [],
    progress: [],
    counts: { done: 0, want: 0 },
  }),
  actions: {
    async loadFavorites() {
      this.favorites = await favoriteModel.getAll()
    },
    async loadProgress() {
      this.progress = await Promise.all([
        progressModel.getByStatus('done'),
        progressModel.getByStatus('want'),
      ]).then(([done, want]) => [...done, ...want])
      this.counts = await progressModel.getCounts()
    },
    async toggleFavorite(dishId) {
      const isFav = await favoriteModel.toggle(dishId)
      await this.loadFavorites()
      return isFav
    },
    async setStatus(dishId, status, note = '') {
      await progressModel.setStatus(dishId, status, note)
      await this.loadProgress()
    },
  },
})

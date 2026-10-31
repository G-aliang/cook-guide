import { defineStore } from 'pinia'
import { noteModel } from '../db/models'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: [],
    currentRef: { type: '', id: null },
  }),
  actions: {
    async loadByRef(refType, refId) {
      this.currentRef = { type: refType, id: refId }
      this.notes = await noteModel.getByRef(refType, refId)
    },
    async add(content) {
      await noteModel.insert({
        refType: this.currentRef.type,
        refId: this.currentRef.id,
        content,
      })
      await this.loadByRef(this.currentRef.type, this.currentRef.id)
    },
    async update(id, content) {
      await noteModel.update(id, content)
      await this.loadByRef(this.currentRef.type, this.currentRef.id)
    },
    async remove(id) {
      await noteModel.remove(id)
      await this.loadByRef(this.currentRef.type, this.currentRef.id)
    },
  },
})

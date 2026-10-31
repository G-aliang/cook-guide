<template>
  <div class="note-list" v-if="notes.length">
    <div v-for="note in notes" :key="note.id" class="note-item">
      <div class="note-content">{{ note.content }}</div>
      <div class="note-footer">
        <span class="note-time">{{ formatTime(note.createdAt) }}</span>
        <div class="note-actions">
          <button class="btn-sm-link" @click="edit(note)">编辑</button>
          <button class="btn-sm-link danger" @click="del(note)">删除</button>
        </div>
      </div>
      <textarea v-if="editingId === note.id" v-model="editContent" class="input" rows="2" maxlength="500"></textarea>
      <div v-if="editingId === note.id" class="note-edit-actions">
        <button class="btn btn-sm btn-primary" @click="saveEdit(note)">保存</button>
        <button class="btn btn-sm" @click="editingId = null">取消</button>
      </div>
    </div>
  </div>
  <div v-else class="empty-note">暂无备注</div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNoteStore } from '../stores/note'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps({
  notes: { type: Array, default: () => [] },
})

const noteStore = useNoteStore()
const editingId = ref(null)
const editContent = ref('')
const showDeleteConfirm = ref(false)
const deleteTarget = ref(null)

function formatTime(ts) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

function edit(note) {
  editingId.value = note.id
  editContent.value = note.content
}

async function saveEdit(note) {
  if (!editContent.value.trim()) return
  await noteStore.update(note.id, editContent.value.trim())
  editingId.value = null
}

function del(note) {
  deleteTarget.value = note
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTarget.value) {
    await noteStore.remove(deleteTarget.value.id)
  }
  showDeleteConfirm.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.note-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.note-content { font-size: 13px; line-height: 1.5; }
.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.note-time { font-size: 12px; color: var(--text-3); }
.note-actions { display: flex; gap: 8px; }
.btn-sm-link {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
}
.btn-sm-link.danger { color: var(--danger); }
.note-edit-actions { display: flex; gap: 8px; margin-top: 8px; }
.empty-note { text-align: center; color: var(--text-3); font-size: 13px; padding: 8px; }
</style>

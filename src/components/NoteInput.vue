<template>
  <div class="note-input-area">
    <textarea
      v-model="content"
      class="input"
      placeholder="记录你的心得..."
      rows="2"
      maxlength="500"
    ></textarea>
    <div class="note-input-actions">
      <span class="char-count">{{ content.length }}/500</span>
      <button class="btn btn-sm btn-primary" @click="submit" :disabled="!content.trim()">提交</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNoteStore } from '../stores/note'

const content = ref('')
const noteStore = useNoteStore()

async function submit() {
  if (!content.value.trim()) return
  await noteStore.add(content.value.trim())
  content.value = ''
}
</script>

<style scoped>
.note-input-area { margin-top: 8px; }
.note-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.char-count { font-size: 12px; color: var(--text-3); }
</style>

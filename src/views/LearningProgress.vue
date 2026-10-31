<template>
  <div>
    <h2 class="page-title">📚 学习进度</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else>
      <div class="progress-section">
        <h3 class="section-title">✅ 已做过 ({{ doneList.length }})</h3>
        <div v-if="!doneList.length" class="empty-note">暂无已做过的菜品</div>
        <div v-for="p in doneList" :key="p.id" class="progress-item" @click="goDetail(p.dishId)">
          <div class="progress-info">
            <div class="progress-name">{{ p.dish?.name || '未知菜品' }}</div>
            <div v-if="p.note" class="progress-note">{{ p.note }}</div>
          </div>
          <span class="tag tag-secondary">已做过</span>
        </div>
      </div>
      <div class="progress-section">
        <h3 class="section-title">⭐ 想做 ({{ wantList.length }})</h3>
        <div v-if="!wantList.length" class="empty-note">暂无想做的菜品</div>
        <div v-for="p in wantList" :key="p.id" class="progress-item" @click="goDetail(p.dishId)">
          <div class="progress-info">
            <div class="progress-name">{{ p.dish?.name || '未知菜品' }}</div>
          </div>
          <span class="tag tag-primary">想做</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { progressModel, dishModel } from '../db/models'

const router = useRouter()
const loading = ref(true)
const allProgress = ref([])

const doneList = computed(() => allProgress.value.filter(p => p.status === 'done'))
const wantList = computed(() => allProgress.value.filter(p => p.status === 'want'))

async function loadData() {
  loading.value = true
  try {
    const done = await progressModel.getByStatus('done')
    const want = await progressModel.getByStatus('want')
    const all = [...done, ...want]
    const dishes = await Promise.all(all.map(p => dishModel.getById(p.dishId)))
    allProgress.value = all.map((p, i) => ({ ...p, dish: dishes[i] }))
  } finally {
    loading.value = false
  }
}

function goDetail(id) { router.push(`/dishes/${id}`) }

onMounted(loadData)
</script>

<style scoped>
.progress-section { margin-bottom: 24px; }
.progress-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.progress-item:hover { background: var(--primary-light); }
.progress-info { flex: 1; }
.progress-name { font-size: 14px; font-weight: 500; }
.progress-note { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.empty-note { color: var(--text-3); font-size: 13px; padding: 8px; }
</style>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">🕐 浏览记录</h2>
      <button v-if="history.length" class="btn btn-danger btn-sm" @click="showClear = true">清空全部</button>
    </div>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!history.length" class="empty-state">暂无浏览记录</div>
    <div v-else>
      <div v-for="h in history" :key="h.id" class="history-item" @click="goDetail(h)">
        <div class="history-info">
          <div class="history-name">{{ h.item?.name || '未知' }}</div>
          <div class="history-time">{{ formatTime(h.viewedAt) }}</div>
        </div>
        <span class="tag" :class="h.refType === 'dish' ? 'tag-gray' : 'tag-primary'">{{ h.refType === 'dish' ? '菜品' : '食材' }}</span>
        <button class="btn btn-sm btn-danger" @click.stop="remove(h.id)">✕</button>
      </div>
    </div>
    <ConfirmDialog :visible="showClear" title="清空浏览记录" message="确定要清空所有浏览记录吗？" @confirm="clearAll" @cancel="showClear = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { browsingHistoryModel, dishModel, ingredientModel } from '../db/models'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const router = useRouter()
const loading = ref(true)
const history = ref([])
const showClear = ref(false)

function formatTime(ts) {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

async function loadData() {
  loading.value = true
  try {
    const records = await browsingHistoryModel.getRecent(50)
    const items = await Promise.all(records.map(h => {
      if (h.refType === 'dish') return dishModel.getById(h.refId).then(d => ({ ...h, item: d }))
      else return ingredientModel.getById(h.refId).then(i => ({ ...h, item: i }))
    }))
    history.value = items
  } finally {
    loading.value = false
  }
}

function goDetail(h) {
  if (h.refType === 'dish') router.push(`/dishes/${h.refId}`)
  else router.push(`/ingredients/${h.refId}`)
}

async function remove(id) {
  await browsingHistoryModel.remove(id)
  await loadData()
}

async function clearAll() {
  await browsingHistoryModel.clear()
  showClear.value = false
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.history-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.history-item:hover { background: var(--primary-light); }
.history-info { flex: 1; }
.history-name { font-size: 14px; font-weight: 500; }
.history-time { font-size: 12px; color: var(--text-3); }
</style>

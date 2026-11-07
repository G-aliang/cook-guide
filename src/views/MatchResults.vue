<template>
  <div>
    <div v-if="loading" class="empty-state">匹配中...</div>

    <div v-else-if="!dishes.length">
      <h2 class="page-title">匹配结果</h2>
      <div class="empty-state">未找到可做的菜，试试减少食材数量</div>
      <button class="btn btn-outline" @click="$router.push('/match')">重新选菜</button>
    </div>

    <div v-else>
      <div class="results-header">
        <h2 class="page-title">匹配结果</h2>
        <span class="result-count">共 {{ dishes.length }} 道菜</span>
      </div>

      <!-- 已选食材标签 -->
      <div class="selected-tags-bar">
        <span v-for="(ing, i) in selectedIngredients" :key="i" class="tag tag-primary" @click="removeIngredient(i)">
          {{ ing.emoji || '📦' }} {{ ing.name }} ✕
        </span>
        <span class="reselect-btn" @click="$router.push('/match')">重新选菜</span>
      </div>

      <!-- 匹配度统计 -->
      <div class="match-stats">
        <span v-for="stat in matchStats" :key="stat.label" class="stat-item">
          <span class="stat-value" :style="{ color: stat.color }">{{ stat.count }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </span>
      </div>

      <!-- 菜品卡片 -->
      <div class="card-grid" v-if="!isMobile">
        <div v-for="dish in dishes" :key="dish.id" class="card dish-card" @click="goDetail(dish.id)">
          <div class="dish-header">
            <span class="tag tag-primary">{{ dish.category }}</span>
            <span class="tag" :class="diffClass(dish.difficulty)">{{ dish.difficulty }}</span>
          </div>
          <div class="dish-name">{{ dish.name }}</div>
          <div class="dish-desc">{{ dish.duration || '' }}</div>
          <div class="match-badge" :class="matchClass(dish.matchInfo)">
            {{ matchText(dish.matchInfo) }}
          </div>
          <div class="match-detail" v-if="dish.matchInfo">
            <span v-if="usedNames(dish.matchInfo).length">已用：{{ usedNames(dish.matchInfo).join('、') }}</span>
            <span v-if="unusedNames(dish.matchInfo).length" class="miss">未用：{{ unusedNames(dish.matchInfo).join('、') }}</span>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-for="dish in dishes" :key="dish.id" class="dish-list-item" @click="goDetail(dish.id)">
          <div class="list-info">
            <div class="list-name">{{ dish.name }}</div>
            <div class="list-desc">{{ dish.duration || '' }} · {{ dish.difficulty }}</div>
            <div class="match-detail" v-if="dish.matchInfo">
              <span v-if="usedNames(dish.matchInfo).length">已用：{{ usedNames(dish.matchInfo).join('、') }}</span>
              <span v-if="unusedNames(dish.matchInfo).length" class="miss">未用：{{ unusedNames(dish.matchInfo).join('、') }}</span>
            </div>
          </div>
          <span class="tag" :class="matchClass(dish.matchInfo)">{{ matchText(dish.matchInfo) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dishModel } from '../db/models'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const dishes = ref([])
const selectedIngredients = ref([])
const isMobile = ref(window.innerWidth < 768)

const matchStats = computed(() => {
  const total = selectedIngredients.value.length
  const perfect = dishes.value.filter(d => d.matchInfo?.matchedCount === total).length
  const partial = dishes.value.filter(d => d.matchInfo?.matchedCount < total).length
  return [
    { label: '完美匹配', count: perfect, color: 'var(--secondary)' },
    { label: '部分匹配', count: partial, color: 'var(--primary)' },
  ]
})

function diffClass(d) {
  if (d === '入门') return 'tag-secondary'
  if (d === '进阶') return 'tag-warning'
  if (d === '挑战') return 'tag-danger'
  return 'tag-gray'
}

function matchClass(info) {
  if (!info) return ''
  const ratio = info.matchedCount / info.totalSelected
  if (ratio === 1) return 'tag-secondary'
  if (ratio >= 0.5) return 'tag-warning'
  return 'tag-gray'
}

function matchText(info) {
  if (!info) return ''
  if (info.matchedCount === info.totalSelected) return `✅ 完美匹配 (${info.matchedCount}/${info.totalSelected})`
  return `用了 ${info.matchedCount}/${info.totalSelected} 个食材`
}

function removeIngredient(idx) {
  selectedIngredients.value.splice(idx, 1)
  loadMatch()
}

// 已选食材中，这道菜确实用到的
function usedNames(info) {
  const ids = info?.matchedIngredientIds || []
  return selectedIngredients.value.filter(s => ids.includes(s.id)).map(s => s.name)
}

// 已选食材中，这道菜没用到的
function unusedNames(info) {
  const ids = info?.matchedIngredientIds || []
  return selectedIngredients.value.filter(s => !ids.includes(s.id)).map(s => s.name)
}

function goDetail(id) {
  router.push(`/dishes/${id}`)
}

async function loadMatch() {
  loading.value = true
  try {
    const ids = selectedIngredients.value.map(s => s.id).filter(id => id)
    dishes.value = await dishModel.matchByIngredients(ids)
  } catch (e) {
    console.error('Match error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const dataStr = route.query.data
  if (dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr))
    selectedIngredients.value = data.names.map((name, i) => ({
      name,
      emoji: '📦',
      id: data.ids[i] || null,
    }))
    loadMatch()
  } else {
    router.push('/match')
  }
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})
</script>

<style scoped>
.results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.result-count { font-size: 13px; color: var(--text-2); }
.selected-tags-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 12px; }
.selected-tags-bar .tag { cursor: pointer; font-size: 13px; }
.reselect-btn { font-size: 13px; color: var(--primary); cursor: pointer; margin-left: auto; }
.match-stats { display: flex; gap: 20px; margin-bottom: 16px; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid var(--border); }
.stat-item { text-align: center; }
.stat-value { font-size: 20px; font-weight: 700; display: block; }
.stat-label { font-size: 12px; color: var(--text-2); }
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.dish-card { cursor: pointer; }
.dish-header { display: flex; gap: 4px; margin-bottom: 8px; }
.dish-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.dish-desc { font-size: 12px; color: var(--text-2); margin-bottom: 8px; }
.match-badge { font-size: 12px; padding: 2px 8px; border-radius: 4px; display: inline-block; }
.match-detail { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--text-2); margin-top: 6px; }
.match-detail .miss { color: var(--text-3); }
.dish-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.list-info { flex: 1; }
.list-name { font-size: 14px; font-weight: 500; }
.list-desc { font-size: 12px; color: var(--text-2); }
</style>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">食材库</h2>
      <button class="btn btn-primary btn-sm" @click="showForm = true">+ 新增食材</button>
    </div>

    <!-- 分类标签 -->
    <div class="cat-tabs">
      <span class="cat-tab" :class="{ active: !filter.category }" @click="setCategory('')">全部</span>
      <span v-for="cat in categories" :key="cat" class="cat-tab" :class="{ active: filter.category === cat }" @click="setCategory(cat)">{{ cat }}</span>
    </div>

    <!-- 搜索 -->
    <input v-model="searchKeyword" class="input" style="margin-bottom:16px" placeholder="搜索食材名称..." @input="onSearch" />

    <!-- 加载状态 -->
    <div v-if="loading" class="empty-state">加载中...</div>

    <!-- 空状态 -->
    <div v-else-if="filtered.length === 0" class="empty-state">
      {{ searchKeyword || filter.category ? '未找到相关食材' : '暂无食材，点击"新增食材"添加' }}
    </div>

    <!-- 卡片网格 -->
    <div v-else>
      <!-- 桌面端：分页 -->
      <div class="card-grid" v-if="!isMobile">
        <div v-for="ing in pagedItems" :key="ing.id" class="card ingredient-card" @click="goDetail(ing.id)">
          <div class="card-emoji">{{ ing.emoji || getEmoji(ing.category) }}</div>
          <div class="card-name">{{ ing.name }}</div>
          <div class="card-tags">
            <span class="tag tag-primary">{{ ing.category }}</span>
          </div>
          <div class="card-desc">{{ ing.intro?.substring(0, 40) || '暂无介绍' }}...</div>
        </div>
      </div>

      <!-- 移动端：列表 + 加载更多 -->
      <div v-else>
        <div v-for="ing in pagedItems" :key="ing.id" class="ingredient-list-item" @click="goDetail(ing.id)">
          <div class="list-emoji">{{ ing.emoji || getEmoji(ing.category) }}</div>
          <div class="list-info">
            <div class="list-name">{{ ing.name }}</div>
            <div class="list-desc">{{ ing.intro?.substring(0, 30) || '暂无介绍' }}...</div>
          </div>
          <span class="tag tag-primary">{{ ing.category }}</span>
        </div>
        <div v-if="hasMore" class="load-more">
          <button class="btn btn-outline btn-sm" @click="nextPage">加载更多</button>
        </div>
        <div v-else class="load-more">
          <span class="text-muted">没有更多了</span>
        </div>
      </div>

      <!-- 桌面端分页 -->
      <div class="pagination" v-if="!isMobile && filtered.length > pageSize">
        <button @click="prevPage" :disabled="page === 1">上一页</button>
        <button v-for="p in pageNumbers" :key="p" @click="goPage(p)" :class="{ active: p === page }">
          {{ p === -1 ? '...' : p }}
        </button>
        <button @click="nextPage" :disabled="!hasMore">下一页</button>
      </div>
    </div>

    <!-- 新增/编辑表单 -->
    <IngredientForm v-if="showForm" :editing="editingIngredient" @save="onSave" @cancel="showForm = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useIngredientStore } from '../stores/ingredient'
import { CATEGORIES } from '../db/database'
import IngredientForm from '../components/IngredientForm.vue'

const router = useRouter()
const store = useIngredientStore()

const categories = CATEGORIES.ingredient
const showForm = ref(false)
const editingIngredient = ref(null)
const searchKeyword = ref('')
const isMobile = ref(window.innerWidth < 768)

const filter = computed(() => store.filter)
const loading = computed(() => store.loading)
const filtered = computed(() => store.filtered)
const pagedItems = computed(() => store.paged.items)
const hasMore = computed(() => store.paged.hasMore)
const page = computed(() => store.page)
const pageSize = computed(() => store.pageSize)

const pageNumbers = computed(() => {
  const total = Math.ceil(filtered.value.length / pageSize.value)
  const pages = []
  const max = 5
  let start = Math.max(1, page.value - Math.floor(max / 2))
  let end = Math.min(total, start + max - 1)
  if (end - start < max - 1) start = Math.max(1, end - max + 1)
  if (start > 1) { pages.push(1); if (start > 2) pages.push(-1) }
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total) { if (end < total - 1) pages.push(-1); pages.push(total) }
  return pages
})

function getEmoji(category) {
  const map = { '蔬菜': '🥬', '肉禽': '🍖', '海鲜水产': '🐟', '蛋奶': '🥚', '豆类': '🫘', '冻品': '🧊', '主食': '🍚', '调味项': '🧂', '干货': '🍄' }
  return map[category] || '📦'
}

function setCategory(cat) {
  store.setFilter({ category: cat })
}

function onSearch() {
  store.setFilter({ keyword: searchKeyword.value })
}

function goPage(p) {
  if (p !== -1) store.page = p
}

function prevPage() { store.prevPage() }
function nextPage() { store.nextPage() }

function goDetail(id) {
  router.push(`/ingredients/${id}`)
}

function onSave() {
  showForm.value = false
}

watch(() => store.page, () => {})

onMounted(() => {
  store.loadAll()
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.ingredient-card { cursor: pointer; text-align: center; }
.card-emoji { font-size: 32px; margin-bottom: 8px; }
.card-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.card-desc { font-size: 12px; color: var(--text-2); margin-top: 6px; }
.ingredient-list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer;
}
.list-emoji { font-size: 28px; }
.list-info { flex: 1; }
.list-name { font-size: 14px; font-weight: 500; }
.list-desc { font-size: 12px; color: var(--text-2); }
.load-more { text-align: center; padding: 16px 0; }
.text-muted { color: var(--text-3); font-size: 13px; }
</style>

<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">菜品库</h2>
      <button class="btn btn-primary btn-sm" @click="showForm = true">+ 新增菜品</button>
    </div>

    <!-- 分类标签 -->
    <div class="cat-tabs">
      <span class="cat-tab" :class="{ active: !filter.category }" @click="setCategory('')">全部</span>
      <span v-for="cat in categories" :key="cat" class="cat-tab" :class="{ active: filter.category === cat }" @click="setCategory(cat)">{{ cat }}</span>
    </div>

    <!-- 难度标签 -->
    <div class="cat-tabs">
      <span v-for="d in difficulties" :key="d" class="cat-tab" :class="{ active: filter.difficulty === d }" @click="setDifficulty(d)">{{ d }}</span>
    </div>

    <!-- 多维度标签筛选 -->
    <div class="tag-filters" v-if="filter.tags && (filter.tags.cooking?.length || filter.tags.cuisine?.length || filter.tags.meal?.length)">
      <div v-if="filter.tags.cooking?.length" class="filter-group">
        <span class="filter-label">烹饪：</span>
        <span v-for="t in filter.tags.cooking" :key="t" class="tag tag-primary">{{ t }} ✕</span>
      </div>
      <div v-if="filter.tags.cuisine?.length" class="filter-group">
        <span class="filter-label">菜系：</span>
        <span v-for="t in filter.tags.cuisine" :key="t" class="tag tag-primary">{{ t }} ✕</span>
      </div>
      <div v-if="filter.tags.meal?.length" class="filter-group">
        <span class="filter-label">时段：</span>
        <span v-for="t in filter.tags.meal" :key="t" class="tag tag-primary">{{ t }} ✕</span>
      </div>
      <button class="btn btn-sm" @click="clearTags">清除筛选</button>
    </div>

    <!-- 搜索 -->
    <input v-model="searchKeyword" class="input" style="margin-bottom:16px" placeholder="搜索菜品名称..." @input="onSearch" />

    <!-- 加载状态 -->
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="filtered.length === 0" class="empty-state">未找到符合条件的菜品</div>

    <!-- 卡片网格 -->
    <div v-else>
      <div class="card-grid" v-if="!isMobile">
        <div v-for="dish in pagedItems" :key="dish.id" class="card dish-card" @click="goDetail(dish.id)">
          <div class="dish-header">
            <span class="tag tag-primary">{{ dish.category }}</span>
            <span class="tag" :class="difficultyClass(dish.difficulty)">{{ dish.difficulty }}</span>
            <span v-if="dish.nutrition?.calories" class="tag tag-gray">{{ dish.nutrition.calories }}kcal</span>
          </div>
          <div class="dish-name">{{ dish.name }}</div>
          <div class="dish-desc">{{ dish.intro?.substring(0, 40) || '暂无简介' }}...</div>
          <div class="dish-tags" v-if="dish.tags">
            <span v-if="dish.tags.cooking?.length" class="tag tag-gray">{{ dish.tags.cooking.join(',') }}</span>
            <span v-if="dish.tags.cuisine?.length" class="tag tag-gray">{{ dish.tags.cuisine.join(',') }}</span>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-for="dish in pagedItems" :key="dish.id" class="dish-list-item" @click="goDetail(dish.id)">
          <div class="list-info">
            <div class="list-name">{{ dish.name }}</div>
            <div class="list-desc">{{ dish.duration || '' }} · {{ dish.difficulty }}</div>
          </div>
          <div class="list-tags">
            <span class="tag" :class="difficultyClass(dish.difficulty)">{{ dish.difficulty }}</span>
            <span v-if="dish.nutrition?.calories" class="tag tag-gray">{{ dish.nutrition.calories }}kcal</span>
          </div>
        </div>
        <div v-if="hasMore" class="load-more"><button class="btn btn-outline btn-sm" @click="nextPage">加载更多</button></div>
        <div v-else class="load-more"><span class="text-muted">没有更多了</span></div>
      </div>

      <div class="pagination" v-if="!isMobile && filtered.length > pageSize">
        <button @click="prevPage" :disabled="page === 1">上一页</button>
        <button v-for="p in pageNumbers" :key="p" @click="goPage(p)" :class="{ active: p === page }">{{ p === -1 ? '...' : p }}</button>
        <button @click="nextPage" :disabled="!hasMore">下一页</button>
      </div>
    </div>

    <DishForm v-if="showForm" :editing="editingDish" @save="onSave" @cancel="showForm = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDishStore } from '../stores/dish'
import { CATEGORIES } from '../db/database'
import DishForm from '../components/DishForm.vue'

const router = useRouter()
const route = useRoute()
const store = useDishStore()

const categories = CATEGORIES.dish
const difficulties = CATEGORIES.difficulty
const showForm = ref(false)
const editingDish = ref(null)
const searchKeyword = ref('')
const isMobile = ref(window.innerWidth < 768)

const filter = computed(() => store.filter)
const loading = computed(() => store.loading)
const filtered = computed(() => store.filtered || [])
const pagedItems = computed(() => (store.paged?.items) || [])
const hasMore = computed(() => store.paged?.hasMore || false)
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

function difficultyClass(d) {
  if (d === '入门') return 'tag-secondary'
  if (d === '进阶') return 'tag-warning'
  if (d === '挑战') return 'tag-danger'
  return 'tag-gray'
}

function setCategory(cat) { store.setFilter({ category: cat }) }
function setDifficulty(d) { store.setFilter({ difficulty: store.filter.difficulty === d ? '' : d }) }
function clearTags() { store.setFilter({ tags: {} }) }
function onSearch() { store.setKeyword(searchKeyword.value) }
function goPage(p) { if (p !== -1) store.page = p }
function prevPage() { store.prevPage() }
function nextPage() { store.nextPage() }
function goDetail(id) { router.push(`/dishes/${id}`) }
function onSave() { showForm.value = false }

watch(() => route.query.search, (val) => {
  if (val) { searchKeyword.value = val; store.setKeyword(val) }
}, { immediate: true })

onMounted(() => {
  store.loadAll()
  if (route.query.search) { searchKeyword.value = route.query.search; store.setKeyword(route.query.search) }
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.dish-card { cursor: pointer; }
.dish-header { display: flex; gap: 4px; margin-bottom: 8px; }
.dish-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.dish-desc { font-size: 12px; color: var(--text-2); margin-bottom: 8px; }
.dish-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.dish-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.list-info { flex: 1; }
.list-name { font-size: 14px; font-weight: 500; }
.list-desc { font-size: 12px; color: var(--text-2); }
.list-tags { display: flex; gap: 4px; }
.load-more { text-align: center; padding: 16px 0; }
.text-muted { color: var(--text-3); font-size: 13px; }
.tag-filters { margin-bottom: 12px; padding: 12px; background: #fff; border-radius: 8px; border: 1px solid var(--border); }
.filter-group { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
.filter-label { font-size: 13px; color: var(--text-2); }
</style>

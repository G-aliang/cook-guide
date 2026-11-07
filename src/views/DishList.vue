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

    <!-- 多维度筛选面板 -->
    <div class="filter-panel">
      <div class="filter-head" @click="showFilter = !showFilter">
        <span class="filter-title">筛选<em v-if="activeCount"> · 已选 {{ activeCount }}</em></span>
        <span class="filter-toggle">{{ showFilter ? '收起 ▲' : '展开 ▼' }}</span>
      </div>
      <div v-show="showFilter" class="filter-body">
        <div class="filter-row" v-for="dim in dims" :key="dim.key">
          <span class="filter-label">{{ dim.label }}</span>
          <div class="chips">
            <span
              v-for="opt in dim.options"
              :key="opt.value"
              class="chip"
              :class="{ active: isActive(dim.key, opt.value) }"
              @click="store.toggleTag(dim.key, opt.value)"
            >{{ opt.value }}<em class="chip-count">{{ opt.count }}</em></span>
          </div>
        </div>
        <div class="filter-actions" v-if="activeCount">
          <button class="btn btn-sm" @click="clearTags">清除筛选</button>
        </div>
      </div>
    </div>

    <!-- 已选条件 -->
    <div class="tag-filters" v-if="activeCount">
      <div class="filter-group" v-for="dim in dims" :key="dim.key" v-show="activeTags(dim.key).length">
        <span class="filter-label">{{ dim.label }}：</span>
        <span v-for="t in activeTags(dim.key)" :key="t" class="tag tag-primary" style="cursor:pointer" @click="store.toggleTag(dim.key, t)">{{ t }} ✕</span>
      </div>
      <button class="btn btn-sm" @click="clearTags">清除全部</button>
    </div>

    <!-- 搜索 -->
    <input v-model="searchKeyword" class="input" style="margin-bottom:16px" placeholder="搜索菜品名称或食材名，如「番茄」「豆腐」" @input="onSearch" />
    <div v-if="searchKeyword.trim() && filtered.length" class="search-hint">
      按名称和食材一起找，共 {{ filtered.length }} 道菜
    </div>

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
          <div v-if="matchedIngredient(dish)" class="dish-match-ing">🧺 含 {{ matchedIngredient(dish) }}</div>
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
            <span v-if="matchedIngredient(dish)" class="tag tag-primary">🧺 {{ matchedIngredient(dish) }}</span>
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
const tagDims = CATEGORIES.tagDims
const showForm = ref(false)
const editingDish = ref(null)
const searchKeyword = ref('')
const showFilter = ref(true)
const isMobile = ref(window.innerWidth < 768)

// 各维度的可选项：只列出当前菜品里实际用到的取值，并按数量排序
const dims = computed(() => {
  const dishes = store.dishes || []
  return tagDims.map(dim => {
    const counter = {}
    for (const d of dishes) {
      for (const v of (d.tags?.[dim.key] || [])) {
        if (v) counter[v] = (counter[v] || 0) + 1
      }
    }
    const options = Object.entries(counter)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
    return { ...dim, options }
  }).filter(dim => dim.options.length)
})

const activeCount = computed(() => {
  const tags = store.filter.tags || {}
  return Object.values(tags).reduce((n, arr) => n + (arr?.length || 0), 0)
})

function activeTags(dim) { return (store.filter.tags || {})[dim] || [] }
function isActive(dim, value) { return activeTags(dim).includes(value) }

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
// 菜名没命中、但食材命中时，标出命中的那个食材
function matchedIngredient(dish) {
  const kw = (store.keyword || '').trim().toLowerCase()
  if (!kw) return ''
  if (dish.name?.toLowerCase().includes(kw)) return ''
  const hit = (dish.ingredients || []).find(
    ing =>
      String(ing.name || '').toLowerCase().includes(kw) ||
      (ing.alternatives || []).some(a => String(a || '').toLowerCase().includes(kw))
  )
  if (!hit) return ''
  if (String(hit.name || '').toLowerCase().includes(kw)) return hit.name
  const alt = (hit.alternatives || []).find(a => String(a).toLowerCase().includes(kw))
  return alt || hit.name
}
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
.dish-match-ing { font-size: 12px; color: var(--primary); margin-bottom: 6px; }
.search-hint { font-size: 12px; color: var(--text-2); margin: -10px 0 12px; }
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
.filter-label { font-size: 13px; color: var(--text-2); flex: 0 0 auto; }

/* 筛选面板 */
.filter-panel { margin-bottom: 12px; background: #fff; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.filter-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; cursor: pointer; }
.filter-title { font-size: 14px; font-weight: 500; }
.filter-title em { font-style: normal; font-size: 12px; color: var(--primary); }
.filter-toggle { font-size: 12px; color: var(--text-3); }
.filter-body { padding: 0 12px 12px; border-top: 1px solid var(--border); }
.filter-row { display: flex; align-items: flex-start; gap: 8px; padding: 8px 0; border-bottom: 1px dashed var(--border); }
.filter-row:last-of-type { border-bottom: none; }
.filter-row .filter-label { padding-top: 3px; width: 32px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
.chip { padding: 3px 10px; border: 1px solid var(--border); border-radius: 14px; background: #fff; font-size: 13px; color: var(--text-2); cursor: pointer; user-select: none; }
.chip.active { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.chip-count { font-style: normal; font-size: 11px; color: var(--text-3); margin-left: 3px; }
.chip.active .chip-count { color: var(--primary); }
.filter-actions { padding-top: 10px; }
</style>

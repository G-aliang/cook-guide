<template>
  <div>
    <h2 class="page-title">⭐ 收藏</h2>
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!favorites.length" class="empty-state">暂无收藏，去菜品库收藏你喜欢的菜吧</div>
    <div v-else>
      <div class="card-grid" v-if="!isMobile">
        <div v-for="fav in favorites" :key="fav.id" class="card dish-card" @click="goDetail(fav.dishId)">
          <div class="dish-header">
            <span class="tag tag-primary">{{ fav.dish?.category || '菜品' }}</span>
            <span v-if="fav.dish?.difficulty" class="tag tag-gray">{{ fav.dish.difficulty }}</span>
          </div>
          <div class="dish-name">{{ fav.dish?.name || '未知菜品' }}</div>
          <div class="dish-desc">{{ fav.dish?.duration || '' }}</div>
        </div>
      </div>
      <div v-else>
        <div v-for="fav in favorites" :key="fav.id" class="dish-list-item" @click="goDetail(fav.dishId)">
          <div class="list-info">
            <div class="list-name">{{ fav.dish?.name || '未知菜品' }}</div>
            <div class="list-desc">{{ fav.dish?.duration || '' }} · {{ fav.dish?.difficulty || '' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { favoriteModel, dishModel } from '../db/models'

const router = useRouter()
const loading = ref(true)
const favorites = ref([])
const isMobile = ref(window.innerWidth < 768)

async function loadData() {
  loading.value = true
  try {
    const favs = await favoriteModel.getAll()
    const dishIds = favs.map(f => f.dishId)
    const dishes = await Promise.all(dishIds.map(id => dishModel.getById(id)))
    favorites.value = favs.map((f, i) => ({ ...f, dish: dishes[i] }))
  } finally {
    loading.value = false
  }
}

function goDetail(id) { router.push(`/dishes/${id}`) }

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
})
</script>

<style scoped>
.dish-card { cursor: pointer; }
.dish-header { display: flex; gap: 4px; margin-bottom: 8px; }
.dish-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.dish-desc { font-size: 12px; color: var(--text-2); }
.dish-list-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.list-info { flex: 1; }
.list-name { font-size: 14px; font-weight: 500; }
.list-desc { font-size: 12px; color: var(--text-2); }
</style>

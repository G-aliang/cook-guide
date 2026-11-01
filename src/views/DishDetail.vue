<template>
  <div>
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/dishes">菜品库</router-link>
      <span> / </span>
      <router-link to="/dishes">{{ current?.category || '分类' }}</router-link>
      <span> / </span>
      <span>{{ current?.name }}</span>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!current" class="empty-state">未找到该菜品</div>

    <div v-else>
      <!-- 基本信息 -->
      <div class="module-card dish-header-card">
        <div class="dish-title-row">
          <h2 class="dish-title">{{ current.name }}</h2>
          <div class="dish-action-btns">
            <button class="btn btn-sm" :class="isFav ? 'btn-secondary' : 'btn-outline'" @click="toggleFav">⭐ {{ isFav ? '已收藏' : '收藏' }}</button>
            <button class="btn btn-sm" :class="progress === 'done' ? 'btn-secondary' : 'btn-outline'" @click="setProgress('done')">✅ 已做过</button>
            <button class="btn btn-sm" :class="progress === 'want' ? 'btn-primary' : 'btn-outline'" @click="setProgress('want')">⭐ 想做</button>
          </div>
        </div>
        <div class="dish-meta">
          <span class="tag tag-primary">{{ current.category }}</span>
          <span class="tag" :class="diffClass(current.difficulty)">{{ current.difficulty }}</span>
          <span v-if="current.duration" class="tag tag-gray">{{ current.duration }}</span>
          <span v-if="current.nutrition?.calories" class="tag tag-gray">约{{ current.nutrition.calories }}kcal/份</span>
        </div>
        <div class="dish-intro" v-if="current.intro">{{ current.intro }}</div>
        <div v-if="current.videoUrl" class="video-link">
          <a :href="current.videoUrl" target="_blank" class="video-btn">▶ 观看视频</a>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="module-card" v-if="current.tags">
        <div class="module-title">分类标签</div>
        <div class="tag-display">
          <template v-if="current.tags.cooking?.length">
            <span class="tag-label">烹饪：</span>
            <span v-for="t in current.tags.cooking" :key="t" class="tag tag-gray">{{ t }}</span>
          </template>
          <template v-if="current.tags.diet?.length">
            <span class="tag-label">荤素：</span>
            <span v-for="t in current.tags.diet" :key="t" class="tag tag-gray">{{ t }}</span>
          </template>
          <template v-if="current.tags.cuisine?.length">
            <span class="tag-label">菜系：</span>
            <span v-for="t in current.tags.cuisine" :key="t" class="tag tag-gray">{{ t }}</span>
          </template>
          <template v-if="current.tags.meal?.length">
            <span class="tag-label">时段：</span>
            <span v-for="t in current.tags.meal" :key="t" class="tag tag-gray">{{ t }}</span>
          </template>
          <template v-if="current.tags.custom?.length">
            <span class="tag-label">自定义：</span>
            <span v-for="t in current.tags.custom" :key="t" class="tag tag-gray">{{ t }}</span>
          </template>
        </div>
      </div>

      <!-- 食材清单 -->
      <div class="module-card">
        <div class="module-title">📋 食材清单</div>
        <div class="ingredient-list">
          <div v-for="(ing, i) in current.ingredients" :key="i" class="ingredient-row" @click="goIngredient(ing.ingredientId)">
            <span class="ing-name">{{ ing.name }}</span>
            <span class="ing-amount">{{ ing.amount }}</span>
          </div>
        </div>
      </div>

      <!-- 制作步骤 -->
      <div class="module-card">
        <div class="module-title">👩‍🍳 制作步骤</div>
        <div class="step-list">
          <div v-for="(step, i) in current.steps" :key="i" class="step-item">
            <div class="step-header">
              <span class="step-num">{{ i + 1 }}</span>
              <div class="step-meta">
                <span v-if="step.heat" class="step-badge step-heat">{{ step.heat }}</span>
                <span v-if="step.time" class="step-badge step-time">⏱ {{ step.time }}</span>
              </div>
              <a v-if="step.videoUrl" :href="step.videoUrl" target="_blank" class="step-video">▶ 视频</a>
            </div>
            <div class="step-desc">{{ step.desc }}</div>
            <div v-if="step.amount" class="step-amount">📦 {{ step.amount }}</div>
            <div v-if="step.note" class="step-note">💡 {{ step.note }}</div>
          </div>
        </div>
      </div>

      <!-- 避坑指南 -->
      <div class="module-card" v-if="current.pitfalls && current.pitfalls.length">
        <div class="module-title">⚠️ 新手避坑指南</div>
        <div class="pitfall-list">
          <div v-for="(p, i) in current.pitfalls" :key="i" class="pitfall-item">
            <div class="pitfall-mistake">❌ {{ p.mistake }}</div>
            <div class="pitfall-solution">✅ {{ p.solution }}</div>
          </div>
        </div>
      </div>

      <!-- 营养信息 -->
      <div class="module-card" v-if="current.nutrition">
        <div class="module-title">📊 营养信息</div>
        <table class="nutrition-table">
          <tr><td>单位</td><td>{{ current.nutrition.perUnit }}</td></tr>
          <tr v-if="current.nutrition.calories"><td>热量</td><td>{{ current.nutrition.calories }} kcal</td></tr>
          <tr v-if="current.nutrition.fat"><td>脂肪</td><td>{{ current.nutrition.fat }}g</td></tr>
          <tr v-if="current.nutrition.protein"><td>蛋白质</td><td>{{ current.nutrition.protein }}g</td></tr>
          <tr v-if="current.nutrition.carbs"><td>碳水</td><td>{{ current.nutrition.carbs }}g</td></tr>
        </table>
        <div v-if="current.nutrition.healthNotes" class="health-note">✅ {{ current.nutrition.healthNotes }}</div>
      </div>

      <!-- 个人备注 -->
      <div class="module-card">
        <div class="module-title">💬 个人备注</div>
        <NoteInput />
        <div class="note-list-container">
          <NoteList :notes="notes" />
        </div>
      </div>

      <!-- 相关食材 -->
      <div class="module-card" v-if="relatedIngredients.length">
        <div class="module-title">🔗 相关食材</div>
        <div class="related-ingredients">
          <router-link v-for="ing in relatedIngredients" :key="ing.id" :to="`/ingredients/${ing.id}`" class="related-ing-item">
            {{ ing.emoji || '📦' }} {{ ing.name }}
          </router-link>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions">
        <button class="btn btn-outline btn-sm" @click="showForm = true">编辑</button>
        <button class="btn btn-danger btn-sm" @click="showDelete = true">删除</button>
      </div>
    </div>

    <DishForm v-if="showForm" :editing="current" @save="onSave" @cancel="showForm = false" />
    <ConfirmDialog :visible="showDelete" title="删除菜品" :message="`确定要删除 ${current?.name} 吗？关联的食材、备注、收藏、浏览记录将一并删除。`" @confirm="onDelete" @cancel="showDelete = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDishStore } from '../stores/dish'
import { useNoteStore } from '../stores/note'
import { useProgressStore } from '../stores/progress'
import { browsingHistoryModel, progressModel, favoriteModel } from '../db/models'
import DishForm from '../components/DishForm.vue'
import NoteInput from '../components/NoteInput.vue'
import NoteList from '../components/NoteList.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useDishStore()
const noteStore = useNoteStore()
const progressStore = useProgressStore()

const loading = ref(true)
const showForm = ref(false)
const showDelete = ref(false)
const notes = ref([])
const current = ref(null)
const relatedIngredients = ref([])
const isFav = ref(false)
const progress = ref('')

async function loadData() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    await store.loadById(id)
    current.value = store.currentDish
    relatedIngredients.value = store.relatedIngredients

    await noteStore.loadByRef('dish', id)
    notes.value = noteStore.notes

    await browsingHistoryModel.record('dish', id)

    const fav = await favoriteModel.isFavorited(id)
    isFav.value = !!fav

    const prog = await progressModel.getByDishId(id)
    progress.value = prog?.status || ''
  } catch (e) {
    console.error('Load error:', e)
  } finally {
    loading.value = false
  }
}

function diffClass(d) {
  if (d === '入门') return 'tag-secondary'
  if (d === '进阶') return 'tag-warning'
  if (d === '挑战') return 'tag-danger'
  return 'tag-gray'
}

async function toggleFav() {
  isFav.value = await progressStore.toggleFavorite(Number(route.params.id))
}

async function setProgress(status) {
  if (progress.value === status) {
    progress.value = ''
    await progressModel.remove(Number(route.params.id))
  } else {
    progress.value = status
    await progressModel.setStatus(Number(route.params.id), status)
  }
}

function goIngredient(id) {
  if (id) router.push(`/ingredients/${id}`)
}

async function onSave(data) {
  await store.save(data)
  showForm.value = false
  await loadData()
}

async function onDelete() {
  await store.remove(Number(route.params.id))
  showDelete.value = false
  router.push('/dishes')
}

watch(() => route.params.id, loadData)
onMounted(loadData)
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-2); margin-bottom: 16px; }
.breadcrumb a { color: var(--primary); }
.module-card { padding: 16px; margin-bottom: 16px; }
.module-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.dish-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.dish-title { font-size: 22px; font-weight: 700; }
.dish-action-btns { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.dish-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.dish-intro { font-size: 14px; color: var(--text-2); margin-top: 8px; }
.video-link { margin-top: 12px; }
.video-btn { display: inline-block; padding: 8px 16px; background: var(--primary-light); color: var(--primary); border-radius: 8px; font-size: 14px; text-decoration: none; }
.tag-display { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.tag-label { font-size: 13px; color: var(--text-2); }
.ingredient-list { }
.ingredient-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.ingredient-row:hover { background: var(--primary-light); }
.ing-name { font-size: 14px; }
.ing-amount { font-size: 14px; color: var(--text-2); }
.step-list { }
.step-item { margin-bottom: 16px; }
.step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.step-meta { display: flex; gap: 4px; flex: 1; }
.step-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
.step-heat { background: var(--danger-light); color: var(--danger); }
.step-time { background: var(--bg); color: var(--text-2); }
.step-video { font-size: 12px; color: var(--primary); text-decoration: none; }
.step-desc { font-size: 14px; line-height: 1.6; }
.step-amount { font-size: 12px; color: var(--text-2); margin-top: 4px; }
.step-note { font-size: 12px; color: var(--primary); margin-top: 4px; }
.nutrition-table { width: 100%; font-size: 13px; }
.nutrition-table td { padding: 6px 0; }
.nutrition-table td:first-child { color: var(--text-2); width: 40%; }
.nutrition-table td:last-child { text-align: right; }
.health-note { margin-top: 8px; font-size: 13px; color: var(--secondary); }
.note-list-container { margin-top: 8px; }
.related-ingredients { display: flex; flex-wrap: wrap; gap: 8px; }
.related-ing-item { padding: 4px 12px; background: var(--bg); border-radius: 8px; font-size: 13px; color: var(--text); text-decoration: none; }
.related-ing-item:hover { background: var(--primary-light); text-decoration: none; }
.detail-actions { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
@media (max-width: 768px) {
  .dish-title-row { flex-direction: column; }
  .dish-action-btns { flex-direction: row; flex-wrap: wrap; }
}
</style>

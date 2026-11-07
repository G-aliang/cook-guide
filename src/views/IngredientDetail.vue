<template>
  <div>
    <!-- 面包屑 -->
    <div class="breadcrumb">
      <router-link to="/ingredients">食材库</router-link>
      <span> / </span>
      <router-link to="/ingredients">{{ current?.category || '分类' }}</router-link>
      <span> / </span>
      <span>{{ current?.emoji || '📦' }} {{ current?.name }}</span>
    </div>

    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!current" class="empty-state">未找到该食材</div>

    <div v-else>
      <!-- ⑧ 个人备注（底部固定） -->
      <div class="detail-modules">
        <!-- ① 介绍 -->
        <div class="module-card">
          <div class="module-title">① 介绍</div>
          <div class="module-content">
            <div v-if="current.emoji" class="ingredient-emoji">{{ current.emoji }}</div>
            {{ current.intro || '暂无介绍' }}
          </div>
        </div>

        <!-- ② 品种 -->
        <div class="module-card" v-if="current.varieties && current.varieties.length">
          <div class="module-title">② 品种</div>
          <table class="info-table">
            <tr v-for="(v, i) in current.varieties" :key="i">
              <td>{{ v.name }}</td>
              <td>{{ v.feature }}</td>
              <td>{{ v.usage }}</td>
            </tr>
          </table>
        </div>

        <!-- ③ 没有它可以用… -->
        <div class="module-card" v-if="current.substitutes && current.substitutes.length">
          <div class="module-title">③ 没有它可以用…</div>
          <div class="substitute-list">
            <router-link
              v-for="s in current.substitutes"
              :key="s.name"
              :to="`/ingredients/${s.id}`"
              class="substitute-item"
            >
              <span class="substitute-head">{{ s.emoji || '📦' }} {{ s.name }}</span>
              <span v-if="s.note" class="substitute-note">{{ s.note }}</span>
            </router-link>
          </div>
        </div>

        <!-- ④ 购买/挑选 -->
        <div class="module-card" v-if="current.buying">
          <div class="module-title">④ 购买/挑选</div>
          <div class="module-content">{{ current.buying }}</div>
        </div>

        <!-- ⑤ 储存 -->
        <div class="module-card" v-if="current.storage && current.storage.length">
          <div class="module-title">⑤ 储存</div>
          <table class="info-table">
            <tr v-for="(s, i) in current.storage" :key="i">
              <td>{{ s.method }}</td>
              <td>{{ s.condition }}</td>
              <td>{{ s.shelfLife }}</td>
            </tr>
          </table>
          <div v-if="current.storage.some(s => s.notes)" class="storage-notes">
            <div v-for="(s, i) in current.storage.filter(s => s.notes)" :key="i" class="storage-note">
              <strong>{{ s.method }}：</strong>{{ s.notes }}
            </div>
          </div>
        </div>

        <!-- ⑥ 处理 -->
        <div class="module-card" v-if="current.processing && current.processing.length">
          <div class="module-title">⑥ {{ current.category === '调味项' ? '使用时机与用量' : '处理' }}</div>
          <table class="info-table">
            <tr v-for="(p, i) in current.processing" :key="i">
              <td>{{ p.step }}</td>
              <td>{{ p.detail }}</td>
            </tr>
          </table>
        </div>

        <!-- ⑦ 相关菜品 -->
        <div class="module-card">
          <div class="module-title">⑦ 相关菜品</div>
          <div v-if="relatedDishes && relatedDishes.length" class="related-dishes">
            <router-link v-for="d in relatedDishes" :key="d.id" :to="`/dishes/${d.id}`" class="related-dish-item">
              <span class="tag tag-gray">{{ d.difficulty }}</span>
              {{ d.name }}
            </router-link>
          </div>
          <div v-else class="empty-note">暂无关联菜品</div>
        </div>

        <!-- ⑧ 营养成分 -->
        <div class="module-card" v-if="current.nutrition">
          <div class="module-title">⑧ 营养成分</div>
          <table class="nutrition-table">
            <tr><td>单位</td><td>{{ current.nutrition.perUnit }}</td></tr>
            <tr v-if="current.nutrition.calories"><td>热量</td><td>{{ current.nutrition.calories }} kcal</td></tr>
            <tr v-if="current.nutrition.fat"><td>脂肪</td><td>{{ current.nutrition.fat }}g</td></tr>
            <tr v-if="current.nutrition.protein"><td>蛋白质</td><td>{{ current.nutrition.protein }}g</td></tr>
            <tr v-if="current.nutrition.carbs"><td>碳水化合物</td><td>{{ current.nutrition.carbs }}g</td></tr>
            <tr v-if="current.nutrition.fiber"><td>膳食纤维</td><td>{{ current.nutrition.fiber }}g</td></tr>
            <tr v-if="current.nutrition.sodium"><td>钠</td><td>{{ current.nutrition.sodium }}mg</td></tr>
          </table>
          <div v-if="current.nutrition.healthNotes" class="health-note">✅ {{ current.nutrition.healthNotes }}</div>
        </div>

        <!-- ⑨ 个人备注 -->
        <div class="module-card">
          <div class="module-title">⑨ 个人备注</div>
          <NoteInput />
          <div class="note-list-container">
            <NoteList :notes="notes" />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions">
        <button class="btn btn-outline btn-sm" @click="showForm = true">编辑</button>
        <button class="btn btn-danger btn-sm" @click="showDelete = true">删除</button>
      </div>
    </div>

    <!-- 编辑表单 -->
    <IngredientForm v-if="showForm" :editing="current" @save="onSave" @cancel="showForm = false" />

    <!-- 删除确认 -->
    <ConfirmDialog :visible="showDelete" title="删除食材" :message="`确定要删除 ${current?.name} 吗？关联菜品不会受影响，但个人备注将一并删除。`" @confirm="onDelete" @cancel="showDelete = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIngredientStore } from '../stores/ingredient'
import { useNoteStore } from '../stores/note'
import { browsingHistoryModel } from '../db/models'
import IngredientForm from '../components/IngredientForm.vue'
import NoteInput from '../components/NoteInput.vue'
import NoteList from '../components/NoteList.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useIngredientStore()
const noteStore = useNoteStore()

const loading = ref(true)
const showForm = ref(false)
const showDelete = ref(false)
const notes = ref([])

const current = ref(null)
const relatedDishes = ref([])

async function loadData() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    await store.loadById(id)
    current.value = store.currentIngredient
    relatedDishes.value = store.relatedDishes
    // 加载备注
    await noteStore.loadByRef('ingredient', id)
    notes.value = noteStore.notes
    // 记录浏览
    browsingHistoryModel.record('ingredient', id)
  } catch (e) {
    console.error('Load error:', e)
  } finally {
    loading.value = false
  }
}

async function onSave(data) {
  await store.save(data)
  showForm.value = false
  await loadData()
}

async function onDelete() {
  await store.remove(Number(route.params.id))
  showDelete.value = false
  router.push('/ingredients')
}

watch(() => route.params.id, loadData)

onMounted(loadData)
</script>

<style scoped>
.breadcrumb { font-size: 13px; color: var(--text-2); margin-bottom: 16px; }
.breadcrumb a { color: var(--primary); }
.detail-modules { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.module-card { padding: 16px; }
.module-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.module-content { font-size: 14px; color: var(--text-2); line-height: 1.6; }
.ingredient-emoji { font-size: 40px; margin-bottom: 8px; text-align: center; }
.info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.info-table td { padding: 6px 0; border-bottom: 1px solid var(--border); }
.info-table td:first-child { color: var(--text-2); width: 30%; }
.storage-notes { margin-top: 8px; }
.storage-note { font-size: 12px; color: var(--warning, var(--primary)); margin-bottom: 4px; }
.nutrition-table { width: 100%; font-size: 13px; }
.nutrition-table td { padding: 6px 0; }
.nutrition-table td:first-child { color: var(--text-2); width: 40%; }
.nutrition-table td:last-child { text-align: right; }
.health-note { margin-top: 8px; font-size: 13px; color: var(--secondary); }
.related-dishes { display: flex; flex-wrap: wrap; gap: 8px; }
.related-dish-item { padding: 4px 12px; background: var(--bg); border-radius: 8px; font-size: 13px; color: var(--text); text-decoration: none; }
.related-dish-item:hover { background: var(--primary-light); text-decoration: none; }
.note-list-container { margin-top: 8px; }
/* ③ 没有它可以用… */
.substitute-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.substitute-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; background: var(--bg); border-radius: 8px; text-decoration: none; }
.substitute-item:hover { background: var(--primary-light); text-decoration: none; }
.substitute-head { font-size: 14px; font-weight: 500; color: var(--text); }
.substitute-note { font-size: 12px; color: var(--text-2); line-height: 1.4; }
.empty-note { color: var(--text-3); font-size: 13px; }
.detail-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }

@media (max-width: 768px) {
  .detail-modules { grid-template-columns: 1fr; }
}
</style>

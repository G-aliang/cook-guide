<template>
  <div>
    <h2 class="page-title">🔎 选菜匹配</h2>

    <!-- 自定义食材输入 -->
    <input v-model="customIngredient" class="input" style="margin-bottom:16px" placeholder="点此添加自定义食材" @keyup.enter="addCustom" />

    <!-- 已选食材区 -->
    <div class="selected-area card" v-if="selected.length">
      <div class="selected-header">
        <span class="selected-count">已选食材 ({{ selected.length }})</span>
        <button class="btn btn-sm" @click="clearAll">清空</button>
      </div>
      <div class="selected-tags">
        <span v-for="(ing, i) in selected" :key="i" class="tag tag-primary selected-tag" @click="removeSelected(i)">
          {{ ing.emoji || '📦' }} {{ ing.name }} ✕
        </span>
      </div>
      <div class="selected-hint">* 点击 ✕ 移除食材</div>
    </div>

    <!-- 匹配按钮 -->
    <button class="btn btn-primary match-btn" @click="match" :disabled="!selected.length">
      ✨ 匹配菜谱
    </button>

    <!-- 分类标签云 -->
    <div class="category-section" v-for="cat in categories" :key="cat.name">
      <div class="cat-title">{{ cat.emoji }} {{ cat.name }}</div>
      <div class="tag-cloud">
        <span
          v-for="ing in cat.items"
          :key="ing.name"
          class="tag-chip"
          :class="{ active: isSelected(ing.name) }"
          @click="toggleSelect(ing)"
        >{{ ing.emoji }} {{ ing.name }}</span>
      </div>
    </div>

    <!-- 底部匹配按钮 -->
    <button class="btn btn-primary match-btn-bottom" @click="match" :disabled="!selected.length">
      ✨ 匹配菜谱
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ingredientModel } from '../db/models'

const router = useRouter()
const customIngredient = ref('')
const selected = ref([])
const allIngredients = ref([])

const categories = ref([])

const categoryEmojis = {
  '蔬菜': '🥬', '肉禽': '🍖', '海鲜水产': '🐟', '蛋奶': '🥚',
  '豆类': '🫘', '冻品': '🧊', '主食': '🍚', '调味项': '🧂', '干货': '🍄'
}

function isSelected(name) {
  return selected.value.some(s => s.name === name)
}

function toggleSelect(ing) {
  const idx = selected.value.findIndex(s => s.name === ing.name)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(ing)
  }
}

function removeSelected(idx) {
  selected.value.splice(idx, 1)
}

function clearAll() {
  selected.value = []
}

function addCustom() {
  const name = customIngredient.value.trim()
  if (name && !isSelected(name)) {
    selected.value.push({ name, emoji: '📦' })
    customIngredient.value = ''
  }
}

async function match() {
  if (!selected.value.length) return
  const ids = selected.value.map(s => s.id).filter(id => id)
  const names = selected.value.map(s => s.name)
  const query = encodeURIComponent(JSON.stringify({ ids, names }))
  router.push(`/match-results?data=${query}`)
}

onMounted(async () => {
  allIngredients.value = await ingredientModel.getAll()
  // 按分类分组
  const grouped = {}
  for (const ing of allIngredients.value) {
    const cat = ing.category || '其他'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push({ id: ing.id, name: ing.name, emoji: ing.emoji })
  }
  categories.value = Object.entries(grouped).map(([name, items]) => ({
    name,
    emoji: categoryEmojis[name] || '📦',
    items,
  }))
})
</script>

<style scoped>
.selected-area { margin-bottom: 16px; }
.selected-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.selected-count { font-size: 14px; font-weight: 600; }
.selected-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.selected-tag { cursor: pointer; font-size: 13px; }
.selected-hint { font-size: 12px; color: var(--text-3); margin-top: 4px; }
.match-btn { width: 100%; padding: 14px; font-size: 16px; font-weight: 600; margin-bottom: 24px; }
.match-btn:disabled { background: #f0f0f0; color: var(--text-3); cursor: not-allowed; }
.match-btn-bottom { width: 100%; padding: 14px; font-size: 16px; font-weight: 600; margin-top: 24px; }
.match-btn-bottom:disabled { background: #f0f0f0; color: var(--text-3); cursor: not-allowed; }
.category-section { margin-bottom: 20px; }
.cat-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; background: #fff; border: 1px solid var(--border); color: var(--text-2); cursor: pointer; transition: all 0.2s; }
.tag-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
</style>

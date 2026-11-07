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
        <button v-if="current.steps?.length" class="btn btn-primary kitchen-enter" @click="enterKitchen">
          🍳 厨房模式 · 大字一步一屏
        </button>
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
            <span class="ing-name">
              {{ ing.name }}
              <em v-if="ing.alternatives && ing.alternatives.length" class="ing-alt">或 {{ ing.alternatives.join(' / ') }}</em>
            </span>
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
                <span v-if="step.time" class="step-badge step-time step-time-btn" @click="startTimer(step, i)" title="点击开始倒计时">⏱ {{ step.time }}</span>
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

    <!-- 厨房模式：一步一屏 + 大字 + 屏幕常亮 -->
    <div v-if="kitchenMode" class="km-overlay" @touchstart="onKmTouchStart" @touchend="onKmTouchEnd">
      <div class="km-head">
        <div class="km-head-left">
          <span class="km-dish">{{ current?.name }}</span>
          <span v-if="wakeLockActive" class="km-lock">● 屏幕常亮</span>
        </div>
        <div class="km-head-right">
          <span class="km-progress">{{ kmIndex + 1 }} / {{ kmSteps.length }}</span>
          <button class="km-close" aria-label="退出厨房模式" @click="exitKitchen">✕</button>
        </div>
      </div>

      <div class="km-body">
        <div class="km-badges">
          <span v-if="kmStep.heat" class="step-badge step-heat km-badge">{{ kmStep.heat }}</span>
          <span v-if="kmStep.time" class="step-badge step-time step-time-btn km-badge" @click="startTimer(kmStep, kmIndex)">⏱ {{ kmStep.time }} · 点击计时</span>
        </div>
        <div class="km-desc">{{ kmStep.desc }}</div>
        <div v-if="kmStep.amount" class="km-extra">📦 {{ kmStep.amount }}</div>
        <div v-if="kmStep.note" class="km-note">💡 {{ kmStep.note }}</div>
      </div>

      <div class="km-foot">
        <button class="km-nav-btn" :disabled="kmIndex === 0" @click="kmPrev">上一步</button>
        <button class="km-nav-btn km-nav-primary" @click="kmNext">
          {{ kmIndex === kmSteps.length - 1 ? '完成 ✓' : '下一步' }}
        </button>
      </div>
    </div>

    <!-- 步骤倒计时浮层 -->
    <div v-if="timer" class="timer-bar" :class="{ 'is-done': timer.done, 'in-kitchen': kitchenMode }">
      <div class="timer-body">
        <div class="timer-label">第 {{ timer.stepNo }} 步 · {{ timer.label }}</div>
        <div class="timer-clock">{{ clockText }}</div>
        <div v-if="timer.done" class="timer-tip">时间到啦，看看火候～</div>
      </div>
      <div class="timer-actions">
        <template v-if="!timer.done">
          <button class="btn btn-sm btn-outline" @click="toggleTimer">{{ timer.running ? '暂停' : '继续' }}</button>
        </template>
        <template v-else>
          <button class="btn btn-sm btn-outline" @click="restartTimer">再来一次</button>
        </template>
        <button class="btn btn-sm" @click="stopTimer">关闭</button>
      </div>
    </div>

    <DishForm v-if="showForm" :editing="current" @save="onSave" @cancel="showForm = false" />
    <ConfirmDialog :visible="showDelete" title="删除菜品" :message="`确定要删除 ${current?.name} 吗？关联的食材、备注、收藏、浏览记录将一并删除。`" @confirm="onDelete" @cancel="showDelete = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// ===== 步骤倒计时 =====
// timer: { step, stepNo, label, total, remain, running, done } | null
const timer = ref(null)
const clockText = ref('')
let tickId = null
let audioCtx = null

/** 解析「45秒 / 3分钟 / 1.5分钟」为秒数；「约5分钟」「2-3分钟」等取其中的较大值，无法识别返回 0 */
function parseSeconds(text) {
  const raw = String(text || '').trim()
  let m = raw.match(/^(\d+(?:\.\d+)?)\s*(秒|分钟|分)$/)
  if (!m) m = raw.match(/(\d+(?:\.\d+)?)\s*(秒|分钟|分)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  return Math.max(1, Math.round(m[2] === '秒' ? n : n * 60))
}

function formatClock(sec) {
  const s = Math.max(0, Math.round(sec))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/** 三声短促提示音（Web Audio，无需音频文件） */
function playAlarm() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    audioCtx = audioCtx || new Ctx()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const start = audioCtx.currentTime
    ;[0, 0.5, 1].forEach((offset) => {
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, start + offset)
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.35, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.38)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start(start + offset)
      osc.stop(start + offset + 0.4)
    })
  } catch (e) {
    /* 浏览器不支持时静默降级 */
  }
}

/** 震动（移动端）；桌面端无效果 */
function vibrate() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 150, 300, 150, 300])
    }
  } catch (e) {
    /* 忽略 */
  }
}

function startTickLoop() {
  if (tickId) return
  tickId = setInterval(tick, 500)
}

function tick() {
  const t = timer.value
  if (!t || !t.running || !t.endAt) return
  // 按截止时间戳计算，切后台被节流也不会走慢
  t.remain = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000))
  clockText.value = formatClock(t.remain)
  if (t.remain <= 0) {
    t.running = false
    t.done = true
    t.endAt = 0
    clearTickLoop()
    playAlarm()
    vibrate()
  }
}

function clearTickLoop() {
  if (tickId) {
    clearInterval(tickId)
    tickId = null
  }
}

function startTimer(step, index) {
  const total = parseSeconds(step && step.time)
  if (!total) return
  clearTickLoop()
  timer.value = {
    step,
    stepNo: index + 1,
    label: step.time,
    total,
    remain: total,
    endAt: Date.now() + total * 1000,
    running: true,
    done: false
  }
  clockText.value = formatClock(total)
  startTickLoop()
}

function toggleTimer() {
  const t = timer.value
  if (!t || t.done) return
  if (t.running) {
    // 暂停：把当前剩余量固化下来
    t.remain = Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000))
    clockText.value = formatClock(t.remain)
    t.running = false
    t.endAt = 0
  } else {
    t.endAt = Date.now() + t.remain * 1000
    t.running = true
    startTickLoop()
  }
}

function restartTimer() {
  const t = timer.value
  if (!t) return
  clearTickLoop()
  t.remain = t.total
  t.endAt = Date.now() + t.total * 1000
  t.running = true
  t.done = false
  clockText.value = formatClock(t.total)
  startTickLoop()
}

function stopTimer() {
  clearTickLoop()
  timer.value = null
}

// 从后台切回来时立刻校正一次显示
function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    tick()
    // 切到后台时系统会释放 wake lock，回来要重新申请
    if (kitchenMode.value && !wakeLock) requestWakeLock()
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('keydown', onKmKey)
})

onUnmounted(() => {
  clearTickLoop()
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('keydown', onKmKey)
  document.body.style.overflow = ''
  releaseWakeLock()
})

// 切换菜品时退出厨房模式，别停在上一道菜的步骤上
watch(
  () => route.params.id,
  (val, oldVal) => {
    if (oldVal !== undefined && kitchenMode.value) exitKitchen()
    loadData()
  }
)
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
.ing-alt { font-style: normal; font-size: 12px; color: var(--text-2); margin-left: 4px; }
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
/* 可点击的步骤时间 */
.step-time-btn { cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent; transition: background 0.15s, transform 0.1s; }
.step-time-btn:hover { background: var(--primary-light); color: var(--primary); }
.step-time-btn:active { transform: scale(0.95); }
/* 倒计时浮层 */
.timer-bar {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 150;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 260px;
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}
.timer-bar.is-done { border-color: var(--primary); }
.timer-body { flex: 1; min-width: 0; }
.timer-label { font-size: 11px; color: var(--text-2); margin-bottom: 2px; }
.timer-clock { font-size: 22px; font-weight: 600; line-height: 1.1; font-variant-numeric: tabular-nums; }
.timer-bar.is-done .timer-clock { color: var(--primary); }
.timer-tip { font-size: 11px; color: var(--primary); margin-top: 2px; }
.timer-actions { display: flex; gap: 8px; flex-shrink: 0; }
/* 厨房模式下浮到按钮上方 */
.timer-bar.in-kitchen { bottom: 96px; z-index: 210; }
/* 厨房模式入口按钮 */
.kitchen-enter { width: 100%; margin-top: 14px; padding: 12px; font-size: 15px; }
/* 厨房模式全屏 */
.km-overlay { position: fixed; inset: 0; z-index: 200; background: var(--card); display: flex; flex-direction: column; }
.km-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.km-head-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.km-dish { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.km-lock { font-size: 11px; color: var(--secondary); white-space: nowrap; }
.km-head-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.km-progress { font-size: 15px; color: var(--text-2); font-variant-numeric: tabular-nums; }
.km-close { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--text-2); background: var(--bg); border: none; border-radius: 10px; cursor: pointer; }
.km-body { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 18px; }
.km-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.km-badge { font-size: 14px; padding: 5px 12px; border-radius: 8px; }
.km-desc { font-size: clamp(20px, 5.2vw, 30px); line-height: 1.75; font-weight: 500; }
.km-extra { margin-top: 18px; font-size: clamp(15px, 3.6vw, 18px); color: var(--text-2); }
.km-note { margin-top: 14px; padding: 10px 14px; font-size: clamp(15px, 3.6vw, 18px); color: var(--primary); background: var(--primary-light); border-radius: 10px; }
.km-foot { display: flex; gap: 12px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); background: var(--card); }
.km-nav-btn { flex: 1; padding: 16px; font-size: 17px; font-weight: 500; color: var(--text); background: var(--card); border: 1px solid var(--border); border-radius: 12px; cursor: pointer; }
.km-nav-btn:disabled { color: var(--text-3); cursor: default; }
.km-nav-primary { color: #fff; background: var(--primary); border-color: var(--primary); }
@media (max-width: 768px) {
  .dish-title-row { flex-direction: column; }
  .dish-action-btns { flex-direction: row; flex-wrap: wrap; }
  .timer-bar { bottom: 80px; }
}
</style>

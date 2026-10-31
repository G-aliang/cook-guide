<template>
  <div>
    <!-- 用户信息卡片 -->
    <div class="profile-card card">
      <div class="profile-header">
        <div class="avatar">👤</div>
        <div class="profile-info">
          <div class="profile-name">我的厨房</div>
          <div class="profile-stats">
            已做过 {{ counts.done }} 道 · 收藏 {{ favCount }} 道
          </div>
        </div>
      </div>
    </div>

    <!-- 入口卡片 -->
    <div class="profile-grid">
      <router-link to="/favorites" class="home-entry card">
        <div class="entry-icon" style="background:var(--secondary-light)">⭐</div>
        <div class="entry-title">收藏</div>
        <div class="entry-desc">{{ favCount }} 道常做的菜</div>
      </router-link>
      <router-link to="/history" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">🕐</div>
        <div class="entry-title">浏览记录</div>
        <div class="entry-desc">最近看过的菜品和食材</div>
      </router-link>
      <router-link to="/progress" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">📚</div>
        <div class="entry-title">学习进度</div>
        <div class="entry-desc">已做 {{ counts.done }} · 想做 {{ counts.want }}</div>
      </router-link>
      <router-link to="/settings" class="home-entry card">
        <div class="entry-icon" style="background:var(--danger-light)">⚙️</div>
        <div class="entry-title">设置</div>
        <div class="entry-desc">版本管理 · 数据管理</div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProgressStore } from '../stores/progress'

const store = useProgressStore()
const counts = ref({ done: 0, want: 0 })
const favCount = ref(0)

onMounted(async () => {
  await store.loadProgress()
  await store.loadFavorites()
  counts.value = store.counts
  favCount.value = store.favorites.length
})
</script>

<style scoped>
.profile-card { margin-bottom: 16px; }
.profile-header { display: flex; align-items: center; gap: 16px; }
.avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.profile-name { font-size: 18px; font-weight: 600; }
.profile-stats { font-size: 13px; color: var(--text-2); margin-top: 4px; }
.profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.home-entry { display: block; text-align: center; text-decoration: none; color: var(--text); transition: all 0.2s; }
.home-entry:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
.entry-icon { width: 40px; height: 40px; margin: 0 auto 8px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.entry-title { font-size: 14px; font-weight: 600; }
.entry-desc { font-size: 12px; color: var(--text-2); margin-top: 4px; }
@media (max-width: 768px) { .profile-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
</style>

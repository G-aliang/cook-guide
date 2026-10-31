<template>
  <div class="home">
    <div class="progress-overview card" v-if="counts.done || counts.want">
      <div class="progress-row">
        <div class="progress-item">
          <div class="progress-num">{{ counts.done }}</div>
          <div class="progress-label">已做过</div>
        </div>
        <div class="progress-item">
          <div class="progress-num" style="color:var(--primary)">{{ counts.want }}</div>
          <div class="progress-label">想做</div>
        </div>
      </div>
    </div>
    <div class="home-grid">
      <router-link to="/ingredients" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">🥬</div>
        <div class="entry-title">食材库</div>
        <div class="entry-desc">认识 · 挑选 · 储存 · 处理</div>
      </router-link>
      <router-link to="/dishes" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">🍳</div>
        <div class="entry-title">菜品库</div>
        <div class="entry-desc">分步教学 · 从入门到挑战</div>
      </router-link>
      <router-link to="/match" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">🔍</div>
        <div class="entry-title">选菜匹配</div>
        <div class="entry-desc">勾选食材 · 一键匹配</div>
      </router-link>
      <router-link to="/favorites" class="home-entry card">
        <div class="entry-icon" style="background:var(--secondary-light)">⭐</div>
        <div class="entry-title">收藏</div>
        <div class="entry-desc">常做的好菜</div>
      </router-link>
      <router-link to="/history" class="home-entry card">
        <div class="entry-icon" style="background:var(--primary-light)">🕐</div>
        <div class="entry-title">浏览记录</div>
        <div class="entry-desc">最近看过的菜品和食材</div>
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
import { progressModel } from '../db/models'

const counts = ref({ done: 0, want: 0 })

onMounted(async () => {
  counts.value = await progressModel.getCounts()
})
</script>

<style scoped>
.progress-overview { margin-bottom: 16px; }
.progress-row { display: flex; gap: 32px; }
.progress-item { text-align: center; }
.progress-num { font-size: 24px; font-weight: 700; color: var(--secondary); }
.progress-label { font-size: 12px; color: var(--text-2); }
.home-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.home-entry { display: block; text-align: center; text-decoration: none; color: var(--text); transition: all 0.2s; }
.home-entry:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-2px); }
.entry-icon { width: 48px; height: 48px; margin: 0 auto 8px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.entry-title { font-size: 14px; font-weight: 600; }
.entry-desc { font-size: 12px; color: var(--text-2); margin-top: 4px; }

@media (max-width: 768px) {
  .home-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .home-entry { padding: 12px; }
  .entry-icon { width: 36px; height: 36px; font-size: 18px; }
  .progress-row { gap: 20px; }
}
</style>

<template>
  <div id="app-root">
    <NavBar />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <BottomNav />

    <!-- 新版本提示（由 Service Worker 更新检测触发，个人数据不受影响） -->
    <transition name="toast">
      <div v-if="needRefresh" class="update-toast" role="status" aria-live="polite">
        <div class="update-msg">
          <span class="update-dot"></span>
          <span>有新版本，点击刷新</span>
        </div>
        <div class="update-actions">
          <button class="update-btn" @click="applyUpdate">刷新</button>
          <button class="update-later" @click="dismissUpdate">以后</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import BottomNav from './components/BottomNav.vue'
import { needRefresh, applyUpdate, dismissUpdate } from './pwa'
</script>

<style>
#app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
/* 新版本提示条 */
.update-toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: calc(100vw - 32px);
  padding: 10px 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}
.update-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text);
  white-space: nowrap;
}
.update-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}
.update-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.update-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  background: var(--primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.update-btn:hover { background: var(--primary-dark); }
.update-later {
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-2);
  background: transparent;
  border: none;
  cursor: pointer;
}
.update-later:hover { color: var(--text); }
.toast-enter-active, .toast-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
@media (max-width: 768px) {
  .app-main { padding: 12px; padding-bottom: 72px; }
  .update-toast { bottom: 80px; }
}
</style>

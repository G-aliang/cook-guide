<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="logo">🍳 家常菜</router-link>
      <div class="search-box">
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索食材或菜品..."
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="nav-links">
        <router-link to="/ingredients" class="nav-link">食材库</router-link>
        <router-link to="/dishes" class="nav-link">菜品库</router-link>
        <router-link to="/profile" class="nav-link">我的</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const keyword = ref('')
const router = useRouter()

function handleSearch() {
  if (keyword.value.trim()) {
    router.push({ path: '/dishes', query: { search: keyword.value.trim() } })
  }
}
</script>

<style scoped>
.navbar {
  background: #fff;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  white-space: nowrap;
  text-decoration: none;
}
.search-box { flex: 1; max-width: 400px; }
.search-input {
  width: 100%;
  height: 36px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
}
.search-input:focus { border-color: var(--primary); background: #fff; }
.nav-links { display: flex; gap: 16px; }
.nav-link {
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  white-space: nowrap;
}
.nav-link.router-link-active { color: var(--primary); font-weight: 600; }

@media (max-width: 768px) {
  .nav-links { display: none; }
  .navbar-inner { padding: 0 12px; gap: 8px; }
  .logo { font-size: 16px; }
}
</style>

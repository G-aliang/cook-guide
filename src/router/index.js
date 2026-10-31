import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/ingredients', name: 'ingredients', component: () => import('../views/IngredientList.vue') },
  { path: '/ingredients/:id', name: 'ingredient-detail', component: () => import('../views/IngredientDetail.vue') },
  { path: '/dishes', name: 'dishes', component: () => import('../views/DishList.vue') },
  { path: '/dishes/:id', name: 'dish-detail', component: () => import('../views/DishDetail.vue') },
  { path: '/match', name: 'match', component: () => import('../views/Match.vue') },
  { path: '/match-results', name: 'match-results', component: () => import('../views/MatchResults.vue') },
  { path: '/profile', name: 'profile', component: () => import('../views/Profile.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('../views/Favorites.vue') },
  { path: '/history', name: 'history', component: () => import('../views/History.vue') },
  { path: '/progress', name: 'progress', component: () => import('../views/LearningProgress.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router

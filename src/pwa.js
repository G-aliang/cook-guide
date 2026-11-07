// PWA 注册与「有新版本」提示
//
// 安全说明（个人数据保护）：
//   1. 这里只在用户点击「刷新」后重新加载页面，不做任何清库 / 清缓存操作；
//   2. 页面重新加载后走 syncInitialData()，它只重写基础数据表
//      （ingredients / dishes / dish_ingredients）；
//      个人数据（favorites / notes / browsing_history / learning_progress / images）始终保留，
//      仅清理指向已删除菜品或食材的孤儿记录；
//   3. 新版本数据只在 dataVersion 变化时才写入，版本相同直接跳过。

import { ref } from 'vue'

/** 检测到新版本，可提示用户刷新 */
export const needRefresh = ref(false)
/** 已缓存离线可用（非阻塞提示，仅记录状态） */
export const offlineReady = ref(false)

let updateServiceWorker = null
let checkTimer = null
let reloading = false

function reloadOnce() {
  if (reloading) return
  reloading = true
  window.location.reload()
}

export async function setupPwa() {
  try {
    const { registerSW } = await import('virtual:pwa-register')
    updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        // 新版本已下载完成，等用户确认后再激活
        needRefresh.value = true
      },
      onOfflineReady() {
        offlineReady.value = true
      },
      onRegisteredSW(swUrl, registration) {
        if (!registration) return
        // 每小时主动检查一次；页面重新可见时也检查一次，
        // 否则长时间不关闭标签页就永远收不到更新提示
        if (checkTimer) clearInterval(checkTimer)
        checkTimer = setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {})
          }
        })
      }
    })
  } catch (e) {
    console.warn('PWA 注册失败:', e)
  }
}

/** 用户点击「刷新」：激活新版本并重新加载页面（不含任何数据清除） */
export function applyUpdate() {
  needRefresh.value = false
  if (typeof updateServiceWorker === 'function') {
    // 传 true = 通知新 SW 跳过等待并激活
    updateServiceWorker(true)
  }
  // 兜底：即使没收到 controlling 事件，也主动刷新一次（此时新 SW 已激活）
  setTimeout(reloadOnce, 800)
}

/** 用户选择稍后再说 */
export function dismissUpdate() {
  needRefresh.value = false
}

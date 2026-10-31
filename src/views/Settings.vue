<template>
  <div>
    <h2 class="page-title">⚙️ 设置</h2>

    <!-- 版本信息 -->
    <div class="card" style="margin-bottom:20px">
      <div class="section-title">📋 版本信息</div>
      <div class="version-info">
        <div>家常菜入门指南 v1.0.0</div>
        <div class="version-date">更新日期：2026-10-31</div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card">
      <div class="section-title">💾 数据管理</div>
      <div class="data-actions">
        <button class="data-btn-export" @click="exportData">📤 导出数据 — 下载全部数据为 JSON 文件</button>
        <button class="data-btn-import" @click="importData">📥 导入数据 — 从 JSON 文件恢复</button>
        <button class="data-btn-reset" @click="showReset = true">⚠️ 重置数据 — 清空所有内容</button>
      </div>
      <input type="file" ref="fileInput" accept=".json" style="display:none" @change="onFileSelected" />
      <div v-if="dataSize" class="data-size">当前数据约 {{ dataSize }}KB</div>
    </div>

    <ConfirmDialog :visible="showReset" title="重置数据" message="确定要清空所有数据吗？此操作不可恢复，建议先导出备份。" @confirm="resetData" @cancel="showReset = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../db/database'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const showReset = ref(false)
const dataSize = ref(0)
const fileInput = ref(null)

async function exportData() {
  try {
    const data = { version: '1.0', exportedAt: Date.now() }
    for (const table of ['ingredients', 'dishes', 'dish_ingredients', 'favorites', 'browsing_history', 'learning_progress', 'notes', 'images']) {
      data[table] = await db.table(table).toArray()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cook-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    alert('数据导出成功！')
  } catch (e) {
    alert('导出失败：' + e.message)
  }
}

function importData() {
  fileInput.value?.click()
}

async function onFileSelected(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    const confirm = await new Promise(resolve => {
      alert('导入方式：\n1. 覆盖（清空后写入）\n2. 合并（新增/更新）\n\n请在控制台输入 1 或 2')
      const input = prompt('输入 1（覆盖）或 2（合并）', '2')
      resolve(input === '1')
    })

    for (const table of ['ingredients', 'dishes', 'dish_ingredients', 'favorites', 'browsing_history', 'learning_progress', 'notes', 'images']) {
      if (!data[table]) continue
      if (confirm) {
        await db.table(table).clear()
        await db.table(table).bulkPut(data[table])
      } else {
        // Merge: upsert existing records, add new ones
        const existing = await db.table(table).toArray()
        const existingIds = new Set(existing.map(r => r.id))
        const toAdd = data[table].filter(r => !existingIds.has(r.id))
        const toUpdate = data[table].filter(r => existingIds.has(r.id))
        if (toAdd.length) await db.table(table).bulkAdd(toAdd)
        if (toUpdate.length) await db.table(table).bulkPut(toUpdate)
      }
    }
    alert('数据导入成功！')
    await calcSize()
  } catch (e) {
    alert('导入失败：' + e.message)
  }
  e.target.value = ''
}

async function resetData() {
  showReset.value = false
  for (const table of ['ingredients', 'dishes', 'dish_ingredients', 'favorites', 'browsing_history', 'learning_progress', 'notes', 'images']) {
    await db.table(table).clear()
  }
  alert('数据已重置')
  await calcSize()
}

async function calcSize() {
  try {
    const size = await db.export()
    dataSize.value = Math.round(JSON.stringify(size).length / 1024)
  } catch (e) {
    console.error('Size calc error:', e)
  }
}

onMounted(calcSize)
</script>

<style scoped>
.version-info { font-size: 14px; color: var(--text-2); }
.version-date { font-size: 12px; color: var(--text-3); margin-top: 4px; }
.data-actions { display: flex; flex-direction: column; gap: 12px; }
.data-btn-export { padding: 14px 20px; border-radius: 12px; background: var(--primary-light); border: 1px solid var(--primary); color: var(--primary); font-size: 14px; text-align: left; cursor: pointer; }
.data-btn-import { padding: 14px 20px; border-radius: 12px; background: var(--secondary-light); border: 1px solid var(--secondary); color: var(--secondary); font-size: 14px; text-align: left; cursor: pointer; }
.data-btn-reset { padding: 14px 20px; border-radius: 12px; background: var(--danger-light); border: 1px solid var(--danger); color: var(--danger); font-size: 14px; text-align: left; cursor: pointer; }
.data-size { margin-top: 16px; font-size: 12px; color: var(--text-3); }
</style>

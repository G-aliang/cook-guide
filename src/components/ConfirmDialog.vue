<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="confirm-overlay" @click.self="$emit('cancel')">
        <div class="confirm-dialog">
          <div class="confirm-title">{{ title }}</div>
          <div class="confirm-message">{{ message }}</div>
          <div class="confirm-actions">
            <button class="btn btn-sm" @click="$emit('cancel')">取消</button>
            <button class="btn btn-sm btn-danger" @click="$emit('confirm')">确认</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确定要执行此操作吗？' },
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  max-width: 320px;
  width: 90%;
  text-align: center;
}
.confirm-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.confirm-message { font-size: 14px; color: var(--text-2); margin-bottom: 20px; }
.confirm-actions { display: flex; gap: 12px; justify-content: center; }
.confirm-actions button { min-width: 80px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

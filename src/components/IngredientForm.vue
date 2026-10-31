<template>
  <teleport to="body">
    <div class="form-overlay" @click.self="$emit('cancel')">
      <div class="form-dialog">
        <div class="form-header">
          <h3>{{ editing ? '编辑食材' : '新增食材' }}</h3>
          <button class="btn btn-sm" @click="$emit('cancel')">✕</button>
        </div>
        <div class="form-body">
          <!-- 基本信息 -->
          <div class="form-section">
            <label>名称 <span class="required">*</span></label>
            <input v-model="form.name" class="input" placeholder="如：西红柿" />
          </div>
          <div class="form-row">
            <div class="form-section">
              <label>分类 <span class="required">*</span></label>
              <select v-model="form.category" class="input">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-section" v-if="form.category === '调味项'">
              <label>子分类</label>
              <select v-model="form.subCategory" class="input">
                <option value="">请选择</option>
                <option v-for="sc in subCategories" :key="sc" :value="sc">{{ sc }}</option>
              </select>
            </div>
          </div>

          <!-- ① 介绍 -->
          <div class="form-section">
            <label>① 介绍</label>
            <textarea v-model="form.intro" class="input" rows="3" placeholder="这个食材是什么、基本特性、营养价值、烹饪角色"></textarea>
          </div>

          <!-- 图片上传 -->
          <div class="form-section">
            <label>食材图片（可选）</label>
            <div class="image-upload-area" v-if="imagePreview">
              <img :src="imagePreview" class="image-preview" />
              <button class="btn btn-sm btn-danger" @click="removeImage">移除</button>
            </div>
            <button v-else class="btn btn-sm btn-outline" @click="$refs.ingImg.click()">📷 上传图片</button>
            <input ref="ingImg" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onImageSelected($event, 'ingredient')" />
            <p class="form-hint">支持 JPG/PNG/WebP，≤500KB</p>
          </div>

          <!-- ② 品种 -->
          <div class="form-section">
            <label>② 品种</label>
            <div v-for="(v, i) in form.varieties" :key="i" class="dynamic-row">
              <input v-model="v.name" class="input" placeholder="品种名" style="flex:1" />
              <input v-model="v.feature" class="input" placeholder="特点" style="flex:2" />
              <input v-model="v.usage" class="input" placeholder="适合做法" style="flex:2" />
              <button class="btn btn-sm btn-danger" @click="form.varieties.splice(i,1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline" @click="form.varieties.push({ name: '', feature: '', usage: '' })">+ 添加品种</button>
          </div>

          <!-- ③ 购买/挑选 -->
          <div class="form-section">
            <label>③ 购买/挑选</label>
            <textarea v-model="form.buying" class="input" rows="3" placeholder="挑选要点、避坑提示、价格参考"></textarea>
          </div>

          <!-- ④ 储存 -->
          <div class="form-section">
            <label>④ 储存</label>
            <div v-for="(s, i) in form.storage" :key="i" class="dynamic-row">
              <input v-model="s.method" class="input" placeholder="方式" style="flex:1" />
              <input v-model="s.condition" class="input" placeholder="条件" style="flex:2" />
              <input v-model="s.shelfLife" class="input" placeholder="保质期" style="flex:1" />
              <button class="btn btn-sm btn-danger" @click="form.storage.splice(i,1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline" @click="form.storage.push({ method: '', condition: '', shelfLife: '', notes: '' })">+ 添加储存方式</button>
          </div>

          <!-- ⑤ 处理 -->
          <div class="form-section">
            <label>⑤ 处理</label>
            <div v-for="(p, i) in form.processing" :key="i" class="dynamic-row">
              <input v-model="p.step" class="input" placeholder="步骤" style="flex:1" />
              <input v-model="p.detail" class="input" placeholder="具体操作" style="flex:3" />
              <button class="btn btn-sm btn-danger" @click="form.processing.splice(i,1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline" @click="form.processing.push({ step: '', detail: '' })">+ 添加处理步骤</button>
          </div>

          <!-- ⑦ 营养成分 -->
          <div class="form-section">
            <label>⑦ 营养成分</label>
            <div class="form-row">
              <div class="form-section">
                <label>单位</label>
                <input v-model="form.nutrition.perUnit" class="input" placeholder="如：100g" />
              </div>
              <div class="form-section">
                <label>热量</label>
                <input v-model="form.nutrition.calories" class="input" placeholder="如：18" />
              </div>
              <div class="form-section">
                <label>脂肪</label>
                <input v-model="form.nutrition.fat" class="input" placeholder="如：0.2" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-section">
                <label>蛋白质</label>
                <input v-model="form.nutrition.protein" class="input" placeholder="如：0.9" />
              </div>
              <div class="form-section">
                <label>碳水</label>
                <input v-model="form.nutrition.carbs" class="input" placeholder="如：3.9" />
              </div>
              <div class="form-section">
                <label>钠</label>
                <input v-model="form.nutrition.sodium" class="input" placeholder="如：5" />
              </div>
            </div>
            <textarea v-model="form.nutrition.healthNotes" class="input" rows="2" placeholder="健康提示"></textarea>
          </div>

          <!-- ⑥ 相关菜品 -->
          <div class="form-section">
            <label>⑥ 关联菜品</label>
            <p class="form-hint">关联菜品在菜品编辑时自动建立，无需在此填写。</p>
          </div>
        </div>
        <div class="form-footer">
          <button class="btn" @click="$emit('cancel')">取消</button>
          <button class="btn btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { CATEGORIES } from '../db/database'

const props = defineProps({
  editing: { type: Object, default: null },
})
const emit = defineEmits(['save', 'cancel'])

const categories = CATEGORIES.ingredient
const subCategories = CATEGORIES.subCategory['调味项'] || ['基础调味', '香辛料', '复合调味']

const defaultForm = () => ({
  name: '',
  category: '',
  subCategory: '',
  intro: '',
  varieties: [],
  buying: '',
  storage: [],
  processing: [],
  nutrition: { perUnit: '', calories: '', fat: '', protein: '', carbs: '', fiber: '', sodium: '', healthNotes: '' },
  emoji: '',
})

const form = ref(defaultForm())
const imagePreview = ref('')
const imageBase64 = ref('')

watch(() => props.editing, (val) => {
  if (val) {
    form.value = { ...defaultForm(), ...val, nutrition: { ...defaultForm().nutrition, ...(val.nutrition || {}) } }
    imagePreview.value = ''
    imageBase64.value = ''
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

function onImageSelected(e, refType) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 500 * 1024) { alert('图片不能超过 500KB'); return }
  const reader = new FileReader()
  reader.onload = (ev) => {
    const base64 = ev.target.result
    imagePreview.value = base64
    imageBase64.value = base64
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function removeImage() {
  imagePreview.value = ''
  imageBase64.value = ''
  form.value.imageId = null
}

async function save() {
  if (!form.value.name.trim()) { alert('请填写食材名称'); return }
  if (!form.value.category) { alert('请选择分类'); return }
  // Include image data for storage
  if (imageBase64.value) {
    form.value._imageBase64 = imageBase64.value
  }
  emit('save', form.value)
}
</script>

<style scoped>
.form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; z-index: 200; overflow-y: auto; padding: 20px; }
.form-dialog { background: #fff; border-radius: 12px; max-width: 700px; width: 100%; margin: auto; }
.form-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
.form-header h3 { font-size: 18px; }
.form-body { padding: 20px; max-height: 60vh; overflow-y: auto; }
.form-section { margin-bottom: 16px; }
.form-section label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
.form-section .required { color: var(--danger); }
.form-row { display: flex; gap: 12px; }
.form-row .form-section { flex: 1; }
.dynamic-row { display: flex; gap: 8px; margin-bottom: 8px; }
.form-hint { font-size: 12px; color: var(--text-3); }
.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid var(--border); }
</style>

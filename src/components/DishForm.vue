<template>
  <teleport to="body">
    <div class="form-overlay" @click.self="$emit('cancel')">
      <div class="form-dialog">
        <div class="form-header">
          <h3>{{ editing ? '编辑菜品' : '新增菜品' }}</h3>
          <button class="btn btn-sm" @click="$emit('cancel')">✕</button>
        </div>
        <div class="form-body">
          <!-- 基本信息 -->
          <div class="form-section">
            <label>名称 <span class="required">*</span></label>
            <input v-model="form.name" class="input" placeholder="如：番茄炒蛋" />
          </div>
          <div class="form-row">
            <div class="form-section">
              <label>分类 <span class="required">*</span></label>
              <select v-model="form.category" class="input">
                <option value="">请选择</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-section">
              <label>难度 <span class="required">*</span></label>
              <select v-model="form.difficulty" class="input">
                <option value="">请选择</option>
                <option v-for="d in difficulties" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>
          <div class="form-section">
            <label>预估时长</label>
            <input v-model="form.duration" class="input" placeholder="如：10分钟" />
          </div>
          <div class="form-section">
            <label>简介</label>
            <textarea v-model="form.intro" class="input" rows="2" placeholder="菜品简介"></textarea>
          </div>

          <!-- 分类标签 -->
          <div class="form-section">
            <label>分类标签</label>
            <div class="tag-group">
              <div class="tag-label">烹饪方式：</div>
              <div class="tag-chips">
                <span v-for="t in tagOptions.cooking" :key="t" class="tag-chip" :class="{ active: form.tags.cooking.includes(t) }" @click="toggleTag('cooking', t)">{{ t }}</span>
              </div>
            </div>
            <div class="tag-group">
              <div class="tag-label">荤素/场景：</div>
              <div class="tag-chips">
                <span v-for="t in tagOptions.diet" :key="t" class="tag-chip" :class="{ active: form.tags.diet.includes(t) }" @click="toggleTag('diet', t)">{{ t }}</span>
              </div>
            </div>
            <div class="tag-group">
              <div class="tag-label">菜系/地域：</div>
              <div class="tag-chips">
                <span v-for="t in tagOptions.cuisine" :key="t" class="tag-chip" :class="{ active: form.tags.cuisine.includes(t) }" @click="toggleTag('cuisine', t)">{{ t }}</span>
              </div>
            </div>
            <div class="tag-group">
              <div class="tag-label">用餐时段：</div>
              <div class="tag-chips">
                <span v-for="t in tagOptions.meal" :key="t" class="tag-chip" :class="{ active: form.tags.meal.includes(t) }" @click="toggleTag('meal', t)">{{ t }}</span>
              </div>
            </div>
            <div class="tag-group">
              <div class="tag-label">自定义标签：</div>
              <input v-model="customTag" class="input" placeholder="输入自定义标签" @keyup.enter="addCustomTag" />
              <div class="tag-chips" v-if="form.tags.custom.length">
                <span v-for="(t, i) in form.tags.custom" :key="i" class="tag-chip active" @click="removeTag('custom', t)">{{ t }} ✕</span>
              </div>
            </div>
          </div>

          <!-- 食材清单 -->
          <div class="form-section">
            <label>食材清单 <span class="required">*</span></label>
            <div v-for="(ing, i) in form.ingredients" :key="i" class="dynamic-row">
              <input v-model="ing.name" class="input" placeholder="食材名称" style="flex:2" />
              <input v-model="ing.amount" class="input" placeholder="用量" style="flex:1" />
              <button class="btn btn-sm btn-danger" @click="form.ingredients.splice(i,1)">✕</button>
            </div>
            <button class="btn btn-sm btn-outline" @click="form.ingredients.push({ ingredientId: null, name: '', amount: '' })">+ 添加食材</button>
            <p class="form-hint">至少添加 1 个食材</p>
          </div>

          <!-- 制作步骤 -->
          <div class="form-section">
            <label>制作步骤</label>
            <div v-for="(step, i) in form.steps" :key="i" class="step-block">
              <div class="step-header">
                <span class="step-num">{{ i + 1 }}</span>
                <button class="btn btn-sm btn-danger" @click="form.steps.splice(i,1)">✕</button>
              </div>
              <textarea v-model="step.desc" class="input" rows="2" placeholder="步骤描述"></textarea>
              <div class="form-row" style="margin-top:6px">
                <div class="form-section" style="flex:1">
                  <label style="font-size:12px;color:var(--text-2)">火候</label>
                  <select v-model="step.heat" class="input" style="height:32px">
                    <option value="">不限</option>
                    <option value="小火">小火</option>
                    <option value="中火">中火</option>
                    <option value="大火">大火</option>
                    <option value="中大火">中大火</option>
                  </select>
                </div>
                <div class="form-section" style="flex:1">
                  <label style="font-size:12px;color:var(--text-2)">时间</label>
                  <input v-model="step.time" class="input" style="height:32px" placeholder="如：1分钟" />
                </div>
                <div class="form-section" style="flex:1">
                  <label style="font-size:12px;color:var(--text-2)">用量</label>
                  <input v-model="step.amount" class="input" style="height:32px" placeholder="如：油15ml" />
                </div>
              </div>
              <input v-model="step.note" class="input" style="margin-top:6px" placeholder="注意事项（可选）" />
            </div>
            <button class="btn btn-sm btn-outline" @click="form.steps.push({ order: form.steps.length + 1, desc: '', heat: '', time: '', amount: '', note: '' })">+ 添加步骤</button>
          </div>

          <!-- 营养信息 -->
          <div class="form-section">
            <label>营养信息</label>
            <div class="form-row">
              <div class="form-section">
                <label>单位</label>
                <input v-model="form.nutrition.perUnit" class="input" placeholder="如：1份" />
              </div>
              <div class="form-section">
                <label>热量</label>
                <input v-model="form.nutrition.calories" class="input" placeholder="如：250" />
              </div>
              <div class="form-section">
                <label>脂肪</label>
                <input v-model="form.nutrition.fat" class="input" placeholder="如：12" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-section">
                <label>蛋白质</label>
                <input v-model="form.nutrition.protein" class="input" placeholder="如：15" />
              </div>
              <div class="form-section">
                <label>碳水</label>
                <input v-model="form.nutrition.carbs" class="input" placeholder="如：20" />
              </div>
            </div>
            <textarea v-model="form.nutrition.healthNotes" class="input" rows="2" placeholder="健康提示"></textarea>
          </div>

          <!-- 视频链接 -->
          <div class="form-section">
            <label>视频链接（可选）</label>
            <input v-model="form.videoUrl" class="input" placeholder="如：https://..." />
          </div>

          <!-- 图片上传 -->
          <div class="form-section">
            <label>菜品图片（可选）</label>
            <div class="image-upload-area" v-if="imagePreview">
              <img :src="imagePreview" class="image-preview" />
              <button class="btn btn-sm btn-danger" @click="removeImage">移除</button>
            </div>
            <button v-else class="btn btn-sm btn-outline" @click="$refs.dishImg.click()">📷 上传图片</button>
            <input ref="dishImg" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" @change="onImageSelected" />
            <p class="form-hint">支持 JPG/PNG/WebP，≤500KB</p>
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

const categories = CATEGORIES.dish
const difficulties = CATEGORIES.difficulty
const tagOptions = CATEGORIES.tags

const defaultForm = () => ({
  name: '',
  category: '',
  difficulty: '',
  duration: '',
  intro: '',
  imageId: null,
  videoUrl: '',
  tags: { cooking: [], diet: [], cuisine: [], meal: [], custom: [] },
  ingredients: [],
  steps: [],
  nutrition: { perUnit: '', calories: '', fat: '', protein: '', carbs: '', healthNotes: '' },
})

const form = ref(defaultForm())
const customTag = ref('')
const imagePreview = ref('')
const imageBase64 = ref('')

watch(() => props.editing, (val) => {
  if (val) {
    form.value = { ...defaultForm(), ...val, tags: { cooking: [], diet: [], cuisine: [], meal: [], custom: [], ...(val.tags || {}) }, nutrition: { ...defaultForm().nutrition, ...(val.nutrition || {}) } }
    imagePreview.value = ''
    imageBase64.value = ''
  } else {
    form.value = defaultForm()
  }
}, { immediate: true })

function toggleTag(dim, tag) {
  const arr = form.value.tags[dim]
  const idx = arr.indexOf(tag)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(tag)
}

function removeTag(dim, tag) {
  const arr = form.value.tags[dim]
  const idx = arr.indexOf(tag)
  if (idx >= 0) arr.splice(idx, 1)
}

function addCustomTag() {
  const t = customTag.value.trim()
  if (t && !form.value.tags.custom.includes(t)) {
    form.value.tags.custom.push(t)
  }
  customTag.value = ''
}

function onImageSelected(e) {
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
  if (!form.value.name.trim()) { alert('请填写菜品名称'); return }
  if (!form.value.category) { alert('请选择分类'); return }
  if (!form.value.difficulty) { alert('请选择难度'); return }
  if (!form.value.ingredients.length) { alert('请至少添加 1 个食材'); return }
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
.tag-group { margin-bottom: 12px; }
.tag-label { font-size: 13px; color: var(--text-2); margin-bottom: 6px; }
.tag-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-chip { padding: 4px 10px; border-radius: 16px; font-size: 12px; background: #f5f5f5; color: var(--text-2); cursor: pointer; border: 1px solid transparent; }
.tag-chip.active { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
.step-block { margin-bottom: 12px; padding: 12px; background: var(--bg); border-radius: 8px; }
.step-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; }
.form-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid var(--border); }
</style>

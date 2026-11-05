import Dexie from 'dexie'

export const db = new Dexie('cook')

db.version(1).stores({
  // 主键 ++id，二级索引
  ingredients: '++id, name, category, subCategory',
  dishes: '++id, name, category, difficulty',
  // 关联表
  dish_ingredients: '++id, dishId, ingredientId',
  // 用户数据
  favorites: '++id, dishId',
  browsing_history: '++id, refType, refId, viewedAt',
  learning_progress: '++id, dishId, status',
  notes: '++id, refType, refId',
  images: '++id, refType, refId, role',
})

// 分类常量
export const CATEGORIES = {
  ingredient: ['蔬菜', '肉禽', '海鲜水产', '蛋奶', '豆类', '冻品', '主食', '调味项', '干货'],
  dish: ['凉菜', '热炒', '汤羹', '主食', '甜点'],
  difficulty: ['入门', '进阶', '挑战'],
  subCategory: {
    '调味项': ['基础调味', '香辛料', '复合调味']
  },
  tags: {
    // 做法（烹饪方式，一道菜可选多个）
    cooking: ['炒', '爆', '煎', '炸', '烤', '蒸', '煮', '炖', '烧', '焖', '烩', '煲', '卤', '拌', '腌', '焗', '涮', '烘焙', '卷', '组装'],
    // 荤素（食材属性）
    diet: ['荤菜', '素菜', '海鲜', '蛋类', '主食', '甜点'],
    // 菜系（地域/风味）
    cuisine: ['家常', '川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '淮扬菜', '浙菜', '闽菜', '徽菜', '京菜', '津菜', '沪菜', '东北菜', '山西菜', '豫菜', '鄂菜', '赣菜', '西北菜', '客家菜', '台式', '西餐', '日韩', '东南亚'],
    // 用餐时段
    meal: ['早餐', '午餐', '晚餐', '夜宵', '下午茶'],
    // 场景（用途/人群）
    custom: ['下饭', '快手菜', '宴客菜', '下酒菜', '滋补', '养生', '健康菜', '低卡', '减脂餐', '高蛋白', '暖身菜', '开胃', '儿童餐', '凉菜', '主食', '甜品', '烘焙']
  },
  // 菜品库筛选用（维度 → 展示名）
  tagDims: [
    { key: 'cuisine', label: '菜系' },
    { key: 'cooking', label: '做法' },
    { key: 'diet', label: '荤素' },
    { key: 'meal', label: '时段' },
    { key: 'custom', label: '场景' }
  ]
}

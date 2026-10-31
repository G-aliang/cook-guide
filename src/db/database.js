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
    cooking: ['蒸', '煮', '炒', '卤', '烤', '炸', '烘焙', '煎', '炖', '焖', '拌', '焗'],
    diet: ['荤菜', '素菜', '下酒菜', '宝宝辅食', '减脂餐', '低卡', '高蛋白'],
    cuisine: ['家常', '东北', '山西', '川菜', '粤菜', '湘菜', '江浙', '西北', '西南'],
    meal: ['早餐', '午餐', '晚餐', '夜宵']
  }
}

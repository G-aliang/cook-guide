# 数据文件

本目录存放应用的初始数据文件。

## 目录结构

```
data/
├── README.md              # 本文件
├── ingredients/           # 食材初始数据
└── dishes/                # 菜品初始数据
```

## ingredients/ — 食材数据

每种食材是一个 JSON 文件，包含以下字段：

```json
{
  "name": "西红柿",
  "imageId": null,
  "category": "蔬菜",
  "subCategory": "",
  "intro": "介绍...",
  "varieties": [{ "name": "大番茄", "feature": "...", "usage": "..." }],
  "buying": "购买挑选要点...",
  "storage": [{ "method": "常温", "condition": "...", "shelfLife": "3-5天", "notes": "..." }],
  "processing": [{ "step": "清洗", "detail": "..." }],
  "nutrition": {
    "perUnit": "100g",
    "calories": "18",
    "fat": "0.2",
    "protein": "0.9",
    "carbs": "3.9",
    "fiber": "1.2",
    "sodium": "5",
    "healthNotes": "低热量，富含维生素C"
  },
  "relatedDishIds": [1, 2, 3]
}
```

> `category` 可选值：蔬菜 / 肉禽 / 海鲜水产 / 蛋奶 / 豆类 / 冻品 / 主食 / 调味项 / 干货  
> `subCategory` 仅 `category=调味项` 时使用：基础调味 / 香辛料 / 复合调味  
> `nutrition` 中数值均为字符串（含单位），`perUnit` 表示单位（如"100g"）  
> `imageId` 初始为 null，用户上传图片后由 IndexedDB 的 `images` 表分配  
> 个人备注不在此文件中，由用户在应用中自行添加，存储在 IndexedDB 的 `notes` 表中

## dishes/ — 菜品数据

每道菜是一个 JSON 文件，包含以下字段：

```json
{
  "name": "番茄炒蛋",
  "category": "热炒",
  "difficulty": "入门",
  "duration": "10分钟",
  "intro": "简介...",
  "imageId": null,
  "videoUrl": "",
  "tags": {
    "cooking": ["炒"],
    "diet": ["素"],
    "cuisine": ["家常"],
    "meal": ["早餐", "午餐", "晚餐"],
    "custom": ["快手菜", "下酒菜"]
  },
  "ingredients": [
    { "ingredientId": 1, "name": "西红柿", "amount": "2个" },
    { "ingredientId": 2, "name": "鸡蛋", "amount": "3个" }
  ],
  "steps": [
    { "order": 1, "desc": "...", "note": "...", "imageId": null, "videoUrl": "" }
  ],
  "nutrition": {
    "perUnit": "1份",
    "calories": "250",
    "fat": "12",
    "protein": "15",
    "carbs": "20",
    "healthNotes": "营养均衡，适合日常"
  },
  "relatedIngredientIds": [1, 2]
}
```

> `tags` 各维度说明：`cooking`=烹饪方式，`diet`=荤素/场景，`cuisine`=菜系/地域，`meal`=用餐时段，`custom`=自定义标签  
> `imageId` 初始为 null，用户上传图片后由 IndexedDB 的 `images` 表分配  
> `videoUrl` 为外部链接字符串，留空表示无视频  
> `steps` 中的 `imageId` 和 `videoUrl` 为可选字段

## images/ — 图片数据（可选）

用户上传的图片存储在 IndexedDB 的 `images` 表中，不在此目录预置。

```json
{
  "id": 1,
  "refType": "ingredient",
  "refId": 3,
  "role": "main",
  "dataType": "image",
  "data": "data:image/png;base64,iVBORw0KGgo..."
}
```

> `refType`: ingredient / dish / step / note  
> `role`: main / step_image / note_image  
> `data`: base64 编码的图片数据  
> 图片不预置在 JSON 文件中，由用户在应用中上传后自动生成

## 数据导入

开发时通过脚本将 JSON 文件批量导入 IndexedDB。图片由用户上传后自动写入 `images` 表。

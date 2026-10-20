/**
 * 「今日吃啥」菜名数据池。kind 与 cuisineId 可组合 AND 筛选。
 * cuisineId 与 config/cuisines.ts 的 id 一致。
 */
export type RecommendedDishKind = 'meat' | 'veg' | 'savory_soup' | 'sweet_soup'

export interface RecommendedDish {
    name: string
    kind: RecommendedDishKind
    cuisineId: string
}

const R = (name: string, kind: RecommendedDishKind, cuisineId: string): RecommendedDish => ({
    name,
    kind,
    cuisineId
})

/** 全量菜名（覆盖常见 kind × 菜系 组合，便于强筛选时仍有数据） */
export const recommendedDishes: RecommendedDish[] = [
    // 苏菜 su
    R('清炖蟹粉狮子头', 'meat', 'su'),
    R('大煮干丝', 'meat', 'su'),
    R('白汁圆菜', 'veg', 'su'),
    R('蟹粉豆腐', 'meat', 'su'),
    R('文思豆腐', 'veg', 'su'),
    R('莼菜银鱼羹', 'savory_soup', 'su'),
    R('酒酿圆子', 'sweet_soup', 'su'),
    R('糖芋苗', 'sweet_soup', 'su'),
    // 鲁菜 lu
    R('把子肉', 'meat', 'lu'),
    R('九转大肠', 'meat', 'lu'),
    R('葱烧海参', 'meat', 'lu'),
    R('奶汤蒲菜', 'veg', 'lu'),
    R('炝西芹', 'veg', 'lu'),
    R('德州扒鸡', 'meat', 'lu'),
    R('酸辣汤', 'savory_soup', 'lu'),
    R('海米冬瓜汤', 'savory_soup', 'lu'),
    R('黄米烙', 'sweet_soup', 'lu'),
    // 川菜 chuan
    R('回锅肉', 'meat', 'chuan'),
    R('宫保鸡丁', 'meat', 'chuan'),
    R('麻婆豆腐', 'meat', 'chuan'),
    R('鱼香茄子', 'veg', 'chuan'),
    R('蒜泥白肉', 'meat', 'chuan'),
    R('蚂蚁上树', 'meat', 'chuan'),
    R('酸菜鱼', 'savory_soup', 'chuan'),
    R('担担面', 'savory_soup', 'chuan'),
    R('冰粉', 'sweet_soup', 'chuan'),
    R('红糖糍粑', 'sweet_soup', 'chuan'),
    // 粤菜 yue
    R('白切鸡', 'meat', 'yue'),
    R('叉烧', 'meat', 'yue'),
    R('干炒牛河', 'meat', 'yue'),
    R('白灼菜心', 'veg', 'yue'),
    R('上汤娃娃菜', 'veg', 'yue'),
    R('老火靓汤', 'savory_soup', 'yue'),
    R('及第粥', 'savory_soup', 'yue'),
    R('双皮奶', 'sweet_soup', 'yue'),
    R('杨枝甘露', 'sweet_soup', 'yue'),
    // 浙菜 zhe
    R('东坡肉', 'meat', 'zhe'),
    R('西湖醋鱼', 'meat', 'zhe'),
    R('龙井虾仁', 'meat', 'zhe'),
    R('油焖春笋', 'veg', 'zhe'),
    R('干煸四季豆', 'veg', 'zhe'),
    R('宋嫂鱼羹', 'savory_soup', 'zhe'),
    R('三鲜汤', 'savory_soup', 'zhe'),
    R('桂花糖藕', 'sweet_soup', 'zhe'),
    R('酒酿冲蛋', 'sweet_soup', 'zhe'),
    // 湘菜 xiang
    R('剁椒鱼头', 'meat', 'xiang'),
    R('小炒黄牛肉', 'meat', 'xiang'),
    R('毛氏红烧肉', 'meat', 'xiang'),
    R('炝炒空心菜', 'veg', 'xiang'),
    R('干锅包菜', 'veg', 'xiang'),
    R('口蘑菜心汤', 'savory_soup', 'xiang'),
    R('三鲜豆腐煲', 'savory_soup', 'xiang'),
    R('糖油粑粑', 'sweet_soup', 'xiang'),
    // 闽菜 min
    R('佛跳墙', 'meat', 'min'),
    R('荔枝肉', 'meat', 'min'),
    R('海蛎煎', 'meat', 'min'),
    R('上汤时蔬', 'veg', 'min'),
    R('清炒时蔬', 'veg', 'min'),
    R('肉燕汤', 'savory_soup', 'min'),
    R('七星鱼丸汤', 'savory_soup', 'min'),
    R('花生汤', 'sweet_soup', 'min'),
    R('四果汤', 'sweet_soup', 'min'),
    // 徽菜 hui
    R('毛豆腐', 'veg', 'hui'),
    R('问政山笋', 'veg', 'hui'),
    R('符离集烧鸡', 'meat', 'hui'),
    R('蜜汁红芋', 'sweet_soup', 'hui'),
    R('火腿炖甲鱼', 'meat', 'hui'),
    R('清炖马蹄鳖', 'savory_soup', 'hui'),
    R('板鸭冬瓜汤', 'savory_soup', 'hui'),
    R('酒酿汆鸡蛋', 'sweet_soup', 'hui'),
    // 日式 japanese
    R('天妇罗', 'meat', 'japanese'),
    R('照烧鸡排', 'meat', 'japanese'),
    R('照烧鲭鱼', 'meat', 'japanese'),
    R('味噌汤', 'savory_soup', 'japanese'),
    R('筑前煮', 'veg', 'japanese'),
    R('冷豆腐', 'veg', 'japanese'),
    R('茶碗蒸', 'savory_soup', 'japanese'),
    R('羊羹', 'sweet_soup', 'japanese'),
    R('铜锣烧', 'sweet_soup', 'japanese'),
    // 韩式 korean
    R('煎五花肉', 'meat', 'korean'),
    R('辣炒鸡排', 'meat', 'korean'),
    R('大酱汤', 'savory_soup', 'korean'),
    R('参鸡汤', 'savory_soup', 'korean'),
    R('炒杂菜', 'veg', 'korean'),
    R('拌菠菜', 'veg', 'korean'),
    R('辣白菜汤', 'savory_soup', 'korean'),
    R('松饼配蜂蜜', 'sweet_soup', 'korean'),
    R('米糕甜汤', 'sweet_soup', 'korean'),
    // 意式 italian
    R('番茄肉酱意面', 'meat', 'italian'),
    R('碳烤迷迭香羊排', 'meat', 'italian'),
    R('罗勒青酱面', 'veg', 'italian'),
    R('意式炒时蔬', 'veg', 'italian'),
    R('意式蔬菜汤', 'savory_soup', 'italian'),
    R('海鲜浓汤', 'savory_soup', 'italian'),
    R('意式米布丁', 'sweet_soup', 'italian'),
    R('提拉米苏', 'sweet_soup', 'italian'),
    // 法式 french
    R('红酒炖牛肉', 'meat', 'french'),
    R('油封鸭腿', 'meat', 'french'),
    R('烤蔬菜拼盘', 'veg', 'french'),
    R('洋葱汤', 'savory_soup', 'french'),
    R('经典清汤', 'savory_soup', 'french'),
    R('可丽饼配鲜果', 'sweet_soup', 'french'),
    R('舒芙蕾', 'sweet_soup', 'french'),
    // 印度 indian
    R('黄油鸡', 'meat', 'indian'),
    R('烤鸡块马萨拉', 'meat', 'indian'),
    R('黄扁豆咖喱', 'veg', 'indian'),
    R('花椰菜咖喱', 'veg', 'indian'),
    R('番茄扁豆汤', 'savory_soup', 'indian'),
    R('馕包羊肉汤', 'savory_soup', 'indian'),
    R('米布丁', 'sweet_soup', 'indian'),
    R('奶豆腐甜品', 'sweet_soup', 'indian'),
    // 泰式 thai
    R('泰式打抛猪肉', 'meat', 'thai'),
    R('绿咖喱鸡', 'meat', 'thai'),
    R('青木瓜沙拉', 'veg', 'thai'),
    R('飞天空心菜', 'veg', 'thai'),
    R('冬阴功汤', 'savory_soup', 'thai'),
    R('椰香鸡汤', 'savory_soup', 'thai'),
    R('芒果糯米饭', 'sweet_soup', 'thai'),
    R('椰奶红宝石', 'sweet_soup', 'thai'),
    // 墨西哥 mexican
    R('牛肉塔可', 'meat', 'mexican'),
    R('慢炖猪肉卷', 'meat', 'mexican'),
    R('黑豆蔬菜卷', 'veg', 'mexican'),
    R('炒仙人掌', 'veg', 'mexican'),
    R('玉米浓汤', 'savory_soup', 'mexican'),
    R('杂蔬鸡汤', 'savory_soup', 'mexican'),
    R('吉事果配巧克力', 'sweet_soup', 'mexican'),
    R('玉米布丁', 'sweet_soup', 'mexican')
]

export function filterRecommendedPool(
    kind: RecommendedDishKind | null,
    cuisineId: string | null
): RecommendedDish[] {
    return recommendedDishes.filter((d) => {
        if (kind && d.kind !== kind) return false
        if (cuisineId && d.cuisineId !== cuisineId) return false
        return true
    })
}

/** 从池子中不重复随机取至多 max 个菜名 */
export function pickRandomDishNames(pool: RecommendedDish[], max: number): string[] {
    if (pool.length === 0) return []
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const n = Math.min(max, pool.length)
    const out: string[] = []
    const seen = new Set<string>()
    for (const d of shuffled) {
        if (out.length >= n) break
        if (!seen.has(d.name)) {
            seen.add(d.name)
            out.push(d.name)
        }
    }
    return out
}

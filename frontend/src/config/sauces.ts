import type { SauceCategoryConfig, SauceCategory } from '@/types'

// 酱料分类配置
export const sauceCategories: SauceCategoryConfig[] = [
    {
        id: 'spicy',
        name: '辣味酱料',
        description: '各种辣椒酱、辣油、麻辣酱料',
        icon: '',
        color: 'bg-red-500',
        examples: ['辣椒酱', '蒜蓉辣椒酱', '麻辣油', '韩式辣椒酱', '泰式甜辣酱']
    },
    {
        id: 'garlic',
        name: '蒜香酱料',
        description: '以大蒜为主的香味酱料',
        icon: '',
        color: 'bg-green-500',
        examples: ['蒜蓉酱', '蒜泥白肉酱', '蒜香辣椒油', '黑蒜酱', '蒜蓉豆豉酱']
    },
    {
        id: 'sweet',
        name: '甜味酱料',
        description: '甜口酱料和果酱类',
        icon: '',
        color: 'bg-yellow-500',
        examples: ['甜面酱', '海鲜酱', '糖醋酱', '蜂蜜芥末酱', '果酱']
    },
    {
        id: 'complex',
        name: '复合调味酱',
        description: '多种调料混合的复合酱料',
        icon: '',
        color: 'bg-purple-500',
        examples: ['XO酱', '沙茶酱', '黑椒酱', '蘑菇酱', '咖喱酱']
    },
    {
        id: 'regional',
        name: '地方特色酱',
        description: '各地传统特色酱料',
        icon: '',
        color: 'bg-orange-500',
        examples: ['郫县豆瓣酱', '老干妈', '柱候酱', '海天黄豆酱', '东北大酱']
    },
    {
        id: 'fusion',
        name: '创新融合酱',
        description: '现代创新和中西融合酱料',
        icon: '',
        color: 'bg-pink-500',
        examples: ['芝士酱', '牛油果酱', '芝麻酱', '花生酱', '创意调味酱']
    }
]

// 使用场景配置
export const useCaseOptions = [
    { id: 'noodles', name: '拌面', icon: '' },
    { id: 'dipping', name: '蘸菜', icon: '' },
    { id: 'cooking', name: '炒菜', icon: '' },
    { id: 'bbq', name: '烧烤', icon: '' },
    { id: 'hotpot', name: '火锅', icon: '' }
]

// 预设酱料模板
export const sauceTemplates = [
    {
        name: '蒜蓉辣椒酱',
        category: 'spicy' as SauceCategory,
        tags: ['经典', '下饭', '万能'],
        spiceLevel: 4,
        sweetLevel: 1,
        saltLevel: 3,
        sourLevel: 1
    },
    {
        name: '甜面酱',
        category: 'sweet' as SauceCategory,
        tags: ['传统', '烤鸭', '甜口'],
        spiceLevel: 0,
        sweetLevel: 4,
        saltLevel: 2,
        sourLevel: 0
    },
    {
        name: 'XO酱',
        category: 'complex' as SauceCategory,
        tags: ['高级', '海鲜', '港式'],
        spiceLevel: 2,
        sweetLevel: 2,
        saltLevel: 4,
        sourLevel: 1
    },
    {
        name: '郫县豆瓣酱',
        category: 'regional' as SauceCategory,
        tags: ['川菜', '传统', '发酵'],
        spiceLevel: 3,
        sweetLevel: 1,
        saltLevel: 4,
        sourLevel: 2
    },
    {
        name: '蒜泥白肉酱',
        category: 'garlic' as SauceCategory,
        tags: ['川菜', '蒜香', '清爽'],
        spiceLevel: 1,
        sweetLevel: 1,
        saltLevel: 3,
        sourLevel: 3
    },
    {
        name: '芝麻花生酱',
        category: 'fusion' as SauceCategory,
        tags: ['创新', '香浓', '营养'],
        spiceLevel: 0,
        sweetLevel: 2,
        saltLevel: 2,
        sourLevel: 0
    }
]

// 口味等级描述
export const tasteDescriptions = {
    spice: ['不辣', '微辣', '中辣', '很辣', '超辣'],
    sweet: ['不甜', '微甜', '中甜', '很甜', '超甜'],
    salt: ['不咸', '微咸', '中咸', '很咸', '超咸'],
    sour: ['不酸', '微酸', '中酸', '很酸', '超酸']
}

// 难度等级描述
export const difficultyDescriptions = {
    easy: { name: '简单', color: 'text-green-600', description: '新手友好，步骤简单' },
    medium: { name: '中等', color: 'text-yellow-600', description: '需要一定经验' },
    hard: { name: '困难', color: 'text-red-600', description: '需要丰富经验和技巧' }
}

// 获取分类配置
export const getSauceCategoryById = (id: SauceCategory): SauceCategoryConfig | undefined => {
    return sauceCategories.find(category => category.id === id)
}

// 获取分类颜色
export const getCategoryColor = (category: SauceCategory): string => {
    const config = getSauceCategoryById(category)
    return config?.color || 'bg-gray-500'
}

// 获取分类图标
export const getCategoryIcon = (category: SauceCategory): string => {
    const config = getSauceCategoryById(category)
    return config?.icon || ''
}
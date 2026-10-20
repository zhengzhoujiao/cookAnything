import type { ZodiacConfig, AnimalConfig, MoodConfig, FortuneTeller } from '@/types'

// 十二星座配置
export const zodiacConfigs: ZodiacConfig[] = [
    {
        id: 'aries',
        name: '白羊座',
        symbol: '',
        element: '火',
        traits: ['热情', '冲动', '勇敢', '直率'],
        luckyColors: ['红色', '橙色'],
        dates: '3.21-4.19'
    },
    {
        id: 'taurus',
        name: '金牛座',
        symbol: '',
        element: '土',
        traits: ['稳重', '固执', '实际', '美食家'],
        luckyColors: ['绿色', '粉色'],
        dates: '4.20-5.20'
    },
    {
        id: 'gemini',
        name: '双子座',
        symbol: '',
        element: '风',
        traits: ['机智', '多变', '好奇', '善交际'],
        luckyColors: ['黄色', '银色'],
        dates: '5.21-6.21'
    },
    {
        id: 'cancer',
        name: '巨蟹座',
        symbol: '',
        element: '水',
        traits: ['温柔', '顾家', '敏感', '直觉强'],
        luckyColors: ['白色', '银色'],
        dates: '6.22-7.22'
    },
    {
        id: 'leo',
        name: '狮子座',
        symbol: '',
        element: '火',
        traits: ['自信', '慷慨', '领导力', '戏剧性'],
        luckyColors: ['金色', '橙色'],
        dates: '7.23-8.22'
    },
    {
        id: 'virgo',
        name: '处女座',
        symbol: '',
        element: '土',
        traits: ['完美主义', '细心', '实用', '分析力强'],
        luckyColors: ['深蓝', '灰色'],
        dates: '8.23-9.22'
    },
    {
        id: 'libra',
        name: '天秤座',
        symbol: '',
        element: '风',
        traits: ['和谐', '优雅', '犹豫', '社交'],
        luckyColors: ['粉色', '浅蓝'],
        dates: '9.23-10.23'
    },
    {
        id: 'scorpio',
        name: '天蝎座',
        symbol: '',
        element: '水',
        traits: ['神秘', '专注', '激情', '直觉'],
        luckyColors: ['深红', '黑色'],
        dates: '10.24-11.22'
    },
    {
        id: 'sagittarius',
        name: '射手座',
        symbol: '',
        element: '火',
        traits: ['自由', '乐观', '冒险', '哲学'],
        luckyColors: ['紫色', '深蓝'],
        dates: '11.23-12.21'
    },
    {
        id: 'capricorn',
        name: '摩羯座',
        symbol: '',
        element: '土',
        traits: ['务实', '有野心', '保守', '负责'],
        luckyColors: ['黑色', '深绿'],
        dates: '12.22-1.19'
    },
    {
        id: 'aquarius',
        name: '水瓶座',
        symbol: '',
        element: '风',
        traits: ['独立', '创新', '人道主义', '理想'],
        luckyColors: ['蓝色', '银色'],
        dates: '1.20-2.18'
    },
    {
        id: 'pisces',
        name: '双鱼座',
        symbol: '',
        element: '水',
        traits: ['梦幻', '同情心', '艺术', '直觉'],
        luckyColors: ['海蓝', '紫色'],
        dates: '2.19-3.20'
    }
]

// 十二生肖配置
export const animalConfigs: AnimalConfig[] = [
    {
        id: 'rat',
        name: '鼠',
        symbol: '',
        element: '水',
        traits: ['机智', '灵活', '适应力强', '节俭'],
        luckyNumbers: [2, 3],
        years: [2020, 2008, 1996, 1984, 1972, 1960]
    },
    {
        id: 'ox',
        name: '牛',
        symbol: '',
        element: '土',
        traits: ['勤劳', '稳重', '诚实', '固执'],
        luckyNumbers: [1, 9],
        years: [2021, 2009, 1997, 1985, 1973, 1961]
    },
    {
        id: 'tiger',
        name: '虎',
        symbol: '',
        element: '木',
        traits: ['勇敢', '自信', '竞争', '冲动'],
        luckyNumbers: [1, 3, 4],
        years: [2022, 2010, 1998, 1986, 1974, 1962]
    },
    {
        id: 'rabbit',
        name: '兔',
        symbol: '',
        element: '木',
        traits: ['温和', '谨慎', '优雅', '善良'],
        luckyNumbers: [3, 4, 6],
        years: [2023, 2011, 1999, 1987, 1975, 1963]
    },
    {
        id: 'dragon',
        name: '龙',
        symbol: '',
        element: '土',
        traits: ['威严', '热情', '创新', '领导'],
        luckyNumbers: [1, 6, 7],
        years: [2024, 2012, 2000, 1988, 1976, 1964]
    },
    {
        id: 'snake',
        name: '蛇',
        symbol: '',
        element: '火',
        traits: ['智慧', '神秘', '直觉', '优雅'],
        luckyNumbers: [2, 8, 9],
        years: [2025, 2013, 2001, 1989, 1977, 1965]
    },
    {
        id: 'horse',
        name: '马',
        symbol: '',
        element: '火',
        traits: ['自由', '热情', '独立', '冒险'],
        luckyNumbers: [2, 3, 7],
        years: [2026, 2014, 2002, 1990, 1978, 1966]
    },
    {
        id: 'goat',
        name: '羊',
        symbol: '',
        element: '土',
        traits: ['温柔', '艺术', '同情', '和平'],
        luckyNumbers: [3, 4, 5],
        years: [2027, 2015, 2003, 1991, 1979, 1967]
    },
    {
        id: 'monkey',
        name: '猴',
        symbol: '',
        element: '金',
        traits: ['聪明', '机智', '活泼', '好奇'],
        luckyNumbers: [1, 7, 8],
        years: [2028, 2016, 2004, 1992, 1980, 1968]
    },
    {
        id: 'rooster',
        name: '鸡',
        symbol: '',
        element: '金',
        traits: ['勤奋', '准时', '诚实', '自信'],
        luckyNumbers: [5, 7, 8],
        years: [2029, 2017, 2005, 1993, 1981, 1969]
    },
    {
        id: 'dog',
        name: '狗',
        symbol: '',
        element: '土',
        traits: ['忠诚', '诚实', '负责', '公正'],
        luckyNumbers: [3, 4, 9],
        years: [2030, 2018, 2006, 1994, 1982, 1970]
    },
    {
        id: 'pig',
        name: '猪',
        symbol: '',
        element: '水',
        traits: ['善良', '慷慨', '诚实', '乐观'],
        luckyNumbers: [2, 5, 8],
        years: [2031, 2019, 2007, 1995, 1983, 1971]
    }
]

// 心情配置
export const moodConfigs: MoodConfig[] = [
    {
        id: 'happy',
        name: '开心',
        emoji: '',
        color: 'text-yellow-500',
        cookingStyle: ['甜品', '色彩丰富', '庆祝菜品', '轻松制作'],
        description: '心情愉悦，适合制作色彩缤纷的美食'
    },
    {
        id: 'sad',
        name: '难过',
        emoji: '',
        color: 'text-blue-500',
        cookingStyle: ['温暖汤品', '治愈系', '家常菜', '慢炖'],
        description: '需要温暖治愈的食物来抚慰心灵'
    },
    {
        id: 'anxious',
        name: '焦虑',
        emoji: '',
        color: 'text-orange-500',
        cookingStyle: ['清淡菜品', '舒缓茶饮', '简单制作', '健康'],
        description: '选择简单清淡的食物，避免复杂制作'
    },
    {
        id: 'tired',
        name: '疲惫',
        emoji: '',
        color: 'text-gray-500',
        cookingStyle: ['营养补充', '快手菜', '能量食物', '简便'],
        description: '需要快速补充能量的营养食物'
    },
    {
        id: 'excited',
        name: '兴奋',
        emoji: '',
        color: 'text-red-500',
        cookingStyle: ['挑战菜品', '创新料理', '复杂制作', '实验'],
        description: '精力充沛，适合尝试有挑战性的菜品'
    },
    {
        id: 'calm',
        name: '平静',
        emoji: '',
        color: 'text-green-500',
        cookingStyle: ['素食', '清淡', '禅意料理', '慢节奏'],
        description: '心境平和，适合制作清淡素雅的菜品'
    },
    {
        id: 'angry',
        name: '愤怒',
        emoji: '',
        color: 'text-red-600',
        cookingStyle: ['辛辣菜品', '重口味', '发泄式烹饪', '刺激'],
        description: '通过制作重口味食物来释放情绪'
    },
    {
        id: 'nostalgic',
        name: '思念',
        emoji: '',
        color: 'text-purple-500',
        cookingStyle: ['怀旧菜品', '家乡味', '传统料理', '回忆'],
        description: '制作充满回忆的传统家乡菜'
    }
]

// 灵感推荐角色配置
export const fortuneTeller: FortuneTeller = {
    name: '今日灵感官',
    avatar: '',
    greetings: [
        '今天想吃什么，让我帮你想想...',
        '根据你的信息，我来给你推荐一道合适的菜...',
        '结合你的喜好和今天的状态，推荐来了...',
        '你的专属菜品推荐即将生成...'
    ],
    phrases: {
        daily: {
            opening: [
                '正在结合你的星座和生肖分析今日适合的口味...',
                '根据你的生日信息匹配今日菜品...',
                '综合个人特征，为你筛选今日菜品...'
            ],
            closing: [
                '这道菜很适合你今天的状态，试试看吧！',
                '根据分析，这是今天最推荐给你的菜品。',
                '希望这道推荐能让你今天吃得满意。'
            ],
            processing: [
                '正在分析个人特征...',
                '匹配今日菜品风格...',
                '生成专属推荐中...'
            ]
        },
        mood: {
            opening: [
                '了解你的心情，帮你选一道最合适的菜...',
                '根据你现在的状态，我来推荐...',
                '心情和饮食是有关联的，让我来帮你选...'
            ],
            closing: [
                '这道菜应该很适合你现在的状态，去试试吧！',
                '希望这道推荐能让你吃得开心一些。',
                '好好吃一顿，心情也会跟着好起来的。'
            ],
            processing: [
                '正在分析当前心情状态...',
                '匹配适合的菜品风格...',
                '整理推荐结果中...'
            ]
        },
        couple: {
            opening: [
                '分析两个人的共同口味偏好...',
                '找一道两个人都能喜欢的菜...',
                '适合一起做的菜品，来了...'
            ],
            closing: [
                '这道菜很适合你们一起动手做，享受烹饪过程！',
                '两个人一起做这道菜，应该会很有趣。',
                '希望这道推荐让你们的饭桌更热闹。'
            ],
            processing: [
                '正在分析双方口味特征...',
                '匹配适合合作的菜品...',
                '推荐结果生成中...'
            ]
        },
        number: {
            opening: [
                '用这个数字来决定今天的菜，很有趣...',
                '让数字帮你做选择...',
                '数字背后藏着一道菜，正在揭晓...'
            ],
            closing: [
                '这就是数字给你的答案，去试做吧！',
                '一道有意思的菜，就这么定了。',
                '数字的选择，也是美味的开始。'
            ],
            processing: [
                '正在解析数字含义...',
                '关联菜品特征中...',
                '生成推荐结果...'
            ]
        }
    },
    mysticalWords: [
        '吃好一顿饭，心情自然好。',
        '食材简单，做法用心，菜就好吃。',
        '今天想吃什么，就做什么，别纠结。',
        '好的菜谱是做出来的，不是想出来的。',
        '下厨是件有成就感的事，试试就知道。',
        '把食材用好，就是最好的料理。',
        '每一餐都值得认真对待。',
        '自己做的饭，总是比外卖更有味道。'
    ]
}

// 获取星座配置
export const getZodiacById = (id: string): ZodiacConfig | undefined => {
    return zodiacConfigs.find(zodiac => zodiac.id === id)
}

// 获取生肖配置
export const getAnimalById = (id: string): AnimalConfig | undefined => {
    return animalConfigs.find(animal => animal.id === id)
}

// 获取心情配置
export const getMoodById = (id: string): MoodConfig | undefined => {
    return moodConfigs.find(mood => mood.id === id)
}

// 获取随机占卜师话语
export const getRandomMysticalWord = (): string => {
    const words = fortuneTeller.mysticalWords
    return words[Math.floor(Math.random() * words.length)]
}

// 获取随机问候语
export const getRandomGreeting = (): string => {
    const greetings = fortuneTeller.greetings
    return greetings[Math.floor(Math.random() * greetings.length)]
}
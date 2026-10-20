import axios from 'axios'
import type {
    Recipe,
    CuisineType,
    NutritionAnalysis,
    WinePairing,
    SauceRecipe,
    SaucePreference,
    CustomSauceRequest,
    FortuneResult,
    DailyFortuneParams,
    MoodFortuneParams,
    CoupleFortuneParams,
    NumberFortuneParams
} from '@/types'
import { API_PATH_PREFIX } from '@/config/apiPrefix'

// 所有 AI 请求通过后端代理发起。空字符串表示与页面同源（Docker+Nginx 反代时常用）
const _envBackend = (import.meta as any).env.VITE_BACKEND_URL as string | undefined
const BACKEND_URL: string = _envBackend === '' ? '' : (_envBackend ?? '')

const createAiClient = () => {
    return axios.create({
        baseURL: BACKEND_URL,
        timeout: 300000,
        headers: { 'Content-Type': 'application/json' }
    })
}

export type GenerateRecipeItemKind = 'ingredients' | 'dish_names'

/**
 * 调用AI接口生成菜谱
 * @param ingredients 食材列表；在 itemKind 为 dish_names 时应为**一道菜名**单元素数组
 * @param cuisine 菜系信息
 * @param customPrompt 自定义提示词（可选）
 * @param options itemKind: dish_names 时按「菜名」而非「食材清单」理解
 */
export const generateRecipe = async (
    ingredients: string[],
    cuisine: CuisineType,
    customPrompt?: string,
    options?: { itemKind?: GenerateRecipeItemKind }
): Promise<Recipe> => {
    try {
        const aiClient = createAiClient()
        const itemKind: GenerateRecipeItemKind = options?.itemKind ?? 'ingredients'
        const dishName = itemKind === 'dish_names' && ingredients[0] ? ingredients[0] : null

        // 构建提示词
        let prompt =
            itemKind === 'dish_names' && dishName
                ? `${cuisine.prompt}

用户选定要做的菜名（这是菜名，不是采购食材列表）：${dishName}

请围绕上述菜名，在符合该主厨/菜系风格的前提下，输出一份**完整、可在家操作**的菜品做法。不要误解为只罗列食材。`
                : `${cuisine.prompt}

用户提供的食材：${ingredients.join('、')}`

        // 如果有自定义要求，添加到提示词中
        if (customPrompt) {
            prompt += `

用户的特殊要求：${customPrompt}`
        }

        prompt += `

请生成一个简单的菜谱，要求：
1. 食材清单要包含具体用量（如：猪肉300g、生抽2勺、盐1茶匙）
2. 制作步骤要详细具体，包含：
   - 具体的操作方法（如何切、如何炒、如何调味）
   - 准确的时间控制（预热时间、炒制时间、焖煮时间等）
   - 火候掌握（大火爆炒、中小火慢炖等）
   - 关键判断标准（颜色变化、香味散发、食材状态等）
3. 烹饪技巧要实用，包含关键要点和常见问题的避免方法
4. 每个步骤都要让新手能够理解和操作
5. 全文简洁：禁止冗长教学

请按照以下JSON格式返回菜谱：
{
  "name": "菜品名称",
  "ingredients": ["主料1 300g", "调料1 2勺", "配菜1 100g"],
  "steps": [
    {
      "step": 1,
      "description": "详细的操作步骤，包含具体方法、判断标准和注意事项",
      "time": 5,
      "temperature": "中火/大火/小火"
    }
  ],
  "cookingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["实用技巧1：具体的操作要点", "注意事项2：避免常见错误的方法"]
}`

        const systemContent =
            itemKind === 'dish_names' && dishName
                ? '你是一名家庭烹饪指导老师。用户给出的是**一道菜的名字**（不是采购食材表），请按主厨/菜系风格写出可操作的完整菜谱。只输出 JSON，不附加任何解释文字。'
                : '你是一名家庭烹饪指导老师，熟悉各地菜系的基础做法。根据用户给出的食材和菜系风格，输出一份步骤清晰、操作可行的菜谱，确保家庭厨房条件下也能顺利完成。只输出 JSON，不附加任何解释文字。'

        // 调用AI接口
        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: systemContent
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content

        // 清理响应内容，提取JSON部分
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const recipeData = JSON.parse(cleanResponse)

        // 构建完整的Recipe对象
        const recipe: Recipe = {
            id: `recipe-${cuisine.id}-${Date.now()}`,
            name: recipeData.name || `${cuisine.name}推荐菜品`,
            cuisine: cuisine.name,
            ingredients: recipeData.ingredients || ingredients,
            steps: recipeData.steps || [
                { step: 1, description: '准备所有食材', time: 5 },
                { step: 2, description: '按照传统做法烹饪', time: 20 }
            ],
            cookingTime: recipeData.cookingTime || 25,
            difficulty: recipeData.difficulty || 'medium',
            tips: recipeData.tips || ['注意火候控制', '调味要适中'],
            nutritionAnalysis: undefined,
            winePairing: undefined
        }

        return recipe
    } catch (error) {
        console.error(`生成${cuisine.name}菜谱失败:`, error)

        // 检查是否是400错误或其他特定错误
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as any
            if (axiosError.response?.status === 400) {
                throw new Error(`${cuisine.name}表示这个食材搭配太有挑战性了`)
            }
        }

        // 抛出友好的错误信息
        throw new Error(`${cuisine.name}暂时学不会这道菜`)
    }
}

/**
 * 生成一桌菜的菜单
 * @param config 一桌菜配置
 * @returns Promise<DishInfo[]>
 */
export const generateTableMenu = async (config: {
    dishCount: number
    flexibleCount: boolean
    tastes: string[]
    cuisineStyle: string
    diningScene: string
    nutritionFocus: string
    customRequirement: string
    customDishes: string[]
}): Promise<
    Array<{
        name: string
        description: string
        category: string
        tags: string[]
    }>
> => {
    try {
        // 构建提示词
        const tasteText = config.tastes.length > 0 ? config.tastes.join('、') : '适中'
        const sceneMap = {
            family: '家庭聚餐',
            friends: '朋友聚会',
            romantic: '浪漫晚餐',
            business: '商务宴请',
            festival: '节日庆祝',
            casual: '日常用餐'
        }
        const nutritionMap = {
            balanced: '营养均衡',
            protein: '高蛋白',
            vegetarian: '素食为主',
            low_fat: '低脂健康',
            comfort: '滋补养生'
        }
        const styleMap = {
            mixed: '混合菜系',
            chinese: '中式为主',
            western: '西式为主',
            japanese: '日式为主'
        }

        const styleText = (styleMap as Record<string, string>)[config.cuisineStyle] || '混合菜系'
        const sceneText = (sceneMap as Record<string, string>)[config.diningScene] || '家庭聚餐'
        const nutritionText = (nutritionMap as Record<string, string>)[config.nutritionFocus] || '营养均衡'

        let prompt = `请为我设计一桌菜，要求如下：
- ${config.flexibleCount ? `参考菜品数量：${config.dishCount}道菜（可以根据实际情况智能调整，重点是搭配合理）` : `菜品数量：${config.dishCount}道菜（请严格按照这个数量生成）`}
- 口味偏好：${tasteText}
- 菜系风格：${styleText}
- 用餐场景：${sceneText}
- 营养搭配：${nutritionText}`

        if (config.customDishes.length > 0) {
            prompt += `\n- 用户当前手里有的食材：${config.customDishes.join('、')}${
                config.flexibleCount
                    ? '（请尽量围绕这些食材设计一桌菜，可合理补充常见配料，不必每条菜名都强行写全所有食材）'
                    : '（请确保整桌菜单能主要消耗或体现这些食材，可拆成多道菜使用）'
            }`
        }

        if (config.customRequirement) {
            prompt += `\n- 特殊要求：${config.customRequirement}`
        }

        if (config.flexibleCount) {
            prompt += `

智能搭配原则：
1. 菜品数量可以灵活调整（建议在${Math.max(2, config.dishCount - 2)}-${config.dishCount + 2}道之间），重点是搭配合理、营养均衡
2. 每道菜应有特色，优先利用用户给出的食材，避免口味与结构过于重复
3. 若用户提供的食材种类较少，可适当减少总菜道数或丰富搭配方式，确保每道都有存在价值
4. 优先考虑多样性与营养，而不是机械凑满道数
5. 合理搭配主菜、素菜、汤品、凉菜、主食等
6. 菜名应是具体菜名（不是只列食材名），但做法上应体现对用户食材的利用`
        } else {
            prompt += `

固定数量原则：
1. 严格按照${config.dishCount}道菜的数量生成菜单
2. 在可能范围内让菜单体现用户提供的食材（多道菜可共享或分别使用这些食材）
3. 搭配合理、营养均衡，尽量避免无意义的重复
4. 合理分配主菜、素菜、汤品、凉菜、主食等`
        }

        prompt += `

请按照以下JSON格式返回菜单：
{
  "dishes": [
    {
      "name": "菜品名称",
      "description": "菜品简介和特色描述",
      "category": "主菜/素菜/汤品/凉菜/主食/甜品",
      "tags": ["标签1", "标签2", "标签3"]
    }
  ]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名擅长宴席规划的餐饮顾问。用户会提供「家中现有的食材」，请你据此设计一桌具体菜名与搭配（不是让用户再报菜名）。只输出 JSON，菜名用中文，不附加任何解释。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const menuData = JSON.parse(cleanResponse)
        return menuData.dishes || []
    } catch (error) {
        console.error('生成一桌菜菜单失败:', error)
        throw new Error('大厨表示这个菜单搭配太有挑战性了，请稍后重试')
    }
}

/**
 * 为一桌菜中的单个菜品生成详细菜谱
 * @param dishName 菜品名称
 * @param dishDescription 菜品描述
 * @param category 菜品分类
 * @returns Promise<Recipe>
 */
export const generateDishRecipe = async (dishName: string, dishDescription: string, category: string): Promise<Recipe> => {
    try {
        const prompt = `请为以下菜品生成详细的菜谱：
菜品名称：${dishName}
菜品描述：${dishDescription}
菜品分类：${category}

请生成一份详细实用的菜谱，要求：
1. 食材清单要包含具体用量和规格
2. 制作步骤要详细具体，包含：
   - 食材预处理方法（清洗、切配、腌制等）
   - 具体的烹饪操作（炒制手法、调味时机、火候控制）
   - 关键判断标准（颜色、香味、质地变化）
   - 每个步骤的预计时间
3. 烹饪技巧要实用，包含成功要点和失败避免
4. 适合家庭厨房操作，工具和材料容易获得

请按照以下JSON格式返回菜谱：
{
  "name": "菜品名称",
  "ingredients": ["主料1 具体用量", "调料1 具体用量"],
  "steps": [
    {
      "step": 1,
      "description": "详细的操作步骤，包含具体方法、时间节点和判断标准",
      "time": 5,
      "temperature": "具体火候描述"
    }
  ],
  "cookingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["实用技巧：具体操作要点", "注意事项：避免常见问题"]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名有多年经验的家庭烹饪导师，擅长将餐厅菜品的做法转化为家庭厨房可操作的步骤。请只输出 JSON，不要包含任何说明文字。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const recipeData = JSON.parse(cleanResponse)

        const recipe: Recipe = {
            id: `dish-recipe-${Date.now()}`,
            name: recipeData.name || dishName,
            cuisine: category,
            ingredients: recipeData.ingredients || ['主要食材', '调料'],
            steps: recipeData.steps || [
                { step: 1, description: '准备食材', time: 5 },
                { step: 2, description: '开始制作', time: 15 }
            ],
            cookingTime: recipeData.cookingTime || 20,
            difficulty: recipeData.difficulty || 'medium',
            tips: recipeData.tips || ['注意火候', '调味适中']
        }

        return recipe
    } catch (error) {
        console.error('生成菜品菜谱失败:', error)
        throw new Error('大厨表示这道菜太有挑战性了，请稍后重试')
    }
}

// 使用自定义提示词生成菜谱
export const generateCustomRecipe = async (ingredients: string[], customPrompt: string): Promise<Recipe> => {
    try {
        const prompt = `你是一位经验丰富的专业厨师，请根据用户提供的食材和特殊要求，生成详细实用的菜谱。

用户提供的食材：${ingredients.join('、')}

用户的特殊要求：${customPrompt}

请生成一份详细的菜谱，要求：
1. 充分利用用户提供的食材，合理搭配
2. 食材清单包含具体用量（如：鸡蛋2个、盐1茶匙、油2勺）
3. 制作步骤要详细具体：
   - 食材预处理（清洗、切配、腌制等具体方法）
   - 烹饪过程（炒制手法、调味时机、火候变化）
   - 关键判断点（颜色变化、香味散发、质地状态）
   - 每步骤的准确时间控制
4. 烹饪技巧要实用，包含成功秘诀和常见错误避免
5. 满足用户的特殊要求，如口味偏好、营养需求等

请按照以下JSON格式返回菜谱：
{
  "name": "菜品名称",
  "ingredients": ["主料1 具体用量", "调料1 具体用量"],
  "steps": [
    {
      "step": 1,
      "description": "详细的操作步骤，包含具体方法、判断标准和注意要点",
      "time": 5,
      "temperature": "具体火候描述"
    }
  ],
  "cookingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["实用技巧：具体操作要点", "注意事项：避免失败的关键"]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: '你是一名烹饪辅导员，善于根据用户的具体要求定制适合的菜谱方案。请只返回 JSON 格式的菜谱，不要添加任何额外文字。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2000,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const recipeData = JSON.parse(cleanResponse)

        const recipe: Recipe = {
            id: `recipe-custom-${Date.now()}`,
            name: recipeData.name || '自定义菜品',
            cuisine: '自定义',
            ingredients: recipeData.ingredients || ingredients,
            steps: recipeData.steps || [
                { step: 1, description: '准备所有食材', time: 5 },
                { step: 2, description: '按照要求烹饪', time: 20 }
            ],
            cookingTime: recipeData.cookingTime || 25,
            difficulty: recipeData.difficulty || 'medium',
            tips: recipeData.tips || ['根据个人口味调整', '注意火候控制'],
            nutritionAnalysis: undefined,
            winePairing: undefined
        }

        return recipe
    } catch (error) {
        console.error('生成自定义菜谱失败:', error)
        throw new Error('大厨表示这个自定义要求太有挑战性了，请稍后重试')
    }
}

// 流式生成多个菜系的菜谱
export const generateMultipleRecipesStream = async (
    ingredients: string[],
    cuisines: CuisineType[],
    onRecipeGenerated: (recipe: Recipe, index: number, total: number) => void,
    onRecipeError?: (error: Error, index: number, cuisine: CuisineType, total: number) => void,
    customPrompt?: string
): Promise<void> => {
    const total = cuisines.length
    let completedCount = 0

    // 为了更好的用户体验，我们不并行生成，而是依次生成
    // 这样用户可以看到一个个菜谱依次完成的效果
    for (let index = 0; index < cuisines.length; index++) {
        const cuisine = cuisines[index]
        try {
            // 添加一些随机延迟，让生成过程更自然
            const delay = 1000 + Math.random() * 2000 // 1-3秒的随机延迟
            await new Promise(resolve => setTimeout(resolve, delay))

            const recipe = await generateRecipe(ingredients, cuisine, customPrompt)
            completedCount++
            onRecipeGenerated(recipe, index, total)
        } catch (error) {
            console.error(`生成${cuisine.name}菜谱失败:`, error)

            // 调用错误回调，让前端可以显示友好的错误信息
            if (onRecipeError) {
                const friendlyError = new Error(`${cuisine.name}不会这道菜，哈哈`)
                onRecipeError(friendlyError, index, cuisine, total)
            }

            // 即使某个菜系失败，也继续生成其他菜系
            continue
        }
    }

    if (completedCount === 0) {
        throw new Error('所有菜系生成都失败了，请稍后重试')
    }

    if (completedCount < total) {
        console.warn(`${total - completedCount}个菜系生成失败，但已成功生成${completedCount}个菜谱`)
    }
}

/**
 * 获取菜谱的营养分析
 * @param recipe 菜谱信息
 * @returns Promise<NutritionAnalysis>
 */
export const getNutritionAnalysis = async (recipe: Recipe): Promise<NutritionAnalysis> => {
    try {
        const prompt = `请为以下菜谱生成详细的营养分析：
菜名：${recipe.name}
食材：${recipe.ingredients.join('、')}
烹饪方法：${recipe.steps.map(step => step.description).join('，')}

请按照以下JSON格式返回营养分析：
{
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 45,
    "fat": 12,
    "fiber": 8,
    "sodium": 800,
    "sugar": 6,
    "vitaminC": 30,
    "calcium": 150,
    "iron": 3
  },
  "healthScore": 8,
  "balanceAdvice": ["建议搭配蔬菜沙拉增加维生素", "可适量减少盐分"],
  "dietaryTags": ["高蛋白", "低脂"],
  "servingSize": "1人份"
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: '你是一名注册营养师，擅长分析食谱的营养构成并给出膳食建议。请只返回 JSON，内容用中文，不附加说明。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.5, // 使用更低的temperature以获得更准确的分析
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const nutritionData = JSON.parse(cleanResponse)
        return nutritionData
    } catch (error) {
        console.error('获取营养分析失败:', error)
        return generateFallbackNutrition(recipe.ingredients)
    }
}

/**
 * 获取菜谱的酒水搭配建议
 * @param recipe 菜谱信息
 * @returns Promise<WinePairing>
 */
export const getWinePairing = async (recipe: Recipe): Promise<WinePairing> => {
    try {
        const prompt = `请为以下菜谱推荐合适的饮品搭配：
菜名：${recipe.name}
菜系：${recipe.cuisine}
食材：${recipe.ingredients.join('、')}

请推荐一个最适合的接地气饮品，包括但不限于：
- 常见饮料：可乐、雪碧、橙汁、柠檬汁、苏打水、果汁等
- 茶饮：绿茶、红茶、乌龙茶、花茶、奶茶等
- 酒类：红酒、白酒、啤酒、清酒等（适合的话）
- 其他：豆浆、牛奶、酸奶、气泡水等

请按照以下JSON格式返回一个最佳饮品搭配建议：
{
  "name": "推荐饮品名称",
  "type": "soft_drink/tea/juice/alcoholic/dairy/other",
  "reason": "搭配理由说明",
  "servingTemperature": "冰镇/常温/热饮",
  "glassType": "杯子类型（可选）",
  "alcoholContent": "酒精度（无酒精填0%）",
  "flavor": "口感描述",
  "origin": "品牌或产地（可选）"
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名饮食搭配顾问，熟悉各类菜肴与饮品的风味匹配。优先推荐家庭日常能买到的饮料或茶饮。只输出 JSON，不附加任何解释。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const wineData = JSON.parse(cleanResponse)
        // 如果返回的是数组，取第一个元素
        if (Array.isArray(wineData)) {
            return wineData[0] || generateFallbackWinePairing({ id: 'custom', name: recipe.cuisine } as CuisineType, recipe.ingredients)
        }
        // 如果返回的是单个对象，直接返回
        return wineData
    } catch (error) {
        console.error('获取酒水搭配失败:', error)
        return generateFallbackWinePairing({ id: 'custom', name: recipe.cuisine } as CuisineType, recipe.ingredients)
    }
}

// 生成后备营养分析数据
const generateFallbackNutrition = (ingredients: string[]): NutritionAnalysis => {
    const baseCalories = ingredients.length * 50 + Math.floor(Math.random() * 100) + 200
    const hasVegetables = ingredients.some(ing => ['菜', '瓜', '豆', '萝卜', '白菜', '菠菜', '西红柿', '黄瓜', '茄子', '土豆'].some(veg => ing.includes(veg)))
    const hasMeat = ingredients.some(ing => ['肉', '鸡', '鱼', '虾', '蛋', '牛', '猪', '羊'].some(meat => ing.includes(meat)))
    const hasGrains = ingredients.some(ing => ['米', '面', '粉', '饭', '面条', '馒头'].some(grain => ing.includes(grain)))

    const dietaryTags: string[] = []
    if (hasVegetables && !hasMeat) dietaryTags.push('素食')
    if (hasMeat) dietaryTags.push('高蛋白')
    if (hasVegetables) dietaryTags.push('富含维生素')
    if (!hasGrains) dietaryTags.push('低碳水')
    if (baseCalories < 300) dietaryTags.push('低卡路里')

    const balanceAdvice: string[] = []
    if (!hasVegetables) balanceAdvice.push('建议搭配新鲜蔬菜增加维生素和膳食纤维')
    if (!hasMeat && !ingredients.some(ing => ['豆', '蛋', '奶'].some(protein => ing.includes(protein)))) {
        balanceAdvice.push('建议增加蛋白质来源，如豆类或蛋类')
    }
    if (hasGrains && hasMeat) balanceAdvice.push('营养搭配均衡，适合日常食用')
    if (ingredients.length > 5) balanceAdvice.push('食材丰富，营养全面')

    return {
        nutrition: {
            calories: baseCalories,
            protein: hasMeat ? 20 + Math.floor(Math.random() * 15) : 8 + Math.floor(Math.random() * 8),
            carbs: hasGrains ? 35 + Math.floor(Math.random() * 20) : 15 + Math.floor(Math.random() * 10),
            fat: hasMeat ? 12 + Math.floor(Math.random() * 8) : 5 + Math.floor(Math.random() * 5),
            fiber: hasVegetables ? 6 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 2),
            sodium: 600 + Math.floor(Math.random() * 400),
            sugar: 3 + Math.floor(Math.random() * 5),
            vitaminC: hasVegetables ? 20 + Math.floor(Math.random() * 30) : undefined,
            calcium: hasMeat || ingredients.some(ing => ['奶', '豆'].some(ca => ing.includes(ca))) ? 100 + Math.floor(Math.random() * 100) : undefined,
            iron: hasMeat ? 2 + Math.floor(Math.random() * 3) : undefined
        },
        healthScore: Math.floor(Math.random() * 3) + (hasVegetables ? 6 : 4) + (hasMeat ? 1 : 0),
        balanceAdvice: balanceAdvice.length > 0 ? balanceAdvice : ['营养搭配合理，可以放心享用'],
        dietaryTags: dietaryTags.length > 0 ? dietaryTags : ['家常菜'],
        servingSize: '1人份'
    }
}

// 生成后备饮品搭配数据
const generateFallbackWinePairing = (cuisine: CuisineType, ingredients: string[]): WinePairing => {
    const hasSpicy = ingredients.some(ing => ['辣椒', '花椒', '胡椒', '姜', '蒜', '洋葱'].some(spice => ing.includes(spice)))
    const hasMeat = ingredients.some(ing => ['肉', '鸡', '鱼', '虾', '蛋', '牛', '猪', '羊'].some(meat => ing.includes(meat)))
    const hasSeafood = ingredients.some(ing => ['鱼', '虾', '蟹', '贝', '海带', '紫菜'].some(seafood => ing.includes(seafood)))
    const isSweet = ingredients.some(ing => ['糖', '蜂蜜', '红薯', '南瓜', '玉米'].some(sweet => ing.includes(sweet)))
    const isOily = ingredients.some(ing => ['油', '肥肉', '五花肉', '排骨'].some(oil => ing.includes(oil)))

    // 接地气的饮品搭配方案
    const cuisineDrinkMap: Record<string, WinePairing> = {
        川菜大师: {
            name: '冰镇可乐',
            type: 'soft_drink',
            reason: '可乐的甜味和气泡能很好地平衡川菜的麻辣，清洁口腔，是最受欢迎的搭配',
            servingTemperature: '冰镇',
            glassType: '玻璃杯',
            alcoholContent: '0%',
            flavor: '甜味气泡，清爽解腻',
            origin: '可口可乐/百事可乐'
        },
        粤菜大师: {
            name: '柠檬蜂蜜茶',
            type: 'tea',
            reason: '柠檬的酸甜和蜂蜜的清香与粤菜的清淡鲜美完美搭配，有助消化',
            servingTemperature: '温热',
            glassType: '茶杯',
            alcoholContent: '0%',
            flavor: '酸甜清香，温润解腻',
            origin: '茶餐厅经典'
        },
        湘菜大师: {
            name: '雪碧',
            type: 'soft_drink',
            reason: '雪碧的柠檬味和气泡能中和湘菜的辣味，清爽解腻',
            servingTemperature: '冰镇',
            glassType: '玻璃杯',
            alcoholContent: '0%',
            flavor: '柠檬气泡，清新解辣',
            origin: '雪碧'
        },
        日式料理大师: {
            name: '绿茶',
            type: 'tea',
            reason: '绿茶的清香淡雅与日式料理的鲜美本味相得益彰，传统经典搭配',
            servingTemperature: '温热',
            glassType: '茶杯',
            alcoholContent: '0%',
            flavor: '清香甘甜，回味悠长',
            origin: '日本煎茶'
        },
        韩式料理大师: {
            name: '大麦茶',
            type: 'tea',
            reason: '大麦茶的清香能平衡韩式料理的重口味，是韩国餐厅的经典搭配',
            servingTemperature: '温热或冰镇',
            glassType: '茶杯',
            alcoholContent: '0%',
            flavor: '清香淡雅，去油解腻',
            origin: '韩式大麦茶'
        }
    }

    let drinkPairing: Partial<WinePairing> = cuisineDrinkMap[cuisine.name] || {}

    if (!drinkPairing.name) {
        if (hasSpicy) {
            // 辣菜搭配解辣饮品
            const spicyDrinks: WinePairing[] = [
                {
                    name: '冰镇可乐',
                    type: 'soft_drink',
                    reason: '可乐的甜味和气泡能很好地平衡辛辣食物，是最受欢迎的解辣饮品',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '甜味气泡，清爽解辣'
                },
                {
                    name: '酸梅汤',
                    type: 'juice',
                    reason: '酸梅汤的酸甜能中和辣味，传统的解辣饮品',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '酸甜开胃，生津止渴'
                },
                {
                    name: '冰镇雪碧',
                    type: 'soft_drink',
                    reason: '雪碧的柠檬味清新，气泡感强，很好地缓解辣味',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '柠檬气泡，清新解辣'
                }
            ]
            drinkPairing = spicyDrinks[Math.floor(Math.random() * spicyDrinks.length)]
        } else if (isOily || hasMeat) {
            // 油腻或肉类搭配解腻饮品
            const meatDrinks: WinePairing[] = [
                {
                    name: '柠檬汁',
                    type: 'juice',
                    reason: '柠檬的酸味能很好地解腻，促进消化',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '酸甜清香，解腻开胃'
                },
                {
                    name: '乌龙茶',
                    type: 'tea',
                    reason: '乌龙茶有很好的去油解腻效果，是肉类菜品的经典搭配',
                    servingTemperature: '热饮',
                    alcoholContent: '0%',
                    flavor: '清香回甘，去油解腻'
                },
                {
                    name: '橙汁',
                    type: 'juice',
                    reason: '橙汁的维生素C和酸味能平衡油腻感，口感清新',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '酸甜果香，清新解腻'
                }
            ]
            drinkPairing = meatDrinks[Math.floor(Math.random() * meatDrinks.length)]
        } else if (hasSeafood) {
            // 海鲜搭配清淡饮品
            const seafoodDrinks: WinePairing[] = [
                {
                    name: '柠檬苏打水',
                    type: 'soft_drink',
                    reason: '柠檬苏打水的清新口感与海鲜的鲜味完美搭配，不会掩盖海鲜本味',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '清新气泡，柠檬香气'
                },
                {
                    name: '白葡萄汁',
                    type: 'juice',
                    reason: '白葡萄汁的清甜与海鲜的鲜美相得益彰',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '清甜果香，口感清淡'
                }
            ]
            drinkPairing = seafoodDrinks[Math.floor(Math.random() * seafoodDrinks.length)]
        } else if (isSweet) {
            // 甜味菜品搭配平衡饮品
            drinkPairing = {
                name: '绿茶',
                type: 'tea',
                reason: '绿茶的清香能平衡甜腻感，清洁口腔',
                servingTemperature: '温热',
                alcoholContent: '0%',
                flavor: '清香淡雅，平衡甜腻'
            }
        } else {
            // 清淡菜品的通用搭配
            const lightDrinks: WinePairing[] = [
                {
                    name: '柠檬蜂蜜水',
                    type: 'other',
                    reason: '柠檬蜂蜜水清香甘甜，与清淡菜品搭配和谐',
                    servingTemperature: '温热或冰镇',
                    alcoholContent: '0%',
                    flavor: '酸甜清香，温润怡人'
                },
                {
                    name: '苹果汁',
                    type: 'juice',
                    reason: '苹果汁口感清甜，不会抢夺菜品风头',
                    servingTemperature: '冰镇',
                    alcoholContent: '0%',
                    flavor: '清甜果香，口感顺滑'
                },
                {
                    name: '茉莉花茶',
                    type: 'tea',
                    reason: '茉莉花茶清香淡雅，与清淡菜品相得益彰',
                    servingTemperature: '温热',
                    alcoholContent: '0%',
                    flavor: '花香清雅，回味甘甜'
                }
            ]
            drinkPairing = lightDrinks[Math.floor(Math.random() * lightDrinks.length)]
        }
    }

    return {
        name: drinkPairing.name || '柠檬蜂蜜水',
        type: drinkPairing.type || 'other',
        reason: drinkPairing.reason || '经典搭配，清香怡人',
        servingTemperature: drinkPairing.servingTemperature || '常温',
        glassType: drinkPairing.glassType || '玻璃杯',
        alcoholContent: drinkPairing.alcoholContent || '0%',
        flavor: drinkPairing.flavor || '清香怡人',
        origin: drinkPairing.origin || '家常饮品'
    }
}

/**
 * 测试AI服务连接
 * @returns Promise<boolean>
 */
export const testAIConnection = async (): Promise<boolean> => {
    try {
        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'user',
                    content: '你好'
                }
            ],
            max_tokens: 10
        })
        return response.status === 200
    } catch (error) {
        console.error('AI服务连接测试失败:', error)
        return false
    }
}

/**
 * 根据菜名生成详细菜谱
 * @param dishName 菜品名称
 * @returns Promise<Recipe>
 */
export const generateDishRecipeByName = async (dishName: string): Promise<Recipe> => {
    try {
        const prompt = `请为"${dishName}"这道菜生成详细的制作教程。

要求：
1. 提供完整的食材清单，包含具体用量和规格（如：五花肉500g、生抽3勺、料酒2勺）
2. 详细的制作步骤，每个步骤要包含：
   - 具体的操作方法和技巧
   - 准确的时间控制和火候掌握
   - 关键的判断标准（颜色、香味、质地变化）
   - 重要的注意事项和技巧要点
3. 实用的烹饪技巧和专业建议
4. 如果是地方菜，请说明其特色和传统做法
5. 让家庭厨师也能轻松掌握的详细指导

请按照以下JSON格式返回菜谱：
{
  "name": "菜品名称",
  "ingredients": ["主料1 具体用量", "调料1 具体用量", "配菜1 具体用量"],
  "steps": [
    {
      "step": 1,
      "description": "详细的步骤描述，包含具体操作方法、判断标准和关键技巧",
      "time": 5,
      "temperature": "具体火候描述（如：中火加热至冒烟）"
    }
  ],
  "cookingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["实用技巧1：具体的操作要点和成功秘诀", "注意事项2：避免常见错误的关键方法"]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名擅长整理菜谱教程的厨师，能根据菜名给出详细且家庭友好的制作步骤。只返回 JSON 格式，用中文，不要额外说明。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            stream: false
        })

        // 解析AI响应
        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const recipeData = JSON.parse(cleanResponse)

        // 构建完整的Recipe对象
        const recipe: Recipe = {
            id: `dish-search-${Date.now()}`,
            name: recipeData.name || dishName,
            cuisine: '传统菜谱',
            ingredients: recipeData.ingredients || ['主要食材', '调料'],
            steps: recipeData.steps || [
                { step: 1, description: '准备所有食材', time: 5 },
                { step: 2, description: '按照传统方法制作', time: 20 }
            ],
            cookingTime: recipeData.cookingTime || 25,
            difficulty: recipeData.difficulty || 'medium',
            tips: recipeData.tips || ['注意火候控制', '调味要适中'],
            nutritionAnalysis: undefined,
            winePairing: undefined
        }

        return recipe
    } catch (error) {
        console.error(`生成"${dishName}"菜谱失败:`, error)
        throw new Error(`大厨表示"${dishName}"这道菜太有挑战性了，请稍后重试`)
    }
}

/**
 * 根据酱料名称生成详细制作方法
 * @param sauceName 酱料名称
 * @returns Promise<SauceRecipe>
 */
export const generateSauceRecipe = async (sauceName: string): Promise<SauceRecipe> => {
    try {
        const prompt = `请为"${sauceName}"这种酱料生成详细的制作教程。

要求：
1. 提供完整的食材清单（主料、辅料、调料）
2. 详细的制作步骤，包含具体操作方法、时间、温度控制
3. 实用的制作技巧和注意事项
4. 保存方法和保质期信息
5. 推荐的搭配菜品
6. 口味特点描述

请按照以下JSON格式返回酱料配方：
{
  "name": "酱料名称",
  "category": "spicy/garlic/sweet/complex/regional/fusion",
  "ingredients": ["主料1 200g", "调料1 适量", "调料2 1勺"],
  "steps": [
    {
      "step": 1,
      "description": "详细的步骤描述",
      "time": 5,
      "temperature": "中火",
      "technique": "炒制"
    }
  ],
  "makingTime": 30,
  "difficulty": "easy/medium/hard",
  "tips": ["制作技巧1", "注意事项2"],
  "storage": {
    "method": "密封冷藏",
    "duration": "1个月",
    "temperature": "4°C"
  },
  "pairings": ["搭配菜品1", "搭配菜品2"],
  "tags": ["标签1", "标签2"],
  "spiceLevel": 3,
  "sweetLevel": 1,
  "saltLevel": 4,
  "sourLevel": 2,
  "description": "酱料特色描述"
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名调料研究者，熟悉各类酱料的配方与制作工艺。根据酱料名称输出详细的制作说明。只返回 JSON，用中文，不要额外内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const sauceData = JSON.parse(cleanResponse)

        const sauceRecipe: SauceRecipe = {
            id: `sauce-${Date.now()}`,
            name: sauceData.name || sauceName,
            category: sauceData.category || 'complex',
            ingredients: sauceData.ingredients || ['主要食材', '调料'],
            steps: sauceData.steps || [
                { step: 1, description: '准备所有食材', time: 5 },
                { step: 2, description: '按照传统方法制作', time: 20 }
            ],
            makingTime: sauceData.makingTime || 25,
            difficulty: sauceData.difficulty || 'medium',
            tips: sauceData.tips || ['注意火候控制', '调味要适中'],
            storage: sauceData.storage || {
                method: '密封保存',
                duration: '1周',
                temperature: '常温'
            },
            pairings: sauceData.pairings || ['面条', '蔬菜'],
            tags: sauceData.tags || ['家常', '经典'],
            spiceLevel: sauceData.spiceLevel || 2,
            sweetLevel: sauceData.sweetLevel || 2,
            saltLevel: sauceData.saltLevel || 3,
            sourLevel: sauceData.sourLevel || 2,
            description: sauceData.description || '经典酱料配方'
        }

        return sauceRecipe
    } catch (error) {
        console.error(`生成"${sauceName}"酱料配方失败:`, error)
        throw new Error(`酱料大师表示"${sauceName}"这个配方太有挑战性了，请稍后重试`)
    }
}

/**
 * 根据用户偏好推荐酱料
 * @param preferences 用户偏好配置
 * @returns Promise<string[]>
 */
export const recommendSauces = async (preferences: SaucePreference): Promise<string[]> => {
    try {
        const useCaseMap = {
            noodles: '拌面',
            dipping: '蘸菜',
            cooking: '炒菜',
            bbq: '烧烤',
            hotpot: '火锅'
        }

        const useCaseText = preferences.useCase.map(uc => (useCaseMap as Record<string, string>)[uc] || uc).join('、')
        const ingredientsText = preferences.availableIngredients.length > 0 ? preferences.availableIngredients.join('、') : '无特殊要求'

        const prompt = `请根据以下用户偏好推荐合适的酱料：

用户偏好：
- 辣度偏好：${preferences.spiceLevel}/5
- 甜度偏好：${preferences.sweetLevel}/5  
- 咸度偏好：${preferences.saltLevel}/5
- 酸度偏好：${preferences.sourLevel}/5
- 使用场景：${useCaseText}
- 现有食材：${ingredientsText}

请**恰好推荐 3 种**最适合的酱料，按匹配度从高到低排序（只输出 3 个名称，不要多也不要少）。

请按照以下JSON格式返回推荐结果：
{
  "recommendations": [
    "酱料名称1",
    "酱料名称2",
    "酱料名称3"
  ]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: '你是一名食品顾问，擅长根据用户口味和使用场景推荐合适的酱料。只返回 JSON，用中文，不要额外说明。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const recommendationData = JSON.parse(cleanResponse)
        const list: string[] = recommendationData.recommendations || []
        return list.slice(0, 3).filter((n: string) => typeof n === 'string' && n.trim())
    } catch (error) {
        console.error('获取酱料推荐失败:', error)
        throw new Error('酱料大师暂时想不出好的推荐，请稍后重试')
    }
}

/**
 * 创建自定义酱料配方
 * @param request 自定义酱料创作请求
 * @returns Promise<SauceRecipe>
 */
export const createCustomSauce = async (request: CustomSauceRequest): Promise<SauceRecipe> => {
    try {
        const baseTypeMap = {
            oil: '油性酱料',
            water: '水性酱料',
            paste: '膏状酱料',
            granular: '颗粒状酱料'
        }

        const flavorMap = {
            spicy: '辣味',
            sweet: '甜味',
            sour: '酸味',
            umami: '鲜味',
            aromatic: '香味'
        }

        const prompt = `请根据以下要求创作一个独特的酱料配方：

创作要求：
- 基础类型：${baseTypeMap[request.baseType]}
- 主要风味：${flavorMap[request.flavorDirection]}
- 特殊食材：${request.specialIngredients.join('、')}
- 期望口感：${request.expectedTexture}
- 用途：${request.intendedUse}
${request.customRequirements ? `- 特殊要求：${request.customRequirements}` : ''}

请创作一个创新的酱料配方，要有独特性和实用性。

请按照以下JSON格式返回酱料配方：
{
  "name": "创新酱料名称",
  "category": "fusion",
  "ingredients": ["主料1 200g", "调料1 适量"],
  "steps": [
    {
      "step": 1,
      "description": "详细步骤描述",
      "time": 5,
      "temperature": "中火",
      "technique": "制作技法"
    }
  ],
  "makingTime": 30,
  "difficulty": "medium",
  "tips": ["创作技巧1", "注意事项2"],
  "storage": {
    "method": "保存方法",
    "duration": "保质期",
    "temperature": "保存温度"
  },
  "pairings": ["搭配建议1", "搭配建议2"],
  "tags": ["创新", "自制"],
  "spiceLevel": 3,
  "sweetLevel": 2,
  "saltLevel": 3,
  "sourLevel": 2,
  "description": "创新酱料特色描述"
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: '你是一名有创意的食品研发工程师，擅长根据需求设计新型酱料配方。只返回 JSON，用中文，不要额外内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.9,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const sauceData = JSON.parse(cleanResponse)

        const customSauce: SauceRecipe = {
            id: `custom-sauce-${Date.now()}`,
            name: sauceData.name || '自创酱料',
            category: 'fusion',
            ingredients: sauceData.ingredients || ['创新食材'],
            steps: sauceData.steps || [
                { step: 1, description: '准备创新食材', time: 5 },
                { step: 2, description: '按照创意方法制作', time: 20 }
            ],
            makingTime: sauceData.makingTime || 25,
            difficulty: sauceData.difficulty || 'medium',
            tips: sauceData.tips || ['发挥创意', '调整口味'],
            storage: sauceData.storage || {
                method: '密封保存',
                duration: '1周',
                temperature: '冷藏'
            },
            pairings: sauceData.pairings || ['创意搭配'],
            tags: sauceData.tags || ['创新', '自制'],
            spiceLevel: sauceData.spiceLevel || 2,
            sweetLevel: sauceData.sweetLevel || 2,
            saltLevel: sauceData.saltLevel || 3,
            sourLevel: sauceData.sourLevel || 2,
            description: sauceData.description || '独特的自创酱料'
        }

        return customSauce
    } catch (error) {
        console.error('创建自定义酱料失败:', error)
        throw new Error('酱料大师表示这个自定义配方太有挑战性了，请稍后重试')
    }
}

/**
 * 获取酱料搭配建议
 * @param sauceName 酱料名称
 * @returns Promise<string[]>
 */
export const getSaucePairings = async (sauceName: string): Promise<string[]> => {
    try {
        const prompt = `请为"${sauceName}"这种酱料推荐最佳的搭配菜品和使用方法。

要求：
1. 推荐5-8种最适合的搭配菜品
2. 说明具体的使用方法
3. 考虑不同的烹饪场景

请按照以下JSON格式返回搭配建议：
{
  "pairings": [
    "搭配菜品1 - 使用方法",
    "搭配菜品2 - 使用方法",
    "搭配菜品3 - 使用方法"
  ]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content: '你是一名美食编辑，熟悉各种酱料的用法和搭配规律。只返回 JSON，用中文，不要额外说明。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const pairingData = JSON.parse(cleanResponse)
        return pairingData.pairings || []
    } catch (error) {
        console.error('获取酱料搭配建议失败:', error)
        return ['面条 - 拌面使用', '蔬菜 - 蘸食使用', '肉类 - 调味使用']
    }
}

/**
 * 生成今日运势菜
 * @param params 运势参数
 * @returns Promise<FortuneResult>
 */
export const generateDailyFortune = async (params: DailyFortuneParams): Promise<FortuneResult> => {
    try {
        const prompt = `你是一位神秘的料理占卜师，请根据以下信息为用户推荐今日幸运菜：

星座：${params.zodiac}
生肖：${params.animal}
日期：${params.date}

请结合星座特性、生肖属性和今日能量，推荐一道能带来好运的菜品。

请按照以下JSON格式返回占卜结果：
{
  "dishName": "菜品名称",
  "reason": "选择这道菜的占卜理由",
  "luckyIndex": 8,
  "description": "详细的占卜解析和菜品介绍",
  "tips": ["烹饪技巧1", "幸运提示2"],
  "difficulty": "medium",
  "cookingTime": 30,
  "mysticalMessage": "神秘的占卜师话语",
  "ingredients": ["主要食材1", "主要食材2"],
  "steps": ["制作步骤1", "制作步骤2"]
}`

        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名懂得星座和生肖文化的美食推荐顾问，能结合节气和个人属性推荐合适的菜品。只返回 JSON，用中文，不要额外内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const fortuneData = JSON.parse(cleanResponse)

        const fortune: FortuneResult = {
            id: `daily-fortune-${Date.now()}`,
            type: 'daily',
            date: params.date,
            dishName: fortuneData.dishName || '幸运料理',
            reason: fortuneData.reason || '星座与生肖的神秘指引',
            luckyIndex: fortuneData.luckyIndex || Math.floor(Math.random() * 3) + 7,
            description: fortuneData.description || '这道菜将为您带来今日好运',
            tips: fortuneData.tips || ['用心制作', '保持好心情'],
            difficulty: fortuneData.difficulty || 'medium',
            cookingTime: fortuneData.cookingTime || 30,
            mysticalMessage: fortuneData.mysticalMessage || '命运之轮正在转动，美味即将降临...',
            ingredients: fortuneData.ingredients || [],
            steps: fortuneData.steps || []
        }

        return fortune
    } catch (error) {
        console.error('生成今日运势菜失败:', error)
        throw new Error('占卜师暂时无法感应到星象，请稍后重试')
    }
}

/**
 * 生成心情料理
 * @param params 心情参数
 * @returns Promise<FortuneResult>
 */
export const generateMoodCooking = async (params: MoodFortuneParams): Promise<FortuneResult> => {
    try {
        const moodText = params.moods.join('、')
        const intensityText = ['很轻微', '轻微', '一般', '强烈', '非常强烈'][params.intensity - 1]

        const prompt = `你是一位擅长情感治愈的料理占卜师，请根据以下心情状态推荐治愈菜品：

当前心情：${moodText}
情绪强度：${intensityText}

请推荐一道能够治愈这种心情的菜品，并给出温暖的情感分析。

请按照以下JSON格式返回占卜结果：
{
  "dishName": "菜品名称",
  "reason": "这道菜如何治愈当前心情",
  "luckyIndex": 7,
  "description": "详细的情感分析和菜品治愈功效",
  "tips": ["情感治愈建议1", "烹饪心得2"],
  "difficulty": "easy",
  "cookingTime": 25,
  "mysticalMessage": "温暖治愈的话语",
  "ingredients": ["治愈食材1", "治愈食材2"],
  "steps": ["治愈步骤1", "治愈步骤2"]
}`

        const aiClient = createAiClient()
        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一位温暖而智慧的情感治愈师，深谙美食与情感的关系。你善于通过菜品来抚慰人心，话语温暖治愈。请严格按照JSON���式返回，不要包含任何其他文字。请务必用中文回答。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const fortuneData = JSON.parse(cleanResponse)

        const fortune: FortuneResult = {
            id: `mood-fortune-${Date.now()}`,
            type: 'mood',
            date: new Date().toISOString().split('T')[0],
            dishName: fortuneData.dishName || '治愈料理',
            reason: fortuneData.reason || '这道菜能温暖你的心',
            luckyIndex: fortuneData.luckyIndex || Math.floor(Math.random() * 3) + 6,
            description: fortuneData.description || '美食是最好的情感治愈师',
            tips: fortuneData.tips || ['慢慢品味', '感受温暖'],
            difficulty: fortuneData.difficulty || 'easy',
            cookingTime: fortuneData.cookingTime || 25,
            mysticalMessage: fortuneData.mysticalMessage || '让美食抚慰你的心灵，一切都会好起来的...',
            ingredients: fortuneData.ingredients || [],
            steps: fortuneData.steps || []
        }

        return fortune
    } catch (error) {
        console.error('生成心情料理失败:', error)
        throw new Error('情感占卜师暂时感应不到你的心情，请稍后重试')
    }
}

/**
 * 生成缘分配菜
 * @param params 双人参数
 * @returns Promise<FortuneResult>
 */
export const generateCoupleCooking = async (params: CoupleFortuneParams): Promise<FortuneResult> => {
    try {
        const prompt = `你是一位专门分析人际关系的料理占卜师，请分析两人的配菜缘分：

第一人：
- 星座：${params.user1.zodiac}
- 生肖：${params.user1.animal}
- 性格：${params.user1.personality.join('、')}

第二人：
- 星座：${params.user2.zodiac}
- 生肖：${params.user2.animal}
- 性格：${params.user2.personality.join('、')}

请分析两人的配菜默契度，推荐适合合作制作的菜品。

请按照以下JSON格式返回占卜结果：
{
  "dishName": "适合合作的菜品名称",
  "reason": "为什么这道菜适合你们一起做",
  "luckyIndex": 8,
  "description": "详细的缘分分析和配菜建议",
  "tips": ["合作建议1", "默契提升技巧2"],
  "difficulty": "medium",
  "cookingTime": 40,
  "mysticalMessage": "关于缘分和合作的神秘话语",
  "ingredients": ["需要合作的食材1", "需要合作的食材2"],
  "steps": ["合作步骤1", "合作步骤2"]
}`
        const aiClient = createAiClient()

        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名了解人际互动与饮食习惯的生活顾问，擅长为有共同用餐需求的人推荐适合一起制作的菜品。只返回 JSON，用中文，不要额外内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const fortuneData = JSON.parse(cleanResponse)

        const fortune: FortuneResult = {
            id: `couple-fortune-${Date.now()}`,
            type: 'couple',
            date: new Date().toISOString().split('T')[0],
            dishName: fortuneData.dishName || '缘分料理',
            reason: fortuneData.reason || '你们的星座组合很适合这道菜',
            luckyIndex: fortuneData.luckyIndex || Math.floor(Math.random() * 3) + 7,
            description: fortuneData.description || '这道菜将增进你们的默契',
            tips: fortuneData.tips || ['互相配合', '享受过程'],
            difficulty: fortuneData.difficulty || 'medium',
            cookingTime: fortuneData.cookingTime || 40,
            mysticalMessage: fortuneData.mysticalMessage || '缘分天注定，美食见真情...',
            ingredients: fortuneData.ingredients || [],
            steps: fortuneData.steps || []
        }

        return fortune
    } catch (error) {
        console.error('生成缘分配菜失败:', error)
        throw new Error('缘分占卜师暂时无法感应到你们的默契，请稍后重试')
    }
}

/**
 * 生成幸运数字菜
 * @param params 数字参数
 * @returns Promise<FortuneResult>
 */
export const generateNumberFortune = async (params: NumberFortuneParams): Promise<FortuneResult> => {
    try {
        const numberSource = params.isRandom ? '随机生成' : '用户选择'

        const prompt = `你是一位精通数字占卜的料理大师，请根据幸运数字推荐菜品：

幸运数字：${params.number}
数字来源：${numberSource}

请解析这个数字的寓意，并推荐对应的幸运菜品。

请按照以下JSON格式返回占卜结果：
{
  "dishName": "与数字相关的菜品名称",
  "reason": "数字寓意和选择理由",
  "luckyIndex": 9,
  "description": "数字占卜解析和菜品象征意义",
  "tips": ["数字相关的幸运建议1", "制作要点2"],
  "difficulty": "medium",
  "cookingTime": 35,
  "mysticalMessage": "关于数字和命运的神秘话语",
  "ingredients": ["象征性食材1", "象征性食材2"],
  "steps": ["制作步骤1", "制作步骤2"]
}`

        const aiClient = createAiClient()
        const response = await aiClient.post(`${API_PATH_PREFIX}/ai/chat`, {
            messages: [
                {
                    role: 'system',
                    content:
                        '你是一名擅长用创意方式推荐菜品的美食策划人，能根据用户输入的数字设计有趣的菜品推荐理由。只返回 JSON，用中文，不要额外内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.8,
            stream: false
        })

        const aiResponse = response.data.choices[0].message.content
        let cleanResponse = aiResponse.trim()
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
        }

        const fortuneData = JSON.parse(cleanResponse)

        const fortune: FortuneResult = {
            id: `number-fortune-${Date.now()}`,
            type: 'number',
            date: new Date().toISOString().split('T')[0],
            dishName: fortuneData.dishName || '数字料理',
            reason: fortuneData.reason || `数字${params.number}带来的神秘指引`,
            luckyIndex: fortuneData.luckyIndex || Math.floor(Math.random() * 3) + 7,
            description: fortuneData.description || '数字中蕴含着美食的秘密',
            tips: fortuneData.tips || ['相信数字的力量', '用心制作'],
            difficulty: fortuneData.difficulty || 'medium',
            cookingTime: fortuneData.cookingTime || 35,
            mysticalMessage: fortuneData.mysticalMessage || '数字是宇宙的语言，美食是心灵的慰藉...',
            ingredients: fortuneData.ingredients || [],
            steps: fortuneData.steps || []
        }

        return fortune
    } catch (error) {
        console.error('生成幸运数字菜失败:', error)
        throw new Error('数字占卜师暂时无法解读这个数字，请稍后重试')
    }
}

// 模型与服务方密钥由后端管理，不导出浏览器端服务方配置

/**
 * 通用聊天（流式）
 * @param messages 对话历史
 * @param onDelta 每次增量文本回调
 * @param onComplete 结束回调（携带完整文本）
 * @param onError 错误回调
 */
export const chatStream = async (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    onDelta: (deltaText: string) => void,
    onComplete?: (fullText: string) => void,
    onError?: (err: unknown) => void
): Promise<void> => {
    const url = BACKEND_URL.replace(/\/$/, '') + `${API_PATH_PREFIX}/ai/chat`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    const body = JSON.stringify({
        messages,
        stream: true
    })

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        })

        if (!response.ok || !response.body) {
            throw new Error(`请求失败: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let fullText = ''

        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            // 以SSE事件为单位切分
            const parts = buffer.split(/\n\n/)
            buffer = parts.pop() || ''

            for (const part of parts) {
                const lines = part
                    .split('\n')
                    .map(l => l.trim())
                    .filter(Boolean)
                for (const line of lines) {
                    if (!line.startsWith('data:')) continue
                    const data = line.slice(5).trim()
                    if (data === '[DONE]') {
                        if (onComplete) onComplete(fullText)
                        return
                    }
                    try {
                        const json = JSON.parse(data)
                        // 兼容OpenAI/同构流式规范
                        const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.message?.content ?? ''
                        if (delta) {
                            fullText += delta
                            onDelta(delta)
                        }
                    } catch (e) {
                        // 非JSON行，忽略
                        continue
                    }
                }
            }
        }

        // 读流结束但未收到DONE
        if (onComplete) onComplete(fullText)
    } catch (err) {
        if (onError) onError(err)
        else console.error('chatStream error:', err)
        throw err
    }
}

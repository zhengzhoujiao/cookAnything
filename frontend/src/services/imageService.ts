import type { Recipe } from '@/types'
import { API_PATH_PREFIX } from '@/config/apiPrefix'

export interface GeneratedImage {
    url: string
    id: string
}

// 空字符串表示与页面同源（Docker+Nginx 反代）
const _envBackend = (import.meta as any).env.VITE_BACKEND_URL as string | undefined
const BACKEND_URL: string = _envBackend === '' ? '' : (_envBackend ?? '')

export const generateRecipeImage = async (recipe: Recipe): Promise<GeneratedImage> => {
    const prompt = buildImagePrompt(recipe)

    try {
        const response = await fetch(`${BACKEND_URL}${API_PATH_PREFIX}/ai/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 尺寸/水印/返回格式由管理端默认（与火山 OpenAI 文生图示例：2K、url、watermark 一致）
            body: JSON.stringify({
                prompt,
                n: 1,
            })
        })

        if (!response.ok) {
            throw new Error(`图片生成请求失败: ${response.status}`)
        }

        const data = await response.json()

        if (data.data && data.data.length > 0) {
            return {
                url: data.data[0].url,
                id: `${recipe.id}-${Date.now()}`
            }
        } else {
            throw new Error('图片生成服务返回数据格式错误')
        }
    } catch (error) {
        console.error('生成图片失败:', error)
        throw error
    }
}

const buildImagePrompt = (recipe: Recipe): string => {
    const mainIngredients = recipe.ingredients.slice(0, 4).join(', ')
    const styleName = recipe.cuisine.replace('厨师', '').replace('料理', '').trim()

    return `A beautifully plated ${styleName} dish called "${recipe.name}", featuring ${mainIngredients}. Shot in natural soft lighting, close-up food photography, vibrant colors, clean white background, restaurant quality presentation, 4K resolution, professional food styling.`
}

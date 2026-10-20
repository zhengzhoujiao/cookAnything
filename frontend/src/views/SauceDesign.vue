<template>
    <div class="min-h-screen bg-green-50 px-2 pb-16 page-top-gap">
        <!-- 全局导航 -->
        <GlobalNavigation />
        <div class="max-w-7xl mx-auto">
            <!-- 智能推荐配置区域 -->
            <div class="mb-8">
                <div class="bg-blue-500 text-white px-4 py-2 rounded-t-lg border border-gray-200 shadow-sm border-b-0 inline-block">
                    <span class="font-bold">1.智能推荐</span>
                </div>
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg rounded-tl-none p-4">
                    <div class="grid grid-cols-1 gap-6">
                        <!-- 口味偏好 -->
                        <div>
                            <h3 class="font-bold text-lg mb-4 text-gray-800">口味偏好</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                        <span>辣度</span>
                                        <span class="text-red-600 font-bold">{{ preferences.spiceLevel }}</span>
                                    </label>
                                    <input
                                        v-model="preferences.spiceLevel"
                                        type="range"
                                        min="1"
                                        max="5"
                                        class="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider-red"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                        <span>甜度</span>
                                        <span class="text-emerald-700 font-bold">{{ preferences.sweetLevel }}</span>
                                    </label>
                                    <input
                                        v-model="preferences.sweetLevel"
                                        type="range"
                                        min="1"
                                        max="5"
                                        class="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer slider-yellow"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                        <span>咸度</span>
                                        <span class="text-blue-600 font-bold">{{ preferences.saltLevel }}</span>
                                    </label>
                                    <input
                                        v-model="preferences.saltLevel"
                                        type="range"
                                        min="1"
                                        max="5"
                                        class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                        <span>酸度</span>
                                        <span class="text-green-600 font-bold">{{ preferences.sourLevel }}</span>
                                    </label>
                                    <input
                                        v-model="preferences.sourLevel"
                                        type="range"
                                        min="1"
                                        max="5"
                                        class="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-green"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- 使用场景和食材 -->
                        <div>
                            <h3 class="font-bold text-lg mb-4 text-gray-800">使用场景</h3>
                            <div class="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    v-for="useCase in useCaseOptions"
                                    :key="useCase.id"
                                    @click="toggleUseCase(useCase.id)"
                                    :class="[
                                        'p-3 rounded-lg border border-gray-200 shadow-sm text-sm font-medium transition-all duration-200',
                                        preferences.useCase.includes(useCase.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    ]"
                                >
                                    <span class="mr-1">{{ useCase.icon }}</span>
                                    {{ useCase.name }}
                                </button>
                            </div>

                            <h3 class="font-bold text-lg mb-2 mt-4 text-gray-800">现有食材</h3>
                            <div class="relative">
                                <input
                                    v-model="ingredientInput"
                                    @keyup.enter="addIngredient"
                                    placeholder="输入食材名称，回车添加..."
                                    class="w-full p-3 border border-gray-200 shadow-sm rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div class="flex flex-wrap gap-2 mt-2">
                                <span
                                    v-for="ingredient in preferences.availableIngredients"
                                    :key="ingredient"
                                    class="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                                >
                                    {{ ingredient }}
                                    <button @click="removeIngredient(ingredient)" class="ml-1 text-orange-600 hover:text-orange-800">×</button>
                                </span>
                            </div>

                            <button
                                @click="getRecommendations"
                                :disabled="isLoadingRecommendations"
                                class="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-4 py-3 rounded-lg font-bold text-sm border border-gray-200 shadow-sm transition-all duration-300 disabled:cursor-not-allowed"
                            >
                                <span class="flex items-center gap-2 justify-center">
                                    <template v-if="isLoadingRecommendations">
                                        <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>AI推荐中...</span>
                                    </template>
                                    <template v-else>
                                        <span>获取智能推荐</span>
                                    </template>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 推荐结果区域 -->
            <div v-if="recommendations.length > 0 || isLoadingRecommendations" class="mb-8" data-recommendations>
                <div class="bg-purple-500 text-white px-4 py-2 rounded-t-lg border border-gray-200 shadow-sm border-b-0 inline-block">
                    <span class="font-bold">为您推荐</span>
                </div>
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg rounded-tl-none p-4">
                    <!-- 推荐加载状态 -->
                    <div v-if="isLoadingRecommendations" class="text-center py-8">
                        <h3 class="text-lg font-bold text-gray-700 mb-2">AI正在为您精选酱料...</h3>
                        <div class="animate-spin w-6 h-6 border-3 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
                    </div>

                    <!-- 推荐列表 -->
                    <div v-else-if="recommendations.length > 0" class="space-y-4">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-bold text-gray-800">根据您的偏好，推荐以下酱料：</h3>
                            <span class="text-sm text-gray-500">共{{ recommendations.length }}种</span>
                        </div>
                        <div class="grid grid-cols-1 gap-4">
                            <button
                                v-for="(sauceName, index) in recommendations"
                                :key="sauceName"
                                @click="selectRecommendedSauce(sauceName)"
                                class="group p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-200 shadow-sm rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all duration-200 transform hover:scale-105 text-left relative overflow-hidden"
                            >
                                <div class="absolute top-2 right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {{ index + 1 }}
                                </div>
                                <div class="font-bold text-gray-800 mb-2 pr-8">{{ sauceName }}</div>
                                <div class="text-sm text-gray-600 mb-2">点击查看详细制作方法</div>
                                <div class="flex items-center text-xs text-purple-600 group-hover:text-purple-700">
                                    <span>AI推荐</span>
                                </div>
                            </button>
                        </div>
                        <div class="text-center pt-4 border-t border-gray-200">
                            <p class="text-sm text-gray-500">不满意推荐结果？试试调整上方的口味偏好或使用场景</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 酱料搜索区域 -->
            <div class="mb-8">
                <div class="bg-green-500 text-white px-4 py-2 rounded-t-lg border border-gray-200 shadow-sm border-b-0 inline-block">
                    <span class="font-bold">2.酱料搜索</span>
                </div>
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg rounded-tl-none p-4">
                    <div class="flex gap-4">
                        <div class="flex-1 relative">
                            <input
                                v-model="searchQuery"
                                @keyup.enter="searchSauce"
                                placeholder="输入酱料名称"
                                class="w-full p-4 border border-gray-200 shadow-sm rounded-lg text-md font-medium focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                            <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            </div>
                        </div>
                        <button
                            @click="searchSauce"
                            :disabled="!searchQuery.trim() || isLoadingSearch"
                            class="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-4 rounded-lg font-bold text-md border border-gray-200 shadow-sm transition-all duration-300 disabled:cursor-not-allowed"
                        >
                            <span class="flex items-center gap-2">
                                <template v-if="isLoadingSearch">
                                    <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                </template>
                                <template v-else>
                                    <span>搜索</span>
                                </template>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 制作教程区域 -->
            <div class="mb-8" data-results>
                <div class="bg-teal-500 text-white px-4 py-2 rounded-t-lg border border-gray-200 shadow-sm border-b-0 inline-block">
                    <span class="font-bold">3.制作教程</span>
                    <span v-if="currentSauce && sauceFromLocalCache" class="ml-1.5 text-xs font-normal text-teal-100/95">· 本机缓存</span>
                </div>
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg rounded-tl-none">
                    <!-- 空状态 -->
                    <div v-if="!currentSauce && !isLoadingSearch" class="text-center py-12">
                        <h3 class="text-lg font-bold text-gray-600 mb-3">开始您的酱料制作之旅</h3>
                        <div class="space-y-2 text-sm text-gray-500 max-w-md mx-auto">
                            <p class="flex items-center justify-center gap-2">
                                <span>配置口味偏好，获取个性化推荐</span>
                            </p>
                            <p class="flex items-center justify-center gap-2">
                                <span>直接搜索想要制作的酱料</span>
                            </p>
                        </div>
                    </div>

                    <!-- 搜索加载状态 -->
                    <div v-if="isLoadingSearch" class="text-center py-12">
                        <h3 class="text-xl font-bold text-gray-700 mb-2">AI大师正在准备酱料配方...</h3>
                        <p class="text-gray-500">请稍等片刻，美味秘方即将呈现</p>
                        <div class="mt-4">
                            <div class="animate-spin w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    </div>

                    <!-- 酱料详情 -->
                    <div v-if="currentSauce" class="max-w-4xl mx-auto">
                        <SauceRecipeComponent :sauce="currentSauce" />
                    </div>
                </div>
            </div>

            <!-- 历史记录 -->
            <div v-if="searchHistory.length > 0" class="mb-8">
                <div class="bg-gray-600 text-white px-4 py-2 rounded-t-lg border border-gray-200 shadow-sm border-b-0 inline-block">
                    <span class="font-bold">📚 最近查看</span>
                </div>
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg rounded-tl-none p-4">
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="historyItem in searchHistory.slice(0, 8)"
                            :key="historyItem"
                            @click="selectHistoryItem(historyItem)"
                            class="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-full border border-orange-300 hover:bg-orange-200 hover:border-orange-400 transition-all duration-200"
                        >
                            {{ historyItem }}
                        </button>
                        <button @click="clearHistory" class="px-3 py-2 text-sm text-red-600 hover:text-red-700 underline">清除历史</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { generateSauceRecipe, recommendSauces } from '@/services/aiService'
import type { SauceRecipe, SaucePreference } from '@/types'
import { useCaseOptions } from '@/config/sauces'
import SauceRecipeComponent from '@/components/SauceRecipe.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'

// 响应式数据
const searchQuery = ref('')
const ingredientInput = ref('')
const currentSauce = ref<SauceRecipe | null>(null)
const recommendations = ref<string[]>([])
const searchHistory = ref<string[]>([])
const isLoadingSearch = ref(false)
const isLoadingRecommendations = ref(false)
/** 当前展示的酱料是否来自本机缓存（非本次 AI 生成） */
const sauceFromLocalCache = ref(false)

const SAUCE_RECIPE_CACHE_KEY = 'sauceDesign_recipe_cache'
const SAUCE_CACHE_MAX = 50

const normalizeSauceNameKey = (name: string) => name.trim().toLowerCase()

const loadRecipeCache = (): Record<string, SauceRecipe> => {
    try {
        const raw = localStorage.getItem(SAUCE_RECIPE_CACHE_KEY)
        if (!raw) return {}
        const o = JSON.parse(raw) as Record<string, SauceRecipe>
        return o && typeof o === 'object' ? o : {}
    } catch {
        return {}
    }
}

const persistRecipeCache = (data: Record<string, SauceRecipe>) => {
    try {
        localStorage.setItem(SAUCE_RECIPE_CACHE_KEY, JSON.stringify(data))
    } catch (e) {
        console.error('保存酱料缓存失败', e)
    }
}

const putRecipeCache = (displayName: string, recipe: SauceRecipe) => {
    const k = normalizeSauceNameKey(displayName)
    const next: Record<string, SauceRecipe> = { ...loadRecipeCache(), [k]: recipe }
    const keys = Object.keys(next)
    if (keys.length > SAUCE_CACHE_MAX) {
        for (let i = 0; i < keys.length - SAUCE_CACHE_MAX; i++) {
            delete next[keys[i]]
        }
    }
    persistRecipeCache(next)
}

// 用户偏好配置
const preferences = ref<SaucePreference>({
    spiceLevel: 3,
    sweetLevel: 2,
    saltLevel: 3,
    sourLevel: 2,
    useCase: [],
    availableIngredients: []
})

const scrollToResults = () => {
    nextTick(() => {
        setTimeout(() => {
            const el = document.querySelector('[data-results]')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    })
}

/** 按酱料名取教程：有缓存则不走 AI */
const loadSauceByName = async (sauceName: string) => {
    const key = normalizeSauceNameKey(sauceName)
    const hit = loadRecipeCache()[key]
    if (hit) {
        currentSauce.value = hit
        sauceFromLocalCache.value = true
        scrollToResults()
        return
    }

    sauceFromLocalCache.value = false
    isLoadingSearch.value = true
    currentSauce.value = null
    try {
        const result = await generateSauceRecipe(sauceName)
        currentSauce.value = result
        putRecipeCache(sauceName, result)
        scrollToResults()
    } catch (error) {
        throw error
    } finally {
        isLoadingSearch.value = false
    }
}

// 页面加载时恢复历史记录
onMounted(() => {
    const saved = localStorage.getItem('sauceDesign_history')
    if (saved) {
        try {
            searchHistory.value = JSON.parse(saved)
        } catch (e) {
            console.error('恢复搜索历史失败:', e)
        }
    }
})

// 切换使用场景
const toggleUseCase = (useCaseId: string) => {
    const index = preferences.value.useCase.indexOf(useCaseId)
    if (index > -1) {
        preferences.value.useCase.splice(index, 1)
    } else {
        preferences.value.useCase.push(useCaseId)
    }
}

// 添加食材
const addIngredient = () => {
    const ingredient = ingredientInput.value.trim()
    if (ingredient && !preferences.value.availableIngredients.includes(ingredient)) {
        preferences.value.availableIngredients.push(ingredient)
        ingredientInput.value = ''
    }
}

// 移除食材
const removeIngredient = (ingredient: string) => {
    const index = preferences.value.availableIngredients.indexOf(ingredient)
    if (index > -1) {
        preferences.value.availableIngredients.splice(index, 1)
    }
}

// 获取智能推荐
const getRecommendations = async () => {
    isLoadingRecommendations.value = true
    currentSauce.value = null
    sauceFromLocalCache.value = false

    try {
        const result = await recommendSauces(preferences.value)
        recommendations.value = result

        if (result.length === 0) {
            showErrorMessage('暂时没有找到合适的推荐，请尝试调整偏好设置')
        } else {
            // 滚动到推荐区域
            setTimeout(() => {
                const recommendationsElement = document.querySelector('[data-recommendations]')
                if (recommendationsElement) {
                    recommendationsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
            }, 100)
        }
    } catch (error) {
        console.error('获取推荐失败:', error)
        showErrorMessage('获取推荐失败，请检查网络连接后重试')
    } finally {
        isLoadingRecommendations.value = false
    }
}

// 搜索酱料
const searchSauce = async () => {
    if (!searchQuery.value.trim() || isLoadingSearch.value) return

    const sauceName = searchQuery.value.trim()
    addToHistory(sauceName)
    recommendations.value = []

    try {
        await loadSauceByName(sauceName)
    } catch (error) {
        console.error('搜索酱料失败:', error)
        showErrorMessage('酱料大师表示这个配方太有挑战性了，哈哈！换个搭配试试吧~')
    }
}

// 选择推荐的酱料
const selectRecommendedSauce = async (sauceName: string) => {
    addToHistory(sauceName)
    try {
        await loadSauceByName(sauceName)
    } catch (error) {
        console.error('获取酱料配方失败:', error)
        showErrorMessage('酱料大师挠了挠头说："这个配方我还没学会呢！"换个试试吧~')
    }
}

// 选择历史记录项
const selectHistoryItem = (sauceName: string) => {
    searchQuery.value = sauceName
    searchSauce()
}

// 添加到历史记录
const addToHistory = (sauceName: string) => {
    if (!searchHistory.value.includes(sauceName)) {
        searchHistory.value.unshift(sauceName)
        if (searchHistory.value.length > 20) {
            searchHistory.value = searchHistory.value.slice(0, 20)
        }
        localStorage.setItem('sauceDesign_history', JSON.stringify(searchHistory.value))
    }
}

// 清除历史记录
const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('sauceDesign_history')
}

// 显示错误消息
const showErrorMessage = (message: string) => {
    // 创建临时错误提示元素
    const errorToast = document.createElement('div')
    errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full max-w-sm'
    errorToast.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-sm font-medium">${message}</span>
        </div>
    `

    document.body.appendChild(errorToast)

    // 显示动画
    setTimeout(() => {
        errorToast.style.transform = 'translateX(0)'
    }, 10)

    // 自动隐藏
    setTimeout(() => {
        errorToast.style.transform = 'translateX(100%)'
        setTimeout(() => {
            if (document.body.contains(errorToast)) {
                document.body.removeChild(errorToast)
            }
        }, 300)
    }, 4000)
}
</script>

<style scoped>
/* 自定义滑块样式 */
.slider-red::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #ef4444;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-yellow::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #eab308;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-blue::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-green::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #22c55e;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider-red::-moz-range-thumb,
.slider-yellow::-moz-range-thumb,
.slider-blue::-moz-range-thumb,
.slider-green::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>

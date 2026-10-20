<template>
    <div class="min-h-screen bg-green-50 px-2 pb-16 page-top-gap">
        <!-- 全局导航 -->
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto">
            <!-- 收藏列表：菜谱（默认折叠，点击摘要行展开） -->
            <div v-if="filteredFavorites.length > 0" class="mb-8">
                <h2 class="text-sm font-bold text-gray-700 mb-3 px-1">收藏的菜谱</h2>
                <div class="grid grid-cols-1 gap-3">
                    <div
                        v-for="favorite in filteredFavorites"
                        :key="favorite.id"
                        class="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                        <div class="w-full flex items-stretch bg-white border-b border-gray-100">
                            <button
                                type="button"
                                class="min-w-0 flex-1 text-left p-3 pr-1 flex items-stretch gap-2.5 hover:bg-gray-50 transition-colors rounded-none"
                                :aria-expanded="isRecipeFavExpanded(favorite.id)"
                                :title="favorite.recipe.name"
                                @click="toggleRecipeFav(favorite.id)"
                            >
                                <span class="text-gray-400 text-[10px] w-3.5 shrink-0 self-center select-none" aria-hidden="true">
                                    {{ isRecipeFavExpanded(favorite.id) ? '▼' : '▶' }}
                                </span>
                                <div class="min-w-0 flex-1 flex flex-col justify-center gap-1.5 text-left">
                                    <!-- 第一行：菜名 -->
                                    <h3 class="text-[15px] sm:text-base font-bold text-gray-900 leading-tight line-clamp-1">
                                        {{ favorite.recipe.name }}
                                    </h3>
                                    <!-- 第二行：菜系 · 难度 · 时间（窄屏可断行，仍保持两「逻辑」行：标题 / 元信息） -->
                                    <p class="text-xs text-gray-600 leading-normal flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                        <span class="inline-flex items-center bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                                            {{ favorite.recipe.cuisine }}
                                        </span>
                                        <span class="text-gray-300" aria-hidden="true">·</span>
                                        <span class="shrink-0">{{ recipeDifficultyLabel(favorite.recipe.difficulty) }}</span>
                                        <span class="text-gray-300" aria-hidden="true">·</span>
                                        <span>时间 {{ formatCookingTime(favorite.recipe.cookingTime) }}</span>
                                    </p>
                                </div>
                            </button>
                            <div class="shrink-0 self-stretch flex items-center pr-3 pl-0.5 border-l border-gray-100/80">
                                <button
                                    type="button"
                                    class="text-red-500 hover:text-red-600 hover:bg-red-50/80 text-xs font-medium py-1.5 px-2 rounded-md transition-colors"
                                    @click="confirmRemoveFavorite(favorite.recipe.id)"
                                >
                                    移除
                                </button>
                            </div>
                        </div>
                        <div v-if="isRecipeFavExpanded(favorite.id)">
                            <RecipeCard :recipe="favorite.recipe" :showFavoriteButton="false" :hide-header="true" />
                            <FavoriteMyWorks
                                :fav-id="favorite.id"
                                kind="recipe"
                                @error="(msg: string) => showToast(msg, 'error')"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 收藏列表：酱料（与菜谱：默认折叠、同一摘要行/移除布局） -->
            <div v-if="filteredSauceFavorites.length > 0" class="mb-8">
                <h2 class="text-sm font-bold text-gray-700 mb-3 px-1">收藏的酱料</h2>
                <div class="grid grid-cols-1 gap-3">
                    <div
                        v-for="fav in filteredSauceFavorites"
                        :key="fav.id"
                        class="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                    >
                        <div class="w-full flex items-stretch bg-white border-b border-gray-100">
                            <button
                                type="button"
                                class="min-w-0 flex-1 text-left p-3 pr-1 flex items-stretch gap-2.5 hover:bg-gray-50 transition-colors rounded-none"
                                :aria-expanded="isSauceFavExpanded(fav.id)"
                                :title="fav.sauce.name"
                                @click="toggleSauceFav(fav.id)"
                            >
                                <span class="text-gray-400 text-[10px] w-3.5 shrink-0 self-center select-none" aria-hidden="true">
                                    {{ isSauceFavExpanded(fav.id) ? '▼' : '▶' }}
                                </span>
                                <div class="min-w-0 flex-1 flex flex-col justify-center gap-1.5 text-left">
                                    <h3 class="text-[15px] sm:text-base font-bold text-gray-900 leading-tight line-clamp-1">
                                        {{ fav.sauce.name }}
                                    </h3>
                                    <p class="text-xs text-gray-600 leading-normal flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                        <span class="inline-flex items-center bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                                            {{ getCategoryName(fav.sauce.category) }}
                                        </span>
                                        <span class="text-gray-300" aria-hidden="true">·</span>
                                        <span class="shrink-0">{{ recipeDifficultyLabel(fav.sauce.difficulty) }}</span>
                                        <span class="text-gray-300" aria-hidden="true">·</span>
                                        <span>时间 {{ formatCookingTime(fav.sauce.makingTime) }}</span>
                                    </p>
                                </div>
                            </button>
                            <div class="shrink-0 self-stretch flex items-center pr-3 pl-0.5 border-l border-gray-100/80">
                                <button
                                    type="button"
                                    class="text-red-500 hover:text-red-600 hover:bg-red-50/80 text-xs font-medium py-1.5 px-2 rounded-md transition-colors"
                                    @click.stop="confirmRemoveSauce(fav.sauce.id)"
                                >
                                    移除
                                </button>
                            </div>
                        </div>
                        <div v-if="isSauceFavExpanded(fav.id)">
                            <SauceRecipe :sauce="fav.sauce" :show-favorite-button="false" :hide-header="true" />
                            <FavoriteMyWorks
                                :fav-id="fav.id"
                                kind="sauce"
                                @error="(msg: string) => showToast(msg, 'error')"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- 空状态：无任何收藏 -->
            <div v-if="!hasAnyFavorites" class="text-center py-6">
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg p-8">
                    <div class="text-6xl mb-4"></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">还没有收藏</h3>
                    <p class="text-gray-600 mb-6">去生成菜谱或酱料工坊里的配方，收藏后即可在此查看（数据保存在本机）。</p>
                    <div class="flex flex-wrap items-center justify-center gap-3">
                        <router-link
                            to="/"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold border border-gray-200 shadow-sm transition-all duration-200 hover:scale-105"
                        >
                            <span>去生成菜谱</span>
                        </router-link>
                        <router-link
                            to="/sauce-design"
                            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold border border-gray-200 shadow-sm transition-all duration-200 hover:scale-105"
                        >
                            <span>酱料工坊</span>
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- 搜索/筛选无结果（有数据但当前筛选后为空） -->
            <div
                v-if="hasAnyFavorites && filteredFavorites.length === 0 && filteredSauceFavorites.length === 0"
                class="text-center py-16"
            >
                <div class="bg-white border border-gray-200 shadow-sm rounded-lg p-8">
                    <div class="text-4xl mb-4"></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">没有匹配的内容</h3>
                    <p class="text-gray-600 mb-4">试试调整搜索词或「全部菜系」等筛选</p>
                    <button
                        @click="clearFilters"
                        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium border border-gray-200 shadow-sm transition-all duration-200"
                    >
                        清除筛选条件
                    </button>
                </div>
            </div>
        </div>

        <!-- 清空确认弹窗 -->
        <ConfirmModal
            v-if="showClearConfirm"
            title="确认清空收藏"
            message="确定要清空所有收藏的菜谱和酱料吗？此操作不可恢复，数据从本机删除。"
            @confirm="clearAllFavorites"
            @cancel="showClearConfirm = false"
        />

        <!-- 单个删除确认弹窗 -->
        <ConfirmModal v-if="removingRecipeId" title="确认取消收藏" message="确定要取消收藏这道菜谱吗？" @confirm="removeFavorite" @cancel="removingRecipeId = null" />
        <ConfirmModal v-if="removingSauceId" title="确认取消收藏" message="确定要取消收藏这瓶酱料吗？" @confirm="removeSauce" @cancel="removingSauceId = null" />

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import type { FavoriteRecipe, FavoriteSauce } from '@/types'
import { FavoriteService } from '@/services/favoriteService'
import RecipeCard from '@/components/RecipeCard.vue'
import SauceRecipe from '@/components/SauceRecipe.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'

import ConfirmModal from '@/components/ConfirmModal.vue'
import FavoriteMyWorks from '@/components/FavoriteMyWorks.vue'
import { getCategoryName } from '@/utils/sauceHelpers'

// 响应式数据
const favorites = ref<FavoriteRecipe[]>([])
const sauceFavorites = ref<FavoriteSauce[]>([])
const searchQuery = ref('')
const selectedCuisine = ref('')
const sortBy = ref('date-desc')

const showClearConfirm = ref(false)

const hasAnyFavorites = computed(() => favorites.value.length > 0 || sauceFavorites.value.length > 0)

/** 收藏项 id → 是否展开完整菜谱（默认 false） */
const recipeFavExpanded = ref<Record<string, boolean>>({})

const isRecipeFavExpanded = (favId: string) => !!recipeFavExpanded.value[favId]

const toggleRecipeFav = (favId: string) => {
    recipeFavExpanded.value = {
        ...recipeFavExpanded.value,
        [favId]: !recipeFavExpanded.value[favId]
    }
}

/** 酱料收藏项 id → 是否展开（默认 false，与菜谱一致） */
const sauceFavExpanded = ref<Record<string, boolean>>({})

const isSauceFavExpanded = (favId: string) => !!sauceFavExpanded.value[favId]

const toggleSauceFav = (favId: string) => {
    sauceFavExpanded.value = {
        ...sauceFavExpanded.value,
        [favId]: !sauceFavExpanded.value[favId]
    }
}

// 筛选后的收藏列表
const filteredFavorites = computed(() => {
    let filtered = [...favorites.value]

    // 搜索筛选
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
            fav =>
                fav.recipe.name.toLowerCase().includes(query) ||
                fav.recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
                (fav.notes && fav.notes.toLowerCase().includes(query))
        )
    }

    // 菜系筛选
    if (selectedCuisine.value) {
        filtered = filtered.filter(fav => fav.recipe.cuisine === selectedCuisine.value)
    }

    // 排序
    filtered.sort((a, b) => {
        switch (sortBy.value) {
            case 'date-desc':
                return new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime()
            case 'date-asc':
                return new Date(a.favoriteDate).getTime() - new Date(b.favoriteDate).getTime()
            case 'name-asc':
                return a.recipe.name.localeCompare(b.recipe.name)
            case 'name-desc':
                return b.recipe.name.localeCompare(a.recipe.name)
            default:
                return 0
        }
    })

    return filtered
})

// 筛选后的酱料收藏
const filteredSauceFavorites = computed(() => {
    let list = [...sauceFavorites.value]
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(
            f =>
                f.sauce.name.toLowerCase().includes(q) ||
                f.sauce.ingredients.some(i => i.toLowerCase().includes(q)) ||
                (f.sauce.tags && f.sauce.tags.some(t => t.toLowerCase().includes(q))) ||
                (f.sauce.pairings && f.sauce.pairings.some(p => p.toLowerCase().includes(q))) ||
                (f.sauce.description && f.sauce.description.toLowerCase().includes(q)) ||
                (f.notes && f.notes.toLowerCase().includes(q))
        )
    }
    list.sort((a, b) => {
        switch (sortBy.value) {
            case 'date-desc':
                return new Date(b.favoriteDate).getTime() - new Date(a.favoriteDate).getTime()
            case 'date-asc':
                return new Date(a.favoriteDate).getTime() - new Date(b.favoriteDate).getTime()
            case 'name-asc':
                return a.sauce.name.localeCompare(b.sauce.name)
            case 'name-desc':
                return b.sauce.name.localeCompare(a.sauce.name)
            default:
                return 0
        }
    })
    return list
})

// 刷新收藏列表
const refreshFavorites = () => {
    favorites.value = FavoriteService.getFavorites()
    sauceFavorites.value = FavoriteService.getSauceFavorites()
}

/** 与 RecipeCard 顶栏一致的难度文案 */
const recipeDifficultyLabel = (d: FavoriteRecipe['recipe']['difficulty']) => {
    const map: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' }
    return map[d] || '中等'
}

/** 与 RecipeCard 一致的时间展示 */
const formatCookingTime = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}分钟`
    }
    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    const remainingMinutes = minutes % 60
    let result = ''
    if (days > 0) result += `${days}天`
    if (hours > 0) result += `${hours}小时`
    if (remainingMinutes > 0) result += `${remainingMinutes}分钟`
    return result || '0分钟'
}

// 移除收藏
const removingRecipeId = ref<string | null>(null)

const confirmRemoveFavorite = (recipeId: string) => {
    removingRecipeId.value = recipeId
}

const removeFavorite = () => {
    if (!removingRecipeId.value) return

    const success = FavoriteService.removeFavorite(removingRecipeId.value)
    if (success) {
        refreshFavorites()
        showToast('已取消收藏', 'info')
    } else {
        showToast('取消收藏失败', 'error')
    }
    removingRecipeId.value = null
}

const removingSauceId = ref<string | null>(null)

const confirmRemoveSauce = (sauceId: string) => {
    removingSauceId.value = sauceId
}

const removeSauce = () => {
    if (!removingSauceId.value) return
    const success = FavoriteService.removeSauceFavorite(removingSauceId.value)
    if (success) {
        refreshFavorites()
        showToast('已取消收藏', 'info')
    } else {
        showToast('取消收藏失败', 'error')
    }
    removingSauceId.value = null
}

// 清空所有收藏
const clearAllFavorites = () => {
    const success = FavoriteService.clearAllFavorites()
    if (success) {
        refreshFavorites()
        showToast('已清空所有收藏', 'info')
    } else {
        showToast('清空失败', 'error')
    }
    showClearConfirm.value = false
}

// 清除筛选条件
const clearFilters = () => {
    searchQuery.value = ''
    selectedCuisine.value = ''
    sortBy.value = 'date-desc'
}

// 简单的提示功能
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-all duration-300 transform translate-x-full`

    const styles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-emerald-500',
        info: 'bg-blue-500'
    }

    toast.className += ` ${styles[type]}`
    toast.textContent = message

    document.body.appendChild(toast)

    setTimeout(() => {
        toast.style.transform = 'translateX(0)'
    }, 10)

    setTimeout(() => {
        toast.style.transform = 'translateX(full)'
        setTimeout(() => {
            document.body.removeChild(toast)
        }, 300)
    }, 2000)
}

// 初始化；且 keep-alive 缓存下从其他页返回时不会再次 onMounted，需 onActivated 才能看到新收藏
onMounted(() => {
    refreshFavorites()
})
onActivated(() => {
    refreshFavorites()
})
</script>

<style scoped>
/* 动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hover\:scale-\[1\.02\]:hover {
    transform: scale(1.02);
}

</style>

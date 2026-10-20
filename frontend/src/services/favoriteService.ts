import type { Recipe, FavoriteRecipe, SauceRecipe, FavoriteSauce } from '@/types'

const FAVORITES_KEY = 'chishenme-favorites'
const FAVORITE_SAUCES_KEY = 'chishenme-favorite-sauces'
/** 收藏项「我的作品」照片（data URL），按收藏条目 id 区分菜谱 / 酱料 */
const FAVORITE_WORKS_KEY = 'chishenme-favorite-works'

export const FAVORITE_WORK_PHOTO_MAX = 1

export type FavoriteWorkKind = 'recipe' | 'sauce'

/**
 * 收藏服务 - 管理本地收藏的菜谱
 */
export class FavoriteService {
    /**
     * 获取所有收藏的菜谱
     */
    static getFavorites(): FavoriteRecipe[] {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY)
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            console.error('获取收藏列表失败:', error)
            return []
        }
    }

    /**
     * 添加菜谱到收藏
     */
    static addFavorite(recipe: Recipe, notes?: string): boolean {
        try {
            const favorites = this.getFavorites()

            // 检查是否已收藏
            if (favorites.some(fav => fav.recipe.id === recipe.id)) {
                return false // 已收藏
            }

            const favoriteRecipe: FavoriteRecipe = {
                id: `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                recipe,
                favoriteDate: new Date().toISOString(),
                notes
            }

            favorites.unshift(favoriteRecipe) // 添加到开头
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
            return true
        } catch (error) {
            console.error('添加收藏失败:', error)
            return false
        }
    }

    /**
     * 从收藏中移除菜谱
     */
    private static workStorageKey(kind: FavoriteWorkKind, favoriteItemId: string): string {
        return `${kind}:${favoriteItemId}`
    }

    static getFavoriteWorkPhotos(kind: FavoriteWorkKind, favoriteItemId: string): string[] {
        try {
            const raw = localStorage.getItem(FAVORITE_WORKS_KEY)
            if (!raw) return []
            const all = JSON.parse(raw) as Record<string, string[]>
            const list = all[this.workStorageKey(kind, favoriteItemId)]
            const arr = Array.isArray(list) ? list : []
            if (arr.length > FAVORITE_WORK_PHOTO_MAX) {
                const trimmed = arr.slice(0, FAVORITE_WORK_PHOTO_MAX)
                this.setFavoriteWorkPhotos(kind, favoriteItemId, trimmed)
                return trimmed
            }
            return arr
        } catch {
            return []
        }
    }

    private static readAllWorkPhotos(): Record<string, string[]> {
        try {
            const raw = localStorage.getItem(FAVORITE_WORKS_KEY)
            return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
        } catch {
            return {}
        }
    }

    static setFavoriteWorkPhotos(kind: FavoriteWorkKind, favoriteItemId: string, urls: string[]): boolean {
        try {
            const all = this.readAllWorkPhotos()
            const k = this.workStorageKey(kind, favoriteItemId)
            if (urls.length === 0) {
                delete all[k]
            } else {
                all[k] = urls.slice(0, FAVORITE_WORK_PHOTO_MAX)
            }
            if (Object.keys(all).length === 0) {
                localStorage.removeItem(FAVORITE_WORKS_KEY)
            } else {
                localStorage.setItem(FAVORITE_WORKS_KEY, JSON.stringify(all))
            }
            return true
        } catch (error) {
            console.error('保存作品图失败:', error)
            return false
        }
    }

    static deleteFavoriteWorksForItem(kind: FavoriteWorkKind, favoriteItemId: string): void {
        this.setFavoriteWorkPhotos(kind, favoriteItemId, [])
    }

    static removeFavorite(recipeId: string): boolean {
        try {
            const favorites = this.getFavorites()
            const toRemove = favorites.find(fav => fav.recipe.id === recipeId)
            if (toRemove) {
                this.deleteFavoriteWorksForItem('recipe', toRemove.id)
            }
            const filteredFavorites = favorites.filter(fav => fav.recipe.id !== recipeId)

            if (filteredFavorites.length === favorites.length) {
                return false // 未找到要删除的项
            }

            localStorage.setItem(FAVORITES_KEY, JSON.stringify(filteredFavorites))
            return true
        } catch (error) {
            console.error('移除收藏失败:', error)
            return false
        }
    }

    /**
     * 检查菜谱是否已收藏
     */
    static isFavorite(recipeId: string): boolean {
        try {
            const favorites = this.getFavorites()
            return favorites.some(fav => fav.recipe.id === recipeId)
        } catch (error) {
            console.error('检查收藏状态失败:', error)
            return false
        }
    }

    /**
     * 更新收藏备注
     */
    static updateFavoriteNotes(recipeId: string, notes: string): boolean {
        try {
            const favorites = this.getFavorites()
            const favoriteIndex = favorites.findIndex(fav => fav.recipe.id === recipeId)

            if (favoriteIndex === -1) {
                return false
            }

            favorites[favoriteIndex].notes = notes
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
            return true
        } catch (error) {
            console.error('更新收藏备注失败:', error)
            return false
        }
    }

    /**
     * 清空所有收藏
     */
    static clearAllFavorites(): boolean {
        try {
            localStorage.removeItem(FAVORITES_KEY)
            localStorage.removeItem(FAVORITE_SAUCES_KEY)
            localStorage.removeItem(FAVORITE_WORKS_KEY)
            return true
        } catch (error) {
            console.error('清空收藏失败:', error)
            return false
        }
    }

    /** 所有收藏的酱料（本地持久化） */
    static getSauceFavorites(): FavoriteSauce[] {
        try {
            const stored = localStorage.getItem(FAVORITE_SAUCES_KEY)
            return stored ? JSON.parse(stored) : []
        } catch (error) {
            console.error('获取酱料收藏失败:', error)
            return []
        }
    }

    static addSauceFavorite(sauce: SauceRecipe, notes?: string): boolean {
        try {
            const list = this.getSauceFavorites()
            if (list.some(f => f.sauce.id === sauce.id)) {
                return false
            }
            const item: FavoriteSauce = {
                id: `fav-sauce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                sauce,
                favoriteDate: new Date().toISOString(),
                notes
            }
            list.unshift(item)
            localStorage.setItem(FAVORITE_SAUCES_KEY, JSON.stringify(list))
            return true
        } catch (error) {
            console.error('添加酱料收藏失败:', error)
            return false
        }
    }

    static removeSauceFavorite(sauceId: string): boolean {
        try {
            const list = this.getSauceFavorites()
            const toRemove = list.find(f => f.sauce.id === sauceId)
            if (toRemove) {
                this.deleteFavoriteWorksForItem('sauce', toRemove.id)
            }
            const next = list.filter(f => f.sauce.id !== sauceId)
            if (next.length === list.length) return false
            localStorage.setItem(FAVORITE_SAUCES_KEY, JSON.stringify(next))
            return true
        } catch (error) {
            console.error('移除酱料收藏失败:', error)
            return false
        }
    }

    static isSauceFavorite(sauceId: string): boolean {
        try {
            return this.getSauceFavorites().some(f => f.sauce.id === sauceId)
        } catch (error) {
            console.error('检查酱料收藏失败:', error)
            return false
        }
    }

    /**
     * 获取收藏统计信息
     */
    static getFavoriteStats() {
        const favorites = this.getFavorites()
        const cuisineStats: Record<string, number> = {}

        favorites.forEach(fav => {
            const cuisine = fav.recipe.cuisine
            cuisineStats[cuisine] = (cuisineStats[cuisine] || 0) + 1
        })

        return {
            total: favorites.length,
            cuisineStats,
            latestFavorite: favorites[0]?.favoriteDate
        }
    }
}

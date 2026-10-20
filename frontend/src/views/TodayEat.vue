<template>
    <div class="min-h-screen bg-green-50 px-2 pb-16 page-top-gap">
        <GlobalNavigation />

        <div class="max-w-7xl mx-auto space-y-6 rounded-lg">
            <!--
                单一 Dice3D 区块：初始状态 + 选择中状态共用同一实例。
                isSelecting 为 true 时始终保持，避免 selectedDishes 提前被赋值导致两个区块都不满足而出现空白。
            -->
            <div
                v-if="isSelecting || (!selectionEmpty && selectedDishes.length === 0)"
                class="bg-white rounded-lg shadow-lg border border-gray-200 shadow-sm min-h-[calc(100dvh-4.5rem)] flex flex-col"
            >
                <!-- 色子 + 标题区 -->
                <div class="text-center p-8 pb-4">
                    <template v-if="!isSelecting">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">准备好了吗？</h2>
                        <p class="text-sm text-gray-600 mb-3">摇一摇或点击色子开始</p>
                    </template>
                    <template v-else>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">{{ selectionStatus }}</h3>
                        <p class="text-sm text-gray-500 mb-3">正在随机挑选，请稍候…</p>
                    </template>

                    <!-- 唯一持久 Dice3D 实例 -->
                    <Dice3D
                        class="mb-4 max-w-48 mx-auto w-full"
                        :acceleration="shakeAccel"
                        :shaking="diceShaking"
                        :settle-progress="isSelecting ? selectionProgress : null"
                        :idle-spin="false"
                        :interactive="!isSelecting"
                        height-class="h-36 sm:h-40"
                        @activate="onDiceActivate"
                    />

                    <!-- 选择进度条 -->
                    <div v-if="isSelecting" class="w-full bg-gray-200 rounded-full h-2 max-w-sm mx-auto">
                        <div
                            class="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                            :style="{ width: `${selectionProgress}%` }"
                        ></div>
                    </div>
                </div>

                <!-- 初始状态：偏好设置 + 随机注释 -->
                <div v-if="!isSelecting" class="px-8 pb-8 flex-1">
                    <div class="mt-4 mb-6">
                        <div
                            @click="showPreference = !showPreference"
                            class="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                            <span>偏好设置（可选）</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 transition-transform"
                                :class="{ 'transform rotate-180': showPreference }"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        <div v-if="showPreference" class="bg-gray-50 rounded-xl max-w-lg mx-auto p-4 mt-2 border border-gray-200 text-left space-y-4">
                            <div>
                                <p class="text-xs text-gray-500 mb-2">菜式类型（与菜系可同时筛选）</p>
                                <div class="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        @click="preferenceKind = null"
                                        :class="preferenceKind === null ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-200'"
                                        class="px-2.5 py-1.5 rounded-lg text-sm font-medium"
                                    >
                                        不限
                                    </button>
                                    <button
                                        v-for="k in kindOptions"
                                        :key="k.value"
                                        type="button"
                                        @click="preferenceKind = k.value"
                                        :class="preferenceKind === k.value ? 'bg-emerald-600 text-white' : 'bg-white text-gray-800 border border-gray-200'"
                                        class="px-2.5 py-1.5 rounded-lg text-sm font-medium"
                                    >
                                        {{ k.label }}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 mb-2">菜系</p>
                                <div class="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        @click="preferenceCuisine = null"
                                        :class="preferenceCuisine === null ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border border-gray-200'"
                                        class="px-2.5 py-1.5 rounded-lg text-sm font-medium"
                                    >
                                        不限
                                    </button>
                                    <button
                                        v-for="c in cuisines"
                                        :key="c.id"
                                        type="button"
                                        @click="preferenceCuisine = c.id"
                                        :class="preferenceCuisine === c.id ? 'bg-amber-600 text-white' : 'bg-white text-gray-800 border border-gray-200'"
                                        class="px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                    >
                                        {{ c.name.replace('厨师', '') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr class="mb-4" />
                    <p class="text-gray-500 text-sm italic transition">{{ randomFoodComment }}</p>
                </div>

                <!-- 选择中：当前随机展示项 -->
                <div v-if="isSelecting && currentSelection" class="px-8 pb-8">
                    <div class="text-center p-6 bg-gray-50 rounded-xl">
                        <div class="text-4xl mb-2">{{ currentSelection.type === 'dish' ? '' : currentSelection.avatar }}</div>
                        <div class="text-lg font-semibold text-gray-800">{{ currentSelection.name }}</div>
                        <div v-if="currentSelection.specialty" class="text-sm text-gray-600">{{ currentSelection.specialty }}</div>
                    </div>
                </div>
            </div>

            <!-- 筛选后无菜名 -->
            <div
                v-if="!isSelecting && selectionEmpty"
                class="bg-white rounded-2xl shadow-lg p-8 border border-amber-200 text-center"
            >
                <p class="text-gray-700 mb-2">当前偏好下没有可用菜名。</p>
                <p class="text-sm text-gray-500 mb-6">可放宽「菜式类型 / 菜系」后重试。</p>
                <button
                    type="button"
                    @click="resetSelection"
                    class="px-6 py-2.5 bg-gray-700 text-white rounded-xl text-sm font-medium hover:bg-gray-800"
                >
                    返回修改偏好
                </button>
            </div>

            <!-- 选择结果：有菜名 -->
            <div
                v-if="!isSelecting && selectedDishes.length > 0"
                class="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 shadow-sm min-h-[calc(100dvh-4.5rem)]"
            >
                <h3 class="text-xl font-bold text-gray-800 mb-2 text-center">今日推荐</h3>
                <p class="text-center text-sm text-gray-500 mb-6">请点选一道菜，再生成专属菜谱</p>

                <div class="grid grid-cols-1 gap-6 mb-6">
                    <div class="bg-green-50 rounded-xl p-4">
                        <h4 class="font-semibold text-green-800 mb-3">推荐菜品 ({{ selectedDishes.length }}道)</h4>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <button
                                v-for="dish in selectedDishes"
                                :key="dish"
                                type="button"
                                @click="selectedDishName = dish"
                                :class="
                                    selectedDishName === dish
                                        ? 'ring-2 ring-green-600 bg-green-100 border-green-500'
                                        : 'border-green-200 hover:bg-green-100'
                                "
                                class="bg-white border-2 rounded-lg p-2 transition-colors text-left"
                            >
                                <div class="text-sm font-medium text-green-800 text-center">{{ dish }}</div>
                            </button>
                        </div>
                    </div>

                    <div class="bg-purple-50 rounded-xl p-4">
                        <h4 class="font-semibold text-purple-800 mb-3">推荐主厨</h4>
                        <div class="flex items-center gap-3">
                            <div class="text-3xl">{{ selectedMaster?.avatar }}</div>
                            <div>
                                <div class="font-semibold text-purple-800">{{ selectedMaster?.name }}</div>
                                <div class="text-sm text-purple-600">{{ selectedMaster?.specialty }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-4 justify-center">
                    <button
                        @click="generateRecipeFromSelection"
                        :disabled="isGenerating || !selectedDishName"
                        class="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <span v-if="isGenerating" class="flex items-center justify-center gap-2">
                            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{{ generatingText }}</span>
                        </span>
                        <span v-else>生成菜谱</span>
                    </button>

                    <button
                        @click="resetSelection"
                        :disabled="isGenerating"
                        class="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        重新选择
                    </button>
                </div>
            </div>

            <!-- 菜谱结果 -->
            <div v-if="recipe" class="bg-white rounded-2xl shadow-lg p-4 border border-gray-200 shadow-sm">
                <h3 class="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">专属菜谱</h3>
                <div class="max-w-2xl mx-auto border-2 border-[#333333] rounded-lg overflow-hidden">
                    <RecipeCard :recipe="recipe" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { cuisines } from '@/config/cuisines'
import {
    filterRecommendedPool,
    pickRandomDishNames,
    type RecommendedDishKind
} from '@/config/recommendedDishes'
import type { Recipe, CuisineType } from '@/types'
import { generateRecipe } from '@/services/aiService'
import RecipeCard from '@/components/RecipeCard.vue'
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import Dice3D from '@/components/Dice3D.vue'
import { useShakeTrigger, requestMotionPermission } from '@/composables/useShakeTrigger'

const MAX_DISHES = 6

const kindOptions: { value: RecommendedDishKind; label: string }[] = [
    { value: 'meat', label: '荤菜' },
    { value: 'veg', label: '素菜' },
    { value: 'savory_soup', label: '咸汤' },
    { value: 'sweet_soup', label: '甜汤' }
]

const isSelecting = ref(false)
const isGenerating = ref(false)
const selectedDishes = ref<string[]>([])
const selectedDishName = ref<string | null>(null)
const selectedMaster = ref<CuisineType | null>(null)
const recipe = ref<Recipe | null>(null)
const preferenceKind = ref<RecommendedDishKind | null>(null)
const preferenceCuisine = ref<string | null>(null)
const showPreference = ref(false)
const selectionEmpty = ref(false)

const selectionStatus = ref('')
const selectionProgress = ref(0)
const currentSelection = ref<any>(null)

const diceShaking = ref(false)
let diceKickTimer: ReturnType<typeof setTimeout> | null = null

function kickDiceOnce() {
    if (diceKickTimer) {
        clearTimeout(diceKickTimer)
    }
    diceShaking.value = true
    diceKickTimer = setTimeout(() => {
        diceShaking.value = false
        diceKickTimer = null
    }, 160)
}

/** 仅在初始等待页监听摇动；选择中、结果页、空池页不需要 */
const shakeListenerActive = computed(
    () => !isSelecting.value && !selectionEmpty.value && selectedDishes.value.length === 0
)

/** 统一的"开始抽取"入口，点击与摇一摇停止均调用此处 */
function triggerSelection() {
    if (isSelecting.value) return
    void startRandomSelection()
}

/**
 * 点击色子触发（优先兼容性入口）。
 * 同时申请 motion 权限，使后续摇一摇可在同一会话生效。
 */
function onDiceActivate() {
    void requestMotionPermission()
    kickDiceOnce()
    triggerSelection()
}

const { currentAccel: shakeAccel } = useShakeTrigger({
    active: shakeListenerActive,
    onShakeStop: triggerSelection,
    threshold: 10,
    stopThreshold: 3,
    stopMs: 220
})

const generatingText = ref('正在生成菜谱...')
const generatingTexts = ['正在生成菜谱...', '大师正在创作...', '调配独特配方...', '完善制作步骤...']

const foodComments = [
    "鲁菜大师看到把子肉，直接拍案而起：'今天必须教你怎么吃到地道！' ",
    "川菜大师盯着小炒肉：'莫得问题，马上让你体验什么叫真·下饭' ",
    "给粤菜大师一碟白切鸡，他能讲出一百种蘸料搭配……",
    "日料大师处理刺身时，刀光快得像开了倍速",
    "湘菜大师的炒锅起火三米高：'辣椒放少了！' ",
    "当法餐大师看到油封鸭：'时间会给它最好的答案' ",
    "闽菜大师的汤里，鲜得邻居以为在炼丹",
    "意大利面在真·意厨手里转圈的样子，比广场舞还有节奏",
    "徽菜大师火腿一吊汤，满楼道都在问吃啥",
    "泰式大师的冬阴功里，香茅和柠檬在开会"
]

const currentFoodComment = ref(foodComments[0])
const randomFoodComment = computed(() => currentFoodComment.value)

onMounted(() => {
    const commentInterval = setInterval(() => {
        currentFoodComment.value = foodComments[Math.floor(Math.random() * foodComments.length)]
    }, 3000)

    onUnmounted(() => clearInterval(commentInterval))
})

async function runDishPickAnimation(names: string[]) {
    const set = new Set(names)
    for (let i = 0; i < 5; i++) {
        const list = [...set]
        const randomDish = list[Math.floor(Math.random() * list.length)]
        currentSelection.value = { type: 'dish', name: randomDish }
        selectionProgress.value = (i / 5) * 50
        await new Promise((r) => setTimeout(r, 100))
    }
    selectedDishes.value = names
    currentSelection.value = { type: 'dish', name: names[0] }
    await new Promise((r) => setTimeout(r, 300))
}

const startRandomSelection = async () => {
    if (isSelecting.value) return
    isSelecting.value = true
    selectedDishes.value = []
    selectedDishName.value = null
    selectedMaster.value = null
    recipe.value = null
    selectionEmpty.value = false
    selectionProgress.value = 0

    const pool = filterRecommendedPool(preferenceKind.value, preferenceCuisine.value)
    const names = pickRandomDishNames(pool, MAX_DISHES)

    if (names.length === 0) {
        selectionStatus.value = '没有符合偏好的菜名'
        await new Promise((r) => setTimeout(r, 900))
        selectionEmpty.value = true
        isSelecting.value = false
        currentSelection.value = null
        return
    }

    selectionStatus.value = '正在随机选择菜品...'
    await runDishPickAnimation(names)

    selectionStatus.value = '正在匹配主厨大师...'
    await selectRandomMaster()

    selectionStatus.value = '选择完成！'
    selectionProgress.value = 100
    setTimeout(() => {
        isSelecting.value = false
    }, 1000)
}

const selectRandomMaster = async () => {
    for (let i = 0; i < 10; i++) {
        const randomMaster = cuisines[Math.floor(Math.random() * cuisines.length)]
        currentSelection.value = {
            type: 'master',
            name: randomMaster.name,
            avatar: randomMaster.avatar,
            specialty: randomMaster.specialty
        }
        selectionProgress.value = 50 + (i / 10) * 50
        await new Promise((r) => setTimeout(r, 80))
    }
    const finalMaster = cuisines[Math.floor(Math.random() * cuisines.length)]
    selectedMaster.value = finalMaster
    currentSelection.value = {
        type: 'master',
        name: finalMaster.name,
        avatar: finalMaster.avatar,
        specialty: finalMaster.specialty
    }
    await new Promise((r) => setTimeout(r, 500))
}

const generateRecipeFromSelection = async () => {
    if (!selectedMaster.value || !selectedDishName.value || isGenerating.value) return

    isGenerating.value = true
    let textIndex = 0
    const textInterval = setInterval(() => {
        generatingText.value = generatingTexts[textIndex]
        textIndex = (textIndex + 1) % generatingTexts.length
    }, 1000)

    try {
        const cuisineInfo: CuisineType = {
            id: selectedMaster.value.id,
            name: selectedMaster.value.name,
            description: selectedMaster.value.description || '',
            avatar: selectedMaster.value.avatar,
            specialty: selectedMaster.value.specialty,
            prompt: selectedMaster.value.prompt
        }
        recipe.value = await generateRecipe([selectedDishName.value], cuisineInfo, undefined, { itemKind: 'dish_names' })
        showToast('菜谱生成成功', 'success')
    } catch (error) {
        console.error('生成菜谱失败:', error)
        const masterName = selectedMaster.value?.name || '大师'
        showToast(`${masterName}这道菜有点挑战，换一道试试~`, 'error')
    } finally {
        clearInterval(textInterval)
        isGenerating.value = false
    }
}

const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const toast = document.createElement('div')
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-all duration-300 transform translate-x-full`
    const styles: Record<string, string> = {
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

const resetSelection = () => {
    selectedDishes.value = []
    selectedDishName.value = null
    selectedMaster.value = null
    recipe.value = null
    currentSelection.value = null
    selectionProgress.value = 0
    selectionEmpty.value = false
}

onUnmounted(() => {
    if (diceKickTimer) {
        clearTimeout(diceKickTimer)
    }
})
</script>

<style scoped>
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.animate-spin {
    animation: spin 1s linear infinite;
}

button {
    transition: all 0.3s ease;
}

button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

button:active:not(:disabled) {
    transform: translateY(0);
    background-color: transparent;
}

.bg-gradient-to-r {
    transition: width 0.5s ease-out;
}

.text-4xl {
    animation: pulse 2s ease-in-out infinite;
    font-size: 2rem;
}

@keyframes pulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.text-6xl {
    font-size: 3rem;
}
</style>

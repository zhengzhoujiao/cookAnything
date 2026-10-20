<template>
    <!-- 底部固定 Tab 导航栏 -->
    <nav class="fixed bottom-0 left-0 right-0 z-[60] mobile-tab-bar">
        <div class="bg-white border-t border-gray-200 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] px-1 pt-2 pb-safe">
            <div class="grid grid-cols-5 gap-0">
                <template v-for="tab in mobileTabs" :key="tab.path">
                    <router-link
                        v-if="tab.path !== '/__more__'"
                        :to="tab.path"
                        class="tab-item flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 active:scale-95"
                        :class="isTabActive(tab.path) ? 'tab-active' : 'tab-inactive'"
                    >
                        <span class="text-xs font-bold leading-tight text-center mt-1 pb-1">{{ tab.label }}</span>
                        <span v-if="isTabActive(tab.path)" class="w-1 h-1 rounded-full bg-emerald-500 mt-auto"></span>
                        <span v-else class="w-1 h-1 mt-auto opacity-0"></span>
                    </router-link>
                    <button
                        v-else
                        @click="showMobileMore = !showMobileMore"
                        class="tab-item flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 active:scale-95"
                        :class="isTabActive('/__more__') ? 'tab-active' : 'tab-inactive'"
                    >
                        <span class="text-xs font-bold leading-tight text-center mt-1 pb-1">{{ tab.label }}</span>
                        <span v-if="isTabActive('/__more__')" class="w-1 h-1 rounded-full bg-emerald-500 mt-auto"></span>
                        <span v-else class="w-1 h-1 mt-auto opacity-0"></span>
                    </button>
                </template>
            </div>
        </div>
    </nav>

    <!-- 「更多」浮层 -->
    <Teleport to="body">
        <div v-if="showMobileMore" class="fixed inset-0 z-[70]" @click="showMobileMore = false">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            <div
                class="absolute bottom-[72px] left-2 right-2 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden"
                @click.stop
            >
                <div class="p-3">
                    <div class="text-xs font-bold text-gray-500 px-2 mb-2">更多功能</div>
                    <div class="grid grid-cols-4 gap-2">
                        <router-link
                            v-for="item in moreMenuItems"
                            :key="item.path"
                            :to="item.path"
                            @click="showMobileMore = false"
                            class="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 active:scale-95"
                            :class="$route.path === item.path ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200 hover:border-gray-300'"
                        >
                            <span class="text-xs font-bold text-gray-700 text-center">{{ item.label }}</span>
                        </router-link>
                    </div>
                </div>
                <div class="pb-3 flex justify-center">
                    <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const showMobileMore = ref(false)
const route = useRoute()

const mobileTabs = [
    { path: '/', label: '主页' },
    { path: '/today-eat', label: '今日吃啥' },
    { path: '/table-design', label: '满汉全席' },
    { path: '/sauce-design', label: '酱料工坊' },
    { path: '/__more__', label: '更多' }
]

const moreMenuItems = [
    { path: '/fortune-cooking', label: '玄学厨房' },
    { path: '/favorites', label: '我的收藏' },
    { path: '/support', label: '支持项目' }
]

const moreMenuPaths = moreMenuItems.map(item => item.path)

const isTabActive = (path: string) => {
    if (path === '/__more__') {
        return moreMenuPaths.includes(route.path)
    }
    return route.path === path
}

const pageTitle = computed(() => {
    switch (route.path) {
        case '/':
            return '万能电子菜谱'
        case '/today-eat':
            return '今日吃啥'
        case '/table-design':
            return '满汉全席'
        case '/how-to-cook':
            return '菜谱指南'
        case '/sauce-design':
            return '酱料工坊'
        case '/fortune-cooking':
            return '灵感厨房'
        case '/favorites':
            return '我的收藏'
        case '/gallery':
            return '菜肴图鉴'
        case '/support':
            return '支持项目'
        default:
            return '万能电子菜谱'
    }
})

const documentTitle = computed(() => {
    if (route.path === '/') {
        return '万能电子菜谱'
    }
    return `${pageTitle.value}`
})

watchEffect(() => {
    document.title = documentTitle.value
})
</script>

<style scoped>
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.mobile-tab-bar {
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.pb-safe {
    padding-bottom: max(8px, env(safe-area-inset-bottom));
}

.tab-active {
    color: #1a1a1a;
}

.tab-active span:first-child {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    transform: translateY(-1px);
}

.tab-inactive {
    color: #9ca3af;
}

.tab-item {
    position: relative;
    min-width: 0;
}
</style>

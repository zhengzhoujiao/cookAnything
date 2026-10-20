<template>
    <div v-if="winePairing" class="wine-pairing">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <!-- 酒水信息卡片 -->
            <div class="bg-white rounded-lg p-4 border border-purple-300 mb-3">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">{{ getWineIcon(winePairing.type) }}</span>
                        <div>
                            <h5 class="font-bold text-purple-800">{{ winePairing.name }}</h5>
                            <p class="text-xs text-gray-600">{{ getWineTypeText(winePairing.type) }}</p>
                        </div>
                    </div>
                    <div v-if="winePairing.alcoholContent" class="text-right">
                        <div class="text-sm font-bold text-purple-600">{{ winePairing.alcoholContent }}</div>
                        <div class="text-xs text-gray-500">{{ winePairing.alcoholContent === '0%' ? '无酒精' : '酒精度' }}</div>
                    </div>
                </div>

                <!-- 风味描述 -->
                <div class="mb-3">
                    <p class="text-sm text-gray-700 italic">"{{ winePairing.flavor }}"</p>
                    <p v-if="winePairing.origin" class="text-xs text-gray-500 mt-1">产地：{{ winePairing.origin }}</p>
                </div>

                <!-- 搭配理由 -->
                <div class="bg-purple-100 rounded-lg p-3 mb-3">
                    <h6 class="text-xs font-bold text-purple-700 mb-1">🎯 搭配理由</h6>
                    <p class="text-xs text-purple-800">{{ winePairing.reason }}</p>
                </div>

                <!-- 侍酒建议 -->
                <div class="grid grid-cols-2 gap-3 text-xs">
                    <div class="bg-blue-50 rounded p-2 border border-blue-200">
                        <div class="flex items-center gap-1 mb-1">
                            <span>🌡️</span>
                            <span class="font-bold text-blue-700">饮用温度</span>
                        </div>
                        <p class="text-blue-800">{{ winePairing.servingTemperature }}</p>
                    </div>
                    <div v-if="winePairing.glassType" class="bg-amber-50 rounded p-2 border border-amber-200">
                        <div class="flex items-center gap-1 mb-1">
                            <span>🥂</span>
                            <span class="font-bold text-amber-700">推荐容器</span>
                        </div>
                        <p class="text-amber-800">{{ winePairing.glassType }}</p>
                    </div>
                </div>
            </div>

            <!-- 小贴士 -->
            <div class="bg-emerald-50 border border-yellow-300 rounded-lg p-3">
                <div class="flex items-start gap-2">
                    <span class="text-emerald-700 text-sm">💡</span>
                    <div>
                        <h6 class="text-xs font-bold text-yellow-700 mb-1">品鉴小贴士</h6>
                        <p class="text-xs text-yellow-800">{{ getWineTip(winePairing.type) }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { WinePairing } from '@/types'

interface Props {
    winePairing: WinePairing | undefined
}

defineProps<Props>()

const getWineIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
        red_wine: '🍷',
        white_wine: '🥂',
        beer: '🍺',
        sake: '🍶',
        tea: '🍵',
        cocktail: '🍸',
        spirits: '🥃',
        non_alcoholic: '🥤',
        soft_drink: '🥤',
        juice: '🧃',
        dairy: '🥛',
        other: '🥤'
    }
    return iconMap[type] || '🥤'
}

const getWineTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
        red_wine: '红酒',
        white_wine: '白酒',
        beer: '啤酒',
        sake: '清酒',
        tea: '茶饮',
        cocktail: '鸡尾酒',
        spirits: '烈酒',
        non_alcoholic: '无酒精饮品',
        soft_drink: '碳酸饮料',
        juice: '果汁',
        dairy: '乳制品',
        other: '其他饮品'
    }
    return typeMap[type] || '饮品'
}

const getWineTip = (type: string): string => {
    const tipMap: Record<string, string> = {
        red_wine: '红酒建议提前30分钟开瓶醒酒，让酒体充分接触空气，释放更丰富的香气。',
        white_wine: '白酒应冰镇后饮用，开瓶后尽快享用以保持最佳口感和香气。',
        beer: '啤酒最佳饮用温度为4-6°C，倒酒时应倾斜酒杯，形成适量泡沫。',
        sake: '清酒可温饮或冷饮，温饮时加热至40-50°C，能更好地体现酒的层次感。',
        tea: '茶水温度不宜过高，85°C左右最佳，可以多次冲泡，每次品味不同层次。',
        cocktail: '鸡尾酒应现调现饮，注意冰块的使用和装饰的搭配。',
        spirits: '烈酒可纯饮或加冰，小口品尝，感受酒体的复杂层次。',
        non_alcoholic: '无酒精饮品同样注重温度和新鲜度，可根据个人喜好调整甜度。',
        soft_drink: '碳酸饮料冰镇后饮用口感更佳，开启后尽快饮用以保持气泡感。',
        juice: '果汁最好现榨现饮，冷藏保存，饮用前可适当摇匀。',
        dairy: '乳制品注意保质期，开封后冷藏保存，温度适宜时口感最佳。',
        other: '根据饮品特性选择合适的饮用温度和方式，享受最佳口感。'
    }
    return tipMap[type] || '适量饮用，品味生活。'
}
</script>

<style scoped>
.wine-pairing {
    @apply transition-all duration-300;
}
</style>

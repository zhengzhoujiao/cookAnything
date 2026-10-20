<template>
    <section
        :class="[
            compact ? 'px-2 py-3' : 'px-3 py-4'
        ]"
    >
        <h4 class="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            我的作品
        </h4>

        <div v-if="photos.length > 0" class="grid grid-cols-1 gap-2 mb-3">
            <div
                v-for="(src, index) in photos"
                :key="index + '-' + src.slice(0, 32)"
                class="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-sm"
            >
                <img :src="src" alt="我的作品" class="w-full h-auto block" loading="lazy" />
                <button
                    type="button"
                    class="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white text-xs font-bold opacity-90 hover:bg-red-600 transition-colors"
                    :aria-label="`删除作品图`"
                    @click="removeAt(index)"
                >
                    ×
                </button>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
            <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onFilesSelected"
            />
            <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-emerald-300 bg-white text-emerald-800 shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="uploading"
                @click="openPicker"
            >
                <span v-if="uploading" class="inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span v-else>{{ photos.length > 0 ? '更换图片' : '上传图片' }}</span>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FavoriteService, type FavoriteWorkKind } from '@/services/favoriteService'
import { compressImageForLocalStorage } from '@/utils/favoriteWorkImages'

const props = withDefaults(
    defineProps<{
        favId: string
        kind: FavoriteWorkKind
        /** 与 RecipeCard 内边距对齐时可略收 */
        compact?: boolean
    }>(),
    { compact: true }
)

const emit = defineEmits<{
    updated: []
    error: [message: string]
}>()

const photos = ref<string[]>([])
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function load() {
    photos.value = [...FavoriteService.getFavoriteWorkPhotos(props.kind, props.favId)]
}

watch(
    () => [props.favId, props.kind] as const,
    () => load(),
    { immediate: true }
)

function openPicker() {
    fileInputRef.value?.click()
}

async function onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement
    const fileList = input.files
    if (!fileList?.length) return

    const file = fileList[0]
    uploading.value = true
    try {
        const dataUrl = await compressImageForLocalStorage(file)
        const ok = FavoriteService.setFavoriteWorkPhotos(props.kind, props.favId, [dataUrl])
        if (ok) {
            photos.value = [dataUrl]
            emit('updated')
        } else {
            emit('error', '保存失败，本机存储可能已满，请换一张或稍后再试')
        }
    } catch {
        emit('error', '没有成功添加图片，请换一张试试')
    } finally {
        uploading.value = false
        input.value = ''
    }
}

function removeAt(index: number) {
    const next = photos.value.filter((_, i) => i !== index)
    if (FavoriteService.setFavoriteWorkPhotos(props.kind, props.favId, next)) {
        photos.value = next
        emit('updated')
    } else {
        emit('error', '删除后保存失败')
    }
}
</script>

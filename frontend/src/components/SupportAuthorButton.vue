<template>
    <button
        type="button"
        @click="goSupport"
        class="px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors whitespace-nowrap"
    >
        支持项目
    </button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goSupport = () => {
    router.push('/support')
}
</script>

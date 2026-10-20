<template>
    <div class="min-h-screen bg-gray-50 px-4 pb-24 page-top-gap">
        <GlobalNavigation />
        <div class="max-w-4xl mx-auto space-y-6">
            <div class="bg-white rounded-lg p-6 border border-gray-200 space-y-3">
                <h1 class="text-2xl font-bold">AI 服务设置</h1>
                <p class="text-gray-600">由站点管理员统一配置文本与图片生成服务。</p>
                <router-link to="/JManage" class="text-blue-600 underline">管理员登录</router-link>
            </div>
            <ConfigTest />
        </div>
    </div>
</template>
<script setup lang="ts">
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import ConfigTest from '@/components/ConfigTest.vue'
</script>

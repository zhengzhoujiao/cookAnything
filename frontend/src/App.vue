<template>
    <div id="app" class="min-h-screen">
        <!-- keep-alive：缓存各页；:key 绑定 route.path，否则切换路由时视图可能不更新 -->
        <router-view v-slot="{ Component }">
            <keep-alive :max="12">
                <component v-if="Component" :is="Component" :key="route.path" />
            </keep-alive>
        </router-view>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

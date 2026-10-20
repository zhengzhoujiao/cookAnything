<template>
    <div class="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
        <h3 class="text-lg font-semibold">AI 服务连接测试</h3>
        <p class="text-sm text-gray-600">测试通过后端生成一条简短回复，会产生少量模型调用费用。</p>
        <button @click="testConnection" :disabled="isTesting"
            class="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50">
            {{ isTesting ? '测试中…' : '测试文本生成' }}
        </button>
        <p v-if="result !== null" role="status" :class="result ? 'text-green-700' : 'text-red-700'">
            {{ result ? '服务连接正常' : '连接失败，请联系管理员检查后端模型配置' }}
        </p>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { testAIConnection } from '@/services/aiService'
const isTesting = ref(false)
const result = ref<boolean | null>(null)
async function testConnection() {
    isTesting.value = true
    result.value = null
    try {
        result.value = await testAIConnection()
    } finally {
        isTesting.value = false
    }
}
</script>

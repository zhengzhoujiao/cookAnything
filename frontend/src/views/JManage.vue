<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">

        <!-- 登录界面 -->
        <transition name="fade" mode="out-in">
            <div v-if="!isAuthenticated" key="login" class="w-full max-w-md">
                <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div class="text-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4">
                            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 class="text-2xl font-bold text-white mb-1">管理员后台</h1>
                        <p class="text-slate-400 text-sm">万能电子菜谱 · 模型配置中心</p>
                    </div>

                    <form @submit.prevent="handleLogin" class="space-y-5">
                        <div>
                            <label class="block text-sm font-medium text-slate-300 mb-2">管理员密码</label>
                            <div class="relative">
                                <input
                                    v-model="loginPassword"
                                    :type="showLoginPwd ? 'text' : 'password'"
                                    placeholder="请输入管理员密码"
                                    class="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/10 transition pr-12"
                                    autocomplete="current-password"
                                />
                                <button type="button" @click="showLoginPwd = !showLoginPwd"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path v-if="!showLoginPwd" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div v-if="loginError" class="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                            {{ loginError }}
                        </div>

                        <button type="submit" :disabled="loginLoading || !loginPassword"
                            class="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                            <svg v-if="loginLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            {{ loginLoading ? '验证中...' : '登录' }}
                        </button>
                    </form>

                    <div class="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-sm">
                        <span :class="backendStatus === 'ok' ? 'bg-green-400' : backendStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'"
                            class="w-2 h-2 rounded-full flex-shrink-0"></span>
                        <span class="text-slate-400">
                            后端：
                            <span :class="backendStatus === 'ok' ? 'text-green-400' : backendStatus === 'error' ? 'text-red-400' : 'text-yellow-400'">
                                {{ backendStatus === 'ok' ? '连接正常' : backendStatus === 'error' ? '无法连接' : '检测中...' }}
                            </span>
                            <span class="text-slate-500 ml-1 font-mono text-xs">{{ backendUrl || '同源（Nginx 反代）' }}</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- 管理员主界面 -->
            <div v-else key="admin" class="w-full max-w-3xl">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h1 class="text-2xl font-bold text-white">模型配置管理</h1>
                        <p class="text-slate-400 text-sm mt-0.5">万能电子菜谱 · 管理员后台</p>
                    </div>
                    <button @click="handleLogout"
                        class="flex items-center gap-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        退出
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex gap-1 bg-white/5 rounded-xl p-1 mb-5 border border-white/10">
                    <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
                        :class="activeTab === tab.id ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'"
                        class="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200">
                        <span>{{ tab.icon }}</span>
                        <span class="hidden sm:inline">{{ tab.label }}</span>
                        <span class="sm:hidden">{{ tab.shortLabel }}</span>
                    </button>
                </div>

                <!-- Panel -->
                <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">

                    <!-- Toast -->
                    <transition name="slide-down">
                        <div v-if="toast.visible"
                            :class="toast.type === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-red-500/15 border-red-500/30 text-red-400'"
                            class="border rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2">
                            <svg v-if="toast.type === 'success'" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <svg v-else class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {{ toast.message }}
                        </div>
                    </transition>

                    <!-- Loading -->
                    <div v-if="settingsLoading" class="flex items-center justify-center py-16 text-slate-400 gap-3">
                        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        加载配置中...
                    </div>

                    <!-- Tab: 文本生成 -->
                    <div v-else-if="activeTab === 'text'">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-white font-semibold">文本生成配置</h2>
                                <p class="text-slate-400 text-xs">菜谱生成、营养分析、运势等所有文字类 AI 功能</p>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <!-- Base URL -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">API 服务地址</label>
                                <input v-model="textForm.base_url" type="text"
                                    placeholder="https://ark.cn-beijing.volces.com/api/v3/"
                                    class="field-input" />
                                <p class="field-hint">火山方舟 Responses API：填 v3 根地址，如 https://ark.cn-beijing.volces.com/api/v3/</p>
                            </div>
                            <!-- API Key -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                                <div class="relative">
                                    <input v-model="textForm.api_key" :type="showTextKey ? 'text' : 'password'"
                                        placeholder="sk-..."
                                        class="field-input pr-12" />
                                    <button type="button" @click="showTextKey = !showTextKey"
                                        class="eye-btn">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path v-if="!showTextKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    </button>
                                </div>
                                <p class="field-hint">密钥仅存储于服务端数据库，不会发送到浏览器</p>
                            </div>
                            <!-- Model -->
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">模型名称</label>
                                <input v-model="textForm.model" type="text"
                                    placeholder="doubao-1-5-pro-32k"
                                    class="field-input" />
                                <p class="field-hint">模型 ID 或推理接入点 ID（ep-xxx）</p>
                            </div>
                            <!-- Temperature + Timeout -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">
                                        温度
                                        <span class="text-amber-400 font-mono ml-1">{{ textForm.temperature }}</span>
                                    </label>
                                    <input type="range" v-model.number="textForm.temperature" min="0" max="2" step="0.05"
                                        class="w-full accent-amber-400 mt-1" />
                                    <div class="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>精确 (0)</span><span>创意 (2)</span>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-300 mb-2">超时 (毫秒)</label>
                                    <input v-model.number="textForm.timeout" type="number" min="5000" step="5000"
                                        class="field-input" />
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">思考深度</label>
                                <p class="text-slate-500 text-[11px] mb-2 leading-relaxed">对应上游 <code class="px-1 py-0.5 rounded bg-white/5 text-slate-400 text-[10px]">reasoning.effort</code>，选「最快」时关闭深度思考、延迟明显更低。</p>
                                <div class="relative group">
                                    <span class="select-prefix-icon" aria-hidden="true">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </span>
                                    <select v-model="textForm.reasoning_effort" class="field-select" title="选择模型推理强度">
                                        <option value="minimal">最快 · 关闭深度 (minimal) — 推荐</option>
                                        <option value="none">不推理 (none)</option>
                                        <option value="low">轻量 (low)</option>
                                        <option value="medium">均衡 (medium) · 更慢更细</option>
                                        <option value="high">高 (high)</option>
                                        <option value="xhigh">极高 (xhigh)</option>
                                        <option value="off">不传参数 (off) · 其它模型</option>
                                    </select>
                                    <span class="select-chevron" aria-hidden="true">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                                <p class="field-hint">Doubao-Seed 建议「最快」；需深度分析时再提高档位。</p>
                            </div>

                            <button @click="saveTextSettings" :disabled="saveLoading"
                                class="w-full btn-primary mt-2">
                                <svg v-if="saveLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {{ saveLoading ? '保存中...' : '保存文本生成配置' }}
                            </button>
                        </div>
                    </div>

                    <!-- Tab: 图片生成 -->
                    <div v-else-if="activeTab === 'image'">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-white font-semibold">图片生成配置</h2>
                                <p class="text-slate-400 text-xs">菜谱配图生成功能（豆包 Seedream 等）</p>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">图片 API 地址</label>
                                <input v-model="imageForm.base_url" type="text"
                                    placeholder="https://ark.cn-beijing.volces.com/api/v3"
                                    class="field-input" />
                                <p class="field-hint">填到 <code class="text-slate-300">/api/v3</code> 即可</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                                <div class="relative">
                                    <input v-model="imageForm.api_key" :type="showImageKey ? 'text' : 'password'"
                                        placeholder="sk-..."
                                        class="field-input pr-12" />
                                    <button type="button" @click="showImageKey = !showImageKey" class="eye-btn">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path v-if="!showImageKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">模型名称</label>
                                <input v-model="imageForm.model" type="text"
                                    placeholder="doubao-seedream-5-0-260128"
                                    class="field-input" />
                                <p class="field-hint">与火山方舟文生图文档中的 model 一致（如 Seedream 系列）</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">默认尺寸</label>
                                <input v-model="imageForm.default_size" type="text"
                                    placeholder="2K"
                                    class="field-input" />
                                <p class="field-hint">与 OpenAI SDK 示例一致，如 <code class="text-slate-300">2K</code>、<code class="text-slate-300">1024x1024</code>（依模型文档为准）</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">返回格式</label>
                                <select v-model="imageForm.response_format" class="field-input">
                                    <option value="url">url</option>
                                    <option value="b64_json">b64_json</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-3">
                                <input id="img-watermark" v-model="imageForm.watermark" type="checkbox"
                                    class="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50" />
                                <label for="img-watermark" class="text-sm text-slate-300">水印（对应官方 <code class="text-slate-400">extra_body.watermark</code>）</label>
                            </div>

                            <button @click="saveImageSettings" :disabled="saveLoading"
                                class="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2">
                                <svg v-if="saveLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {{ saveLoading ? '保存中...' : '保存图片生成配置' }}
                            </button>
                        </div>
                    </div>

                    <!-- Tab: 修改密码 -->
                    <div v-else-if="activeTab === 'password'">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <h2 class="text-white font-semibold">修改管理员密码</h2>
                                <p class="text-slate-400 text-xs">密码以 bcrypt 加密存储于数据库</p>
                            </div>
                        </div>

                        <form @submit.prevent="savePassword" class="space-y-5">
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">当前密码</label>
                                <input v-model="pwdForm.old_password" type="password" class="field-input"
                                    placeholder="请输入当前密码" autocomplete="current-password" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">新密码</label>
                                <input v-model="pwdForm.new_password" type="password" class="field-input"
                                    placeholder="至少 12 位，最多 72 字节" minlength="12" autocomplete="new-password" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-300 mb-2">确认新密码</label>
                                <input v-model="pwdForm.confirm_password" type="password" class="field-input"
                                    placeholder="再次输入新密码" autocomplete="new-password" />
                                <p v-if="pwdForm.new_password && pwdForm.confirm_password && pwdForm.new_password !== pwdForm.confirm_password"
                                    class="text-red-400 text-xs mt-1.5">两次输入的密码不一致</p>
                            </div>

                            <button type="submit"
                                :disabled="saveLoading || !pwdForm.old_password || !pwdForm.new_password || pwdForm.new_password !== pwdForm.confirm_password"
                                class="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-600/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2">
                                <svg v-if="saveLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                {{ saveLoading ? '更新中...' : '更新密码' }}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { API_PATH_PREFIX } from '@/config/apiPrefix'

const _envBackend = (import.meta as any).env.VITE_BACKEND_URL as string | undefined
const BACKEND_URL: string = _envBackend === '' ? '' : (_envBackend ?? '')

const api = axios.create({ baseURL: BACKEND_URL, timeout: 15000 })

// ---------- State ----------
const isAuthenticated = ref(false)
const token = ref('')
const loginPassword = ref('')
const showLoginPwd = ref(false)
const showTextKey = ref(false)
const showImageKey = ref(false)
const loginLoading = ref(false)
const loginError = ref('')
const settingsLoading = ref(false)
const saveLoading = ref(false)
const backendUrl = ref(BACKEND_URL)
const backendStatus = ref<'checking' | 'ok' | 'error'>('checking')
const activeTab = ref('text')

const tabs = [
    { id: 'text',     label: '文本生成配置', shortLabel: '文本', icon: '💬' },
    { id: 'image',    label: '图片生成配置', shortLabel: '图片', icon: '🖼️' },
    { id: 'password', label: '修改密码',     shortLabel: '密码', icon: '🔑' },
]

const textForm = reactive({
    base_url: '',
    api_key: '',
    model: '',
    temperature: 0.7,
    timeout: 300000,
    reasoning_effort: 'minimal' as 'off' | 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh',
})
const imageForm = reactive({
    base_url: '',
    api_key: '',
    model: '',
    default_size: '2K',
    response_format: 'url',
    watermark: true,
})
const pwdForm = reactive({ old_password: '', new_password: '', confirm_password: '' })
const toast = reactive({ visible: false, type: 'success' as 'success' | 'error', message: '' })

// ---------- Helpers ----------
function showToast(message: string, type: 'success' | 'error' = 'success') {
    toast.message = message
    toast.type = type
    toast.visible = true
    setTimeout(() => { toast.visible = false }, 3500)
}

function authHeader() {
    return { Authorization: `Bearer ${token.value}` }
}

// ---------- Backend health ----------
async function checkBackend() {
    backendStatus.value = 'checking'
    try {
        await api.get('/health')
        backendStatus.value = 'ok'
    } catch {
        backendStatus.value = 'error'
    }
}

// ---------- Login ----------
async function handleLogin() {
    loginError.value = ''
    loginLoading.value = true
    try {
        const { data } = await api.post(`${API_PATH_PREFIX}/admin/login`, { password: loginPassword.value })
        token.value = data.access_token
        sessionStorage.setItem('jmanage_token', data.access_token)
        isAuthenticated.value = true
        await loadSettings()
    } catch (err: any) {
        loginError.value = err?.response?.data?.detail || '登录失败，请检查密码或确认后端服务正常'
    } finally {
        loginLoading.value = false
    }
}

function handleLogout() {
    isAuthenticated.value = false
    token.value = ''
    sessionStorage.removeItem('jmanage_token')
    loginPassword.value = ''
}

// ---------- Load settings ----------
async function loadSettings() {
    settingsLoading.value = true
    try {
        const { data } = await api.get(`${API_PATH_PREFIX}/admin/settings`, { headers: authHeader() })
        Object.assign(textForm, data.text_generation)
        if (textForm.reasoning_effort === undefined) {
            textForm.reasoning_effort = 'minimal'
        }
        Object.assign(imageForm, data.image_generation)
    } catch (err: any) {
        if (err?.response?.status === 401) {
            handleLogout()
            loginError.value = '登录已过期，请重新登录'
        } else {
            showToast('加载配置失败：' + (err?.response?.data?.detail || err.message), 'error')
        }
    } finally {
        settingsLoading.value = false
    }
}

// ---------- Save ----------
async function saveTextSettings() {
    saveLoading.value = true
    try {
        await api.put(`${API_PATH_PREFIX}/admin/settings`,
            { text_generation: { ...textForm }, image_generation: { ...imageForm } },
            { headers: authHeader() })
        showToast('文本生成配置已保存')
    } catch (err: any) {
        showToast('保存失败：' + (err?.response?.data?.detail || err.message), 'error')
    } finally {
        saveLoading.value = false
    }
}

async function saveImageSettings() {
    saveLoading.value = true
    try {
        await api.put(`${API_PATH_PREFIX}/admin/settings`,
            { text_generation: { ...textForm }, image_generation: { ...imageForm } },
            { headers: authHeader() })
        showToast('图片生成配置已保存')
    } catch (err: any) {
        showToast('保存失败：' + (err?.response?.data?.detail || err.message), 'error')
    } finally {
        saveLoading.value = false
    }
}

async function savePassword() {
    if (pwdForm.new_password !== pwdForm.confirm_password) return
    saveLoading.value = true
    try {
        await api.put(`${API_PATH_PREFIX}/admin/password`,
            { old_password: pwdForm.old_password, new_password: pwdForm.new_password },
            { headers: authHeader() })
        showToast('密码已成功更新')
        pwdForm.old_password = ''
        pwdForm.new_password = ''
        pwdForm.confirm_password = ''
    } catch (err: any) {
        showToast('更新失败：' + (err?.response?.data?.detail || err.message), 'error')
    } finally {
        saveLoading.value = false
    }
}

// ---------- Lifecycle ----------
onMounted(async () => {
    checkBackend()
    const saved = sessionStorage.getItem('jmanage_token')
    if (saved) {
        token.value = saved
        isAuthenticated.value = true
        await loadSettings()
    }
})
</script>

<style scoped>
.field-input {
    @apply w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60 focus:bg-white/10 transition-all;
}

.field-hint {
    @apply text-slate-500 text-xs mt-1.5;
}

/* 原生下拉里外观（与 field-input 区分：渐变、内阴影、去系统外观） */
.field-select {
    @apply w-full pl-10 pr-11 py-3 rounded-xl text-sm text-slate-100 font-medium;
    @apply border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)];
    @apply bg-gradient-to-b from-white/[0.1] to-white/[0.04];
    @apply transition-all duration-200 cursor-pointer;
    @apply hover:border-amber-400/40 hover:from-white/[0.12] hover:to-white/[0.05];
    @apply focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400/50;
    color-scheme: dark;
    -webkit-appearance: none;
    appearance: none;
}

.select-prefix-icon {
    @apply pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/90;
    filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.15));
}

.select-chevron {
    @apply pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400;
    @apply transition-colors duration-200 group-hover:text-amber-400/80;
}

.eye-btn {
    @apply absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition;
}

.btn-primary {
    @apply bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
    const fileEnv = loadEnv(mode, process.cwd(), '')
    const forbidden = Object.entries({ ...process.env, ...fileEnv })
        .filter(([name, value]) => /^VITE_.*(?:KEY|TOKEN|SECRET|PASSWORD)/i.test(name) && value)
        .map(([name]) => name)
    if (forbidden.length) {
        throw new Error(`Provider credentials must stay on the backend. Remove: ${forbidden.join(', ')}`)
    }
    const base = fileEnv.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/'
    const apiPath =
        (fileEnv.VITE_API_PATH_PREFIX || process.env.VITE_API_PATH_PREFIX || '/wte-api').replace(
            /\/$/,
            ''
        ) || '/wte-api'
    if (!base.startsWith('/')) {
        throw new Error(`VITE_BASE_PATH 必须以 / 开头，当前为: ${base}`)
    }
    if (base !== '/' && !base.endsWith('/')) {
        throw new Error(`VITE_BASE_PATH 为子路径时建议以 / 结尾，当前为: ${base}`)
    }
    return {
    base,
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    server: {
        host: '127.0.0.1',
        // VITE_BACKEND_URL 为空时，会请求与 VITE_API_PATH_PREFIX 一致的路径，需代理到本机后端
        proxy: {
            '/health': {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true
            },
            [apiPath]: {
                target: 'http://127.0.0.1:8080',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild'
    }
    }
})

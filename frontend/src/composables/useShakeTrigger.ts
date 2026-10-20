import { ref, watch, onUnmounted, type Ref } from 'vue'

export type ShakeMotionInput = {
    /** 首次有效摇动锁定后的方向向量 */
    x: number
    y: number
    z: number
    /** 当前摇动力度，后续摇动只更新力度，不改变方向 */
    strength: number
}

/** iOS 13+ 需在用户手势中调用；非 iOS 或无需授权时返回 true */
export async function requestMotionPermission(): Promise<boolean> {
    const DM = DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DM.requestPermission === 'function') {
        try {
            const r = await DM.requestPermission()
            return r === 'granted'
        } catch {
            return false
        }
    }
    return true
}

type ShakeOptions = {
    /** 为 true 时监听 devicemotion */
    active: Ref<boolean>
    /** 检测到一次有效摇动时触发（已有功能，保留兼容） */
    onShake?: () => void
    /** 摇动状态开始时触发 */
    onShakeStart?: () => void
    /** 摇动停止（持续静止 stopMs 后）触发，用于开始抽取菜谱 */
    onShakeStop?: () => void
    /** acceleration 向量模长阈值（m/s² 量级） */
    threshold?: number
    cooldownMs?: number
    /** 静止判定时间（ms）；超过此时间且模长低于 stopThreshold 视为停止 */
    stopMs?: number
    stopThreshold?: number
}

/**
 * 实时运动数据：外部可绑定到 Dice3D 的 acceleration prop
 */
export const currentAccel = ref<ShakeMotionInput | null>(null)

/**
 * 当前是否处于摇动中
 */
export const isShaking = ref(false)

/**
 * 摇一摇检测；与点击触发并列，二者互不替代。
 * 返回 { currentAccel, isShaking } 引用（与模块级 ref 相同）。
 */
export function useShakeTrigger(opts: ShakeOptions) {
    const threshold = opts.threshold ?? 12
    const cooldownMs = opts.cooldownMs ?? 1400
    const stopMs = opts.stopMs ?? 800
    const stopThreshold = opts.stopThreshold ?? 4

    let lastTrigger = 0
    let stopTimer: ReturnType<typeof setTimeout> | null = null
    let wasShaking = false
    let lockedDirection: { x: number; y: number; z: number } | null = null

    const clearStopTimer = () => {
        if (stopTimer !== null) {
            clearTimeout(stopTimer)
            stopTimer = null
        }
    }

    const onMotion = (e: DeviceMotionEvent) => {
        if (!opts.active.value) return
        const a = e.acceleration
        if (!a || a.x == null || a.y == null || a.z == null) return

        const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)

        if (mag >= threshold) {
            if (!lockedDirection) {
                lockedDirection = {
                    x: (a.x ?? 0) / mag,
                    y: (a.y ?? 0) / mag,
                    z: (a.z ?? 0) / mag
                }
            }

            // 只有真正摇动时才给色子施力；方向锁定为首次有效摇动，后续只增加力度。
            currentAccel.value = {
                ...lockedDirection,
                strength: mag
            }

            // 进入摇动状态
            clearStopTimer()

            if (!wasShaking) {
                wasShaking = true
                isShaking.value = true
                opts.onShakeStart?.()
            }

            // 兼容旧 onShake（冷却保护）
            const now = Date.now()
            if (opts.onShake && now - lastTrigger >= cooldownMs) {
                lastTrigger = now
                opts.onShake()
            }
        } else {
            currentAccel.value = null

            if (mag >= stopThreshold) return

            // 低于停止阈值，启动停止计时
            if (wasShaking && stopTimer === null) {
                stopTimer = setTimeout(() => {
                    wasShaking = false
                    isShaking.value = false
                    currentAccel.value = null
                    lockedDirection = null
                    stopTimer = null
                    opts.onShakeStop?.()
                }, stopMs)
            }
        }
    }

    let attached = false
    const attach = () => {
        if (attached || typeof window === 'undefined') return
        window.addEventListener('devicemotion', onMotion, true)
        attached = true
    }
    const detach = () => {
        if (!attached) return
        window.removeEventListener('devicemotion', onMotion, true)
        attached = false
        clearStopTimer()
        // 重置状态
        wasShaking = false
        isShaking.value = false
        currentAccel.value = null
        lockedDirection = null
    }

    watch(
        opts.active,
        (v) => {
            if (v) attach()
            else detach()
        },
        { immediate: true }
    )

    onUnmounted(detach)

    return { currentAccel, isShaking }
}

<template>
    <div
        class="flex flex-col items-center select-none"
        :class="[heightClass, interactive ? 'cursor-pointer' : 'cursor-default']"
        role="presentation"
        @click="onWrapperClick"
    >
        <div
            ref="canvasMountRef"
            class="w-full flex-1 min-h-[8rem] rounded-xl overflow-hidden bg-white"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'

const props = withDefaults(
    defineProps<{
        /** 实时加速度数据（来自 useShakeTrigger）；null 表示无传感器或静止 */
        acceleration?: { x: number; y: number; z: number; strength?: number } | null
        /** 抽菜进度（0-100）；传入时色子会随进度同步减速到静止 */
        settleProgress?: number | null
        /** 外层高度，如 h-52 */
        heightClass?: string
        /** 是否响应点击 */
        interactive?: boolean
        /** 无摇动时是否缓慢自转 */
        idleSpin?: boolean
        /**
         * 强制摇动 fallback（不支持 motion API 时，由父层置 true 触发内置正弦抖动）。
         * 有 acceleration 数据时该 prop 被忽略。
         */
        shaking?: boolean
    }>(),
    {
        acceleration: null,
        settleProgress: null,
        heightClass: 'h-52',
        interactive: true,
        idleSpin: false,
        shaking: false
    }
)

const emit = defineEmits<{ activate: [] }>()

const canvasMountRef = ref<HTMLElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let diceRoot: THREE.Group | null = null
let rafId = 0
let resizeObserver: ResizeObserver | null = null
let clock: THREE.Clock | null = null
let diceFitRadius = 0
let modelReadyForFit = false

/** 角速度（rad/frame），由外部摇动输入施加冲量并持续积累 */
const angVel = { x: 0, y: 0, z: 0 }
/** 本轮摇骰锁定的旋转轴，由首次有效摇动方向确定 */
let lockedAxis: { x: number; y: number; z: number } | null = null
/** 摇动时的轻阻尼：允许速度积累，只抵消少量惯性 */
const DAMPING_SHAKING = 0.985
/** 停止摇动后的滚动阻尼：模拟桌面摩擦，逐渐停下 */
const DAMPING_ROLLING = 0.935
/** 加速度 → 角速度的增量系数。只把传感器当成外力，不直接绑定姿态 */
const ACCEL_SCALE = 0.0075
/** 每帧最大角速度上限，避免无限加速（rad/frame） */
const MAX_ANG_VEL = 0.58
/** 过滤传感器余震，避免手机停止后低幅浮动继续推动色子 */
const ACTIVE_ACCEL_MIN = 3

function clampAngularVelocity() {
    const speed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2)
    if (speed <= MAX_ANG_VEL) return

    const ratio = MAX_ANG_VEL / speed
    angVel.x *= ratio
    angVel.y *= ratio
    angVel.z *= ratio
}

function normalizeVector(v: { x: number; y: number; z: number }) {
    const len = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2)
    if (len <= 0.0001) return null
    return {
        x: v.x / len,
        y: v.y / len,
        z: v.z / len
    }
}

function getAxisFromAcceleration(accel: { x: number; y: number; z: number }) {
    // 将手机首次摇动方向映射到色子的旋转轴；之后本轮摇骰不再改变该轴。
    return normalizeVector({
        x: accel.y,
        y: accel.x,
        z: accel.z
    })
}

function addRollImpulse(strength = 1) {
    if (!lockedAxis) {
        lockedAxis = normalizeVector({
            x: 0.7 + Math.random() * 0.3,
            y: 0.9 + Math.random() * 0.3,
            z: 0.5 + Math.random() * 0.3
        })
    }
    if (!lockedAxis) return

    const impulse = (0.42 + Math.random() * 0.2) * strength
    angVel.x += lockedAxis.x * impulse
    angVel.y += lockedAxis.y * impulse
    angVel.z += lockedAxis.z * impulse
    clampAngularVelocity()
}

function applySettleProgress(progress: number) {
    const p = Math.min(Math.max(progress, 0), 100) / 100

    if (p >= 0.995) {
        angVel.x = 0
        angVel.y = 0
        angVel.z = 0
        return
    }

    const speed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2)
    if (!lockedAxis && speed > 0.001) {
        lockedAxis = normalizeVector(angVel)
    }

    const remaining = 1 - p
    const targetSpeed = MAX_ANG_VEL * (0.035 + 0.965 * Math.pow(remaining, 1.35))
    const minVisibleSpeed = p < 0.96 ? MAX_ANG_VEL * (0.035 + 0.08 * remaining) : 0

    if (speed > targetSpeed) {
        const nextSpeed = speed + (targetSpeed - speed) * 0.08
        const ratio = nextSpeed / speed
        angVel.x *= ratio
        angVel.y *= ratio
        angVel.z *= ratio
    } else if (lockedAxis && speed < minVisibleSpeed) {
        const boost = (minVisibleSpeed - speed) * 0.2
        angVel.x += lockedAxis.x * boost
        angVel.y += lockedAxis.y * boost
        angVel.z += lockedAxis.z * boost
    }
}

function disposeMaterial(m: THREE.Material) {
    const anyM = m as unknown as Record<string, unknown>
    for (const key of Object.keys(anyM)) {
        const v = anyM[key]
        if (v && typeof (v as { dispose?: () => void }).dispose === 'function') {
            ;(v as { dispose: () => void }).dispose()
        }
    }
    m.dispose()
}

function disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            const mats = child.material
            if (Array.isArray(mats)) mats.forEach(disposeMaterial)
            else if (mats) disposeMaterial(mats)
        }
    })
}

/** Build the dice locally so no externally licensed model or texture is needed. */
function createDiceMaterial(value: number): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) return new THREE.MeshStandardMaterial({ color: 0xffffff })
    context.fillStyle = '#fffdf5'
    context.fillRect(0, 0, 256, 256)
    context.strokeStyle = '#e2e8d8'
    context.lineWidth = 12
    context.strokeRect(0, 0, 256, 256)
    const positions: Record<number, [number, number][]> = {
        1: [[128, 128]],
        2: [[64, 64], [192, 192]],
        3: [[64, 64], [128, 128], [192, 192]],
        4: [[64, 64], [192, 64], [64, 192], [192, 192]],
        5: [[64, 64], [192, 64], [128, 128], [64, 192], [192, 192]],
        6: [[64, 64], [192, 64], [64, 128], [192, 128], [64, 192], [192, 192]]
    }
    context.fillStyle = value === 1 || value === 4 ? '#dc2626' : '#1f2937'
    for (const [x, y] of positions[value]) {
        context.beginPath()
        context.arc(x, y, value === 1 ? 28 : 19, 0, Math.PI * 2)
        context.fill()
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.5 })
}

function refitDiceCamera() {
    if (!camera || !modelReadyForFit || diceFitRadius <= 0) return
    const r = diceFitRadius
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360)
    const aspect = Math.max(camera.aspect, 0.0001)
    const dist = Math.max(r / tanHalf, r / (tanHalf * aspect)) * 1.22
    camera.position.set(0, 0, dist)
    camera.near = Math.max(dist / 400, 0.01)
    camera.far = dist * 50
    camera.updateProjectionMatrix()
    camera.lookAt(0, 0, 0)
}

function resizeRenderer() {
    const el = canvasMountRef.value
    if (!el || !renderer || !camera) return
    const w = Math.max(1, el.clientWidth)
    const h = Math.max(1, el.clientHeight)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    refitDiceCamera()
}

function initThree() {
    const mount = canvasMountRef.value
    if (!mount) return

    clock = new THREE.Clock()

    const width = Math.max(1, mount.clientWidth)
    const height = Math.max(1, mount.clientHeight)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 200)
    camera.position.set(0, 0, 4)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.72))
    const key = new THREE.DirectionalLight(0xffffff, 1.05)
    key.position.set(3.5, 5, 4)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xfff5e6, 0.35)
    fill.position.set(-3, 1, -2)
    scene.add(fill)

    diceRoot = new THREE.Group()
    scene.add(diceRoot)

    const model = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.68, 0.68),
        [1, 6, 2, 5, 3, 4].map(createDiceMaterial)
    )
    diceRoot.add(model)
    diceRoot.rotation.set(0.35, -0.55, 0.1)
    diceFitRadius = 0.5 * Math.sqrt(3 * 0.68 ** 2) * 1.12
    modelReadyForFit = true
    refitDiceCamera()

    const loop = () => {
        rafId = requestAnimationFrame(loop)
        if (!renderer || !scene || !camera || !diceRoot || !clock) return
        const dt = Math.min(clock.getDelta(), 0.05)
        const accel = props.acceleration
        const accelMag = accel?.strength ?? (accel
            ? Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2)
            : 0)
        const isActivelyShaking = accelMag > ACTIVE_ACCEL_MIN

        if (isActivelyShaking && accel) {
            if (!lockedAxis) {
                lockedAxis = getAxisFromAcceleration(accel)
            }

            // 将手机摇动转成锁定方向上的冲量：越摇越快，但后续不再改变旋转方向。
            const force = Math.min(accelMag / 18, 1.8)
            const impulse = accelMag * ACCEL_SCALE * force
            if (lockedAxis) {
                angVel.x += lockedAxis.x * impulse
                angVel.y += lockedAxis.y * impulse
                angVel.z += lockedAxis.z * impulse
            }

            clampAngularVelocity()

            // 摇动中只施加轻阻尼，让速度继续增长
            angVel.x *= DAMPING_SHAKING
            angVel.y *= DAMPING_SHAKING
            angVel.z *= DAMPING_SHAKING
        } else if (props.settleProgress !== null) {
            // 抽菜界面中，色子按进度条同步降速，到 100% 时静止。
            applySettleProgress(props.settleProgress)
        } else {
            // 停止摇动：只保留惯性和摩擦，让色子逐渐停下
            angVel.x *= DAMPING_ROLLING
            angVel.y *= DAMPING_ROLLING
            angVel.z *= DAMPING_ROLLING
        }

        const speed = Math.sqrt(angVel.x ** 2 + angVel.y ** 2 + angVel.z ** 2)

        if (speed > 0.001) {
            diceRoot.rotation.x += angVel.x
            diceRoot.rotation.y += angVel.y
            diceRoot.rotation.z += angVel.z
        } else if (props.idleSpin) {
            // 完全静止后的缓慢自转
            diceRoot.rotation.y += 0.55 * dt
            diceRoot.rotation.x += 0.12 * dt
        } else if (props.settleProgress === null) {
            lockedAxis = null
        }

        renderer.render(scene, camera)
    }
    loop()
}

function teardownThree() {
    cancelAnimationFrame(rafId)
    resizeObserver?.disconnect()
    resizeObserver = null

    if (diceRoot && scene) {
        disposeGroup(diceRoot)
        scene.remove(diceRoot)
    }
    diceRoot = null
    diceFitRadius = 0
    modelReadyForFit = false

    if (renderer) {
        renderer.dispose()
        const el = renderer.domElement
        if (el.parentNode) el.parentNode.removeChild(el)
    }
    renderer = null
    scene = null
    camera = null
    clock = null
}

function onWrapperClick(e: MouseEvent) {
    if (!props.interactive) return
    e.preventDefault()
    emit('activate')
}

// 当 acceleration 由非 null 变为 null 时（摇动停止），角速度已在 loop 中自然衰减，无需额外处理
watch(
    () => props.acceleration,
    (val) => {
        // 加速度数据消失时重置角速度累积，使衰减从当前帧开始
        if (!val) {
            // 保留现有 angVel，让阻尼自然停下；此处不强制清零
        }
    }
)

watch(
    () => props.shaking,
    (val, oldVal) => {
        if (val && !oldVal) {
            addRollImpulse(1.1)
        }
    }
)

onMounted(() => {
    nextTick(() => {
        initThree()
        const mount = canvasMountRef.value
        if (mount) {
            resizeObserver = new ResizeObserver(() => resizeRenderer())
            resizeObserver.observe(mount)
        }
    })
})

onBeforeUnmount(() => {
    teardownThree()
})
</script>

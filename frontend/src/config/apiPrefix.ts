/**
 * 与后端 `API_PATH_PREFIX`、Nginx 中 `location` 一致（默认 /wte-api，避免与站点的 /api 冲突）
 */
const raw = (import.meta.env.VITE_API_PATH_PREFIX as string | undefined) ?? '/wte-api'
const trimmed = raw.trim() || '/wte-api'
const withLead = trimmed.startsWith('/') ? trimmed : `/${trimmed}`

export const API_PATH_PREFIX = withLead.replace(/\/+$/, '')

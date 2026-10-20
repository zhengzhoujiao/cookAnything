# 电子菜谱前端

Vue 3 + TypeScript + Tailwind CSS + Three.js。前端源自 [liu-ziting/what-to-eat](https://github.com/liu-ziting/what-to-eat)，原作者 liuziting。授权状态见根目录 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

```sh
npm ci
npm run dev
npm run build
```

推荐 Node.js 22。根目录运行 `python scripts/init_local_env.py` 可生成前后端本地配置；后端服务与启动说明见根 README。

浏览器仅配置站点路径、API 前缀和后端地址，见 `.env.example`。所有服务方 API Key 与模型配置都在 `/JManage` 管理员页面保存到后端。前端不保存服务方密钥，启动时会清除旧版本的两项配置缓存。

部署、跨域与子路径设置见 [DEPLOY.md](../DEPLOY.md)。

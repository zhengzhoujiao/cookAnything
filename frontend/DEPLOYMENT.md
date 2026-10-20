# 前端部署

统一部署流程见根目录 [DEPLOY.md](../DEPLOY.md)。

- 独立使用需同时部署后端与 MongoDB。
- `npm ci && npm run build` 包含类型检查和服务方密钥环境变量检查。
- 静态托管设置公开的 `VITE_BACKEND_URL`，后端配置明确的 CORS 来源。
- 不得将 API Key 填入 VITE 环境变量、前端代码或静态托管构建参数。
- 生产环境须使用 HTTPS，并为当前匿名 AI 代理增加鉴权、限流和额度控制。

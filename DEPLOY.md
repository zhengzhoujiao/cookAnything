# 独立部署

本项目无需依赖相邻私有项目或既有容器网络。默认配置用于本地测试。

## Docker Compose

根目录执行：

```sh
python scripts/init_local_env.py
docker compose up --build -d
```

访问 `http://localhost:8088`，在 `/JManage` 中使用 `backend/.env` 的初始密码登录，修改密码并配置模型。`mongo` 仅绑定本机 `27019` 端口，后端只在 Compose 网络暴露 `8080`，前端默认绑定 `127.0.0.1:8088`。生产环境可取消 MongoDB 的宿主机端口映射。

```sh
docker compose logs --tail=100 backend
docker compose stop
```

数据保存在 `mongo_data` 卷；备份需限制访问权限，避免将数据库和备份提交到仓库。不要为了重启而删除数据卷。

## 本地开发

Python 3.12 虚拟环境、MongoDB 与启动步骤见根 README 和 `backend/README.md`。前端默认同源请求，Vite 将 `/wte-api` 转发至 `127.0.0.1:8080`。管理员页面的健康检查在开发模式下也经由 Vite 代理。

## 公网部署

1. 保持 Compose 的回环绑定，在入口反向代理配置自己的域名、HTTPS 和访问控制。
2. 公网 AI 接口当前允许匿名调用，须增加鉴权、限流和调用额度；不要把 CORS 当作鉴权。
3. 管理页面和 `/wte-api/admin/` 建议限制来源 IP 或通过 VPN 访问。
4. 同域部署使用 `VITE_BACKEND_URL=`；跨域部署填写后端 HTTPS 地址，同时设置后端 `ALLOWED_ORIGINS` 为明确的前端来源。
5. 前端根路径部署使用 `VITE_BASE_PATH=/`。如需 `/recipes/` 子路径，构建时设置 `VITE_BASE_PATH=/recipes/`，由你的 Web 服务器将该路径映射到 dist，并配置 SPA 回退；API 前缀仍须单独代理至后端。

内置 `frontend/nginx.conf` 仅演示根路径与默认 `/wte-api` 代理。修改 API 前缀时，必须同步后端 `API_PATH_PREFIX`、前端 `VITE_API_PATH_PREFIX` 和 Nginx location。

## 静态托管

可以将 `frontend/dist` 托管到 Vercel、Netlify 等静态平台，但需另行部署 FastAPI + MongoDB。在平台设置中配置公开的 `VITE_BACKEND_URL` 与 `VITE_BASE_PATH`，并在后端允许相应来源。不得设置服务方密钥为 `VITE_*` 变量。静态平台的配置不会自动部署本仓库后端。

## 凭据轮换

`python scripts/init_local_env.py --rotate` 会备份并替换本地 `.env` 中的 JWT 签名密钥和初始化密码，旧 JWT 将在后端重启后失效。已有管理员账号不会被初始化变量覆盖，必须在 `/JManage` 修改其数据库密码。此脚本不会连接或修改已部署服务器；服务器需要单独更新配置并重启服务。

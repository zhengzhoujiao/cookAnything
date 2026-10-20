# 后端服务

FastAPI + MongoDB，提供管理员 JWT 登录、文本 Responses 与图片 Images 代理，以及服务端模型配置管理。

## 开发启动

需要 Python 3.12 与 MongoDB 7。根目录运行 `python scripts/init_local_env.py` 生成独立随机凭据，`docker compose up -d mongo` 启动本机 MongoDB。

```sh
python -m venv backend/.venv
```

Windows PowerShell 激活：`backend/.venv/Scripts/Activate.ps1`；macOS/Linux：`source backend/.venv/bin/activate`。然后在根目录执行：

```sh
python -m pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload --port 8080
```

`.env` 由本目录的 config.py 读取；进程环境变量优先。`SECRET_KEY` 必填，至少 32 字符，建议使用生成脚本；`ADMIN_INITIAL_PASSWORD` 必填，至少 12 字符且最多 72 UTF-8 字节，两者不可相同。缺失、弱值或示例占位值会阻止启动。

初次连接新数据库时创建 `admin`，其初始密码仅在本机 `.env` 中保存；之后在前端 `/JManage` 修改密码。更改初始化变量不会更新已有账号。

其他变量见 `.env.example`：`MONGODB_URL`、`DATABASE_NAME`、`API_PATH_PREFIX`、`ALLOWED_ORIGINS`。如连接串包含认证信息，不得写入日志或截图。

## 接口

默认 API 前缀 `/wte-api`：

| 方法与路径 | 用途 |
| --- | --- |
| GET /health | 健康检查 |
| POST /wte-api/admin/login | 管理员登录 |
| GET /wte-api/admin/settings | 读取配置，需要管理员 JWT |
| PUT /wte-api/admin/settings | 保存配置，需要管理员 JWT |
| PUT /wte-api/admin/password | 修改密码，需要管理员 JWT |
| POST /wte-api/ai/chat | 文本生成，当前允许匿名请求 |
| POST /wte-api/ai/images | 图片生成，当前允许匿名请求 |

服务方 API Key 存储在 MongoDB；只有管理员配置接口会返回完整密钥，普通生成接口不返回配置。数据库中的 Key 尚未加密，须通过网络隔离、访问控制和备份权限保护。

## 验证

根目录运行 `python -m unittest discover -s backend/tests -v`。配置 `TEST_MONGODB_URL` 后会执行真实 MongoDB 集成测试；每轮使用随机数据库并在结束后删除，不请求真实付费模型。未配置时，集成测试会跳过。

生产部署见根目录 `DEPLOY.md`，安全边界见 `SECURITY.md`。

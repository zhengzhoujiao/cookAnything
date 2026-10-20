# 来源、依赖与素材记录

## 上游前端：授权待核验

- 项目：[liu-ziting/what-to-eat](https://github.com/liu-ziting/what-to-eat)，原项目名“一饭封神”。
- 作者标识：liu-ziting / liuziting；原页面中的作者署名已保留。
- 使用范围：本项目维护者已确认前端复用了该项目；不是仅 README 模板残留。
- 原始版本：当前私有 Git 历史未保留上游提交映射，尚未确定所使用的具体版本。
- 许可状态：本次检查未获得可核验的 LICENSE 或再分发授权。GitHub 页面、master/main 分支的常见 LICENSE 路径未取得许可文本；搜索索引显示有该公开项目，但“可查看源码”不能用作许可证依据。
- 发布条件：补齐所使用版本的许可证和必要署名，或取得权利人明确允许本项目修改及再分发的授权。应保留原许可全文及其要求的声明，再确定本项目新增部分的许可。

私有历史还出现 `zhengzhoujiao/dzcp` 合并来源；需确认它是否仅为维护者的中间仓库，以及是否包含额外第三方代码。本文件不是许可证，也不授予任何原作者未授予的权利。

## 前端直接依赖

以下许可名称来自所安装包的 package.json；完整依赖树以 package-lock.json 为准。各依赖仍受其自己的许可证约束，不能因本项目后续选定许可证而覆盖其权利声明。需要二进制/容器分发时，可运行 `python scripts/collect_notices.py` 按需收集许可文件，输出至被 Git 忽略的 `.release/third-party/`，无需逐个提交到源码仓库。

| 依赖 | 声明的许可 |
| --- | --- |
| Vue、Vue Router、@vueuse/core | MIT |
| axios、markdown-it、party-js、Three.js | MIT |
| Vite、@vitejs/plugin-vue、Tailwind CSS、PostCSS、Autoprefixer | MIT |
| TypeScript | Apache-2.0 |
| vue-tsc、@types/node、@types/three | MIT |

## 后端与运行服务

后端使用 FastAPI、Uvicorn、Motor/PyMongo、Pydantic、pydantic-settings、HTTPX、OpenAI Python SDK、bcrypt、PyJWT、python-dotenv 和 python-multipart。分发前应按实际安装版本收集许可；这些依赖的许可不代表上游前端已获许可。

Docker 配置拉取 Python、Node.js、Nginx 和 MongoDB 镜像，各镜像及所含软件适用各自条款。MongoDB 社区版具有独立许可要求，应核对其官方许可后再决定是否分发自定义镜像或托管服务。

## 已移除或替换的资源

| 原资源 | 公开版本中的处理 |
| --- | --- |
| PingFangLiuAngLeTianTi-2.ttf | 未确认再分发授权，已移除；界面使用设备系统字体 |
| dice.glb | 未确认来源，已移除；骰子由 Three.js 几何体和本地 Canvas 点阵生成 |
| 原 logo.svg、favicon.ico | 原件已备份，发布版本使用本次编写的简易 SVG 餐碗图形 |
| wx.png 收款码 | 已从发布内容及界面中移除；未再分发原作者收款信息 |
| 外部 Google Fonts 请求 | 已移除，避免页面依赖外部字体请求 |

本次新增的几何体和 SVG 不使用外部素材；仍需在上游许可确认后，决定新增代码与图形的许可声明。

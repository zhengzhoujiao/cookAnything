/**
 * 万能电子菜谱小程序全局配置
 *
 * ⚠️ 使用前必须在微信小程序管理后台完成以下配置：
 *   开发 → 开发管理 → 开发设置 → 业务域名 → 添加 WEBVIEW_URL 对应的域名
 *
 * 本地开发调试时可在微信开发者工具勾选：
 *   详情 → 本地设置 → 不校验合法域名、web-view（业务域名）...
 */
const Config = {
  /**
   * 万能电子菜谱 Web 端地址（本地联调用）
   * 注意：真机环境下 localhost/127.0.0.1 指向手机本机，通常无法访问电脑 dev server
   * 若需真机调试，请改为可公网访问的 https 域名（并配置业务域名）
   */
  WEBVIEW_URL: 'https://example.com/',
  // WEBVIEW_URL: 'http://localhost:5173/',

  /** 应用名称 */
  APP_TITLE: '万能电子菜谱',
}

module.exports = Config

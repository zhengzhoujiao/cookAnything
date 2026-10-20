// pages/webview/webview.js
const Config = require('../../utils/config')

Page({
  data: {
    webviewUrl: Config.WEBVIEW_URL,
    loadError: false,
    errorMsg: '',
  },

  /**
   * 页面生命周期：支持通过 url 参数动态传入地址（预留扩展）
   * 例：wx.navigateTo({ url: '/pages/webview/webview?url=...' })
   */
  onLoad(options) {
    if (options.url) {
      this.setData({ webviewUrl: decodeURIComponent(options.url) })
    }
  },

  /** WebView 加载完成 */
  handleLoad() {
    console.log('[WebView] 加载完成:', this.data.webviewUrl)
  },

  /** WebView 加载失败 */
  handleError(e) {
    console.error('[WebView] 加载失败:', e.detail)
    this.setData({
      loadError: true,
      errorMsg: '无法加载页面，请检查网络连接后重试',
    })
  },

  /**
   * 接收 Web 端 postMessage 消息
   * Web 端调用方式：wx.miniProgram.postMessage({ data: { action: '...' } })
   * 注意：消息在小程序后退、销毁或分享时才会触发回调
   */
  handleMessage(e) {
    const messages = e.detail.data
    console.log('[WebView] 收到 Web 端消息:', messages)
    // 在此处理来自 Web 端的业务消息
  },

  /** 重新加载 WebView */
  onRetry() {
    this.setData({ loadError: false, errorMsg: '' })
  },

  /** 分享给朋友 */
  onShareAppMessage() {
    return {
      title: Config.APP_TITLE,
      path: '/pages/webview/webview',
    }
  },
})

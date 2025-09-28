/**
 * 扩展消息通信机制
 * 基于MultiPost扩展的通信协议和消息格式
 */

/**
 * MultiPost扩展的消息动作常量
 */
export const EXTENSION_ACTIONS = {
  // 服务状态检查
  CHECK_SERVICE_STATUS: 'MULTIPOST_EXTENSION_CHECK_SERVICE_STATUS',
  
  // 发布相关
  PUBLISH: 'MULTIPOST_EXTENSION_PUBLISH',
  
  // 平台信息
  GET_PLATFORMS: 'MULTIPOST_EXTENSION_PLATFORMS',
  
  // 权限相关
  REQUEST_TRUST_DOMAIN: 'MULTIPOST_EXTENSION_REQUEST_TRUST_DOMAIN',
  
  // 选项页面
  OPEN_OPTIONS: 'MULTIPOST_EXTENSION_OPEN_OPTIONS'
};

/**
 * 平台类型常量
 */
export const PLATFORM_TYPES = {
  DYNAMIC: 'DYNAMIC',
  VIDEO: 'VIDEO', 
  ARTICLE: 'ARTICLE',
  PODCAST: 'PODCAST'
};

/**
 * 支持的平台名称
 */
export const PLATFORM_NAMES = {
  DOUYIN: '抖音',
  WEIBO: '微博',
  XIAOHONGSHU: '小红书',
  ZHIHU: '知乎',
  BILIBILI: 'B站',
  TOUTIAO: '头条号',
  WECHAT: '微信视频号',
  BAIJIAHAO: '百家号'
};

/**
 * 生成UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * MultiPost扩展消息通信管理器
 */
class ExtensionMessenger {
  constructor() {
    this.pendingMessages = new Map();
    this.eventListeners = new Map();
    this.setupMessageListener();
  }

  /**
   * 设置消息监听器
   */
  setupMessageListener() {
    // 监听来自扩展的消息响应
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'response') {
        this.handleExtensionMessage(event.data);
      }
    });
  }

  /**
   * 处理扩展消息响应
   * @param {Object} message 消息对象
   */
  handleExtensionMessage(message) {
    const { traceId, action, data } = message;
    
    // 处理响应消息
    if (traceId && this.pendingMessages.has(traceId)) {
      const { resolve, reject, cleanup } = this.pendingMessages.get(traceId);
      this.pendingMessages.delete(traceId);
      
      if (cleanup) {
        cleanup();
      }
      
      resolve(data);
      return;
    }
    
    // 处理事件消息
    if (this.eventListeners.has(action)) {
      const listeners = this.eventListeners.get(action);
      listeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('事件监听器执行失败:', error);
        }
      });
    }
  }

  /**
   * 发送请求到MultiPost扩展
   * @param {string} action 动作类型
   * @param {*} data 请求数据
   * @param {number} timeout 超时时间（毫秒）
   * @returns {Promise} 扩展响应
   */
  async sendRequest(action, data = undefined, timeout = 5000) {
    const traceId = generateUUID();

    return new Promise((resolve, reject) => {
      // 创建消息处理器
      const messageHandler = (event) => {
        if (event.data.type === 'response' && 
            event.data.action === action && 
            event.data.traceId === traceId) {
          cleanup();
          resolve(event.data.data);
        }
      };

      // 创建超时处理器
      let timeoutId;
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      }

      // 清理函数
      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      // 存储清理函数以便在响应处理中使用
      this.pendingMessages.set(traceId, { resolve, reject, cleanup });

      // 添加事件监听器
      window.addEventListener('message', messageHandler);

      // 发送消息
      window.postMessage({
        type: 'request',
        traceId,
        action,
        data,
      }, '*');
    });
  }

  /**
   * 添加事件监听器
   * @param {string} eventType 事件类型
   * @param {Function} listener 监听器函数
   */
  addEventListener(eventType, listener) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType).push(listener);
  }

  /**
   * 移除事件监听器
   * @param {string} eventType 事件类型
   * @param {Function} listener 监听器函数
   */
  removeEventListener(eventType, listener) {
    if (this.eventListeners.has(eventType)) {
      const listeners = this.eventListeners.get(eventType);
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 检查MultiPost扩展服务状态
   * @param {number} timeout 超时时间
   * @returns {Promise<boolean>} 服务是否运行
   */
  async checkServiceStatus(timeout = 5000) {
    try {
      await this.sendRequest(EXTENSION_ACTIONS.CHECK_SERVICE_STATUS, undefined, timeout);
      return true;
    } catch (error) {
      console.error('Service check failed:', error);
      return false;
    }
  }

  /**
   * 获取支持的平台信息
   * @returns {Promise<Array>} 平台信息列表
   */
  async getPlatformInfos() {
    try {
      return await this.sendRequest(EXTENSION_ACTIONS.GET_PLATFORMS);
    } catch (error) {
      console.error('获取平台信息失败:', error);
      return [];
    }
  }

  /**
   * 请求域名信任权限
   * @param {number} timeout 超时时间
   * @returns {Promise<Object>} 权限响应
   */
  async requestTrustDomain(timeout = 30000) {
    try {
      return await this.sendRequest(EXTENSION_ACTIONS.REQUEST_TRUST_DOMAIN, undefined, timeout);
    } catch (error) {
      console.error('请求权限失败:', error);
      throw error;
    }
  }

  /**
   * 打开扩展选项页面
   * @param {number} timeout 超时时间
   * @returns {Promise<boolean>} 是否成功打开
   */
  async openOptions(timeout = 5000) {
    try {
      await this.sendRequest(EXTENSION_ACTIONS.OPEN_OPTIONS, undefined, timeout);
      return true;
    } catch (error) {
      console.error('Failed to open extension options:', error);
      return false;
    }
  }

  /**
   * 发布内容到指定平台
   * @param {Object} syncData 发布数据
   * @returns {Promise<Object>} 发布结果
   */
  async publish(syncData) {
    try {
      return await this.sendRequest(EXTENSION_ACTIONS.PUBLISH, syncData, 30000);
    } catch (error) {
      console.error('发布失败:', error);
      throw error;
    }
  }
}

/**
 * MultiPost扩展数据构建器
 * 用于构建符合MultiPost扩展格式的SyncData
 */
class SyncDataBuilder {
  /**
   * 构建视频发布数据
   * @param {string} platformName 平台名称
   * @param {Object} videoData 视频数据
   * @param {Object} options 发布选项
   * @returns {Object} SyncData对象
   */
  static buildVideoSyncData(platformName, videoData, options = {}) {
    return {
      platforms: [{
        name: platformName,
        extraConfig: options.extraConfig || {}
      }],
      isAutoPublish: options.autoPublish || false,
      data: {
        title: videoData.title || '',
        content: videoData.content || videoData.description || '',
        video: {
          name: videoData.video?.name || 'video.mp4',
          url: videoData.videoUrl || videoData.video?.url || '',
          type: videoData.video?.type || 'video/mp4',
          size: videoData.video?.size || 0,
          originUrl: videoData.video?.originUrl
        },
        tags: Array.isArray(videoData.tags) ? videoData.tags : 
              (typeof videoData.tags === 'string' ? videoData.tags.split(',').map(t => t.trim()) : [])
      }
    };
  }

  /**
   * 构建动态发布数据
   * @param {string} platformName 平台名称
   * @param {Object} dynamicData 动态数据
   * @param {Object} options 发布选项
   * @returns {Object} SyncData对象
   */
  static buildDynamicSyncData(platformName, dynamicData, options = {}) {
    return {
      platforms: [{
        name: platformName,
        extraConfig: options.extraConfig || {}
      }],
      isAutoPublish: options.autoPublish || false,
      data: {
        title: dynamicData.title || '',
        content: dynamicData.content || '',
        images: (dynamicData.images || []).map(img => ({
          name: img.name || 'image.jpg',
          url: img.url || img,
          type: img.type || 'image/jpeg',
          size: img.size || 0,
          originUrl: img.originUrl
        })),
        videos: (dynamicData.videos || []).map(video => ({
          name: video.name || 'video.mp4',
          url: video.url || video,
          type: video.type || 'video/mp4',
          size: video.size || 0,
          originUrl: video.originUrl
        }))
      }
    };
  }

  /**
   * 构建文章发布数据
   * @param {string} platformName 平台名称
   * @param {Object} articleData 文章数据
   * @param {Object} options 发布选项
   * @returns {Object} SyncData对象
   */
  static buildArticleSyncData(platformName, articleData, options = {}) {
    return {
      platforms: [{
        name: platformName,
        extraConfig: options.extraConfig || {}
      }],
      isAutoPublish: options.autoPublish || false,
      data: {
        title: articleData.title || '',
        digest: articleData.digest || articleData.summary || '',
        cover: articleData.cover ? {
          name: articleData.cover.name || 'cover.jpg',
          url: articleData.cover.url || articleData.cover,
          type: articleData.cover.type || 'image/jpeg',
          size: articleData.cover.size || 0,
          originUrl: articleData.cover.originUrl
        } : null,
        htmlContent: articleData.htmlContent || '',
        markdownContent: articleData.markdownContent || articleData.content || '',
        images: (articleData.images || []).map(img => ({
          name: img.name || 'image.jpg',
          url: img.url || img,
          type: img.type || 'image/jpeg',
          size: img.size || 0,
          originUrl: img.originUrl
        }))
      }
    };
  }
}

// 创建默认实例
const messenger = new ExtensionMessenger();

// 便捷函数导出
export const checkServiceStatus = (timeout = 5000) => messenger.checkServiceStatus(timeout);
export const getPlatformInfos = () => messenger.getPlatformInfos();
export const requestTrustDomain = (timeout = 30000) => messenger.requestTrustDomain(timeout);
export const openOptions = (timeout = 5000) => messenger.openOptions(timeout);
export const publishToExtension = (syncData) => messenger.publish(syncData);
export const sendRequest = (action, data, timeout) => messenger.sendRequest(action, data, timeout);

// 导出类和实例
export { messenger, ExtensionMessenger, SyncDataBuilder };

// 默认导出
export default messenger;
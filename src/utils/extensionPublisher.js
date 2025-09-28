/**
 * MultiPost扩展发布器
 * 用于与MultiPost浏览器扩展通信，实现跨平台内容发布
 */

import { 
  checkServiceStatus, 
  publishToExtension, 
  SyncDataBuilder,
  PLATFORM_NAMES 
} from './extensionMessaging.js';

/**
 * 扩展发布器类
 * 负责与MultiPost扩展的通信和内容发布
 */
class ExtensionPublisher {
  constructor() {
    this.isExtensionAvailable = false;
    this.checkExtensionAvailability();
  }

  /**
   * 检查扩展是否可用
   * @returns {Promise<boolean>} 扩展可用性
   */
  async checkExtensionAvailability() {
    try {
      this.isExtensionAvailable = await checkServiceStatus(3000);
      return this.isExtensionAvailable;
    } catch (error) {
      console.warn('MultiPost扩展不可用:', error.message);
      this.isExtensionAvailable = false;
      return false;
    }
  }

  /**
   * 发布视频到抖音
   * @param {Object} videoData 视频数据
   * @returns {Promise} 发布结果
   */
  async publishToDouyin(videoData) {
    if (!this.isExtensionAvailable) {
      throw new Error('扩展不可用，请安装MultiPost扩展或使用备用发布方案');
    }

    try {
      // 使用SyncDataBuilder构造发布数据
      const syncData = new SyncDataBuilder()
        .setTitle(videoData.title || videoData.data?.title || '默认标题')
        .setContent(videoData.content || videoData.description || videoData.data?.content || '')
        .setVideoUrl(videoData.videoUrl || videoData.video?.url || videoData.url)
        .setCoverUrl(videoData.coverUrl || videoData.cover?.url)
        .setTags(videoData.tags || [])
        .setPlatformConfig(PLATFORM_NAMES.DOUYIN, {
          allowComment: true,
          allowDuet: true,
          allowStitch: true,
          visibility: 'public'
        })
        .build();

      console.log('发送发布请求到扩展:', syncData);
      
      const response = await publishToExtension(PLATFORM_NAMES.DOUYIN, syncData, {
        autoPublish: videoData.autoPublish || false,
        openInNewTab: true
      });
      
      return {
        success: true,
        message: '视频发布成功',
        data: response
      };
    } catch (error) {
      console.error('扩展发布失败:', error);
      throw error;
    }
  }

  /**
   * 通用发布方法
   * @param {string} platform 平台名称
   * @param {Object} data 发布数据
   * @param {Object} options 发布选项
   * @returns {Promise<Object>} 发布结果
   */
  async publishViaExtension(platform, data, options = {}) {
    if (!this.isExtensionAvailable) {
      throw new Error('扩展不可用，无法发布');
    }

    try {
      // 根据数据类型构建SyncData
      let syncData;
      const builder = new SyncDataBuilder();
      
      if (data.videoUrl || data.video) {
        // 视频类型
        syncData = builder
          .setTitle(data.title || '默认标题')
          .setContent(data.content || data.description || '')
          .setVideoUrl(data.videoUrl || data.video?.url)
          .setCoverUrl(data.coverUrl || data.cover?.url)
          .setTags(data.tags || [])
          .build();
      } else if (data.images && data.images.length > 0) {
        // 动态类型（包含图片）
        syncData = builder
          .setTitle(data.title || '默认标题')
          .setContent(data.content || '')
          .setImages(data.images)
          .build();
      } else {
        // 纯文本动态
        syncData = builder
          .setTitle(data.title || '默认标题')
          .setContent(data.content || '')
          .build();
      }

      console.log(`发布到${platform}:`, syncData);
      
      const response = await publishToExtension(platform, syncData, {
        autoPublish: options.autoPublish || false,
        openInNewTab: options.openInNewTab !== false,
        ...options
      });
      
      return {
        success: true,
        message: `${platform}发布成功`,
        data: response
      };
    } catch (error) {
      console.error(`${platform}发布失败:`, error);
      throw error;
    }
  }

  /**
   * 获取扩展状态
   * @returns {Object} 扩展状态信息
   */
  getExtensionStatus() {
    return {
      available: this.isExtensionAvailable
    };
  }
}

/**
 * 用户脚本注入方案（备用方案）
 * 当扩展不可用时，提供用户脚本让用户手动在抖音页面执行
 */
class UserScriptPublisher {
  /**
   * 生成抖音发布用户脚本
   * @param {Object} videoData 视频数据
   * @returns {string} 用户脚本代码
   */
  generateDouyinScript(videoData) {
    const scriptTemplate = `
// 抖音自动发布脚本 - 请在抖音创作者页面控制台中执行
(async function() {
  const videoData = ${JSON.stringify(videoData, null, 2)};
  
  // 等待元素函数
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error('元素未找到: ' + selector));
      }, timeout);
    });
  }
  
  try {
    console.log('开始执行抖音发布脚本...');
    
    // 检查是否在抖音创作者页面
    if (!window.location.href.includes('creator.douyin.com')) {
      alert('请在抖音创作者页面执行此脚本');
      return;
    }
    
    // 上传视频
    if (videoData.videoUrl) {
      console.log('开始上传视频...');
      const response = await fetch(videoData.videoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
      
      const fileInput = await waitForElement('input[type="file"]');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 等待视频处理完成
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 填写标题
    if (videoData.title) {
      console.log('填写标题...');
      const titleInput = await waitForElement('input[placeholder*="标题"], input[placeholder*="title"]');
      titleInput.value = videoData.title;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 填写描述
    if (videoData.content) {
      console.log('填写描述...');
      const contentArea = await waitForElement('div[contenteditable="true"], textarea');
      contentArea.textContent = videoData.content;
      contentArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 上传封面
    if (videoData.coverUrl) {
      console.log('上传封面...');
      const coverResponse = await fetch(videoData.coverUrl);
      const coverBlob = await coverResponse.blob();
      const coverFile = new File([coverBlob], 'cover.jpg', { type: 'image/jpeg' });
      
      const coverInput = await waitForElement('input[type="file"][accept*="image"]');
      const coverDataTransfer = new DataTransfer();
      coverDataTransfer.items.add(coverFile);
      coverInput.files = coverDataTransfer.files;
      coverInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    console.log('脚本执行完成！请检查内容并手动点击发布按钮。');
    alert('内容填写完成！请检查后点击发布按钮。');
    
  } catch (error) {
    console.error('脚本执行失败:', error);
    alert('脚本执行失败: ' + error.message);
  }
})();
`;
    
    return scriptTemplate;
  }
  
  /**
   * 提供用户脚本下载
   * @param {Object} videoData 视频数据
   */
  downloadScript(videoData) {
    const script = this.generateDouyinScript(videoData);
    const blob = new Blob([script], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'douyin-publish-script.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// 创建全局实例
const extensionPublisher = new ExtensionPublisher();
const userScriptPublisher = new UserScriptPublisher();

/**
 * 统一的抖音发布接口
 * @param {Object} videoData 视频数据
 * @returns {Promise} 发布结果
 */
export async function publishToDouyinWithExtension(videoData) {
  try {
    // 优先尝试扩展发布
    if (extensionPublisher.isExtensionAvailable) {
      return await extensionPublisher.publishToDouyin(videoData);
    } else {
      // 扩展不可用时，提供用户脚本方案
      const useUserScript = confirm(
        'MultiPost扩展不可用。\n\n' +
        '是否使用用户脚本方案？\n' +
        '点击"确定"下载脚本文件，然后在抖音创作者页面的控制台中执行。\n' +
        '点击"取消"打开抖音创作者页面手动发布。'
      );
      
      if (useUserScript) {
        userScriptPublisher.downloadScript(videoData);
        // 打开抖音创作者页面
        window.open('https://creator.douyin.com/', '_blank');
        
        return {
          success: true,
          message: '用户脚本已下载，请在抖音创作者页面执行',
          method: 'userscript'
        };
      } else {
        // 直接打开抖音创作者页面
        window.open('https://creator.douyin.com/', '_blank');
        
        return {
          success: true,
          message: '已打开抖音创作者页面，请手动发布',
          method: 'manual'
        };
      }
    }
  } catch (error) {
    console.error('发布失败:', error);
    throw error;
  }
}

// 导出服务实例
export { extensionPublisher, userScriptPublisher };

// 默认导出
export default {
  publishToDouyinWithExtension,
  extensionPublisher,
  userScriptPublisher
};
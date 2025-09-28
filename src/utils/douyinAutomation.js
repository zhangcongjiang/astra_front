/**
 * 抖音视频发布自动化脚本
 * 基于浏览器注入脚本实现
 */

// 抖音发布配置
const DOUYIN_CONFIG = {
  baseUrl: 'https://creator.douyin.com',
  uploadUrl: 'https://creator.douyin.com/creator-micro/content/upload',
  selectors: {
    uploadButton: '[data-testid="upload-btn"], .upload-btn, input[type="file"]',
    fileInput: 'input[type="file"][accept*="video"]',
    titleInput: 'input[placeholder*="作品标题"]',
    descInput: 'div.zone-container.editor-kit-container.editor.editor-comp-publish[contenteditable="true"]',
    coverUpload: 'div.content-upload-new',
    publishButton: '[data-testid="publish-btn"], .publish-btn, button[type="submit"]',
    progressBar: '.progress-bar, [data-testid="progress"]',
    errorMessage: '.error-message, [data-testid="error"]',
    successMessage: '.success-message, [data-testid="success"]'
  },
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  maxTitleLength: 55,
  maxDescLength: 2000
};

/**
 * 延迟函数
 * @param {number} ms 毫秒数
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 等待元素出现（使用MutationObserver实现）
 * @param {string} selector CSS选择器
 * @param {number} timeout 超时时间（毫秒）
 */
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
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
    }, timeout);
  });
};

/**
 * 从URL获取文件
 * @param {string} url 文件URL
 * @returns {Promise<File>} 文件对象
 */
const fetchFileFromUrl = async (url) => {
  try {
    // 验证URL
    if (!url || typeof url !== 'string') {
      throw new Error('无效的URL');
    }
    
    // 检查URL格式
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (e) {
      throw new Error('URL格式不正确，请检查视频链接');
    }
    
    // 检查协议
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      throw new Error('不支持的URL协议，仅支持HTTP和HTTPS');
    }
    
    console.log('开始下载文件:', url);
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        headers: {
          'Accept': 'video/*,*/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('视频文件不存在，请检查链接是否正确');
        } else if (response.status === 403) {
          throw new Error('无权限访问视频文件，请检查链接权限');
        } else if (response.status >= 500) {
          throw new Error('服务器错误，请稍后重试');
        } else {
          throw new Error(`文件下载失败: ${response.status} ${response.statusText}`);
        }
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) { // 100MB限制
        throw new Error('视频文件过大，请选择小于100MB的视频');
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('下载的文件为空，请检查视频链接');
      }
      
      if (blob.size < 1024) { // 小于1KB可能不是有效视频
        throw new Error('文件太小，可能不是有效的视频文件');
      }
      
      // 从URL中提取文件名
      const pathname = validUrl.pathname;
      let filename = pathname.split('/').pop() || 'video.mp4';
      
      // 确保文件名有扩展名
      if (!filename.includes('.')) {
        filename += '.mp4';
      }
      
      // 验证文件类型
      const validVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm'];
      const contentType = response.headers.get('content-type') || blob.type;
      
      if (contentType && !validVideoTypes.includes(contentType) && !contentType.startsWith('video/')) {
        console.warn('文件类型可能不是视频:', contentType);
        // 不抛出错误，允许继续，因为有些服务器可能返回错误的content-type
      }
      
      const file = new File([blob], filename, { 
        type: contentType || 'video/mp4',
        lastModified: Date.now()
      });
      
      console.log('文件下载成功:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      });
      
      return file;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('文件下载超时，请检查网络连接或选择较小的视频文件');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('fetchFileFromUrl 错误:', error);
    
    // 提供更友好的错误信息
    if (error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络后重试');
    } else if (error.message.includes('CORS')) {
      throw new Error('跨域访问被阻止，请使用支持的视频链接');
    }
    
    throw new Error(error.message || '文件获取失败');
  }
};

/**
 * 上传视频文件
 * @param {File} file 视频文件对象
 */
async function uploadVideo(file) {
  const fileInput = await waitForElement('input[type=file]');

  // 创建一个新的 File 对象，因为某些浏览器可能不允许直接设置 fileInput.files
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  fileInput.files = dataTransfer.files;

  // 触发 change 事件
  const changeEvent = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(changeEvent);

  // 触发 input 事件
  const inputEvent = new Event('input', { bubbles: true });
  fileInput.dispatchEvent(inputEvent);

  console.log('视频上传事件已触发');
}

/**
 * 上传封面图片
 * @param {Object} cover 封面数据对象
 */
async function uploadCover(coverUrl) {
  console.log('尝试上传封面', coverUrl);
  const coverUploadContainer = await waitForElement('div.content-upload-new');
  console.log('封面上传容器', coverUploadContainer);
  if (!coverUploadContainer) return;

  const coverUploadButton = coverUploadContainer.firstChild?.firstChild?.firstChild;
  console.log('封面上传按钮', coverUploadButton);
  if (!coverUploadButton) return;

  coverUploadButton.click();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const fileInput = await waitForElement('input[type="file"].semi-upload-hidden-input');
  console.log('封面文件输入框', fileInput);
  if (!fileInput) return;

  // 从URL获取图片文件
  const response = await fetch(coverUrl);
  if (!response.ok) {
    console.error('无法获取封面文件:', response.status, response.statusText);
    return;
  }
  
  const blob = await response.blob();
  const fileName = coverUrl.split('/').pop() || 'cover.jpg';
  const imageFile = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
  
  console.log('封面文件信息:', imageFile.name, imageFile.type, imageFile.size);

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(imageFile);
  fileInput.files = dataTransfer.files;

  const changeEvent = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(changeEvent);

  const inputEvent = new Event('input', { bubbles: true });
  fileInput.dispatchEvent(inputEvent);

  console.log('封面文件上传操作已触发');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const doneButtons = document.querySelectorAll('button.semi-button.semi-button-primary.semi-button-light');
  console.log('完成按钮列表', doneButtons);
  const doneButton = Array.from(doneButtons).find((button) => button.textContent === '完成');
  console.log('完成按钮', doneButton);
  if (doneButton) {
    doneButton.click();
  }
}









/**
 * 抖音视频发布主函数
 * @param {Object} data 视频数据
 * @returns {Promise<Object>} 发布结果
 */
export const VideoDouyin = async (data) => {
  try {
    console.log('开始抖音视频发布流程:', data);
    
    // 检查是否在抖音创作者页面
    if (!window.location.href.includes('creator.douyin.com')) {
      // 如果不在创作者页面，尝试打开
      const newWindow = window.open(DOUYIN_CONFIG.baseUrl, '_blank');
      if (!newWindow) {
        throw new Error('无法打开抖音创作者页面，请检查浏览器弹窗设置，或手动访问 https://creator.douyin.com');
      }
      throw new Error('请在新打开的抖音创作者页面中重新执行发布操作');
    }
    
    // 检查是否已登录
    const loginCheck = document.querySelector('[data-testid="user-avatar"], .avatar, .user-info');
    if (!loginCheck) {
      throw new Error('请先登录抖音创作者平台，然后重新尝试发布');
    }
    
    const { content, video, title, tags, cover, videoUrl, coverUrl, description } = data.data || data;
    
    // 处理视频上传 - 支持两种数据格式
    const actualVideoUrl = video?.url || videoUrl;
    if (actualVideoUrl) {
      console.log('开始获取视频文件:', actualVideoUrl);
      const response = await fetch(actualVideoUrl);
      if (!response.ok) {
        throw new Error(`无法获取视频文件: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const fileName = actualVideoUrl.split('/').pop() || 'video.mp4';
      const videoFile = new File([blob], fileName, { type: blob.type || 'video/mp4' });
      console.log(`视频文件: ${videoFile.name} ${videoFile.type} ${videoFile.size}`);

      await uploadVideo(videoFile);
      console.log('视频上传已初始化');
    } else {
      throw new Error('未找到视频文件URL');
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 处理标题输入
    const titleInput = await waitForElement('input[placeholder*="作品标题"]');
    if (titleInput) {
      const actualTitle = title || data.title || (content || description || '').slice(0, 20);
      titleInput.value = actualTitle;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('标题已填写:', titleInput.value);
    }

    // 填写内容和标签
    const contentEditor = await waitForElement(
      'div.zone-container.editor-kit-container.editor.editor-comp-publish[contenteditable="true"]'
    );
    if (contentEditor) {
      // 处理标签
      if (tags && tags.length > 0) {
        const tagsToSync = tags.slice(0, 5);
        for (const tag of tagsToSync) {
          console.log('添加标签:', tag);
          contentEditor.focus();

          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true,
            cancelable: true,
            clipboardData: new DataTransfer(),
          });

          pasteEvent.clipboardData.setData('text/plain', ` #${tag}`);
          contentEditor.dispatchEvent(pasteEvent);

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
          });

          contentEditor.dispatchEvent(enterEvent);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 填写描述内容
      contentEditor.focus();
      const contentPasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });

      const actualContent = content || description || data.content || '';
      contentPasteEvent.clipboardData.setData('text/plain', actualContent + '\n');
      contentEditor.dispatchEvent(contentPasteEvent);
    }

    // 处理封面上传 - 支持两种数据格式
    const actualCoverUrl = cover?.url || coverUrl;
    if (actualCoverUrl) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('开始上传封面:', actualCoverUrl);
      await uploadCover(actualCoverUrl);
    }

    console.log('抖音视频发布流程完成');
    
    return {
      success: true,
      message: '抖音视频发布成功',
      data: { title, content, tags }
    };
    
  } catch (error) {
    console.error('抖音视频发布失败:', error);
    throw error;
  }
};

export { DOUYIN_CONFIG };

export default {
  VideoDouyin,
  DOUYIN_CONFIG
};
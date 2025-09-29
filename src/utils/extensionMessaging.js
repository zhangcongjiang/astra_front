/**
 * Browser extension communication utilities
 * Provides utilities for communicating with the MultiPost browser extension
 * through window message events.
 */

/**
 * @typedef {Object} FileData
 * @property {string} name
 * @property {string} url
 * @property {string} type
 * @property {number} size
 * @property {string} [originUrl]
 */

/**
 * @typedef {Object} DynamicData
 * @property {string} title
 * @property {string} content
 * @property {FileData[]} images
 * @property {FileData[]} videos
 */

/**
 * @typedef {Object} ArticleData
 * @property {string} title
 * @property {string} digest
 * @property {FileData} cover
 * @property {string} htmlContent
 * @property {string} markdownContent
 * @property {FileData[]} [images]
 */

/**
 * @typedef {Object} VideoData
 * @property {string} title
 * @property {string} content
 * @property {FileData} video
 * @property {string[]} tags
 */

/**
 * @typedef {Object} PodcastData
 * @property {string} title
 * @property {string} description
 * @property {FileData} audio
 */

/**
 * @typedef {('DYNAMIC'|'VIDEO'|'ARTICLE'|'PODCAST')} PlatformType
 */

/**
 * @typedef {Object} AccountInfo
 * @property {string} provider
 * @property {string} accountId
 * @property {string} username
 * @property {string} [description]
 * @property {string} [profileUrl]
 * @property {string} [avatarUrl]
 * @property {unknown} extraData
 */

/**
 * @typedef {Object} PlatformInfo
 * @property {PlatformType} type
 * @property {string} name
 * @property {string} homeUrl
 * @property {string} [faviconUrl]
 * @property {string} [iconifyIcon]
 * @property {string} platformName
 * @property {string} [username]
 * @property {string} [userAvatarUrl]
 * @property {string} injectUrl
 * @property {(data: SyncData) => Promise<void>} injectFunction
 * @property {string[]} [tags]
 * @property {string} accountKey
 * @property {AccountInfo} [accountInfo]
 * @property {any} [extraConfig]
 */

/**
 * @typedef {Object} SyncData
 * @property {PlatformInfo[]} platforms
 * @property {boolean} isAutoPublish
 * @property {DynamicData|ArticleData|VideoData|PodcastData} data
 */

/**
 * @template T
 * @typedef {Object} ExtensionResponse
 * @property {'response'} type
 * @property {string} action
 * @property {string} traceId
 * @property {T} data
 */

/**
 * @template D, R
 * @param {string} action
 * @param {D} [data]
 * @param {number} [timeout=5000]
 * @returns {Promise<R>}
 */
export function sendRequest(action, data, timeout = 5000) {
  const traceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  return new Promise((resolve, reject) => {
    /** @param {MessageEvent<ExtensionResponse<R>>} event */
    const messageHandler = (event) => {
      const msg = event && event.data;
      if (!msg) return;
      // Only handle real responses matching our action and traceId
      if (msg.type === 'response' && msg.action === action && msg.traceId === traceId) {
        cleanup();
        resolve(msg.data);
      }
    };

    /** @type {number|undefined} */
    let timeoutId;
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
    }

    const cleanup = () => {
      window.removeEventListener('message', messageHandler);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    window.addEventListener('message', messageHandler);

    // Send the request message
    try {
      window.postMessage({ type: 'request', traceId, action, data }, '*');
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

/**
 * Checks if the MultiPost extension service is running and accessible
 * @param {number} [timeout=5000]
 * @returns {Promise<boolean>}
 */
export async function checkServiceStatus(timeout = 5000) {
  try {
    const resp = await sendRequest('MULTIPOST_EXTENSION_CHECK_SERVICE_STATUS', undefined, timeout);
    console.log('扩展服务状态响应:', resp);
    return resp; // 形如 { extensionId: string }
  } catch (error) {
    console.error('Service check failed:', error);
    return null;
  }
}

/**
 * Opens the extension options page
 * @param {number} [timeout=5000]
 * @returns {Promise<boolean>}
 */
export async function openOptions(timeout = 5000) {
  try {
    const resp = await sendRequest('MULTIPOST_EXTENSION_OPEN_OPTIONS', undefined, timeout);
    console.log('打开扩展设置页响应:', resp);
    return resp;
  } catch (error) {
    console.error('Failed to open extension options:', error);
    return null;
  }
}

/**
 * Publish unified data via extension
 * @param {SyncData|import('../api/modules').PublishPostData|import('../api/modules').SchedulePublishPostData} data
 * @returns {Promise<void>}
 */
export async function funcPublish(data) {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    console.log('funcPublish', data);
  }
  return sendRequest('MULTIPOST_EXTENSION_PUBLISH', data);
}

/**
 * Get platform infos from extension
 * @returns {Promise<PlatformInfo[]>}
 */
export async function funcGetPlatformInfos() {
  return sendRequest('MULTIPOST_EXTENSION_PLATFORMS');
}

/**
 * @typedef {Object} PermissionResponse
 * @property {string} status
 * @property {boolean} trusted
 */

/**
 * Request trust permission for current domain
 * @param {number} [timeout=30000]
 * @returns {Promise<PermissionResponse>}
 */
export async function funcGetPermission(timeout = 30000) {
  return sendRequest('MULTIPOST_EXTENSION_REQUEST_TRUST_DOMAIN', undefined, timeout);
}

/**
 * @typedef {Object} PlatformResponse
 * @property {PlatformInfo[]} platforms
 */

/**
 * Filter platform infos by type
 * @param {string} type
 * @returns {Promise<PlatformInfo[]>}
 */
export async function getPlatformInfos(type) {
  const response = await funcGetPlatformInfos();
  if (!response) return [];
  const platforms = Array.isArray(response) ? response : (response && response.platforms ? response.platforms : []);
  return platforms.filter((platform) => platform.type === type);
}

/**
 * Get account infos from extension
 * @returns {Promise<Record<string, AccountInfo>>}
 */
export async function getAccountInfos() {
  const response = await sendRequest('MULTIPOST_EXTENSION_GET_ACCOUNT_INFOS');
  console.log('扩展返回账户信息响应:', response);
  const infos = (response && (response.accountInfo || response.accountInfos)) || {};
  console.log('解析后的账户信息对象:', infos);
  return infos;
}

/**
 * Link extension client with apiKey
 * @param {string} apiKey
 * @param {number} [timeout=30000]
 * @returns {Promise<{confirm: boolean}>}
 */
export async function linkExtensionClient(apiKey, timeout = 30000) {
  return sendRequest('MULTIPOST_EXTENSION_LINK_EXTENSION', { apiKey }, timeout);
}

/**
 * Request refresh of account infos in extension
 * @param {boolean} [isFocused=false]
 * @returns {Promise<void>}
 */
export async function requestRefreshAccountInfo(isFocused = false) {
  return sendRequest('MULTIPOST_EXTENSION_REFRESH_ACCOUNT_INFOS', { isFocused });
}
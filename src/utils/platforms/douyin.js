// Douyin platform utilities
// 使用 ES Module 规范

// 提供平台常量
export const DOUYIN_PROVIDER = 'VIDEO_DOUYIN';

// 将相对路径转换为本地绝对路径（用于记录 originUrl）
function convertToAbsolutePath(relativePath) {
  if (!relativePath) return '';
  if (relativePath.startsWith('http') || relativePath.startsWith('F:') || relativePath.startsWith('/F:')) {
    return relativePath;
  }
  if (relativePath.startsWith('/media/')) {
    return `F:\\pycharm_workspace\\astra${relativePath.replace(/\//g, '\\')}`;
  }
  if (!relativePath.includes('/') && !relativePath.includes('\\')) {
    return `F:\\pycharm_workspace\\astra\\media\\videos\\${relativePath}`;
  }
  return relativePath;
}

// 将本地绝对路径或相对路径转换为可访问的 HTTP URL（用于扩展页面注入）
function convertToHttpUrl(p) {
  if (!p) return '';
  if (p.startsWith('http')) return p;
  if (p.startsWith('/media/')) return `http://127.0.0.1:8089${p}`;
  const fileName = p.split(/[\\/]/).pop();
  if (fileName) return `http://127.0.0.1:8089/media/videos/${fileName}`;
  return p;
}

// 数据格式转换（抖音）
export function convertToDouyinFormat(videoData = {}, editableData = {}) {
  const absVideoUrl = convertToAbsolutePath(videoData.video_path || videoData.videoUrl || '');
  const httpVideoUrl = convertToHttpUrl(videoData.video_path || videoData.videoUrl || '');
  const coverAbs = convertToAbsolutePath((videoData.cover_path || '').replace('videos', 'images'));
  const coverHttp = convertToHttpUrl((videoData.cover_path || '').replace('videos', 'images'));

  const videoFileName = (videoData.video_path || '').split(/[\\/]/).pop() || 'video.mp4';

  return {
    title: editableData.title || videoData.title || '默认标题',
    content: editableData.content || videoData.content || '',
    videoUrl: httpVideoUrl,
    coverUrl: coverHttp,
    video: {
      name: videoFileName,
      url: httpVideoUrl,
      type: 'video/mp4',
      size: videoData.file_size || videoData.size || 0,
      originUrl: absVideoUrl
    },
    tags: (editableData.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    category: editableData.category || '娱乐'
  };
}

// 平台特定校验（抖音）
export function validateDouyinData(data = {}) {
  const errors = [];
  const title = data.title || '';
  const desc = data.description || data.content || '';
  if (title.length > 55) {
    errors.push('抖音标题不能超过55个字符');
  }
  if (desc && desc.length > 2000) {
    errors.push('抖音描述不能超过2000个字符');
  }
  return errors;
}
<template>
  <div class="dynamic-detail-container" v-if="detail">
    <div class="header">
      <div class="title-wrap">
        <a-typography-title :level="3" class="page-title">{{ detail.title || '未命名动态' }}</a-typography-title>
        <div class="meta-inline">
          <a-tag :color="detail.publish ? 'blue' : 'gold'">{{ detail.publish ? '已发布' : '未发布' }}</a-tag>
          <a-tag>{{ detail.origin || '未知来源' }}</a-tag>
          <a-tag>{{ detail.username || '匿名用户' }}</a-tag>
        </div>
      </div>
      <a-space>
        <a-button type="primary" @click="save">保存</a-button>
        <a-button @click="openPublish">发布</a-button>
        <a-button @click="goBack">返回列表</a-button>
      </a-space>
    </div>

    <a-card title="基本信息" class="card-block">
      <a-descriptions size="small" :column="2">
        <a-descriptions-item label="ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(detail.create_time) }}</a-descriptions-item>
        <a-descriptions-item label="创建人">{{ detail.username || '匿名' }}</a-descriptions-item>
        <a-descriptions-item label="来源">{{ detail.origin || '用户创建' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="内容" class="card-block">
      <a-typography-paragraph class="content-text" v-if="detail.content">
        {{ detail.content }}
      </a-typography-paragraph>
      <div v-else class="empty-text">暂无内容</div>
    </a-card>

    <a-card title="图片" class="card-block">
      <div v-if="Array.isArray(detail.images) && detail.images.length > 0" class="image-gallery">
        <a-image-preview-group>
          <a-row :gutter="[12,12]">
            <a-col v-for="(img, idx) in detail.images" :key="img.id || idx" :xs="24" :sm="12" :md="8" :lg="6">
              <a-image class="gallery-image" :src="getImageUrl(img)" :fallback="fallbackSvg" :alt="img.id || ('image-' + idx)" />
            </a-col>
          </a-row>
        </a-image-preview-group>
      </div>
      <div v-else class="image-placeholder">暂无图片</div>
    </a-card>

    <a-card title="媒体（本地选择，仅预览）" class="card-block">
      <div class="media-section">
        <a-upload :beforeUpload="() => false" multiple @change="handleMediaUpload">
          <a-button>选择图片/视频</a-button>
        </a-upload>
        <div class="media-list">
          <div class="media-item" v-for="(m, idx) in detail.media" :key="idx">
            <span>{{ m.name }}</span>
            <a-tag>{{ m.type }}</a-tag>
            <a-button type="link" danger @click="removeMedia(idx)">移除</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 发布弹窗 -->
    <a-modal v-model:open="publishModalVisible" title="发布动态" :footer="null" width="680px">
      <div class="publish-platforms">
        <div class="platform" v-for="p in dynamicPlatforms" :key="p.name" :class="{active: selectedPlatforms.includes(p.name)}" @click="togglePlatform(p.name)">
          <img v-if="p.faviconUrl" :src="p.faviconUrl" alt="" />
          <span>{{ p.platformName }}</span>
        </div>
      </div>
      <div class="publish-actions">
        <a-switch v-model:checked="isAutoPublish" checked-children="自动" un-checked-children="手动" />
        <a-button type="primary" style="margin-left: 12px" @click="confirmPublish">开始发布</a-button>
        <a-button style="margin-left: 8px" @click="cancelPublish">取消</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getDynamicDetail, createDynamic } from '@/api/modules/dynamicApi';
import { funcPublish, getPlatformInfos, checkServiceStatus, funcGetPermission, openOptions } from '@/utils/extensionMessaging';

// 静态资源地址与图片URL构造
const staticBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8089';
const fallbackSvg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23fafafa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">图片加载失败</text></svg>';
const getImageUrl = (img) => {
  if (!img) return '';
  const url = img.url || (img.img_name ? `/media/images/${img.img_name}` : '');
  if (!url) return '';
  // 规范化，避免双斜杠
  const base = staticBaseUrl.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return url.startsWith('http') ? url : `${base}${path}`;
};

const router = useRouter();
const route = useRoute();

const detail = ref({ title: '', content: '', media: [], publish: false, origin: '', username: '', id: '', create_time: '' });

// 发布相关
const publishModalVisible = ref(false);
const dynamicPlatforms = ref([]);
const selectedPlatforms = ref([]);
const isAutoPublish = ref(false);

const togglePlatform = (key) => {
  const i = selectedPlatforms.value.indexOf(key);
  if (i > -1) selectedPlatforms.value.splice(i, 1); else selectedPlatforms.value.push(key);
};

const openPublish = async () => {
  publishModalVisible.value = true;
  dynamicPlatforms.value = await getPlatformInfos('DYNAMIC');
};
const confirmPublish = async () => {
  try {
    if (!selectedPlatforms.value.length) {
      message.warning('请选择至少一个平台');
      return;
    }

    const serviceResp = await checkServiceStatus();
    if (!serviceResp) {
      message.error('扩展服务未运行，请先启动扩展');
      return;
    }

    const trustResp = await funcGetPermission(5000);
    if (!trustResp || trustResp.status !== 'ok' || !trustResp.trusted) {
      await openOptions();
      message.info('请在扩展设置页授权当前域名后，系统将自动继续');
    }

    const selectedSet = new Set(selectedPlatforms.value);
    const targetPlatforms = (dynamicPlatforms.value || []).filter(p => selectedSet.has(p.name));
    if (!targetPlatforms.length) {
      message.error('未匹配到选中的平台');
      return;
    }

    const syncPlatforms = targetPlatforms.map(p => ({ name: p.name, platformName: p.platformName, injectUrl: p.injectUrl, faviconUrl: p.faviconUrl, accountKey: p.accountKey, extraConfig: {} }));

    // 仅使用后端返回的图片参与发布，确保为可访问的 HTTP 链接
    const images = Array.isArray(detail.value.images)
      ? detail.value.images.map(img => ({
          name: img.name || img.img_name || '',
          url: getImageUrl(img),
          type: (img.type && String(img.type)) || 'image/*'
        }))
      : [];

    const syncData = {
      platforms: syncPlatforms,
      isAutoPublish: isAutoPublish.value,
      data: {
        title: detail.value.title || '未命名动态',
        content: (detail.value.content || '').toString(),
        images,
        videos: []
      }
    };

    console.log('发送扩展发布请求 syncData:', JSON.stringify(syncData, null, 2));
    await funcPublish(syncData);
    message.success(`发布请求已发送到扩展（${syncPlatforms.length}个平台），请在新标签页查看扩展自动填充`);
    publishModalVisible.value = false;
  } catch (e) {
    console.error(e);
    message.error(e?.message || '发布失败');
  }
};
const cancelPublish = () => { publishModalVisible.value = false; };

// 媒体处理
const handleMediaUpload = (info) => {
  const files = info.fileList?.map(f => ({ name: f.name, type: f.type })) || [];
  detail.value.media = files;
};
const removeMedia = (idx) => { detail.value.media.splice(idx, 1); };

const save = async () => {
  try {
    await createDynamic({ title: detail.value.title, content: detail.value.content });
    message.success('保存成功');
  } catch (e) {
    message.error('保存失败');
  }
};

const goBack = () => router.push({ name: 'dynamics' });

const formatDate = (v) => {
  if (!v) return '-';
  try {
    const d = new Date(v);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch { return String(v); }
};

onMounted(async () => {
  const id = route.params.id;
  if (id && id !== 'new') {
    try {
      const resp = await getDynamicDetail(id);
      const data = resp?.data || resp;
      detail.value = {
        id: data.id || '',
        title: data.title || '',
        content: data.content || '',
        images: Array.isArray(data.images) ? data.images : [],
        origin: data.origin || '',
        publish: !!data.publish,
        creator: data.creator || '',
        username: data.username || '',
        create_time: data.create_time || '',
        media: [],
      };
    } catch (e) {
      console.error(e);
      message.error('加载详情失败');
    }
  }
});
</script>

<style scoped>
.dynamic-detail-container { padding: 20px; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.title-wrap { display: flex; flex-direction: column; gap: 6px; }
.page-title { margin: 0; }
.meta-inline { display: flex; gap: 8px; align-items: center; }
.card-block { margin-top: 12px; }
.content-text { white-space: pre-wrap; line-height: 1.8; font-size: 14px; color: #333; }
.empty-text { width: 100%; padding: 20px; text-align: center; background: #fafafa; color: #999; border-radius: 6px; }
.image-gallery { margin-top: 8px; }
.gallery-image { width: 100%; border-radius: 8px; overflow: hidden; }
.image-placeholder { width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; background: #fafafa; color: #999; border-radius: 6px; }
.publish-platforms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.publish-platforms .platform { display:flex; align-items:center; gap:8px; padding:6px 10px; border:1px solid #eee; border-radius:6px; cursor:pointer; }
.publish-platforms .platform.active { border-color:#1890ff; background:#e6f7ff; }
.media-section { display: flex; align-items: flex-start; gap: 12px; }
.media-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.media-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; border: 1px solid #eee; border-radius: 6px; }
</style>
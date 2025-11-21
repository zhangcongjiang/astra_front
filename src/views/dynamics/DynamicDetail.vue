<template>
  <div class="dynamic-detail-container" v-if="detail">
    <div class="header">
      <a-input v-model:value="detail.title" placeholder="输入标题" />
      <a-space>
        <a-button type="primary" @click="save">保存</a-button>
        <a-button @click="openPublish">发布</a-button>
        <a-button @click="goBack">返回列表</a-button>
      </a-space>
    </div>

    <a-card title="内容" style="margin-top: 12px">
      <a-textarea v-model:value="detail.content" rows="8" placeholder="输入动态内容" />
    </a-card>

    <a-card title="媒体" style="margin-top: 12px">
      <div class="media-section">
        <a-upload :beforeUpload="() => false" multiple @change="handleMediaUpload">
          <a-button>选择图片/视频</a-button>
        </a-upload>
        <div class="media-list">
          <div class="media-item" v-for="(m, idx) in detail.media" :key="idx">
            <span>{{ m.name }}</span>
            <a-button type="link" danger @click="removeMedia(idx)">移除</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 发布弹窗 -->
    <a-modal v-model:open="publishModalVisible" title="发布动态" :footer="null" width="680px">
      <div class="publish-platforms">
        <div class="platform" v-for="p in dynamicPlatforms" :key="p.accountKey" :class="{active: selectedPlatforms.includes(p.accountKey)}" @click="togglePlatform(p.accountKey)">
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getDynamicDetail, createDynamic } from '@/api/modules/dynamicApi';
import { funcPublish, getPlatformInfos } from '@/utils/extensionMessaging';

const router = useRouter();
const route = useRoute();

const detail = ref({ title: '', content: '', media: [] });

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
    const data = {
      platforms: dynamicPlatforms.value.filter(p => selectedPlatforms.value.includes(p.accountKey)),
      isAutoPublish: isAutoPublish.value,
      data: {
        title: detail.value.title,
        content: detail.value.content,
        images: detail.value.media?.filter(m => m.type?.startsWith('image/')) || [],
        videos: detail.value.media?.filter(m => m.type?.startsWith('video/')) || [],
      }
    };
    await funcPublish(data);
    message.success('已发送到扩展进行发布');
    publishModalVisible.value = false;
  } catch (e) {
    console.error(e);
    message.error('发布失败');
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

onMounted(async () => {
  const id = route.params.id;
  if (id && id !== 'new') {
    try {
      const resp = await getDynamicDetail(id);
      const data = resp?.data || resp;
      detail.value = {
        title: data.title || '',
        content: data.content || '',
        media: [],
      };
    } catch (e) {
      message.error('加载详情失败');
    }
  }
});
</script>

<style scoped>
.dynamic-detail-container { padding: 20px; }
.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.publish-platforms { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.publish-platforms .platform { display:flex; align-items:center; gap:8px; padding:6px 10px; border:1px solid #eee; border-radius:6px; cursor:pointer; }
.publish-platforms .platform.active { border-color:#1890ff; background:#e6f7ff; }
.media-section { display: flex; align-items: center; gap: 12px; }
.media-list { margin-top: 12px; }
.media-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; border: 1px solid #eee; border-radius: 6px; }
</style>
<template>
  <div class="account-manage-container">
    <a-card title="自媒体账号管理" class="manage-card">
      <template #extra>
        <a-space>
          <a-button @click="refreshStatuses" :loading="refreshLoading">
            <template #icon><ReloadOutlined /></template>
            刷新状态
          </a-button>
          <a-button type="primary" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            新增账号
          </a-button>
        </a-space>
      </template>
      <div v-if="loading" class="grid">
        <a-row :gutter="[16, 16]">
          <a-col v-for="i in 8" :key="i" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
            <a-card class="account-card" hoverable>
              <a-skeleton active :paragraph="{ rows: 2 }" />
            </a-card>
          </a-col>
        </a-row>
      </div>
      <div v-else class="timeline-wrap">
        <template v-if="groupedAccounts.length">
          <a-timeline mode="left">
            <a-timeline-item v-for="group in groupedAccounts" :key="group.platform">
              <template #dot>
                <img :src="getPlatformLogo(group.platform)" alt="" class="timeline-logo" />
              </template>
              <div class="group-header">
                <span class="group-title">{{ getPlatformLabel(group.platform) }}</span>
                <a-tag color="blue">{{ group.accounts.length }}</a-tag>
              </div>
              <a-row :gutter="[16, 16]" class="group-cards">
                <a-col
                  v-for="item in group.accounts"
                  :key="item.id"
                  :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
                >
                  <a-card class="account-card" :bodyStyle="{ padding: '8px 10px' }" hoverable>
                    <a-badge :status="getBadgeStatus(item.id)" class="status-dot" />
                    <a-card-meta>
                      <template #title>
                        <div class="title-row">
                          <span class="name" :class="{ scrolling: nameOverflow[item.id] }" :data-id="item.id" :title="item.name">
                            <span class="name-text">{{ item.name }}</span>
                          </span>
                        </div>
                      </template>
                    </a-card-meta>
                    <template #actions>
                      <span class="action-item" @click.stop="enterHomepage(item)">
                        <HomeOutlined />
                        <span class="action-text">主页</span>
                      </span>
                      <span class="action-item" @click.stop="openEditModal(item)">
                        <EditOutlined />
                        <span class="action-text">编辑</span>
                      </span>
                    </template>
                  </a-card>
                </a-col>
              </a-row>
            </a-timeline-item>
          </a-timeline>
        </template>
        <template v-else>
          <div class="empty-wrap">
            <a-empty description="暂无匹配的账号">
              <a-button type="primary" @click="openAddModal">新增账号</a-button>
            </a-empty>
          </div>
        </template>
      </div>
    </a-card>
    <a-modal v-model:open="addVisible" title="新增自媒体账号" :confirm-loading="addLoading" @ok="submitAdd" @cancel="closeAdd">
      <a-form layout="vertical">
        <a-form-item label="平台">
          <a-select v-model:value="addForm.platform" placeholder="请选择平台">
            <a-select-option v-for="opt in platformOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="名称">
          <a-input v-model:value="addForm.name" placeholder="请输入账号名称" />
        </a-form-item>
        <a-form-item label="主页">
          <a-input v-model:value="addForm.main_page" placeholder="请输入主页URL，例如：https://mp.toutiao.com/profile/xxx" />
        </a-form-item>
      </a-form>
    </a-modal>
    <a-modal v-model:open="editVisible" title="修改账号名称" :confirm-loading="editLoading" @ok="submitEdit" @cancel="closeEdit">
      <a-form layout="vertical">
        <a-form-item label="名称">
          <a-input v-model:value="editForm.name" placeholder="请输入新名称" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { ReloadOutlined, PlusOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons-vue';
import { getMediaAccountList, createMediaAccount, updateMediaAccount } from '@/api/modules/mediaAccountApi.js';

const loading = ref(false);
const accounts = ref([]);
const groupedAccounts = computed(() => {
  const arr = accounts.value;
  const order = platformOptions.map(p => p.value);
  const groups = order.map(pf => ({
    platform: pf,
    accounts: arr.filter(it => it.platform === pf)
  })).filter(g => g.accounts.length > 0);
  return groups;
});
const accountStatuses = ref({});
const refreshLoading = ref(false);
const nameOverflow = ref({});
const getStatusText = (id) => {
  const s = accountStatuses.value[id];
  if (s === 'online') return '在线';
  if (s === 'offline') return '离线';
  return '未知';
};
const getBadgeStatus = (id) => {
  const s = accountStatuses.value[id];
  if (s === 'online') return 'success';
  if (s === 'offline') return 'error';
  return 'default';
};
const loginPatterns = {
  TOUTIAO: [/passport\.toutiao\.com/i, /mp\.toutiao\.com\/(auth|login)/i, /登录/i],
  DOUYIN: [/passport\.douyin\.com/i, /creator\.douyin\.com\/portal/i, /登录/i],
  WEIXIN: [/mp\.weixin\.qq\.com.*(login|cgi-bin\/loginpage)/i, /登录/i],
  WEIXIN_CHANNEL: [/channels\.weixin\.qq\.com.*login/i, /登录/i],
  REDNOTE: [/xiaohongshu\.com.*(passport|login)/i, /登录/i],
  BILIBILI: [/passport\.bilibili\.com/i, /登录/i],
  WEIBO: [/passport\.weibo\.com/i, /weibo\.com\/login/i, /登录/i],
  DEFAULT: [/登录/i, /sign\\s*in/i, /password/i, /扫码登录/i]
};
const makeProxyUrl = (url) => {
  try {
    if (!(typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')))) return null;
    return `https://r.jina.ai/http/${url}`;
  } catch { return null; }
};
const probeHomepage = async (url, platform) => {
  const proxyUrl = makeProxyUrl(url);
  if (!proxyUrl) return 'unknown';
  try {
    const resp = await fetch(proxyUrl, { method: 'GET', redirect: 'follow' });
    const text = await resp.text();
    const pats = [...(loginPatterns[platform] || []), ...loginPatterns.DEFAULT];
    const offline = pats.some(re => re.test(text));
    return offline ? 'offline' : 'online';
  } catch (e) {
    return 'unknown';
  }
};
const refreshStatuses = async () => {
  if (!accounts.value.length) return;
  refreshLoading.value = true;
  try {
    const jobs = accounts.value.map(async (it) => {
      const status = await probeHomepage(it.main_page, it.platform);
      accountStatuses.value[it.id] = status;
    });
    await Promise.all(jobs);
    message.success('状态已刷新');
  } finally {
    refreshLoading.value = false;
  }
};

const measureNameOverflow = () => {
  const nodes = document.querySelectorAll('.account-card .name');
  nodes.forEach((n) => {
    const id = n.getAttribute('data-id');
    if (!id) return;
    nameOverflow.value[id] = n.scrollWidth > n.clientWidth;
  });
};
const getVisibleIds = () => {
  const nodes = document.querySelectorAll('.account-card .name');
  const ids = [];
  nodes.forEach((n) => {
    const rect = n.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const id = n.getAttribute('data-id');
      if (id && !ids.includes(id)) ids.push(id);
    }
  });
  return ids;
};
const refreshVisibleStatuses = async () => {
  const ids = getVisibleIds();
  if (!ids.length) return;
  refreshLoading.value = true;
  try {
    const idSet = new Set(ids.map(String));
    const jobs = accounts.value.filter(it => idSet.has(String(it.id))).map(async (it) => {
      const status = await probeHomepage(it.main_page, it.platform);
      accountStatuses.value[it.id] = status;
    });
    await Promise.all(jobs);
  } finally {
    refreshLoading.value = false;
  }
};
const onResize = () => {
  measureNameOverflow();
};

const addVisible = ref(false);
const addLoading = ref(false);
const addForm = reactive({ platform: '', name: '', main_page: '' });

const editVisible = ref(false);
const theEditId = ref(null);
const editLoading = ref(false);
const editForm = reactive({ name: '' });

const platformOptions = [
  { value: 'TOUTIAO', label: '今日头条' },
  { value: 'BAIDU', label: '百度' },
  { value: 'DOUYIN', label: '抖音' },
  { value: 'WEIXIN_CHANNEL', label: '视频号' },
  { value: 'WEIXIN', label: '公众号' },
  { value: 'REDNOTE', label: '小红书' },
  { value: 'BILIBILI', label: 'B站' },
  { value: 'WEIBO', label: '微博' }
];
const getPlatformLabel = (val) => {
  const found = platformOptions.find(p => p.value === val);
  return found ? found.label : (val || '未知平台');
};
const getPlatformLogo = (val) => {
  const map = {
    TOUTIAO: new URL('@/assets/logo/TOUTIAO.png', import.meta.url).href,
    BAIDU: new URL('@/assets/logo/BAIDU.png', import.meta.url).href,
    DOUYIN: new URL('@/assets/logo/DOUYIN.png', import.meta.url).href,
    WEIXIN_CHANNEL: new URL('@/assets/logo/WEIXIN_CHANNEL.png', import.meta.url).href,
    WEIXIN: new URL('@/assets/logo/WEIXIN.png', import.meta.url).href,
    REDNOTE: new URL('@/assets/logo/REDNOTE.png', import.meta.url).href,
    BILIBILI: new URL('@/assets/logo/BILIBILI.png', import.meta.url).href,
    WEIBO: new URL('@/assets/logo/WEIBO.png', import.meta.url).href,
  };
  return map[val] || new URL('@/assets/logo/WEIXIN.png', import.meta.url).href;
};

const openAddModal = () => { addVisible.value = true; };
const closeAdd = () => { addVisible.value = false; addForm.platform = ''; addForm.name = ''; addForm.main_page = ''; };
const submitAdd = async () => {
  if (!addForm.platform) { message.warning('请选择平台'); return; }
  if (!addForm.name?.trim()) { message.warning('请输入账号名称'); return; }
  if (!addForm.main_page?.trim()) { message.warning('请输入主页URL'); return; }
  addLoading.value = true;
  try {
    const payload = { platform: addForm.platform, name: addForm.name.trim(), main_page: addForm.main_page.trim() };
    const resp = await createMediaAccount(payload);
    const ok = (resp?.code === 0) || resp?.success;
    if (ok) {
      message.success('添加成功');
      closeAdd();
      await loadAccounts();
    } else {
      message.error(resp?.message || '添加失败');
    }
  } catch (e) {
    message.error(e?.message || '添加失败');
  } finally {
    addLoading.value = false;
  }
};

const openEditModal = (record) => {
  theEditId.value = record.id;
  editForm.name = record.name || '';
  editVisible.value = true;
};
const closeEdit = () => { editVisible.value = false; theEditId.value = null; editForm.name = ''; };
const submitEdit = async () => {
  if (!theEditId.value) { message.warning('无效账号'); return; }
  if (!editForm.name?.trim()) { message.warning('请输入新名称'); return; }
  editLoading.value = true;
  try {
    const resp = await updateMediaAccount(theEditId.value, { name: editForm.name.trim() });
    const ok = (resp?.code === 0) || resp?.success;
    if (ok) {
      message.success('修改成功');
      closeEdit();
      await loadAccounts();
    } else {
      message.error(resp?.message || '修改失败');
    }
  } catch (e) {
    message.error(e?.message || '修改失败');
  } finally {
    editLoading.value = false;
  }
};
const enterHomepage = (record) => {
  if (record?.main_page) {
    window.open(record.main_page, '_blank', 'noopener');
  } else {
    message.warning('该账号未设置主页');
  }
};

const loadAccounts = async () => {
  loading.value = true;
  try {
    const resp = await getMediaAccountList();
    const arr = (resp?.data) ?? (resp?.results) ?? (resp?.data?.data) ?? [];
    accounts.value = Array.isArray(arr) ? arr.map(it => ({
      id: it.id,
      platform: it.platform,
      name: it.name,
      main_page: it.main_page
    })) : [];
    await nextTick();
    measureNameOverflow();
    setTimeout(refreshVisibleStatuses, 0);
  } catch (e) {
    accounts.value = [];
    message.error(e?.message || '获取账号列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(loadAccounts);
onMounted(() => {
  window.addEventListener('resize', onResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.account-manage-container {
  padding: 20px;
}

.manage-card {
  min-height: 80vh;
}

.ant-modal-body { padding-top: 8px; }
.grid {
  margin-top: 8px;
}
.timeline-wrap {
  margin-top: 8px;
}
.account-card {
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
}
:deep(.ant-card-body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
:deep(.ant-card-meta) {
  margin: 0;
}
:deep(.ant-card-meta-title) {
  margin-bottom: 0;
  line-height: 20px;
  font-size: 12px;
}
.timeline-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
}
.status-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  pointer-events: none;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.group-title {
  font-weight: 600;
  font-size: 15px;
}
.group-cards {
  margin-top: 4px;
}
.cover {
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.name {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.name-text {
  display: inline-block;
}
.name.scrolling .name-text {
  animation: marquee 8s linear infinite;
  padding-right: 24px;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}
.actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  flex-wrap: nowrap;
}
.account-card :deep(.ant-card-actions) {
  margin-top: auto;
}
.account-card .action-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 0;
  cursor: pointer;
}
.account-card .action-text {
  font-size: 12px;
}
.action-btn {
  border-radius: 14px;
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.enter-btn {
  background-color: #1677ff;
  border-color: #1677ff;
}
.enter-btn:hover {
  background-color: #4096ff;
  border-color: #4096ff;
}
.edit-btn {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
}
.edit-btn:hover {
  background-color: #e6f4ff;
  border-color: #91caff;
}
.empty-wrap {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}
</style>

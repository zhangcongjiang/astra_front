<template>
  <div class="account-manage-container">
    <a-card title="账号管理" class="manage-card">
      <template #extra>
        <a-button style="margin-right: 8px;" @click="handleRefreshAccounts">刷新账号</a-button>
        <a-button type="primary" @click="handleAddAccount">新增账号</a-button>
      </template>

      <a-timeline>
        <a-timeline-item v-for="platform in platforms" :key="platform.id">
          <template #dot>
            <img :src="platform.logo" class="platform-logo" />
          </template>
          <div class="platform-section">
            <div class="platform-header">
              <span class="platform-name">{{ platform.name }}</span>
            </div>
            <div class="account-list">
              <a-card v-for="account in platform.accounts" :key="account.id" class="account-card">
                <div class="account-info">
                  <div class="account-name">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img v-if="account.avatarUrl" :src="account.avatarUrl" alt="avatar" style="width:24px; height:24px; border-radius:50%; object-fit:cover;" />
                      <span>{{ account.username || account.name }}</span>
                    </div>
                    <div class="status-icon">
                      <CheckCircleOutlined :style="{ color: '#52c41a', fontSize: '16px' }" />
                    </div>
                  </div>
                  <div class="account-expire" v-if="account.description">
                    {{ account.description }}
                  </div>
                  <div class="account-expire" v-if="account.profileUrl">
                    <a :href="account.profileUrl" target="_blank">主页：{{ account.profileUrl }}</a>
                  </div>
                </div>
                <div class="account-actions">
                  <a-button type="link" v-if="account.profileUrl" @click="handleEnterHome(account)">进入主页</a-button>
                  <a-button type="link" @click="handleReLogin(account)">重新登录</a-button>
                  <a-button type="link" danger @click="handleLogout(account)">退出</a-button>
                </div>
              </a-card>
            </div>
          </div>
        </a-timeline-item>
      </a-timeline>
    </a-card>

    <!-- 新增账号模态框保持不变 -->
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import { onMounted } from 'vue';
import { getAccountInfos as extGetAccountInfos, requestRefreshAccountInfo as extRequestRefreshAccountInfo } from '@/utils/extensionMessaging.js';

const activePlatforms = ref([]);
const addModalVisible = ref(false);

const platforms = ref([]);

const newAccountForm = reactive({
  platform: null,
  name: '',
  loginInfo: ''
});

const formatTime = (timestamp) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
};

const handleAddAccount = () => {
  addModalVisible.value = true;
};

const handleAddConfirm = () => {
  // 处理新增账号逻辑
  message.success('新增账号成功');
  addModalVisible.value = false;
};

const handleReLogin = (account) => {
  // 处理重新登录逻辑
  message.success(`重新登录账号：${account.name}`);
};

const handleLogout = (account) => {
  // 处理退出登录逻辑
  message.success(`已退出账号：${account.name}`);
};

const handleEnterHome = (account) => {
  // 处理进入主页逻辑
  message.success(`进入账号主页：${account.name}`);
};

const providerLogos = {
  VIDEO_DOUYIN: new URL('@/assets/logo/douyin.png', import.meta.url).href,
  VIDEO_REDNOTE: new URL('@/assets/logo/xiaohongshu.png', import.meta.url).href,
  ARTICLE_WECHAT_MP: new URL('@/assets/logo/wechat.png', import.meta.url).href,
  VIDEO_WECHAT_CHANNEL: new URL('@/assets/logo/wechat-video.png', import.meta.url).href,
  ARTICLE_TOUTIAO: new URL('@/assets/logo/toutiao.png', import.meta.url).href,
  ARTICLE_BAIJIAHAO: new URL('@/assets/logo/baijiahao.png', import.meta.url).href,
};

const loadAccounts = async () => {
  try {
    const infos = await extGetAccountInfos();
    // infos: Record<string, AccountInfo>
    const byProvider = {};
    Object.values(infos || {}).forEach((acc) => {
      const prov = acc.provider || 'UNKNOWN';
      if (!byProvider[prov]) byProvider[prov] = [];
      byProvider[prov].push(acc);
    });
    const list = Object.entries(byProvider).map(([provider, accounts], idx) => ({
      id: idx + 1,
      name: provider,
      logo: providerLogos[provider] || new URL('@/assets/logo/wechat.png', import.meta.url).href,
      accounts: accounts.map((acc) => ({
        id: acc.accountId,
        name: acc.username || acc.accountId,
        username: acc.username,
        description: acc.description,
        profileUrl: acc.profileUrl,
        avatarUrl: acc.avatarUrl,
        isExpired: false,
        expireTime: null,
        raw: acc,
      })),
    }));
    platforms.value = list;
  } catch (e) {
    console.error('获取账号信息失败', e);
  }
};

onMounted(() => {
  loadAccounts();
});

const handleRefreshAccounts = async () => {
  try {
    await extRequestRefreshAccountInfo(true);
    message.loading({ content: '正在刷新账号信息...', key: 'refresh-accounts', duration: 0 });
    // 等待扩展刷新完成后重新拉取（简单延迟）
    setTimeout(async () => {
      await loadAccounts();
      message.success({ content: '账号信息已刷新', key: 'refresh-accounts' });
    }, 1000);
  } catch (e) {
    message.error(e?.message || '刷新账号信息失败');
  }
};
</script>

<style scoped>
.account-manage-container {
  padding: 20px;
}

.manage-card {
  min-height: 80vh;
}

.platform-section {
  margin-left: 20px;
}

.platform-header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.platform-name {
  font-size: 18px;
  font-weight: 500;
}

.platform-logo {
  width: 24px;
  height: 24px;
}

.account-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 8px;
}

.account-card {
  margin-bottom: 12px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
  background: #fff;
  transition: all 0.2s ease;
  padding: 8px 12px;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-icon {
  margin-left: 8px;
}

.account-expire {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  margin-top: 2px;
}

.account-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  text-align: left;
  white-space: nowrap; /* 防止按钮换行 */
}

.account-actions .ant-btn {
  margin-right: 4px; /* 调整按钮间距 */
}
</style>
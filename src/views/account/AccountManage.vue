<template>
  <div class="account-manage-container">
    <a-card title="账号管理" class="manage-card">
      <template #extra>
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
                    {{ account.name }}
                    <div class="status-icon">
                      <CloseCircleOutlined
                        v-if="account.isExpired"
                        :style="{ color: '#ff4d4f', fontSize: '16px' }"
                      />
                      <CheckCircleOutlined
                        v-else
                        :style="{ color: '#52c41a', fontSize: '16px' }"
                      />
                    </div>
                  </div>
                  <div class="account-expire">
                    过期时间：{{ formatTime(account.expireTime) }}
                  </div>
                </div>
                <div class="account-actions">
                  <a-button type="link" @click="handleEnterHome(account)">进入主页</a-button>
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

const activePlatforms = ref([]);
const addModalVisible = ref(false);

const platforms = ref([
  {
    id: 1,
    name: '今日头条',
    logo: new URL('@/assets/logo/toutiao.png', import.meta.url).href,
    accounts: [
      {
        id: 1,
        name: '头条账号1',
        isExpired: false,
        expireTime: dayjs().add(1, 'day').valueOf()
      },
      {
        id: 2,
        name: '头条账号2',
        isExpired: true,
        expireTime: dayjs().subtract(1, 'day').valueOf()
      },
      {
        id: 3,
        name: '头条账号3',
        isExpired: false,
        expireTime: dayjs().add(3, 'day').valueOf()
      },
      {
        id: 4,
        name: '头条账号4',
        isExpired: false,
        expireTime: dayjs().add(2, 'day').valueOf()
      },
      {
        id: 5,
        name: '头条账号5',
        isExpired: true,
        expireTime: dayjs().subtract(2, 'day').valueOf()
      }
    ]
  },
  {
    id: 2,
    name: '抖音',
    logo: new URL('@/assets/logo/douyin.png', import.meta.url).href,
    accounts: [
      {
        id: 2,
        name: '抖音账号1',
        isExpired: true,
        expireTime: dayjs().subtract(1, 'day').valueOf()
      }
    ]
  },
  {
    id: 3,
    name: '微信公众号',
    logo: new URL('@/assets/logo/wechat.png', import.meta.url).href,
    accounts: [
      {
        id: 3,
        name: '公众号账号1',
        isExpired: false,
        expireTime: dayjs().add(3, 'day').valueOf()
      }
    ]
  },
  {
    id: 4,
    name: '微信视频号',
    logo: new URL('@/assets/logo/wechat-video.png', import.meta.url).href,
    accounts: [
      {
        id: 4,
        name: '视频号账号1',
        isExpired: false,
        expireTime: dayjs().add(2, 'day').valueOf()
      }
    ]
  },
  {
    id: 5,
    name: '百家号',
    logo: new URL('@/assets/logo/baijiahao.png', import.meta.url).href,
    accounts: [
      {
        id: 5,
        name: '百家号账号1',
        isExpired: true,
        expireTime: dayjs().subtract(2, 'day').valueOf()
      }
    ]
  }
]);

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
  text-align: right;
  white-space: nowrap; /* 防止按钮换行 */
}

.account-actions .ant-btn {
  margin-left: 8px; /* 调整按钮间距 */
}
</style>
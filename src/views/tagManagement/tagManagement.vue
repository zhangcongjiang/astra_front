<template>
  <div class="tag-management-page">
    <!-- 标签管理页面 -->
    <div class="search-condition-row">
      <div class="left-area">
        <a-popconfirm
          :title="`确认要删除该${tagTitle}吗？`"
          ok-text="确认"
          cancel-text="取消"
          :disabled="!selectedRows1.length && !selectedRows2.length"
          @confirm="delTags()"
        >
          <a-button :disabled="!selectedRows1.length && !selectedRows2.length">批量删除</a-button>
        </a-popconfirm>
      </div>
      <div class="right-area">
        <a-button type="primary" @click="addTags">添加{{ tagTitle }}</a-button>
      </div>
    </div>

    <div class="tag-table-row">
      <a-table :data-source="tagsList" :row-selection="rowSelection1" rowKey="tag_id">
        <template #expandedRowRender="{ record }">
          <a-table
            width="100%"
            class="table_inside"
            :rowKey="record => record.tag_id"
            :showHeader="false"
            :pagination="false"
            :data-source="record.subTags"
            :row-selection="rowSelection2"
          >
            <a-table-column key="sub_tag_name" data-index="tag_name" fixed="left" />
            <a-table-column key="description" data-index="description"></a-table-column>
            <a-table-column key="sub_create_time" data-index="sub_create_time" width="200px">
              <template #default="{ record }">
                {{ dayjs.unix(record.create_time).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </a-table-column>
            <a-table-column key="action" title="操作" :width="110" fixed="right">
              <template #default="{ record }">
                <a-button type="link" @click="editTag(record, 2)">编辑</a-button>
                <a-divider type="vertical" />
                <a-popconfirm
                  :title="`确认要删除该${tagTitle}吗？`"
                  ok-text="确认"
                  cancel-text="取消"
                  @confirm="delTags(record)"
                >
                  <a-button type="link">删除</a-button>
                </a-popconfirm>
              </template>
            </a-table-column>
          </a-table>
        </template>
        <a-table-column
          key="tag_name"
          :title="`${tagTitle}名称`"
          data-index="tag_name"
          fixed="left"
        ></a-table-column>
        <a-table-column
          key="description"
          :title="`${tagTitle}简介`"
          data-index="description"
        ></a-table-column>
        <a-table-column key="create_time" title="创建时间" width="200px">
          <template #default="{ record }">
            {{ dayjs.unix(record.create_time).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
        </a-table-column>
        <a-table-column key="action" title="操作" :width="110" fixed="right">
          <template #default="{ record }">
            <a-button type="link" @click="editTag(record, 1)">编辑</a-button>
            <a-divider type="vertical" />
            <a-popconfirm
              :title="`确认要删除该${tagTitle}吗？`"
              ok-text="确认"
              cancel-text="取消"
              @confirm="delTags(record)"
            >
              <a-button type="link">删除</a-button>
            </a-popconfirm>
          </template>
        </a-table-column>
      </a-table>
    </div>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import router from '@/router'
import api from '@/api'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
export default {
  name: 'tagManagement',
  async setup() {
    const tagType = router.currentRoute.value.query.type
    const tagTitle = router.currentRoute.value.meta.tagTitle || '标签'
    const data = reactive({
      // 标签表格数据
      tagsList: [],
      // 列表当前选中行
      selectedRows1: [],
      selectedRows2: [],
    })
    const rowSelection1 = {
      onChange: (selectedRowKeys, selectedRows) => {
        data.selectedRows1 = selectedRowKeys
      },
    }
    const rowSelection2 = {
      onChange: (selectedRowKeys, selectedRows) => {
        let arr = [...data.selectedRows2, ...selectedRowKeys]
        data.selectedRows2 = Array.from(new Set(arr))
      },
      onSelect: (record, selected, selectedRows) => {
        if (!selected) {
          data.selectedRows2.splice(data.selectedRows2.indexOf(record.tag_id), 1)
        }
      },
    }

    // 确认删除
    async function delTags(item) {
      let ids = []
      if (item) {
        ids = [item.tag_id]
      } else {
        ids = [...data.selectedRows1, ...data.selectedRows2]
      }
      let arr = []
      ids.forEach(v => {
        data.tagsList.forEach(v1 => {
          if (v === v1.tag_id) {
            let arrs = v1.subTags.map(v2 => v2.tag_id)
            arr = [...arr, ...arrs]
          }
        })
      })
      ids = [...ids, ...arr]
      ids = [...new Set(ids)]
      api.mirroringManagement.deleteTags({ ids: ids.join(',') }).then(() => {
        message.info('删除成功')
        getTagList()
        data.selectedRows1 = []
        data.selectedRows2 = []
      })
    }

    // 获取标签数据
    function getTagList() {
      api.mirroringManagement.getMirroringTags({ type: tagType }).then(res => {
        res.list.forEach(item => {
          item.subTags = item.children || []
          delete item.children
        })
        data.tagsList = res.list
        router.currentRoute.value.meta.refresh = 1 // 返回刷新
      })
    }
    getTagList()

    // 添加标签
    function addTags() {
      let urlName = ''
      switch (tagType) {
        case '1':
          urlName = 'addTags'
          break
        case '2':
          urlName = 'addKnowledgeTagManagement'
          break
        case '3':
          urlName = 'tag_new_tpl'
          break
        case '5':
          urlName = 'addVMTTags'
          break
        case '6':
          urlName = 'addBugTag'
        case '4':
          urlName = 'addFlowTag'
        default:
          break
      }
      router.push({
        name: urlName,
        query: {
          type: tagType,
        },
      })
    }
    // 编辑标签
    function editTag(target, tagTier = 1) {
      let urlName = ''
      switch (tagType) {
        case '1':
          urlName = 'editTags'
          break
        case '2':
          urlName = 'editKnowledgeTagManagement'
          break
        case '3':
          urlName = 'tag_edit_tpl'
          break
        case '5':
          urlName = 'editVMTTags'
          break
        case '6':
          urlName = 'editBugTag'
        case '4':
          urlName = 'editFlowTag'
        default:
          break
      }
      router.push({
        name: urlName,
        query: {
          tagTier: tagTier,
          targetId: target.tag_id,
          type: tagType,
        },
      })
    }

    return {
      dayjs,
      tagTitle,
      ...toRefs(data),
      rowSelection1,
      rowSelection2,
      addTags,
      editTag,
      delTags,
      getTagList,
    }
  },
}
</script>

<style lang="scss" scoped>
.tag-management-page {
  padding: 16px 24px;
  .search-condition-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    .right-area {
      display: flex;
      flex-direction: row;
      align-items: center;
      .search-input {
        display: flex;
        flex-direction: row;
        align-items: center;
        > span {
          flex-shrink: 0;
          margin-right: 10px;
        }
      }
    }
  }
  .tag-table-row {
    margin-top: 12px;
  }
  .operate-btn {
    color: #0072ee;
    border-right: 1px solid #e8e8e8;
    padding: 0 5px;
    cursor: pointer;
  }
  .operate-btn:last-child {
    border: none;
  }
}

:deep(.ant-table-expand-icon-th:nth-child(2)) {
  display: none;
}
:deep(
    .ant-table-expanded-row.ant-table-expanded-row-level-1
      .ant-table-cell-fix-left.ant-table-cell-fix-left-last
      .ant-table-wrapper
  ) {
  padding-left: 30px;
}
</style>

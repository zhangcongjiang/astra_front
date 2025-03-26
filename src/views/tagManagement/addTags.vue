<template>
  <div class="common-form-container">
    <a-form
      class="form-cont"
      :model="formState"
      ref="formRef"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :rules="rules"
    >
      <a-form-item :label="`${tagTitle}名称`" name="tagName">
        <a-input v-model:value="formState.tagName" />
      </a-form-item>
      <a-form-item :label="`${tagTitle}简介`" name="description">
        <a-textarea
          maxLength="128"
          placeholder="最多输入128字符"
          v-model:value="formState.description"
          :auto-size="{ minRows: 2, maxRows: 5 }"
        />
      </a-form-item>
      <a-form-item label="类型" v-if="tagTier == 2 || type == 1">
        <a-radio-group v-model:value="formState.tagLevel" button-style="solid">
          <a-radio value="main">一级{{ tagTitle }}</a-radio>
          <a-radio value="sub">二级{{ tagTitle }}</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        :label="`父${tagTitle}`"
        v-show="formState.tagLevel === 'sub'"
        name="parent_id"
        v-if="tagTier == 2 || type == 1"
      >
        <a-select ref="select" width="100%" v-model:value="formState.mainTag">
          <a-select-option v-for="item in tagsList" :key="item.tag_id" :value="item.tag_id">{{
            item.tag_name
          }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label=" " :colon="false">
        <a-button type="primary" @click="confirmAdd()">保存</a-button>
        <a-button style="margin-left: 10px" @click="formRef.resetFields()" v-if="type == 1"
          >重置</a-button
        >
        <a-button style="margin-left: 10px" @click="router.go(-1)">取消</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import api from '@/api'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import validator from '@/utils/validator'
export default {
  name: 'addTags',
  async setup(props) {
    const router = useRouter()
    const queryParams = router.currentRoute.value.query
    const tagTitle = router.currentRoute.value.meta.tagTitle || '标签'
    const tagType = queryParams.type
    console.log('queryParams.targetId:', queryParams.targetId)
    const targetId = queryParams.targetId || null
    const data = reactive({
      type: 1, // 1新建 2编辑
      tagTier: router.currentRoute.value.query?.tagTier, // 1: 一级标签 2: 二级标签 undefined: 新建标签
      formRef: null,
      formState: {
        // 表单组件
        // 标签名
        tagName: '',
        // 默认标签类型
        tagLevel: 'main',
        // 标签简介
        description: '',
        // 如果创建二级标签时选定的父标签
        mainTag: null,
      },
      tagsList: [],
    })

    if (data.tagTier) {
      data.type = 2
    }

    // 获取标签
    async function getMirroringTags() {
      const res = await api.mirroringManagement.getMirroringTags({ type: tagType })
      data.tagsList = res.list
      // 如果targetId存在，为编辑操作
      if (targetId) {
        reviewData()
      }
    }

    // 父标签校验规则
    async function parentIdCheck() {
      if (data.formState.tagLevel === 'sub' && !data.formState.mainTag) {
        return Promise.reject(`请选择父${tagTitle}`)
      }
    }

    // 表单校验规则
    const rules = {
      tagName: validator.name(`${tagTitle}名称`),
      description: validator.desc('简介'),
      parent_id: [{ required: true, validator: parentIdCheck, trigger: 'blur' }],
    }

    async function confirmAdd() {
      data.formRef
        .validate()
        .then(async () => {
          let ajaxParams
          if (!targetId) {
            // targetId不存在，为新建操作
            ajaxParams = {
              name: data.formState.tagName,
              description: data.formState.description,
              parent_id: data.formState.tagLevel === 'main' ? null : data.formState.mainTag,
              type: tagType,
            }
            try {
              await api.mirroringManagement.addTags(ajaxParams)
              message.info('创建成功')
              router.go(-1)
            } catch (err) {
              console.error(err)
            }
          } else {
            ajaxParams = {
              id: targetId,
              type: tagType,
              name: data.formState.tagName,
              description: data.formState.description || '',
              parent_id: data.formState.tagLevel === 'main' ? null : data.formState.mainTag,
            }
            try {
              await api.mirroringManagement.editTags(ajaxParams)
              message.info('修改成功')
              router.go(-1)
            } catch (err) {
              console.error(err)
            }
          }
        })
        .catch(error => {
          console.log(error)
        })
    }
    // 获取镜像标签数据
    getMirroringTags()

    function reviewData() {
      let targetTag = null
      let subTags = []
      data.tagsList.forEach(item => {
        subTags = [...subTags, ...item.children]
      })
      targetTag = data.tagsList.find(item => item.tag_id === targetId)
      if (!targetTag) {
        targetTag = subTags.find(item => item.tag_id === targetId)
      }
      data.formState.tagName = targetTag.tag_name
      data.formState.description = targetTag.description
      data.formState.tagLevel = targetTag.parent_id ? 'sub' : 'main'
      if (targetTag.parent_id) {
        data.formState.mainTag = targetTag.parent_id
      }
    }
    return {
      router,
      tagTitle,
      ...toRefs(data),
      confirmAdd,
      rules,
    }
  },
}
</script>

<style lang="scss" scoped></style>

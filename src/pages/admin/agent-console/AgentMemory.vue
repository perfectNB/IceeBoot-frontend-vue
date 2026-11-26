<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { hasPermission } from '@/utils/permission'
import { memoryApi, type MemoryUser } from '@/api/agentMemory'
import MemoryPolicyEditor from './components/MemoryPolicyEditor.vue'
import MemoryProfile from './components/MemoryProfile.vue'
import './console.scss'

const canList = hasPermission('ai:memory:user-list:api')
const canPolicy = hasPermission('ai:memory:platform-policy-read:api')
const tab = ref(canList ? 'profiles' : 'policy')
const policyOpened = ref(!canList && canPolicy)
watch(tab, value => { if (value === 'policy' && canPolicy) policyOpened.value = true })
const users = ref<MemoryUser[]>([]), selected = ref<MemoryUser>()
const keyword = ref(''), page = ref(1), total = ref(0), loading = ref(false), error = ref('')
const selectedName = computed(() => selected.value?.nickname || selected.value?.username || '')
let generation = 0, alive = true
async function load() {
  if (!canList) return
  const token = ++generation
  loading.value = true; error.value = ''
  try {
    const result = await memoryApi.users({ pageNum: page.value, pageSize: 20, keyword: keyword.value.trim() })
    if (alive && token === generation) { users.value = result.records; total.value = result.total }
  } catch { if (alive && token === generation) error.value = '用户列表加载失败，请重试。' }
  finally { if (alive && token === generation) loading.value = false }
}
function search() { page.value = 1; selected.value = undefined; void load() }
function changePage(value: number) { page.value = value; selected.value = undefined; void load() }
onMounted(load)
onBeforeUnmount(() => { alive = false; generation++ })
</script>

<template>
  <main class="agent-console general-profiles admin-page">
    <AdminPageHeader title="通用画像" description="统一配置提取规则，按用户管理画像内容。每位用户的记忆独立保存。" />
    <section class="profiles-workspace">
      <el-tabs v-model="tab" class="profiles-tabs">
        <el-tab-pane v-if="canList" label="用户画像" name="profiles" />
        <el-tab-pane v-if="canPolicy" label="统一画像策略" name="policy" />
      </el-tabs>
      <div v-show="tab === 'profiles' && canList" class="profiles-layout">
        <aside class="users-panel">
          <div class="users-heading"><h2>全部用户 <span>{{ total }}</span></h2><el-button link type="primary" :loading="loading" @click="load">刷新</el-button></div>
          <el-input v-model="keyword" placeholder="搜索账号或昵称" aria-label="搜索画像用户" clearable :prefix-icon="Search" maxlength="100" @keyup.enter="search" @clear="search"><template #append><el-button :icon="Search" aria-label="搜索" @click="search" /></template></el-input>
          <p v-if="error" class="load-error" role="alert">{{ error }}</p>
          <div v-loading="loading" class="users-list" aria-label="画像用户列表">
            <button v-for="user in users" :key="user.userId" type="button" class="user-row" :aria-pressed="selected?.userId === user.userId" @click="selected = user"><span class="user-avatar">{{ (user.nickname || user.username).slice(0, 1) }}</span><span class="user-label"><strong>{{ user.nickname || user.username }}</strong><span>{{ user.username }}</span></span><el-tag v-if="user.status !== 'active'" type="info" size="small">已停用</el-tag></button>
            <el-empty v-if="!users.length && !loading" description="没有匹配的用户" :image-size="70" />
          </div>
          <el-pagination small layout="prev, pager, next" :total="total" :page-size="20" :pager-count="5" :current-page="page" @current-change="changePage" />
        </aside>
        <section class="profile-detail">
          <template v-if="selected"><header class="profile-owner"><div><h2>{{ selectedName }} 的通用画像</h2><p>账号 {{ selected.username }} · 用户 ID {{ selected.userId }}</p></div><el-tag effect="plain">按用户隔离</el-tag></header><MemoryProfile v-if="hasPermission('ai:memory:user-read:api')" :key="selected.userId" scope="USER" :agent="0" :user-id="selected.userId" /><el-empty v-else description="当前账号没有查看用户画像内容的权限" /></template>
          <el-empty v-else description="从左侧选择一位用户，查看其通用画像" :image-size="110" />
        </section>
      </div>
      <section v-if="policyOpened && canPolicy" v-show="tab === 'policy'" class="platform-policy"><div class="platform-policy-heading"><h2>所有用户共用的提取规则</h2><p>字段定义和提取规则统一配置；画像内容仍按用户分别保存，不会共享给其他用户。</p></div><MemoryPolicyEditor scope="USER" :agent="0" /></section>
      <el-empty v-if="!canList && !canPolicy" description="当前账号没有通用画像管理权限" />
    </section>
  </main>
</template>
<style scoped>
.general-profiles { max-width: 1480px; padding: 14px 16px 28px; }
.profiles-workspace { border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-bg-color); overflow: hidden; }
.profiles-tabs { padding: 0 26px; border-bottom: 1px solid var(--el-border-color-lighter); }.profiles-tabs :deep(.el-tabs__header) { margin: 0; }.profiles-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }.profiles-tabs :deep(.el-tabs__item) { height: 60px; }
.profiles-layout { display: grid; grid-template-columns: 300px minmax(0,1fr); min-height: 520px; }.users-panel { padding: 20px; border-right: 1px solid var(--el-border-color-lighter); background: var(--el-fill-color-lighter); }.users-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }.users-heading h2, .profile-owner h2, .platform-policy-heading h2 { margin: 0; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); }.users-heading h2 span { margin-left: 5px; color: var(--el-text-color-secondary); font-size: 12px; }.users-list { min-height: 180px; margin: 16px 0; max-height: 520px; overflow: auto; }.user-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 10px; border: 1px solid transparent; border-radius: 8px; background: transparent; font: inherit; text-align: left; cursor: pointer; }.user-row:hover { background: var(--el-fill-color); }.user-row[aria-pressed='true'] { border-color: var(--el-color-primary-light-7); background: var(--el-color-primary-light-9); }.user-row:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }.user-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); flex-shrink: 0; }.user-label { display: grid; gap: 4px; min-width: 0; flex: 1; }.user-label strong { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.user-label > span { font-size: 11px; color: var(--el-text-color-secondary); }.profile-detail { padding: 26px; min-width: 0; }.profile-owner { display: flex; gap: 16px; align-items: center; justify-content: space-between; padding-bottom: 22px; margin-bottom: 24px; border-bottom: 1px solid var(--el-border-color-lighter); }.profile-owner p, .platform-policy-heading p { margin: 8px 0 0; font-size: 12px; line-height: 1.7; color: var(--el-text-color-regular); }.platform-policy { padding: 26px; }.platform-policy-heading { margin-bottom: 24px; }.load-error { color: var(--el-color-danger); font-size: 12px; line-height: 1.7; }
@media(max-width:900px) { .profiles-layout { grid-template-columns: 240px minmax(0,1fr); }.users-panel, .profile-detail { padding: 18px; } }
@media(max-width:650px) { .general-profiles { padding: 6px 0 20px; }.profiles-layout { grid-template-columns: 1fr; }.users-panel { border-right: 0; border-bottom: 1px solid var(--el-border-color-lighter); }.users-list { max-height: 220px; }.profile-owner { align-items: flex-start; flex-wrap: wrap; }.profiles-tabs { padding: 0 18px; }.platform-policy { padding: 20px 16px; } }
</style>

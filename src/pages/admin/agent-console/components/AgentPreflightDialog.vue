<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { agentConsole, type AgentPreflight } from '@/api/agentConsole'
import { formatDuration } from './runMetrics'
const props = defineProps<{ agentId: number; dirty: boolean }>()
const visible = defineModel<boolean>({ default: false })
const result = ref<AgentPreflight>()
const loading = ref(false), error = ref('')
let alive = true
onBeforeUnmount(() => { alive = false })
async function run() {
  loading.value = true; error.value = ''; result.value = undefined
  try { const value = await agentConsole.preflight(props.agentId); if (alive) result.value = value }
  catch { if (alive) error.value = '预检未完成，请检查服务状态后重试。' }
  finally { if (alive) loading.value = false }
}
</script>
<template>
  <el-dialog v-model="visible" title="技能与环境预检" width="min(720px,94vw)" append-to-body :close-on-click-modal="!loading" :close-on-press-escape="!loading" :show-close="!loading">
    <div class="preflight-intro"><strong>运行前，先确认准备就绪</strong><p>检查已保存的草稿、能力绑定、沙箱模板和 Python 依赖。会短暂创建并释放运行环境，不调用模型，不安装依赖，也不执行技能脚本。</p></div>
    <el-alert v-if="dirty" type="warning" title="有未保存的修改，本次检查最近保存的草稿。" :closable="false" show-icon />
    <p class="preflight-note">预检覆盖静态可识别的依赖；动态导入、npm 依赖和业务接口仍需实际验证。</p>
    <div v-if="loading" class="preflight-loading" role="status">正在检查配置与运行环境…</div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <template v-if="result">
      <div class="preflight-result"><el-tag :type="result.passed ? 'success' : 'danger'">{{ result.passed ? '未发现阻断问题' : '需要处理后再运行' }}</el-tag><span>总耗时 {{ formatDuration(result.durationMs) }}</span></div>
      <ul class="preflight-checks"><li v-for="(check,index) in result.checks" :key="index"><el-tag :type="check.status === 'PASS' ? 'success' : check.status === 'WARN' ? 'warning' : 'danger'" size="small">{{ check.status === 'PASS' ? '通过' : check.status === 'WARN' ? '待核对' : '未通过' }}</el-tag><div><strong>{{ check.name }}</strong><p>{{ check.detail }}</p></div><small>{{ formatDuration(check.durationMs) }}</small></li></ul>
    </template>
    <template #footer><el-button :disabled="loading" @click="visible=false">关闭</el-button><el-button type="primary" :loading="loading" @click="run">{{ result || error ? '重新预检' : '开始预检' }}</el-button></template>
  </el-dialog>
</template>
<style scoped>
.preflight-intro { padding: 16px 18px; margin-bottom: 18px; border-radius: 12px; background: var(--el-fill-color-light); }
.preflight-intro strong { font-size: 17px; color: var(--el-text-color-primary); }
.preflight-intro p,.preflight-note { font-size: 12px; line-height: 1.8; color: var(--el-text-color-regular); }
.preflight-intro p { margin: 8px 0 0; }
.preflight-loading { padding: 28px; text-align: center; color: var(--el-color-primary); }
.preflight-result { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 12px; }
.preflight-result > span { font-size: 12px; color: var(--el-text-color-secondary); }
.preflight-checks { list-style: none; padding: 0; margin: 0; max-height: 45vh; overflow: auto; }
.preflight-checks li { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.preflight-checks li > div { flex: 1; min-width: 0; }
.preflight-checks strong { font-size: 13px; overflow-wrap: anywhere; color: var(--el-text-color-primary); }
.preflight-checks p { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-regular); overflow-wrap: anywhere; }
.preflight-checks small { color: var(--el-text-color-secondary); font-size: 11px; }
</style>

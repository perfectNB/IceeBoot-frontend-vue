<script setup lang="ts">
import { computed } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import type { Capability } from '@/api/agentConsole'
const props = defineProps<{ modelValue: number[]; options: Capability[]; title: string; hint: string; emptyText: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()
const selected = computed(() => props.options.filter((option) => props.modelValue.includes(option.id!)))
</script>
<template>
  <div class="capability-picker">
    <el-form-item :label="`挂载${title}`">
      <el-select :model-value="modelValue" multiple filterable clearable :placeholder="`搜索并选择${title}`" @update:model-value="emit('update:modelValue', $event)">
        <el-option v-for="option in options" :key="option.id" :label="`${option.name} · ${option.code}`" :value="option.id!">
          <span>{{ option.name }}</span><span class="option-code">{{ option.code }}</span>
        </el-option>
      </el-select>
    </el-form-item>
    <p class="picker-help">{{ hint }}</p>
    <div v-if="!options.length" class="picker-empty"><el-icon><Connection /></el-icon><strong>暂无可用{{ title }}</strong><p>{{ emptyText }}</p></div>
    <div v-else-if="selected.length" class="binding-preview-list">
      <div v-for="option in selected" :key="option.id" class="binding-preview">
        <span class="binding-preview-icon"><el-icon><Connection /></el-icon></span>
        <div><strong>{{ option.name }}</strong><span>{{ option.description || option.code }}</span></div>
        <el-tag size="small" type="info">{{ option.kind === 'TOOL' ? (option.tool?.kind === 'SCRIPT' ? '沙箱脚本' : 'HTTP 工具') : '已挂载' }}</el-tag>
      </div>
    </div>
    <div v-else class="picker-empty"><strong>还未挂载{{ title }}</strong><p>这是可选配置，可根据智能体职责按需添加。</p></div>
  </div>
</template>
<style scoped>
.capability-picker { width: 100%; }
.picker-help { margin: -6px 0 20px; font-size: 13px; line-height: 1.7; color: var(--el-text-color-regular); }
.picker-empty { padding: 32px 20px; border: 1px dashed var(--el-border-color); border-radius: 12px; background: var(--el-fill-color-lighter); text-align: center; }
.picker-empty > .el-icon { display: block; font-size: 26px; color: var(--el-color-primary); margin: 0 auto 12px; }
.picker-empty strong { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.picker-empty p { margin: 8px 0 0; font-size: 13px; line-height: 1.7; color: var(--el-text-color-regular); }
.option-code { margin-left: 12px; color: var(--el-text-color-secondary); font-size: 12px; }
</style>

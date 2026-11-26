<template>
  <div class="approval-fields">
    <label v-for="f in fields" :key="f.key">
      <span>
        {{ f.label }}
        <em v-if="f.required || f.kind === 'routing'">*</em>
      </span>
      <el-input
        :model-value="formValue(modelValue, f.key)"
        :inputmode="f.type === 'number' ? 'decimal' : 'text'"
        maxlength="2000"
        :placeholder="f.type === 'number' ? '请输入数字' : '请输入' + f.label"
        @update:model-value="$emit('update:modelValue', { ...modelValue, [f.key]: $event })"
      />
    </label>
  </div>
</template>
<script setup lang="ts">
import { formValue } from '@/utils/approval'
import type { ApprovalField, Values } from '@/types/approval'
defineProps<{ fields: ApprovalField[]; modelValue: Values }>()
defineEmits<{ 'update:modelValue': [values: Values] }>()
</script>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getSMSProviders, sendSms, querySmsStatus, querySmsBalance, type SMSProvider, type SmsResponse, type SmsSendDTO, type SmsStatusQuery, type SmsBalanceQuery } from '@/api'

const { t } = useI18n()

defineOptions({
  name: 'SmsManagement'
})

const activeTab = ref('send')
const loadingProviders = ref(false)
const sending = ref(false)
const queryingStatus = ref(false)
const queryingBalance = ref(false)

const providerList = ref<SMSProvider[]>([])

const sendFormRef = ref<FormInstance>()
const statusFormRef = ref<FormInstance>()
const balanceFormRef = ref<FormInstance>()

const sendForm = reactive({
  provider: '',
  keyId: undefined as number | undefined,
  phoneNumber: '',
  phoneNumbers: '',
  content: '',
  templateId: '',
  templateParamsJson: '',
  signName: '',
  smsType: '',
  countryCode: '',
  scheduleTime: undefined as number | undefined,
  validityPeriod: undefined as number | undefined,
  callbackUrl: '',
  userData: '',
  sendType: ''
})

const statusForm = reactive({
  messageId: '',
  keyId: undefined as number | undefined,
  provider: ''
})

const balanceForm = reactive({
  keyId: undefined as number | undefined,
  provider: ''
})

const sendResult = ref<SmsResponse | null>(null)
const statusResult = ref<SmsResponse | null>(null)
const balanceResult = ref<SmsResponse | null>(null)

const providerOptions = computed(() => providerList.value)
const keyOptions = computed(() => {
  const provider = providerList.value.find(item => item.providerName === sendForm.provider)
  return provider?.keys || []
})

const statusKeyOptions = computed(() => {
  const provider = providerList.value.find(item => item.providerName === statusForm.provider)
  return provider?.keys || []
})

const balanceKeyOptions = computed(() => {
  const provider = providerList.value.find(item => item.providerName === balanceForm.provider)
  return provider?.keys || []
})

const parseList = (value: string): string[] => {
  return value
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

const parseJson = (value: string): Record<string, string> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, string>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error(t('smsManagement.templateParamsError'))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t('smsManagement.templateParamsFormatError'))
    return null
  }
}

const formatResult = (value: SmsResponse | null): string => {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

const validatePhoneTarget = (_rule: unknown, _value: string, callback: (error?: Error) => void) => {
  if (!sendForm.phoneNumber && !sendForm.phoneNumbers) {
    callback(new Error(t('smsManagement.phoneRequired')))
    return
  }
  callback()
}

const validateProviderOrKey = (_rule: unknown, _value: number | undefined, callback: (error?: Error) => void) => {
  if (!balanceForm.provider && !balanceForm.keyId) {
    callback(new Error(t('smsManagement.providerOrKeyRequired')))
    return
  }
  callback()
}

const sendRules: FormRules = {
  provider: [{ required: true, message: t('smsManagement.providerRequired'), trigger: 'change' }],
  content: [{ required: true, message: t('smsManagement.contentRequired'), trigger: 'blur' }],
  phoneNumber: [{ validator: validatePhoneTarget, trigger: 'blur' }],
  phoneNumbers: [{ validator: validatePhoneTarget, trigger: 'blur' }]
}

const statusRules: FormRules = {
  messageId: [{ required: true, message: t('smsManagement.messageIdRequired'), trigger: 'blur' }]
}

const balanceRules: FormRules = {
  keyId: [{ validator: validateProviderOrKey, trigger: 'change' }],
  provider: [{ validator: validateProviderOrKey, trigger: 'change' }]
}

const loadProviders = async () => {
  loadingProviders.value = true
  try {
    providerList.value = await getSMSProviders()
  } catch {
    ElMessage.error(t('smsManagement.loadProvidersError'))
  } finally {
    loadingProviders.value = false
  }
}

const handleSend = async () => {
  if (!sendFormRef.value) return
  try {
    await sendFormRef.value.validate()
    const templateParams = parseJson(sendForm.templateParamsJson)
    if (templateParams === null) return
    const phoneNumbers = parseList(sendForm.phoneNumbers)
    const payload: SmsSendDTO = {
      keyId: sendForm.keyId ?? undefined,
      provider: sendForm.provider || undefined,
      phoneNumber: sendForm.phoneNumber || undefined,
      phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : undefined,
      content: sendForm.content || undefined,
      templateId: sendForm.templateId || undefined,
      templateParams: templateParams || undefined,
      signName: sendForm.signName || undefined,
      smsType: sendForm.smsType || undefined,
      countryCode: sendForm.countryCode || undefined,
      scheduleTime: sendForm.scheduleTime ?? undefined,
      validityPeriod: sendForm.validityPeriod ?? undefined,
      callbackUrl: sendForm.callbackUrl || undefined,
      userData: sendForm.userData || undefined,
      sendType: sendForm.sendType || undefined
    }
    sending.value = true
    sendResult.value = await sendSms(payload)
    ElMessage.success(t('smsManagement.sendSuccess'))
  } catch {
    return
  } finally {
    sending.value = false
  }
}

const handleQueryStatus = async () => {
  if (!statusFormRef.value) return
  try {
    await statusFormRef.value.validate()
    const payload: SmsStatusQuery = {
      messageId: statusForm.messageId || undefined,
      keyId: statusForm.keyId ?? undefined,
      provider: statusForm.provider || undefined
    }
    queryingStatus.value = true
    statusResult.value = await querySmsStatus(payload)
    ElMessage.success(t('smsManagement.querySuccess'))
  } catch {
    return
  } finally {
    queryingStatus.value = false
  }
}

const handleQueryBalance = async () => {
  if (!balanceFormRef.value) return
  try {
    await balanceFormRef.value.validate()
    const payload: SmsBalanceQuery = {
      keyId: balanceForm.keyId ?? undefined,
      provider: balanceForm.provider || undefined
    }
    queryingBalance.value = true
    balanceResult.value = await querySmsBalance(payload)
    ElMessage.success(t('smsManagement.balanceQuerySuccess'))
  } catch {
    return
  } finally {
    queryingBalance.value = false
  }
}

const resetSendForm = () => {
  Object.assign(sendForm, {
    provider: '',
    keyId: undefined,
    phoneNumber: '',
    phoneNumbers: '',
    content: '',
    templateId: '',
    templateParamsJson: '',
    signName: '',
    smsType: '',
    countryCode: '',
    scheduleTime: undefined,
    validityPeriod: undefined,
    callbackUrl: '',
    userData: '',
    sendType: ''
  })
  sendFormRef.value?.clearValidate()
  sendResult.value = null
}

const resetStatusForm = () => {
  Object.assign(statusForm, {
    messageId: '',
    keyId: undefined,
    provider: ''
  })
  statusFormRef.value?.clearValidate()
  statusResult.value = null
}

const resetBalanceForm = () => {
  Object.assign(balanceForm, {
    keyId: undefined,
    provider: ''
  })
  balanceFormRef.value?.clearValidate()
  balanceResult.value = null
}

onMounted(() => {
  loadProviders()
})
</script>

<template>
  <div class="sms-management">
    <div class="page-header">
      <h2>{{ t('smsManagement.title') }}</h2>
      <p>{{ t('smsManagement.description') }}</p>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane :label="t('smsManagement.sendSms')" name="send">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form
            ref="sendFormRef"
            :model="sendForm"
            :rules="sendRules"
            label-width="110px"
          >
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.provider')" prop="provider">
                  <el-select v-model="sendForm.provider" :placeholder="t('smsManagement.providerPlaceholder')" filterable>
                    <el-option
                      v-for="provider in providerOptions"
                      :key="provider.providerName"
                      :label="provider.displayName"
                      :value="provider.providerName"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.keyId')">
                  <el-select v-model="sendForm.keyId" :placeholder="t('smsManagement.keyPlaceholder')">
                    <el-option
                      v-for="key in keyOptions"
                      :key="key.id"
                      :label="`${key.id} - ${key.remark || key.accessKeyId}`"
                      :value="key.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.phoneNumber')" prop="phoneNumber">
                  <el-input v-model="sendForm.phoneNumber" :placeholder="t('smsManagement.phoneNumberPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.phoneNumbers')" prop="phoneNumbers">
                  <el-input
                    v-model="sendForm.phoneNumbers"
                    :placeholder="t('smsManagement.phoneNumbersPlaceholder')"
                    type="textarea"
                    :rows="2"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('smsManagement.content')" prop="content">
                  <el-input
                    v-model="sendForm.content"
                    type="textarea"
                    :rows="3"
                    :placeholder="t('smsManagement.contentPlaceholder')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.templateId')">
                  <el-input v-model="sendForm.templateId" :placeholder="t('smsManagement.templateIdPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.signName')">
                  <el-input v-model="sendForm.signName" :placeholder="t('smsManagement.signNamePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.smsType')">
                  <el-input v-model="sendForm.smsType" :placeholder="t('smsManagement.smsTypePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.countryCode')">
                  <el-input v-model="sendForm.countryCode" :placeholder="t('smsManagement.countryCodePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.scheduleTime')">
                  <el-input-number v-model="sendForm.scheduleTime" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.validityPeriod')">
                  <el-input-number v-model="sendForm.validityPeriod" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.callbackUrl')">
                  <el-input v-model="sendForm.callbackUrl" :placeholder="t('smsManagement.callbackUrlPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.sendType')">
                  <el-input v-model="sendForm.sendType" :placeholder="t('smsManagement.sendTypePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.userData')">
                  <el-input v-model="sendForm.userData" :placeholder="t('smsManagement.userDataPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('smsManagement.templateParams')">
                  <el-input
                    v-model="sendForm.templateParamsJson"
                    :placeholder="t('smsManagement.templateParamsPlaceholder')"
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="sending" @click="handleSend">{{ t('smsManagement.send') }}</el-button>
              <el-button @click="resetSendForm">{{ t('smsManagement.reset') }}</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="sendResult" class="result-card">
          <div class="result-title">{{ t('smsManagement.sendResult') }}</div>
          <pre class="result-content">{{ formatResult(sendResult) }}</pre>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('smsManagement.queryStatus')" name="status">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form ref="statusFormRef" :model="statusForm" :rules="statusRules" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.provider')" prop="provider">
                  <el-select v-model="statusForm.provider" :placeholder="t('smsManagement.providerPlaceholder')" filterable>
                    <el-option
                      v-for="provider in providerOptions"
                      :key="provider.providerName"
                      :label="provider.displayName"
                      :value="provider.providerName"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.keyId')">
                  <el-select v-model="statusForm.keyId" :placeholder="t('smsManagement.keyPlaceholder')">
                    <el-option
                      v-for="key in statusKeyOptions"
                      :key="key.id"
                      :label="`${key.id} - ${key.remark || key.accessKeyId}`"
                      :value="key.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item :label="t('smsManagement.messageId')" prop="messageId">
                  <el-input v-model="statusForm.messageId" :placeholder="t('smsManagement.messageIdPlaceholder')" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="queryingStatus" @click="handleQueryStatus">{{ t('smsManagement.query') }}</el-button>
              <el-button @click="resetStatusForm">{{ t('smsManagement.reset') }}</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="statusResult" class="result-card">
          <div class="result-title">{{ t('smsManagement.queryResult') }}</div>
          <pre class="result-content">{{ formatResult(statusResult) }}</pre>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="t('smsManagement.queryBalance')" name="balance">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form ref="balanceFormRef" :model="balanceForm" :rules="balanceRules" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.provider')">
                  <el-select v-model="balanceForm.provider" :placeholder="t('smsManagement.providerPlaceholder')" filterable>
                    <el-option
                      v-for="provider in providerOptions"
                      :key="provider.providerName"
                      :label="provider.displayName"
                      :value="provider.providerName"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="t('smsManagement.keyId')">
                  <el-select v-model="balanceForm.keyId" :placeholder="t('smsManagement.keyPlaceholder')">
                    <el-option
                      v-for="key in balanceKeyOptions"
                      :key="key.id"
                      :label="`${key.id} - ${key.remark || key.accessKeyId}`"
                      :value="key.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="queryingBalance" @click="handleQueryBalance">{{ t('smsManagement.queryBalance') }}</el-button>
              <el-button @click="resetBalanceForm">{{ t('smsManagement.reset') }}</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="balanceResult" class="result-card">
          <div class="result-title">{{ t('smsManagement.balanceResult') }}</div>
          <pre class="result-content">{{ formatResult(balanceResult) }}</pre>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.sms-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.panel-card {
  padding: 20px;
  border-radius: 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.result-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
}

.result-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.result-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: var(--bg-color-overlay);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-light);
}

@media (max-width: 768px) {
  .action-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

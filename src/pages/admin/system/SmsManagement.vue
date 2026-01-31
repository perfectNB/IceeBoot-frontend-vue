<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getSMSProviders, sendSms, querySmsStatus, querySmsBalance, type SMSProvider, type SmsResponse, type SmsSendDTO, type SmsStatusQuery, type SmsBalanceQuery } from '@/api'

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
      ElMessage.error('模板参数需要是JSON对象')
      return null
    }
    return parsed
  } catch {
    ElMessage.error('模板参数JSON格式不正确')
    return null
  }
}

const formatResult = (value: SmsResponse | null): string => {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

const validatePhoneTarget = (_rule: unknown, _value: string, callback: (error?: Error) => void) => {
  if (!sendForm.phoneNumber && !sendForm.phoneNumbers) {
    callback(new Error('请输入手机号或手机号列表'))
    return
  }
  callback()
}

const validateProviderOrKey = (_rule: unknown, _value: number | undefined, callback: (error?: Error) => void) => {
  if (!balanceForm.provider && !balanceForm.keyId) {
    callback(new Error('请选择服务商或密钥'))
    return
  }
  callback()
}

const sendRules: FormRules = {
  provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
  content: [{ required: true, message: '请输入短信内容', trigger: 'blur' }],
  phoneNumber: [{ validator: validatePhoneTarget, trigger: 'blur' }],
  phoneNumbers: [{ validator: validatePhoneTarget, trigger: 'blur' }]
}

const statusRules: FormRules = {
  messageId: [{ required: true, message: '请输入短信ID', trigger: 'blur' }]
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
    ElMessage.error('加载短信服务商失败')
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
    ElMessage.success('短信发送请求已提交')
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
    ElMessage.success('短信状态查询完成')
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
    ElMessage.success('短信余额查询完成')
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
      <h2>短信发送管理</h2>
      <p>发送短信、查询发送状态与余额</p>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="发送短信" name="send">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form
            ref="sendFormRef"
            :model="sendForm"
            :rules="sendRules"
            label-width="110px"
          >
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="服务商" prop="provider">
                  <el-select v-model="sendForm.provider" placeholder="请选择服务商" filterable>
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
                <el-form-item label="密钥ID">
                  <el-select v-model="sendForm.keyId" placeholder="请选择密钥">
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
                <el-form-item label="手机号" prop="phoneNumber">
                  <el-input v-model="sendForm.phoneNumber" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号列表" prop="phoneNumbers">
                  <el-input
                    v-model="sendForm.phoneNumbers"
                    placeholder="多个手机号用逗号或换行分隔"
                    type="textarea"
                    :rows="2"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="短信内容" prop="content">
                  <el-input
                    v-model="sendForm.content"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入短信内容"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="模板ID">
                  <el-input v-model="sendForm.templateId" placeholder="请输入模板ID" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="签名">
                  <el-input v-model="sendForm.signName" placeholder="请输入签名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="短信类型">
                  <el-input v-model="sendForm.smsType" placeholder="如验证码、通知" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="国际区号">
                  <el-input v-model="sendForm.countryCode" placeholder="如86" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="定时发送">
                  <el-input-number v-model="sendForm.scheduleTime" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="有效期">
                  <el-input-number v-model="sendForm.validityPeriod" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="回调地址">
                  <el-input v-model="sendForm.callbackUrl" placeholder="请输入回调地址" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发送类型">
                  <el-input v-model="sendForm.sendType" placeholder="如 batch" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="自定义数据">
                  <el-input v-model="sendForm.userData" placeholder="用户自定义参数" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="模板参数">
                  <el-input
                    v-model="sendForm.templateParamsJson"
                    placeholder='请输入JSON格式，如 {"code":"1234"}'
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="sending" @click="handleSend">发送短信</el-button>
              <el-button @click="resetSendForm">重置</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="sendResult" class="result-card">
          <div class="result-title">发送结果</div>
          <pre class="result-content">{{ formatResult(sendResult) }}</pre>
        </div>
      </el-tab-pane>

      <el-tab-pane label="查询状态" name="status">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form ref="statusFormRef" :model="statusForm" :rules="statusRules" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="服务商" prop="provider">
                  <el-select v-model="statusForm.provider" placeholder="请选择服务商" filterable>
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
                <el-form-item label="密钥ID">
                  <el-select v-model="statusForm.keyId" placeholder="请选择密钥">
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
                <el-form-item label="短信ID" prop="messageId">
                  <el-input v-model="statusForm.messageId" placeholder="请输入短信ID" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="queryingStatus" @click="handleQueryStatus">查询状态</el-button>
              <el-button @click="resetStatusForm">重置</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="statusResult" class="result-card">
          <div class="result-title">查询结果</div>
          <pre class="result-content">{{ formatResult(statusResult) }}</pre>
        </div>
      </el-tab-pane>

      <el-tab-pane label="查询余额" name="balance">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form ref="balanceFormRef" :model="balanceForm" :rules="balanceRules" label-width="110px">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="服务商">
                  <el-select v-model="balanceForm.provider" placeholder="请选择服务商" filterable>
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
                <el-form-item label="密钥ID">
                  <el-select v-model="balanceForm.keyId" placeholder="请选择密钥">
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
              <el-button type="primary" :loading="queryingBalance" @click="handleQueryBalance">查询余额</el-button>
              <el-button @click="resetBalanceForm">重置</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="balanceResult" class="result-card">
          <div class="result-title">余额结果</div>
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

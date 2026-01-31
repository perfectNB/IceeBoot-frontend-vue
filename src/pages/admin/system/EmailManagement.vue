<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getEmailProviders, sendEmail, queryEmailStatus, type EmailProvider, type EmailResponse, type EmailSendDTO, type EmailStatusQuery } from '@/api'

defineOptions({
  name: 'EmailManagement'
})

const activeTab = ref('send')
const loadingProviders = ref(false)
const sending = ref(false)
const queryingStatus = ref(false)

const providerList = ref<EmailProvider[]>([])

const sendFormRef = ref<FormInstance>()
const statusFormRef = ref<FormInstance>()

const sendForm = reactive({
  provider: '',
  keyId: undefined as number | undefined,
  toEmail: '',
  toEmails: '',
  ccEmails: '',
  bccEmails: '',
  subject: '',
  textContent: '',
  htmlContent: '',
  templateId: '',
  templateParamsJson: '',
  fromName: '',
  emailType: '',
  priority: undefined as number | undefined,
  needReceipt: false,
  replyTo: '',
  charset: '',
  customHeadersJson: '',
  async: true,
  attachmentsJson: ''
})

const statusForm = reactive({
  messageId: '',
  keyId: undefined as number | undefined,
  provider: ''
})

const sendResult = ref<EmailResponse | null>(null)
const statusResult = ref<EmailResponse | null>(null)

const providerOptions = computed(() => providerList.value)
const keyOptions = computed(() => {
  const provider = providerList.value.find(item => item.providerName === sendForm.provider)
  return provider?.keys || []
})

const statusKeyOptions = computed(() => {
  const provider = providerList.value.find(item => item.providerName === statusForm.provider)
  return provider?.keys || []
})

const parseList = (value: string): string[] => {
  return value
    .split(/[,;\n]/)
    .map(item => item.trim())
    .filter(Boolean)
}

const parseJsonObject = (value: string, errorText: string): Record<string, unknown> | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      ElMessage.error(errorText)
      return null
    }
    return parsed
  } catch {
    ElMessage.error(errorText)
    return null
  }
}

const parseJsonArray = (value: string, errorText: string): unknown[] | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      ElMessage.error(errorText)
      return null
    }
    return parsed
  } catch {
    ElMessage.error(errorText)
    return null
  }
}

const formatResult = (value: EmailResponse | null): string => {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

const validateReceiver = (_rule: unknown, _value: string, callback: (error?: Error) => void) => {
  if (!sendForm.toEmail && !sendForm.toEmails) {
    callback(new Error('请输入收件人邮箱或邮箱列表'))
    return
  }
  callback()
}

const sendRules: FormRules = {
  provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
  subject: [{ required: true, message: '请输入邮件主题', trigger: 'blur' }],
  toEmail: [{ validator: validateReceiver, trigger: 'blur' }],
  toEmails: [{ validator: validateReceiver, trigger: 'blur' }]
}

const statusRules: FormRules = {
  messageId: [{ required: true, message: '请输入邮件ID', trigger: 'blur' }]
}

const loadProviders = async () => {
  loadingProviders.value = true
  try {
    providerList.value = await getEmailProviders()
  } catch {
    ElMessage.error('加载邮件服务商失败')
  } finally {
    loadingProviders.value = false
  }
}

const handleSend = async () => {
  if (!sendFormRef.value) return
  try {
    await sendFormRef.value.validate()
    const templateParams = parseJsonObject(sendForm.templateParamsJson, '模板参数需要是JSON对象')
    if (templateParams === null) return
    const customHeaders = parseJsonObject(sendForm.customHeadersJson, '自定义头需要是JSON对象')
    if (customHeaders === null) return
    const attachments = parseJsonArray(sendForm.attachmentsJson, '附件需要是JSON数组')
    if (attachments === null) return

    const toEmails = parseList(sendForm.toEmails)
    const ccEmails = parseList(sendForm.ccEmails)
    const bccEmails = parseList(sendForm.bccEmails)
    const payload: EmailSendDTO = {
      keyId: sendForm.keyId ?? undefined,
      provider: sendForm.provider || undefined,
      toEmail: sendForm.toEmail || undefined,
      toEmails: toEmails.length ? toEmails : undefined,
      ccEmails: ccEmails.length ? ccEmails : undefined,
      bccEmails: bccEmails.length ? bccEmails : undefined,
      subject: sendForm.subject || undefined,
      textContent: sendForm.textContent || undefined,
      htmlContent: sendForm.htmlContent || undefined,
      templateId: sendForm.templateId || undefined,
      templateParams: templateParams || undefined,
      fromName: sendForm.fromName || undefined,
      emailType: sendForm.emailType || undefined,
      priority: sendForm.priority ?? undefined,
      needReceipt: sendForm.needReceipt,
      replyTo: sendForm.replyTo || undefined,
      charset: sendForm.charset || undefined,
      customHeaders: customHeaders as Record<string, string> | undefined,
      async: sendForm.async,
      attachments: attachments as EmailSendDTO['attachments']
    }
    sending.value = true
    sendResult.value = await sendEmail(payload)
    ElMessage.success('邮件发送请求已提交')
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
    const payload: EmailStatusQuery = {
      messageId: statusForm.messageId || undefined,
      keyId: statusForm.keyId ?? undefined,
      provider: statusForm.provider || undefined
    }
    queryingStatus.value = true
    statusResult.value = await queryEmailStatus(payload)
    ElMessage.success('邮件状态查询完成')
  } catch {
    return
  } finally {
    queryingStatus.value = false
  }
}

const resetSendForm = () => {
  Object.assign(sendForm, {
    provider: '',
    keyId: undefined,
    toEmail: '',
    toEmails: '',
    ccEmails: '',
    bccEmails: '',
    subject: '',
    textContent: '',
    htmlContent: '',
    templateId: '',
    templateParamsJson: '',
    fromName: '',
    emailType: '',
    priority: undefined,
    needReceipt: false,
    replyTo: '',
    charset: '',
    customHeadersJson: '',
    async: true,
    attachmentsJson: ''
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

onMounted(() => {
  loadProviders()
})
</script>

<template>
  <div class="email-management">
    <div class="page-header">
      <h2>邮件发送管理</h2>
      <p>发送邮件、查询发送状态</p>
    </div>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="发送邮件" name="send">
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
                      :label="`${key.id} - ${key.remark || key.emailAddress}`"
                      :value="key.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="收件人" prop="toEmail">
                  <el-input v-model="sendForm.toEmail" placeholder="请输入收件人邮箱" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="收件人列表" prop="toEmails">
                  <el-input
                    v-model="sendForm.toEmails"
                    placeholder="多个邮箱用逗号或换行分隔"
                    type="textarea"
                    :rows="2"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="抄送">
                  <el-input v-model="sendForm.ccEmails" placeholder="多个邮箱用逗号或换行分隔" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="密送">
                  <el-input v-model="sendForm.bccEmails" placeholder="多个邮箱用逗号或换行分隔" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="邮件主题" prop="subject">
                  <el-input v-model="sendForm.subject" placeholder="请输入邮件主题" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="纯文本内容">
                  <el-input v-model="sendForm.textContent" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="HTML内容">
                  <el-input v-model="sendForm.htmlContent" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="模板ID">
                  <el-input v-model="sendForm.templateId" placeholder="请输入模板ID" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="发件人名称">
                  <el-input v-model="sendForm.fromName" placeholder="发件人展示名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮件类型">
                  <el-input v-model="sendForm.emailType" placeholder="如通知、营销" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="优先级">
                  <el-input-number v-model="sendForm.priority" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="需要回执">
                  <el-switch v-model="sendForm.needReceipt" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="回复地址">
                  <el-input v-model="sendForm.replyTo" placeholder="回复邮箱地址" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="字符集">
                  <el-input v-model="sendForm.charset" placeholder="如 UTF-8" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="异步发送">
                  <el-switch v-model="sendForm.async" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="模板参数">
                  <el-input
                    v-model="sendForm.templateParamsJson"
                    placeholder='请输入JSON格式，如 {"name":"张三"}'
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="自定义头">
                  <el-input
                    v-model="sendForm.customHeadersJson"
                    placeholder='请输入JSON格式，如 {"X-Trace-Id":"xxx"}'
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="附件列表">
                  <el-input
                    v-model="sendForm.attachmentsJson"
                    placeholder='请输入JSON数组格式'
                    type="textarea"
                    :rows="3"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="sending" @click="handleSend">发送邮件</el-button>
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
                      :label="`${key.id} - ${key.remark || key.emailAddress}`"
                      :value="key.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="邮件ID" prop="messageId">
                  <el-input v-model="statusForm.messageId" placeholder="请输入邮件ID" />
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
    </el-tabs>
  </div>
</template>

<style scoped>
.email-management {
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

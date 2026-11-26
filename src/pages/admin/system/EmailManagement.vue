<script setup lang="ts">
import AdminPageHeader from '@/components/common/AdminPageHeader.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getEmailProviders, sendEmail, queryEmailStatus, type EmailProvider, type EmailResponse, type EmailSendDTO, type EmailStatusQuery } from '@/api'

import { Refresh } from '@element-plus/icons-vue'
import '../third/third-management.scss'

const { t } = useI18n()

defineOptions({
  name: 'EmailManagement'
})

const activeTab = ref('send')
const advancedPanels = ref<string[]>([])
const contentTab = ref('text')
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

watch(() => sendForm.provider, () => { sendForm.keyId = undefined })
watch(() => statusForm.provider, () => { statusForm.keyId = undefined })

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
      ElMessage.error(t(errorText))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t(errorText))
    return null
  }
}

const parseJsonArray = (value: string, errorText: string): unknown[] | undefined | null => {
  if (!value) return undefined
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      ElMessage.error(t(errorText))
      return null
    }
    return parsed
  } catch {
    ElMessage.error(t(errorText))
    return null
  }
}

const formatResult = (value: EmailResponse | null): string => {
  if (!value) return ''
  return JSON.stringify(value, null, 2)
}

const validateReceiver = (_rule: unknown, _value: string, callback: (error?: Error) => void) => {
  if (!sendForm.toEmail && !sendForm.toEmails) {
    callback(new Error(t('emailManagement.recipientRequired')))
    return
  }
  callback()
}

const sendRules: FormRules = {
  provider: [{ required: true, message: t('emailManagement.providerRequired'), trigger: 'change' }],
  subject: [{ required: true, message: t('emailManagement.subjectRequired'), trigger: 'blur' }],
  toEmail: [{ validator: validateReceiver, trigger: 'blur' }],
  toEmails: [{ validator: validateReceiver, trigger: 'blur' }]
}

const statusRules: FormRules = {
  messageId: [{ required: true, message: t('emailManagement.messageIdRequired'), trigger: 'blur' }]
}

const loadProviders = async () => {
  loadingProviders.value = true
  try {
    providerList.value = await getEmailProviders()
  } catch {
    ElMessage.error(t('emailManagement.loadProvidersFailed'))
  } finally {
    loadingProviders.value = false
  }
}

const handleSend = async () => {
  if (!sendFormRef.value) return
  try {
    await sendFormRef.value.validate()
    const templateParams = parseJsonObject(sendForm.templateParamsJson, 'emailManagement.templateParamsError')
    if (templateParams === null) return
    const customHeaders = parseJsonObject(sendForm.customHeadersJson, 'emailManagement.customHeadersError')
    if (customHeaders === null) return
    const attachments = parseJsonArray(sendForm.attachmentsJson, 'emailManagement.attachmentsError')
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
    ElMessage.success(t('emailManagement.sendSuccess'))
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
    ElMessage.success(t('emailManagement.querySuccess'))
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
  <main class="third-workbench operation-workbench admin-page">
    <AdminPageHeader :title="t('emailManagement.title')" :description="t('emailManagement.description')">
      <el-button :icon="Refresh" :loading="loadingProviders" @click="loadProviders">{{ t('thirdCommon.refresh') }}</el-button>
    </AdminPageHeader>
    <el-tabs v-model="activeTab" class="operation-tabs">
      <el-tab-pane :label="t('emailManagement.sendEmail')" name="send">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form
            ref="sendFormRef"
            :model="sendForm"
            :rules="sendRules"
            label-position="top"
          >
            <section class="operation-section">
              <div class="operation-section-heading">
                <span>01</span>
                <div>
                  <h2>{{ t('thirdCommon.serviceSection') }}</h2>
                  <p>{{ t('thirdCommon.serviceHint') }}</p>
                </div>
              </div>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12">
                  <el-form-item :label="t('emailManagement.provider')" prop="provider">
                    <el-select v-model="sendForm.provider" :placeholder="t('emailManagement.providerPlaceholder')" filterable>
                      <el-option
                        v-for="provider in providerOptions"
                        :key="provider.providerName"
                        :label="provider.displayName"
                        :value="provider.providerName"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item :label="t('emailManagement.keyId')">
                    <el-select v-model="sendForm.keyId"
                               clearable
                               :disabled="!sendForm.provider"
                               :placeholder="t('emailManagement.keyIdPlaceholder')"
                    >
                      <el-option
                        v-for="key in keyOptions"
                        :key="key.id"
                        :label="`${key.id} - ${key.remark || key.emailAddress}`"
                        :value="key.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </section>
            <section class="operation-section">
              <div class="operation-section-heading">
                <span>02</span>
                <div>
                  <h2>{{ t('thirdCommon.emailContentSection') }}</h2>
                  <p>{{ t('thirdCommon.emailContentHint') }}</p>
                </div>
              </div>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12">
                  <el-form-item :label="t('emailManagement.recipient')" prop="toEmail">
                    <el-input v-model="sendForm.toEmail" :placeholder="t('emailManagement.recipientPlaceholder')" />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item :label="t('emailManagement.recipientList')" prop="toEmails">
                    <el-input
                      v-model="sendForm.toEmails"
                      :placeholder="t('emailManagement.recipientListPlaceholder')"
                      type="textarea"
                      :rows="2"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item :label="t('emailManagement.subject')" prop="subject">
                    <el-input v-model="sendForm.subject" :placeholder="t('emailManagement.subjectPlaceholder')" />
                  </el-form-item>
                </el-col>
              </el-row>
            </section>
            <div class="content-editor">
              <el-tabs v-model="contentTab">
                <el-tab-pane :label="t('thirdCommon.textTab')" name="text">
                  <el-col :span="24">
                    <el-form-item :label="t('emailManagement.textContent')">
                      <el-input v-model="sendForm.textContent"
                                :aria-label="t('emailManagement.textContent')"
                                type="textarea"
                                :autosize="{ minRows: 6, maxRows: 14 }"
                      />
                    </el-form-item>
                  </el-col>
                </el-tab-pane>
                <el-tab-pane :label="t('thirdCommon.htmlTab')" name="html">
                  <el-col :span="24">
                    <el-form-item :label="t('emailManagement.htmlContent')">
                      <el-input v-model="sendForm.htmlContent"
                                :aria-label="t('emailManagement.htmlContent')"
                                type="textarea"
                                :autosize="{ minRows: 6, maxRows: 14 }"
                      />
                    </el-form-item>
                  </el-col>
                </el-tab-pane>
              </el-tabs>
            </div>
            <el-collapse v-model="advancedPanels" class="operation-advanced">
              <el-collapse-item :title="t('thirdCommon.advancedTitle')" name="options">
                <p class="advanced-description">{{ t('thirdCommon.advancedHint') }}</p>
                <el-row :gutter="20">
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.cc')">
                      <el-input v-model="sendForm.ccEmails" :placeholder="t('emailManagement.ccPlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.bcc')">
                      <el-input v-model="sendForm.bccEmails" :placeholder="t('emailManagement.bccPlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.templateId')">
                      <el-input v-model="sendForm.templateId" :placeholder="t('emailManagement.templateIdPlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.fromName')">
                      <el-input v-model="sendForm.fromName" :placeholder="t('emailManagement.fromNamePlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.emailType')">
                      <el-input v-model="sendForm.emailType" :placeholder="t('emailManagement.emailTypePlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.priority')">
                      <el-input-number v-model="sendForm.priority" :min="0" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.needReceipt')">
                      <el-switch v-model="sendForm.needReceipt" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.replyTo')">
                      <el-input v-model="sendForm.replyTo" :placeholder="t('emailManagement.replyToPlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.charset')">
                      <el-input v-model="sendForm.charset" :placeholder="t('emailManagement.charsetPlaceholder')" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="12">
                    <el-form-item :label="t('emailManagement.async')">
                      <el-switch v-model="sendForm.async" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item :label="t('emailManagement.templateParams')">
                      <el-input
                        v-model="sendForm.templateParamsJson"
                        :placeholder="t('emailManagement.templateParamsPlaceholder')"
                        type="textarea"
                        :rows="3"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item :label="t('emailManagement.customHeaders')">
                      <el-input
                        v-model="sendForm.customHeadersJson"
                        :placeholder="t('emailManagement.customHeadersPlaceholder')"
                        type="textarea"
                        :rows="3"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item :label="t('emailManagement.attachments')">
                      <el-input
                        v-model="sendForm.attachmentsJson"
                        :placeholder="t('emailManagement.attachmentsPlaceholder')"
                        type="textarea"
                        :rows="3"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>
            <div class="action-row">
              <span class="action-hint">{{ t('thirdCommon.operationHint') }}</span>
              <el-button type="primary" :loading="sending" @click="handleSend">{{ t('emailManagement.sendEmail') }}</el-button>
              <el-button @click="resetSendForm">{{ t('emailManagement.reset') }}</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="sendResult" class="result-card">
          <div class="result-title">{{ t('emailManagement.sendResult') }}</div>
          <pre class="result-content">{{ formatResult(sendResult) }}</pre>
        </div>
      </el-tab-pane>
      <el-tab-pane :label="t('emailManagement.queryStatus')" name="status">
        <div class="panel-card" v-loading="loadingProviders">
          <el-form ref="statusFormRef"
                   :model="statusForm"
                   :rules="statusRules"
                   label-position="top"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item :label="t('emailManagement.provider')" prop="provider">
                  <el-select v-model="statusForm.provider" :placeholder="t('emailManagement.providerPlaceholder')" filterable>
                    <el-option
                      v-for="provider in providerOptions"
                      :key="provider.providerName"
                      :label="provider.displayName"
                      :value="provider.providerName"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item :label="t('emailManagement.keyId')">
                  <el-select v-model="statusForm.keyId"
                             clearable
                             :disabled="!statusForm.provider"
                             :placeholder="t('emailManagement.keyIdPlaceholder')"
                  >
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
                <el-form-item :label="t('emailManagement.messageId')" prop="messageId">
                  <el-input v-model="statusForm.messageId" :placeholder="t('emailManagement.messageIdPlaceholder')" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="action-row">
              <el-button type="primary" :loading="queryingStatus" @click="handleQueryStatus">{{ t('emailManagement.queryStatus') }}</el-button>
              <el-button @click="resetStatusForm">{{ t('emailManagement.reset') }}</el-button>
            </div>
          </el-form>
        </div>
        <div v-if="statusResult" class="result-card">
          <div class="result-title">{{ t('emailManagement.queryResult') }}</div>
          <pre class="result-content">{{ formatResult(statusResult) }}</pre>
        </div>
      </el-tab-pane>
    </el-tabs>
  </main>
</template>

<template>
  <div class="message-center">
    <div class="page-header">
      <h1 class="page-title">{{ t('message.title') }}</h1>
      <p class="page-description">{{ t('message.description') }}</p>
    </div>

    <div class="message-content">
      <!-- 消息统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon unread">
            <el-icon><Message /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ unreadCount }}</div>
            <div class="stat-label">{{ t('message.unreadMessages') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon read">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ readCount }}</div>
            <div class="stat-label">{{ t('message.readMessages') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">{{ t('message.totalMessages') }}</div>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="message-list-container">
        <div class="list-header">
          <div class="filter-tabs">
            <el-radio-group v-model="activeTab" @change="handleTabChange">
              <el-radio-button value="all">{{ t('message.allMessages') }}</el-radio-button>
              <el-radio-button value="unread">{{ t('message.unread') }}</el-radio-button>
              <el-radio-button value="read">{{ t('message.read') }}</el-radio-button>
            </el-radio-group>
          </div>
          <div class="time-filter">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              :range-separator="t('message.rangeSeparator')"
              :start-placeholder="t('message.startTime')"
              :end-placeholder="t('message.endTime')"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleTimeRangeChange"
              clearable
            />
          </div>
          <div class="list-actions">
            <el-button
              v-if="activeTab === 'unread' && selectedMessages.length > 0"
              type="primary"
              @click="handleBatchRead"
              :loading="batchReading"
            >
              <el-icon><Check /></el-icon>
              {{ t('message.markReadCount', { count: selectedMessages.length }) }}
            </el-button>
            <el-button
              v-if="selectedMessages.length > 0"
              type="danger"
              @click="handleBatchDelete"
              :loading="batchDeleting"
            >
              <el-icon><Delete /></el-icon>
              {{ t('message.batchDelete', { count: selectedMessages.length }) }}
            </el-button>
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
              {{ t('common.refresh') }}
            </el-button>
          </div>
        </div>

        <div class="message-list" v-loading="loading">
          <el-table
            :data="messageList"
            @selection-change="handleSelectionChange"
            stripe
            style="width: 100%"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column :label="t('message.statusLabel')" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'read' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === 'read' ? t('message.read') : t('message.unread') }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.typeLabel')" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getMessageTypeColor(row.type)"
                  size="small"
                >
                  {{ getMessageTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.titleLabel')" min-width="200">
              <template #default="{ row }">
                <div
                  class="message-title"
                  :class="{ 'unread-title': row.status === 'unread' }"
                  @click="handleMessageClick(row)"
                >
                  {{ row.title }}
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.contentLabel')" min-width="300">
              <template #default="{ row }">
                <div class="message-content-preview">
                  {{ row.content }}
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.sendTime')" width="180">
              <template #default="{ row }">
                <div class="message-time">
                  {{ formatDateTime(row.createTime) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="t('message.operationLabel')" width="180">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    v-if="row.status === 'unread'"
                    type="primary"
                    size="small"
                    text
                    @click="handleMarkRead(row)"
                  >
                    <el-icon><Check /></el-icon>
                    {{ t('message.markRead') }}
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="handleDelete(row)"
                  >
                    <el-icon><Delete /></el-icon>
                    {{ t('common.delete') }}
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.size"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 消息详情对话框 -->
    <el-dialog
      v-model="showMessageDialog"
      :title="currentMessage?.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="message-detail" v-if="currentMessage">
        <div class="message-meta">
          <div class="meta-item">
            <span class="meta-label">{{ t('message.detailType') }}</span>
            <el-tag
              :type="getMessageTypeColor(currentMessage.type)"
              size="small"
            >
              {{ getMessageTypeName(currentMessage.type) }}
            </el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">{{ t('message.detailStatus') }}</span>
            <el-tag
              :type="currentMessage.status === 'read' ? 'success' : 'danger'"
              size="small"
            >
              {{ currentMessage.status === 'read' ? t('message.read') : t('message.unread') }}
            </el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">{{ t('message.detailTime') }}</span>
            <span>{{ formatDateTime(currentMessage.createTime) }}</span>
          </div>
        </div>
        <div class="message-body">
          <div class="message-content-full" v-html="renderMarkdown(currentMessage.content)">
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMessageDialog = false">{{ t('common.close') }}</el-button>
          <el-button
            v-if="currentMessage && currentMessage.status === 'unread'"
            type="primary"
            @click="handleMarkReadInDialog"
            :loading="markingRead"
          >
            {{ t('message.markRead') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Message,
  ChatDotRound,
  Bell,
  Check,
  Delete,
  Refresh
} from '@element-plus/icons-vue'
import { marked } from 'marked'
import { useI18n } from 'vue-i18n'
import {
  getMessages,
  markMessageAsRead,
  deleteMessage,
  batchMarkAsRead,
  batchDeleteMessages,
  getMessageStats,
  type MessageItem,
  type MessageType,
  type MessageStats,
  type MessageQueryParams
} from '@/api/message'

// 响应式数据
const loading = ref(false)
const batchReading = ref(false)
const batchDeleting = ref(false)
const markingRead = ref(false)
const activeTab = ref<'all' | 'unread' | 'read'>('all')
const messageList = ref<MessageItem[]>([])
const selectedMessages = ref<MessageItem[]>([])
const showMessageDialog = ref(false)
const currentMessage = ref<MessageItem | null>(null)
const timeRange = ref<[string, string] | null>(null)
const statsData = ref<MessageStats>({ unread: 0, read: 0, total: 0 })

const { t } = useI18n()

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 统计数据
const unreadCount = computed(() => {
  return statsData.value.unread
})

const readCount = computed(() => {
  return statsData.value.read
})

const totalCount = computed(() => {
  return statsData.value.total
})

// 消息类型映射
const getMessageTypeName = (type: MessageType): string => {
  const typeMap: Record<MessageType, string> = {
    system: t('message.typeSystem'),
    notice: t('message.typeNotice'),
    warning: t('message.typeWarning')
  }
  return typeMap[type] || t('message.typeUnknown')
}

const getMessageTypeColor = (type: MessageType): string => {
  const colorMap: Record<MessageType, string> = {
    system: 'primary',
    notice: 'success',
    warning: 'danger'
  }
  return colorMap[type] || ''
}

// 格式化时间
const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 渲染 Markdown
const renderMarkdown = (content: string): string => {
  if (!content) return ''
  try {
    const result = marked.parse(content, {
      breaks: true,
      gfm: true
    })
    return typeof result === 'string' ? result : ''
  } catch (error) {
    console.error('Markdown 解析失败:', error)
    return content
  }
}

// 加载消息统计
const loadMessageStats = async () => {
  try {
    const stats = await getMessageStats()
    statsData.value = stats
  } catch (error) {
    console.error('加载消息统计失败:', error)
    ElMessage.error(t('message.loadStatsFailed'))
  }
}

// 加载消息列表
const loadMessages = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.current,
      pageSize: pagination.size,
      status: activeTab.value === 'all' ? undefined : (activeTab.value === 'read' ? 'read' as const : 'unread' as const),
      startTime: timeRange.value?.[0],
      endTime: timeRange.value?.[1]
    } as MessageQueryParams

    const result = await getMessages(params)
    messageList.value = result.records
    pagination.total = result.total
  } catch (error) {
    console.error('加载消息列表失败:', error)
    ElMessage.error(t('message.loadListFailed'))
  } finally {
    loading.value = false
  }
}

// 标签切换
const handleTabChange = () => {
  pagination.current = 1
  loadMessages()
}

// 时间范围变化
const handleTimeRangeChange = () => {
  pagination.current = 1
  loadMessages()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  loadMessages()
}

const handleCurrentChange = (current: number) => {
  pagination.current = current
  loadMessages()
}

// 选择处理
const handleSelectionChange = (selection: MessageItem[]) => {
  selectedMessages.value = selection
}

// 消息点击
const handleMessageClick = async (message: MessageItem) => {
  currentMessage.value = message
  showMessageDialog.value = true

  // 如果是未读消息，自动标记为已读
  if (message.status === 'unread') {
    await handleMarkRead(message, false)
  }
}

// 标记已读
const handleMarkRead = async (message: MessageItem, showSuccess = true) => {
  try {
    await markMessageAsRead(message.id)
    message.status = 'read'
    if (showSuccess) {
      ElMessage.success(t('message.markedAsRead'))
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error(t('message.markReadFailed'))
  }
}

// 对话框中标记已读
const handleMarkReadInDialog = async () => {
  if (!currentMessage.value) return

  markingRead.value = true
  try {
    await handleMarkRead(currentMessage.value)
    showMessageDialog.value = false
  } finally {
    markingRead.value = false
  }
}

// 删除消息
const handleDelete = async (message: MessageItem) => {
  try {
    await ElMessageBox.confirm(
      t('message.deleteConfirm', { title: message.title }),
      t('message.deleteTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    await deleteMessage(message.id)
    ElMessage.success(t('message.deleteSuccess'))
    loadMessages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除消息失败:', error)
      ElMessage.error(t('message.deleteFailed'))
    }
  }
}

// 批量标记已读
const handleBatchRead = async () => {
  if (selectedMessages.value.length === 0) return

  batchReading.value = true
  try {
    const ids = selectedMessages.value.map(msg => msg.id)
    await batchMarkAsRead(ids)
    ElMessage.success(t('message.batchMarkedRead', { count: ids.length }))
    loadMessages()
  } catch (error) {
    console.error('批量标记已读失败:', error)
    ElMessage.error(t('message.batchMarkReadFailed'))
  } finally {
    batchReading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedMessages.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      t('message.batchDeleteConfirm', { count: selectedMessages.value.length }),
      t('message.batchDeleteTitle'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    batchDeleting.value = true
    const ids = selectedMessages.value.map(msg => msg.id)
    await batchDeleteMessages(ids)
    ElMessage.success(t('message.batchDeleteSuccess', { count: ids.length }))
    loadMessages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error(t('message.batchDeleteFailed'))
    }
  } finally {
    batchDeleting.value = false
  }
}

// 刷新
const handleRefresh = () => {
  loadMessages()
  loadMessageStats()
}

// 初始化
onMounted(() => {
  loadMessageStats()
  loadMessages()
})
</script>

<style scoped lang="scss">
.message-center {
  padding: 20px;
  background: var(--bg-color-page);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  text-align: left;
}

.page-title {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 32px;
  font-weight: 700;
}

.page-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 16px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;

  &.unread {
    background: linear-gradient(135deg, #f56565, #e53e3e);
  }

  &.read {
    background: linear-gradient(135deg, #48bb78, #38a169);
  }

  &.total {
    background: linear-gradient(135deg, #4299e1, #3182ce);
  }
}

.stat-content {
  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.message-list-container {
  background: var(--bg-color);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.list-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-color-overlay);
  flex-wrap: wrap;
  gap: 16px;
}

.filter-tabs {
  .el-radio-group {
    :deep(.el-radio-button__inner) {
      border-radius: 6px;
      margin-right: 8px;
    }
  }
}

.time-filter {
  display: flex;
  align-items: center;
  
  .el-date-editor {
    width: 350px;
  }
}

.list-actions {
  display: flex;
  gap: 12px;
}

.message-list {
  padding: 0;
}

.message-title {
  cursor: pointer;
  color: var(--text-regular);
  transition: color 0.3s;

  &:hover {
    color: #409eff;
  }

  &.unread-title {
    font-weight: 600;
    color: var(--text-primary);
  }
}

.message-content-preview {
  color: var(--text-secondary);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.message-time {
  color: var(--text-secondary);
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  padding: 20px 24px;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--border-light);
  background: var(--bg-color-overlay);
}

.message-detail {
  .message-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-color-overlay);
    border-radius: 8px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .meta-label {
        font-weight: 500;
        color: var(--text-regular);
      }
    }
  }

  .message-body {
    .message-content-full {
      line-height: 1.6;
      color: var(--text-primary);
      word-break: break-word;
      
      // Markdown 样式
      :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
        margin: 16px 0 8px 0;
        font-weight: 600;
      }
      
      :deep(p) {
        margin: 8px 0;
      }
      
      :deep(ul), :deep(ol) {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      :deep(li) {
        margin: 4px 0;
      }
      
      :deep(code) {
        background: var(--bg-color-overlay);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      
      :deep(pre) {
        background: var(--bg-color-overlay);
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;
        
        code {
          background: none;
          padding: 0;
        }
      }
      
      :deep(blockquote) {
        border-left: 4px solid var(--border-light);
        padding-left: 12px;
        margin: 8px 0;
        color: var(--text-regular);
      }
      
      :deep(a) {
        color: #409eff;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      :deep(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 8px 0;
        
        th, td {
          border: 1px solid var(--border-light);
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background: var(--bg-color-overlay);
          font-weight: 600;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .message-center {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .time-filter {
    .el-date-editor {
      width: 100%;
    }
  }

  .list-actions {
    justify-content: center;
  }

  .message-detail .message-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

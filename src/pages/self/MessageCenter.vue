<template>
  <div class="message-center">
    <div class="page-header">
      <h1 class="page-title">消息中心</h1>
      <p class="page-description">管理您的系统消息和通知</p>
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
            <div class="stat-label">未读消息</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon read">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ readCount }}</div>
            <div class="stat-label">已读消息</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总消息数</div>
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="message-list-container">
        <div class="list-header">
          <div class="filter-tabs">
            <el-radio-group v-model="activeTab" @change="handleTabChange">
              <el-radio-button value="all">全部消息</el-radio-button>
              <el-radio-button value="unread">未读消息</el-radio-button>
              <el-radio-button value="read">已读消息</el-radio-button>
            </el-radio-group>
          </div>
          <div class="time-filter">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
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
              标记已读 ({{ selectedMessages.length }})
            </el-button>
            <el-button
              v-if="selectedMessages.length > 0"
              type="danger"
              @click="handleBatchDelete"
              :loading="batchDeleting"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedMessages.length }})
            </el-button>
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
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
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'read' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === 'read' ? '已读' : '未读' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getMessageTypeColor(row.type)"
                  size="small"
                >
                  {{ getMessageTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="标题" min-width="200">
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
            <el-table-column label="内容" min-width="300">
              <template #default="{ row }">
                <div class="message-content-preview">
                  {{ row.content }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="180">
              <template #default="{ row }">
                <div class="message-time">
                  {{ formatDateTime(row.createTime) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
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
                    标记已读
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="handleDelete(row)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
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
            <span class="meta-label">类型：</span>
            <el-tag
              :type="getMessageTypeColor(currentMessage.type)"
              size="small"
            >
              {{ getMessageTypeName(currentMessage.type) }}
            </el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">状态：</span>
            <el-tag
              :type="currentMessage.status === 'read' ? 'success' : 'danger'"
              size="small"
            >
              {{ currentMessage.status === 'read' ? '已读' : '未读' }}
            </el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">发送时间：</span>
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
          <el-button @click="showMessageDialog = false">关闭</el-button>
          <el-button
            v-if="currentMessage && currentMessage.status === 'unread'"
            type="primary"
            @click="handleMarkReadInDialog"
            :loading="markingRead"
          >
            标记已读
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
    system: '系统消息',
    notice: '通知消息',
    warning: '警告消息'
  }
  return typeMap[type] || '未知'
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
    ElMessage.error('加载消息统计失败')
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
    ElMessage.error('加载消息列表失败')
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
      ElMessage.success('已标记为已读')
    }
  } catch (error) {
    console.error('标记已读失败:', error)
    ElMessage.error('标记已读失败')
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
      `确定要删除消息"${message.title}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMessage(message.id)
    ElMessage.success('删除成功')
    loadMessages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除消息失败:', error)
      ElMessage.error('删除失败')
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
    ElMessage.success(`已标记 ${ids.length} 条消息为已读`)
    loadMessages()
  } catch (error) {
    console.error('批量标记已读失败:', error)
    ElMessage.error('批量标记已读失败')
  } finally {
    batchReading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedMessages.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedMessages.value.length} 条消息吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    batchDeleting.value = true
    const ids = selectedMessages.value.map(msg => msg.id)
    await batchDeleteMessages(ids)
    ElMessage.success(`已删除 ${ids.length} 条消息`)
    loadMessages()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
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
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
  text-align: left;
}

.page-title {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 32px;
  font-weight: 700;
}

.page-description {
  margin: 0;
  color: #909399;
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
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
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
    color: #303133;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}

.message-list-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  overflow: hidden;
}

.list-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafbfc;
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
  color: #606266;
  transition: color 0.3s;

  &:hover {
    color: #409eff;
  }

  &.unread-title {
    font-weight: 600;
    color: #303133;
  }
}

.message-content-preview {
  color: #909399;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.message-time {
  color: #909399;
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
  border-top: 1px solid #e4e7ed;
  background: #fafbfc;
}

.message-detail {
  .message-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .meta-label {
        font-weight: 500;
        color: #606266;
      }
    }
  }

  .message-body {
    .message-content-full {
      line-height: 1.6;
      color: #303133;
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
        background: #f5f5f5;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
      }
      
      :deep(pre) {
        background: #f5f5f5;
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
        border-left: 4px solid #ddd;
        padding-left: 12px;
        margin: 8px 0;
        color: #666;
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
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        
        th {
          background: #f5f5f5;
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

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
                  :type="row.isRead ? 'success' : 'warning'"
                  size="small"
                >
                  {{ row.isRead ? '已读' : '未读' }}
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
                  :class="{ 'unread-title': !row.isRead }"
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
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button
                  v-if="!row.isRead"
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
      width="600px"
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
              :type="currentMessage.isRead ? 'success' : 'warning'"
              size="small"
            >
              {{ currentMessage.isRead ? '已读' : '未读' }}
            </el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">发送时间：</span>
            <span>{{ formatDateTime(currentMessage.createTime) }}</span>
          </div>
        </div>
        <div class="message-body">
          <div class="message-content-full">
            {{ currentMessage.content }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMessageDialog = false">关闭</el-button>
          <el-button
            v-if="currentMessage && !currentMessage.isRead"
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
import {
  getMessages,
  markMessageAsRead,
  deleteMessage,
  batchMarkAsRead,
  batchDeleteMessages,
  type MessageItem,
  type MessageType
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

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 统计数据
const unreadCount = computed(() => {
  return messageList.value.filter((msg: MessageItem) => !msg.isRead).length
})

const readCount = computed(() => {
  return messageList.value.filter((msg: MessageItem) => msg.isRead).length
})

const totalCount = computed(() => {
  return messageList.value.length
})

// 消息类型映射
const getMessageTypeName = (type: MessageType): string => {
  const typeMap: Record<MessageType, string> = {
    system: '系统通知',
    security: '安全提醒',
    task: '任务通知',
    announcement: '公告',
    reminder: '提醒'
  }
  return typeMap[type] || '未知'
}

const getMessageTypeColor = (type: MessageType): string => {
  const colorMap: Record<MessageType, string> = {
    system: 'primary',
    security: 'danger',
    task: 'warning',
    announcement: 'success',
    reminder: 'info'
  }
  return colorMap[type] || ''
}

// 格式化时间
const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载消息列表
const loadMessages = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.current,
      pageSize: pagination.size,
      status: activeTab.value === 'all' ? undefined : (activeTab.value === 'read' ? 'read' : 'unread')
    }

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
  if (!message.isRead) {
    await handleMarkRead(message, false)
  }
}

// 标记已读
const handleMarkRead = async (message: MessageItem, showSuccess = true) => {
  try {
    await markMessageAsRead(message.id)
    message.isRead = true
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
}

// 初始化
onMounted(() => {
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
}

.filter-tabs {
  .el-radio-group {
    :deep(.el-radio-button__inner) {
      border-radius: 6px;
      margin-right: 8px;
    }
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
      white-space: pre-wrap;
      word-break: break-word;
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

  .list-actions {
    justify-content: center;
  }

  .message-detail .message-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

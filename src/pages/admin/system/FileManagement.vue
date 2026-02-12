<template>
  <div class="file-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t('fileManagement.title') }}</h2>
      <p>{{ t('fileManagement.description') }}</p>
    </div>

    <!-- 存储桶管理 -->
    <div class="bucket-section">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>{{ t('fileManagement.bucketManagement') }}</span>
            <el-button type="primary" @click="handleAddBucket" v-if="hasPermission('system:bucket:create')">
              <el-icon><Plus /></el-icon>
              {{ t('fileManagement.addBucket') }}
            </el-button>
          </div>
        </template>

        <!-- 搜索表单 -->
        <div class="search-form">
          <el-form :model="bucketSearchForm" inline>
            <el-form-item :label="t('fileManagement.bucketName')">
              <el-input
                v-model="bucketSearchForm.bucketName"
                :placeholder="t('fileManagement.bucketNamePlaceholder')"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item :label="t('fileManagement.provider')">
              <el-select
                v-model="bucketSearchForm.provider"
                :placeholder="t('fileManagement.providerPlaceholder')"
                clearable
                style="width: 150px"
              >
                <el-option :label="t('fileManagement.aliyun')" value="aliyun" />
                <el-option :label="t('fileManagement.huawei')" value="huawei" />
                <el-option :label="t('fileManagement.tencent')" value="tencent" />
                <el-option :label="t('fileManagement.qiniu')" value="qiniu" />
                <el-option label="MinIO" value="minio" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('fileManagement.status')">
              <el-select
                v-model="bucketSearchForm.status"
                :placeholder="t('fileManagement.statusPlaceholder')"
                clearable
                style="width: 120px"
              >
                <el-option :label="t('fileManagement.active')" value="active" />
                <el-option :label="t('fileManagement.inactive')" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadBucketList">
                <el-icon><Search /></el-icon>
                {{ t('fileManagement.search') }}
              </el-button>
              <el-button @click="resetBucketSearch">
                <el-icon><Refresh /></el-icon>
                {{ t('fileManagement.reset') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 存储桶表格 -->
        <el-table
          v-loading="bucketLoading"
          :data="bucketList"
          style="width: 100%"
          @selection-change="handleBucketSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="bucketName" :label="t('fileManagement.bucketName')" min-width="150" />
          <el-table-column prop="provider" :label="t('fileManagement.provider')" width="100">
            <template #default="{ row }">
              <el-tag :type="getProviderTagType(row.provider)">{{ getProviderName(row.provider) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" :label="t('fileManagement.description')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="fileCount" :label="t('fileManagement.fileCount')" width="100" />
          <el-table-column prop="status" :label="t('fileManagement.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? t('fileManagement.active') : t('fileManagement.inactive') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('fileManagement.createTime')" width="180" />
          <el-table-column :label="t('fileManagement.actions')" width="350" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleViewFiles(row)" v-if="hasPermission('system:file:view')">
                <el-icon><Document /></el-icon>
                {{ t('fileManagement.viewFiles') }}
              </el-button>
              <el-button type="success" size="small" @click="handleUploadFile(row)" v-if="hasPermission('system:file:upload')">
                <el-icon><Upload /></el-icon>
                {{ t('fileManagement.uploadFile') }}
              </el-button>
              <el-button type="warning" size="small" @click="handleEditBucket(row)" v-if="hasPermission('system:bucket:edit')">
                <el-icon><Edit /></el-icon>
                {{ t('fileManagement.edit') }}
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteBucket(row)" v-if="hasPermission('system:bucket:delete')">
                <el-icon><Delete /></el-icon>
                {{ t('fileManagement.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations" v-if="selectedBuckets.length > 0">
          <el-button type="danger" @click="handleBatchDeleteBuckets" v-if="hasPermission('system:bucket:delete')">
            <el-icon><Delete /></el-icon>
            {{ t('fileManagement.batchDelete', { count: selectedBuckets.length }) }}
          </el-button>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="bucketPagination.pageNum"
            v-model:page-size="bucketPagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="bucketPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadBucketList"
            @current-change="loadBucketList"
          />
        </div>
      </el-card>
    </div>

    <!-- 存储桶表单对话框 -->
    <el-dialog
      v-model="bucketDialogVisible"
      :title="bucketDialogTitle"
      width="600px"
      @close="resetBucketForm"
    >
      <el-form
        ref="bucketFormRef"
        :model="bucketForm"
        :rules="bucketFormRules"
        label-width="100px"
      >
        <el-form-item :label="t('fileManagement.bucketName')" prop="bucketName">
          <el-input v-model="bucketForm.bucketName" :placeholder="t('fileManagement.bucketNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('fileManagement.provider')" prop="provider">
          <el-select
            v-model="bucketForm.provider"
            :placeholder="t('fileManagement.providerPlaceholder')"
            style="width: 100%"
            @change="handleProviderChange"
          >
            <el-option
              v-for="provider in availableProviders"
              :key="provider.providerName"
              :label="provider.displayName"
              :value="provider.providerName"
              :disabled="!provider.keys || provider.keys.length === 0"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('fileManagement.key')" prop="keyId">
          <el-select
            v-model="bucketForm.keyId"
            :placeholder="t('fileManagement.keyPlaceholder')"
            style="width: 100%"
            :disabled="!bucketForm.provider"
            clearable
          >
            <el-option
              v-for="key in availableKeys"
              :key="key.id"
              :label="key.remark || t('fileManagement.keyLabel', { id: key.id })"
              :value="key.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('fileManagement.description')" prop="description">
          <el-input
            v-model="bucketForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('fileManagement.descriptionPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('fileManagement.status')" prop="status">
          <el-radio-group v-model="bucketForm.status">
            <el-radio value="active">{{ t('fileManagement.active') }}</el-radio>
            <el-radio value="inactive">{{ t('fileManagement.inactive') }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bucketDialogVisible = false">{{ t('fileManagement.cancel') }}</el-button>
          <el-button type="primary" @click="submitBucketForm">{{ t('fileManagement.confirm') }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件列表对话框 -->
    <el-dialog
      v-model="fileDialogVisible"
      :title="t('fileManagement.fileManagement')"
      width="1200px"
      @close="resetFileDialog"
    >
      <div class="file-dialog-content">
        <!-- 文件搜索表单 -->
        <div class="search-form">
          <el-form :model="fileSearchForm" inline>
            <el-form-item :label="t('fileManagement.fileName')">
              <el-input
                v-model="fileSearchForm.fileName"
                :placeholder="t('fileManagement.fileNamePlaceholder')"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item :label="t('fileManagement.originalName')">
              <el-input
                v-model="fileSearchForm.originalName"
                :placeholder="t('fileManagement.originalNamePlaceholder')"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item :label="t('fileManagement.fileType')">
              <el-select
                v-model="fileSearchForm.fileType"
                :placeholder="t('fileManagement.fileTypePlaceholder')"
                clearable
                style="width: 150px"
              >
                <el-option :label="t('fileManagement.image')" value="image" />
                <el-option :label="t('fileManagement.document')" value="document" />
                <el-option :label="t('fileManagement.video')" value="video" />
                <el-option :label="t('fileManagement.audio')" value="audio" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadFileList">
                <el-icon><Search /></el-icon>
                {{ t('fileManagement.search') }}
              </el-button>
              <el-button @click="resetFileSearch">
                <el-icon><Refresh /></el-icon>
                {{ t('fileManagement.reset') }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 文件表格 -->
        <el-table
          v-loading="fileLoading"
          :data="fileList"
          style="width: 100%"
          @selection-change="handleFileSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="originalName" :label="t('fileManagement.originalName')" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon class="file-icon" :style="{ color: getFileIconColor(row.fileType) }">
                  <component :is="getFileIcon(row.originalName, row.fileType)" />
                </el-icon>
                <span class="file-name">{{ row.originalName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" :label="t('fileManagement.fileName')" min-width="200" show-overflow-tooltip />
          <el-table-column prop="fileType" :label="t('fileManagement.fileType')" width="120" />
          <el-table-column prop="fileSizeFormatted" :label="t('fileManagement.fileSize')" width="100" />
          <el-table-column prop="status" :label="t('fileManagement.status')" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? t('fileManagement.normal') : t('fileManagement.deleted') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" :label="t('fileManagement.uploadTime')" width="180" />
          <el-table-column :label="t('fileManagement.actions')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDownloadFile(row)">
                <el-icon><Download /></el-icon>
                {{ t('fileManagement.download') }}
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteFile(row)">
                <el-icon><Delete /></el-icon>
                {{ t('fileManagement.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations" v-if="selectedFiles.length > 0">
          <el-button type="danger" @click="handleBatchDeleteFiles">
            <el-icon><Delete /></el-icon>
            {{ t('fileManagement.batchDelete', { count: selectedFiles.length }) }}
          </el-button>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="filePagination.pageNum"
            v-model:page-size="filePagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filePagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadFileList"
            @current-change="loadFileList"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      :title="t('fileManagement.uploadFile')"
      width="600px"
      @close="resetUploadDialog"
    >
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadFormRules"
        label-width="100px"
      >
        <el-form-item :label="t('fileManagement.bucketName')" prop="bucketName">
          <el-input v-model="uploadForm.bucketName" disabled />
        </el-form-item>
        <el-form-item :label="t('fileManagement.provider')" prop="provider">
          <el-input v-model="uploadForm.provider" disabled />
        </el-form-item>
        <el-form-item :label="t('fileManagement.key')" prop="keyId">
          <el-input :value="getKeyDescription(uploadForm.keyId, uploadForm.provider)" disabled style="width: 100%" :placeholder="t('fileManagement.keyDescription')" />
        </el-form-item>
        <el-form-item :label="t('fileManagement.pathPrefix')" prop="pathPrefix">
          <el-input v-model="uploadForm.pathPrefix" :placeholder="t('fileManagement.pathPrefixPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('fileManagement.selectFile')" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text" v-html="t('fileManagement.uploadText')"></div>
            <template #tip>
              <div class="el-upload__tip">
                {{ t('fileManagement.uploadTip') }}
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">{{ t('fileManagement.cancel') }}</el-button>
          <el-button type="primary" @click="submitUploadForm" :loading="uploadLoading">{{ t('fileManagement.upload') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadInstance, type UploadFile } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  Document,
  Upload,
  Edit,
  Delete,
  Download,
  UploadFilled,
  Picture,
  Grid,
  VideoPlay,
  Memo,
  Reading,
  Box,
  VideoCamera,
  Microphone
} from '@element-plus/icons-vue'
import {
  getBucketList,
  createBucket,
  updateBucket,
  deleteBuckets,
  getFileList,
  uploadFile,
  deleteFiles,
  downloadAndSaveFile,
  getOSSProviders,
  type OssBucket,
  type OssFile,
  type CreateBucketData,
  type UpdateBucketData,
  type BucketQueryParams,
  type FileQueryParams,
  type UploadFileParams,
  type OSSProvider,
  type OSSKey
} from '@/api/oss'
import { hasPermission } from '@/utils/permission'

const { t } = useI18n()

// 存储桶相关状态
const bucketLoading = ref(false)
const bucketList = ref<OssBucket[]>([])
const selectedBuckets = ref<OssBucket[]>([])
const bucketPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// OSS服务商和密钥
const availableProviders = ref<OSSProvider[]>([])
const loadingProviders = ref(false)

// 存储桶搜索表单
const bucketSearchForm = reactive<BucketQueryParams>({
  pageNum: 1,
  pageSize: 10,
  bucketName: '',
  provider: '',
  status: undefined
})

// 存储桶表单对话框
const bucketDialogVisible = ref(false)
const bucketDialogTitle = ref('')
const bucketFormRef = ref<FormInstance>()
const bucketForm = reactive<CreateBucketData & { id?: number }>({
  bucketName: '',
  provider: '',
  keyId: null as number | null,
  description: '',
  status: 'active'
})

const bucketFormRules: FormRules = {
  bucketName: [
    { required: true, message: t('fileManagement.bucketNameRequired'), trigger: 'blur' },
    { min: 3, max: 63, message: t('fileManagement.bucketNameLength'), trigger: 'blur' }
  ],
  provider: [
    { required: true, message: t('fileManagement.providerRequired'), trigger: 'change' }
  ],
  keyId: [
          { required: true, message: t('fileManagement.keyRequired'), trigger: 'change' }
        ],
  status: [
    { required: true, message: t('fileManagement.statusRequired'), trigger: 'change' }
  ]
}

// 文件相关状态
const fileDialogVisible = ref(false)
const fileLoading = ref(false)
const fileList = ref<OssFile[]>([])
const selectedFiles = ref<OssFile[]>([])
const currentBucket = ref<OssBucket | null>(null)
const filePagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 文件搜索表单
const fileSearchForm = reactive<FileQueryParams>({
  pageNum: 1,
  pageSize: 10,
  fileName: '',
  originalName: '',
  fileType: '',
  bucketName: ''
})

// 上传文件对话框
const uploadDialogVisible = ref(false)
const uploadLoading = ref(false)
const uploadFormRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const uploadForm = reactive<Omit<UploadFileParams, 'file'> & { file?: File }>({
  provider: '',
  keyId: 1,
  bucketName: '',
  pathPrefix: ''
})

const uploadFormRules: FormRules = {
  file: [
    { required: true, message: t('fileManagement.fileRequired'), trigger: 'change' }
  ]
}

// 获取服务商标签类型
const getProviderTagType = (provider: string) => {
  const typeMap: Record<string, string> = {
    aliyun: 'primary',
    huawei: 'success',
    tencent: 'info',
    qiniu: 'warning',
    minio: 'danger'
  }
  return typeMap[provider] || 'info'
}

// 获取服务商名称
const getProviderName = (provider: string) => {
  const nameMap: Record<string, string> = {
    aliyun: t('fileManagement.aliyun'),
    huawei: t('fileManagement.huawei'),
    tencent: t('fileManagement.tencent'),
    qiniu: t('fileManagement.qiniu'),
    minio: 'MinIO'
  }
  return nameMap[provider] || provider
}

// 获取文件图标
const getFileIcon = (fileName: string, fileType: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''

  // 根据文件扩展名或类型返回对应图标
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension) || fileType === 'image') {
    return Picture
  }
  if (['doc', 'docx'].includes(extension)) {
    return Document
  }
  if (['xls', 'xlsx'].includes(extension)) {
    return Grid
  }
  if (['ppt', 'pptx'].includes(extension)) {
    return VideoPlay
  }
  if (['txt', 'md'].includes(extension)) {
    return Memo
  }
  if (['pdf'].includes(extension)) {
    return Reading
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return Box
  }
  if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension) || fileType === 'video') {
    return VideoCamera
  }
  if (['mp3', 'wav', 'flac', 'aac'].includes(extension) || fileType === 'audio') {
    return Microphone
  }

  return Document // 默认图标
}

// 获取文件图标颜色
const getFileIconColor = (fileType: string) => {
  const colorMap: Record<string, string> = {
    image: '#67C23A',
    document: '#409EFF',
    video: '#E6A23C',
    audio: '#F56C6C',
    archive: 'var(--text-secondary)'
  }
  return colorMap[fileType] || 'var(--text-regular)'
}

// 可用密钥列表
const availableKeys = computed(() => {
  const provider = availableProviders.value.find(p => p.providerName === bucketForm.provider)
  return provider?.keys?.filter((k: OSSKey) => k.status === 'active') || []
})

// 加载OSS服务商列表
const loadOSSProviders = async () => {
  try {
    loadingProviders.value = true
    const providers = await getOSSProviders()
    availableProviders.value = providers
  } catch (error) {
    console.error('加载OSS服务商列表失败:', error)
    ElMessage.error(t('fileManagement.loadProvidersError'))
  } finally {
    loadingProviders.value = false
  }
}

// 处理服务商变更
const handleProviderChange = () => {
  bucketForm.keyId = null
}

// 获取密钥描述
const getKeyDescription = (keyId: number | null, provider: string) => {
  if (!keyId || !provider) return ''
  const providerData = availableProviders.value.find(p => p.providerName === provider)
  const key = providerData?.keys?.find((k: OSSKey) => k.id === keyId)
  return key?.remark || `密钥${keyId}`
}

// 加载存储桶列表
const loadBucketList = async () => {
  try {
    bucketLoading.value = true
    const params = {
      ...bucketSearchForm,
      pageNum: bucketPagination.pageNum,
      pageSize: bucketPagination.pageSize
    }
    const result = await getBucketList(params)
    bucketList.value = result.records
    bucketPagination.total = result.total
  } catch (error) {
    ElMessage.error(t('fileManagement.loadBucketsError'))
    console.error('获取存储桶列表失败:', error)
  } finally {
    bucketLoading.value = false
  }
}

// 重置存储桶搜索
const resetBucketSearch = () => {
  Object.assign(bucketSearchForm, {
    pageNum: 1,
    pageSize: 10,
    bucketName: '',
    provider: '',
    status: undefined
  })
  bucketPagination.pageNum = 1
  loadBucketList()
}

// 存储桶选择变化
const handleBucketSelectionChange = (selection: OssBucket[]) => {
  selectedBuckets.value = selection
}

// 新增存储桶
const handleAddBucket = async () => {
  bucketDialogTitle.value = t('fileManagement.addBucket')
  await loadOSSProviders()
  resetBucketForm()
  bucketDialogVisible.value = true
}

// 编辑存储桶
const handleEditBucket = async (bucket: OssBucket) => {
  bucketDialogTitle.value = t('fileManagement.editBucket')
  await loadOSSProviders()
  Object.assign(bucketForm, bucket)
  bucketDialogVisible.value = true
}

// 删除存储桶
const handleDeleteBucket = async (bucket: OssBucket) => {
  try {
    await ElMessageBox.confirm(
      t('fileManagement.deleteBucketConfirm', { name: bucket.bucketName }),
      t('fileManagement.confirmDelete'),
      {
        confirmButtonText: t('fileManagement.confirm'),
        cancelButtonText: t('fileManagement.cancel'),
        type: 'warning'
      }
    )
    await deleteBuckets([bucket.id])
    ElMessage.success(t('fileManagement.deleteSuccess'))
    loadBucketList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fileManagement.deleteError'))
      console.error('删除存储桶失败:', error)
    }
  }
}

// 批量删除存储桶
const handleBatchDeleteBuckets = async () => {
  try {
    await ElMessageBox.confirm(
      t('fileManagement.batchDeleteBucketsConfirm', { count: selectedBuckets.value.length }),
      t('fileManagement.confirmBatchDelete'),
      {
        confirmButtonText: t('fileManagement.confirm'),
        cancelButtonText: t('fileManagement.cancel'),
        type: 'warning'
      }
    )
    const ids = selectedBuckets.value.map(bucket => bucket.id)
    await deleteBuckets(ids)
    ElMessage.success(t('fileManagement.batchDeleteSuccess'))
    loadBucketList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fileManagement.batchDeleteError'))
      console.error('批量删除存储桶失败:', error)
    }
  }
}

// 提交存储桶表单
const submitBucketForm = async () => {
  if (!bucketFormRef.value) return

  try {
    await bucketFormRef.value.validate()

    if (!bucketForm.keyId) {
      ElMessage.error(t('fileManagement.keyRequired'))
      return
    }

    if (bucketForm.id) {
      // 更新
      const updateData: UpdateBucketData = {
        id: bucketForm.id,
        bucketName: bucketForm.bucketName,
        provider: bucketForm.provider,
        keyId: bucketForm.keyId,
        description: bucketForm.description,
        status: bucketForm.status
      }
      await updateBucket(updateData)
      ElMessage.success(t('fileManagement.updateSuccess'))
    } else {
      // 创建
      const createData: CreateBucketData = {
        bucketName: bucketForm.bucketName,
        provider: bucketForm.provider,
        keyId: bucketForm.keyId,
        description: bucketForm.description,
        status: bucketForm.status
      }
      await createBucket(createData)
      ElMessage.success(t('fileManagement.createSuccess'))
    }

    bucketDialogVisible.value = false
    loadBucketList()
  } catch (error) {
    ElMessage.error(t('fileManagement.operationError'))
    console.error('存储桶操作失败:', error)
  }
}

// 重置存储桶表单
const resetBucketForm = () => {
  if (bucketFormRef.value) {
    bucketFormRef.value.resetFields()
  }
  Object.assign(bucketForm, {
    id: undefined,
    bucketName: '',
    provider: '',
    keyId: null,
    description: '',
    status: 'active'
  })
}

// 查看文件
const handleViewFiles = (bucket: OssBucket) => {
  currentBucket.value = bucket
  fileSearchForm.bucketName = bucket.bucketName
  fileSearchForm.provider = bucket.provider
  fileDialogVisible.value = true
  loadFileList()
}

// 上传文件
const handleUploadFile = (bucket: OssBucket) => {
  uploadForm.provider = bucket.provider
  uploadForm.keyId = bucket.keyId
  uploadForm.bucketName = bucket.bucketName
  uploadDialogVisible.value = true
}

// 加载文件列表
const loadFileList = async () => {
  if (!currentBucket.value) return

  try {
    fileLoading.value = true
    const params = {
      ...fileSearchForm,
      pageNum: filePagination.pageNum,
      pageSize: filePagination.pageSize,
      bucketName: currentBucket.value.bucketName
    }
    const result = await getFileList(params)
    fileList.value = result.records
    filePagination.total = result.total
  } catch (error) {
    ElMessage.error(t('fileManagement.loadFilesError'))
    console.error('获取文件列表失败:', error)
  } finally {
    fileLoading.value = false
  }
}

// 重置文件搜索
const resetFileSearch = () => {
  Object.assign(fileSearchForm, {
    pageNum: 1,
    pageSize: 10,
    fileName: '',
    originalName: '',
    fileType: '',
    bucketName: currentBucket.value?.bucketName || ''
  })
  filePagination.pageNum = 1
  loadFileList()
}

// 文件选择变化
const handleFileSelectionChange = (selection: OssFile[]) => {
  selectedFiles.value = selection
}

// 下载文件
const handleDownloadFile = async (file: OssFile) => {
  try {
    await downloadAndSaveFile(file.id, file.originalName)
    ElMessage.success(t('fileManagement.downloadSuccess'))
  } catch (error) {
    ElMessage.error(t('fileManagement.downloadError') + ': ' + (error as Error).message)
    console.error('下载文件失败:', error)
  }
}

// 删除文件
const handleDeleteFile = async (file: OssFile) => {
  try {
    await ElMessageBox.confirm(
      t('fileManagement.deleteFileConfirm', { name: file.originalName }),
      t('fileManagement.confirmDelete'),
      {
        confirmButtonText: t('fileManagement.confirm'),
        cancelButtonText: t('fileManagement.cancel'),
        type: 'warning'
      }
    )
    await deleteFiles([file.id])
    ElMessage.success(t('fileManagement.deleteSuccess'))
    loadFileList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fileManagement.deleteError'))
      console.error('删除文件失败:', error)
    }
  }
}

// 批量删除文件
const handleBatchDeleteFiles = async () => {
  try {
    await ElMessageBox.confirm(
      t('fileManagement.batchDeleteFilesConfirm', { count: selectedFiles.value.length }),
      t('fileManagement.confirmBatchDelete'),
      {
        confirmButtonText: t('fileManagement.confirm'),
        cancelButtonText: t('fileManagement.cancel'),
        type: 'warning'
      }
    )
    const ids = selectedFiles.value.map(file => file.id)
    await deleteFiles(ids)
    ElMessage.success(t('fileManagement.batchDeleteSuccess'))
    loadFileList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('fileManagement.batchDeleteError'))
      console.error('批量删除文件失败:', error)
    }
  }
}

// 重置文件对话框
const resetFileDialog = () => {
  currentBucket.value = null
  fileList.value = []
  selectedFiles.value = []
  filePagination.pageNum = 1
  filePagination.total = 0
}

// 文件选择变化
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    uploadForm.file = file.raw
  }
}

// 文件移除
const handleFileRemove = () => {
  uploadForm.file = undefined
}

// 提交上传表单
const submitUploadForm = async () => {
  if (!uploadFormRef.value) return

  try {
    await uploadFormRef.value.validate()

    if (!uploadForm.file) {
      ElMessage.error(t('fileManagement.fileRequired'))
      return
    }

    uploadLoading.value = true
    const uploadParams: UploadFileParams = {
      provider: uploadForm.provider,
      keyId: uploadForm.keyId,
      bucketName: uploadForm.bucketName,
      file: uploadForm.file,
      pathPrefix: uploadForm.pathPrefix
    }

    await uploadFile(uploadParams)
    ElMessage.success(t('fileManagement.uploadSuccess'))
    uploadDialogVisible.value = false

    // 如果文件对话框打开，刷新文件列表
    if (fileDialogVisible.value) {
      loadFileList()
    }

    // 刷新存储桶列表（更新文件数量）
    loadBucketList()
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    ElMessage.error(message || t('fileManagement.uploadError'))
    console.error('上传文件失败:', error)
  } finally {
    uploadLoading.value = false
  }
}

// 重置上传对话框
const resetUploadDialog = () => {
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
  Object.assign(uploadForm, {
    provider: '',
    keyId: 1,
    bucketName: '',
    pathPrefix: ''
  })
  uploadForm.file = undefined
}

// 页面加载时获取数据
onMounted(() => {
  loadBucketList()
})
</script>

<style scoped>
.file-management {
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
  color: var(--text-regular);
  font-size: 14px;
}

.bucket-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: var(--bg-color-overlay);
  border-radius: 6px;
}

.batch-operations {
  margin: 20px 0;
  padding: 10px;
  background-color: rgba(64, 158, 255, 0.12);
  border: 1px solid var(--primary-light);
  border-radius: 6px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.file-dialog-content {
  max-height: 600px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-upload-dragger) {
  width: 100%;
}

:deep(.el-table .cell) {
  word-break: break-all;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

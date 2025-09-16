<template>
  <div class="file-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>文件管理</h2>
      <p>管理OSS存储桶和文件</p>
    </div>

    <!-- 存储桶管理 -->
    <div class="bucket-section">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span>存储桶管理</span>
            <el-button type="primary" @click="handleAddBucket" v-if="hasPermission('system:file:create')">
              <el-icon><Plus /></el-icon>
              新增存储桶
            </el-button>
          </div>
        </template>

        <!-- 搜索表单 -->
        <div class="search-form">
          <el-form :model="bucketSearchForm" inline>
            <el-form-item label="存储桶名称">
              <el-input
                v-model="bucketSearchForm.bucketName"
                placeholder="请输入存储桶名称"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="服务商">
              <el-select
                v-model="bucketSearchForm.provider"
                placeholder="请选择服务商"
                clearable
                style="width: 150px"
              >
                <el-option label="阿里云" value="aliyun" />
                <el-option label="华为云" value="huawei" />
                <el-option label="腾讯云" value="tencent" />
                <el-option label="七牛云" value="qiniu" />
                <el-option label="MinIO" value="minio" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="bucketSearchForm.status"
                placeholder="请选择状态"
                clearable
                style="width: 120px"
              >
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadBucketList">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetBucketSearch">
                <el-icon><Refresh /></el-icon>
                重置
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
          <el-table-column prop="bucketName" label="存储桶名称" min-width="150" />
          <el-table-column prop="provider" label="服务商" width="100">
            <template #default="{ row }">
              <el-tag :type="getProviderTagType(row.provider)">{{ getProviderName(row.provider) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="fileCount" label="文件数量" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleViewFiles(row)" v-if="hasPermission('system:file:view')">
                <el-icon><Document /></el-icon>
                查看文件
              </el-button>
              <el-button type="success" size="small" @click="handleUploadFile(row)" v-if="hasPermission('system:file:upload')">
                <el-icon><Upload /></el-icon>
                上传文件
              </el-button>
              <el-button type="warning" size="small" @click="handleEditBucket(row)" v-if="hasPermission('system:file:edit')">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteBucket(row)" v-if="hasPermission('system:file:delete')">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations" v-if="selectedBuckets.length > 0">
          <el-button type="danger" @click="handleBatchDeleteBuckets" v-if="hasPermission('system:file:delete')">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedBuckets.length }})
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
        <el-form-item label="存储桶名称" prop="bucketName">
          <el-input v-model="bucketForm.bucketName" placeholder="请输入存储桶名称" />
        </el-form-item>
        <el-form-item label="服务商" prop="provider">
          <el-select 
            v-model="bucketForm.provider" 
            placeholder="请选择服务商" 
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
        <el-form-item label="密钥" prop="keyId">
          <el-select 
            v-model="bucketForm.keyId" 
            placeholder="请选择密钥" 
            style="width: 100%"
            :disabled="!bucketForm.provider"
            clearable
          >
            <el-option 
              v-for="key in availableKeys"
              :key="key.id"
              :label="key.remark || `密钥${key.id}`"
              :value="key.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="bucketForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="bucketForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bucketDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBucketForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件列表对话框 -->
    <el-dialog
      v-model="fileDialogVisible"
      title="文件管理"
      width="1200px"
      @close="resetFileDialog"
    >
      <div class="file-dialog-content">
        <!-- 文件搜索表单 -->
        <div class="search-form">
          <el-form :model="fileSearchForm" inline>
            <el-form-item label="文件名">
              <el-input
                v-model="fileSearchForm.fileName"
                placeholder="请输入文件名"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="原始名称">
              <el-input
                v-model="fileSearchForm.originalName"
                placeholder="请输入原始名称"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="文件类型">
              <el-select
                v-model="fileSearchForm.fileType"
                placeholder="请选择文件类型"
                clearable
                style="width: 150px"
              >
                <el-option label="图片" value="image" />
                <el-option label="文档" value="document" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadFileList">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetFileSearch">
                <el-icon><Refresh /></el-icon>
                重置
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
          <el-table-column prop="originalName" label="原始名称" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="file-name-cell">
                <el-icon class="file-icon" :style="{ color: getFileIconColor(row.fileType) }">
                  <component :is="getFileIcon(row.originalName, row.fileType)" />
                </el-icon>
                <span class="file-name">{{ row.originalName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="fileType" label="文件类型" width="120" />
          <el-table-column prop="fileSizeFormatted" label="文件大小" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                {{ row.status === 'active' ? '正常' : '已删除' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="上传时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleDownloadFile(row)">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteFile(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-operations" v-if="selectedFiles.length > 0">
          <el-button type="danger" @click="handleBatchDeleteFiles">
            <el-icon><Delete /></el-icon>
            批量删除 ({{ selectedFiles.length }})
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
      title="上传文件"
      width="600px"
      @close="resetUploadDialog"
    >
      <el-form
        ref="uploadFormRef"
        :model="uploadForm"
        :rules="uploadFormRules"
        label-width="100px"
      >
        <el-form-item label="存储桶" prop="bucketName">
          <el-input v-model="uploadForm.bucketName" disabled />
        </el-form-item>
        <el-form-item label="服务商" prop="provider">
          <el-input v-model="uploadForm.provider" disabled />
        </el-form-item>
        <el-form-item label="密钥" prop="keyId">
          <el-input :value="getKeyDescription(uploadForm.keyId, uploadForm.provider)" disabled style="width: 100%" placeholder="密钥描述" />
        </el-form-item>
        <el-form-item label="路径前缀" prop="pathPrefix">
          <el-input v-model="uploadForm.pathPrefix" placeholder="可选，如：images/" />
        </el-form-item>
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持上传任意格式文件，单个文件大小不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUploadForm" :loading="uploadLoading">上传</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
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
    { required: true, message: '请输入存储桶名称', trigger: 'blur' },
    { min: 3, max: 63, message: '存储桶名称长度在 3 到 63 个字符', trigger: 'blur' }
  ],
  provider: [
    { required: true, message: '请选择服务商', trigger: 'change' }
  ],
  keyId: [
          { required: true, message: '请选择密钥', trigger: 'change' }
        ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
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
    { required: true, message: '请选择要上传的文件', trigger: 'change' }
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
    aliyun: '阿里云',
    huawei: '华为云',
    tencent: '腾讯云',
    qiniu: '七牛云',
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
    archive: '#909399'
  }
  return colorMap[fileType] || '#606266'
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
    ElMessage.error('加载OSS服务商列表失败')
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
    ElMessage.error('获取存储桶列表失败')
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
  bucketDialogTitle.value = '新增存储桶'
  await loadOSSProviders()
  resetBucketForm()
  bucketDialogVisible.value = true
}

// 编辑存储桶
const handleEditBucket = async (bucket: OssBucket) => {
  bucketDialogTitle.value = '编辑存储桶'
  await loadOSSProviders()
  Object.assign(bucketForm, bucket)
  bucketDialogVisible.value = true
}

// 删除存储桶
const handleDeleteBucket = async (bucket: OssBucket) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除存储桶 "${bucket.bucketName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteBuckets([bucket.id])
    ElMessage.success('删除成功')
    loadBucketList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除存储桶失败:', error)
    }
  }
}

// 批量删除存储桶
const handleBatchDeleteBuckets = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBuckets.value.length} 个存储桶吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const ids = selectedBuckets.value.map(bucket => bucket.id)
    await deleteBuckets(ids)
    ElMessage.success('批量删除成功')
    loadBucketList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
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
      ElMessage.error('请选择密钥')
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
      ElMessage.success('更新成功')
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
      ElMessage.success('创建成功')
    }

    bucketDialogVisible.value = false
    loadBucketList()
  } catch (error) {
    ElMessage.error('操作失败')
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
    ElMessage.error('获取文件列表失败')
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
    ElMessage.success('下载成功')
  } catch (error) {
    ElMessage.error('下载文件失败: ' + (error as Error).message)
    console.error('下载文件失败:', error)
  }
}

// 删除文件
const handleDeleteFile = async (file: OssFile) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.originalName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteFiles([file.id])
    ElMessage.success('删除成功')
    loadFileList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除文件失败:', error)
    }
  }
}

// 批量删除文件
const handleBatchDeleteFiles = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.length} 个文件吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const ids = selectedFiles.value.map(file => file.id)
    await deleteFiles(ids)
    ElMessage.success('批量删除成功')
    loadFileList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
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
      ElMessage.error('请选择要上传的文件')
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
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false

    // 如果文件对话框打开，刷新文件列表
    if (fileDialogVisible.value) {
      loadFileList()
    }

    // 刷新存储桶列表（更新文件数量）
    loadBucketList()
  } catch (error) {
    ElMessage.error('上传失败')
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
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #606266;
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
  background-color: #f8f9fa;
  border-radius: 6px;
}

.batch-operations {
  margin: 20px 0;
  padding: 10px;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
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

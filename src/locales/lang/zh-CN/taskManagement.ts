export default {
  pageTitle: '定时任务管理',
  pageDescription: '管理系统定时任务',

  // 操作按钮
  actions: {
    addTask: '新增任务',
    batchDelete: '批量删除',
    search: '搜索',
    reset: '重置',
    start: '启动',
    stop: '停止',
    edit: '编辑',
    delete: '删除',
    cancel: '取消',
    create: '创建',
    update: '更新',
  },

  // 搜索表单
  search: {
    taskName: '任务名称',
    enterTaskName: '请输入任务名称',
    taskStatus: '任务状态',
    selectTaskStatus: '请选择任务状态',
  },

  // 任务状态
  status: {
    active: '运行中',
    inactive: '已停止',
  },

  // 表格列
  table: {
    taskName: '任务名称',
    taskClass: '任务类',
    cronExpression: 'Cron表达式',
    status: '状态',
    remark: '备注',
    operation: '操作',
  },

  // 对话框
  dialog: {
    addTitle: '新增任务',
    editTitle: '编辑任务',
    taskName: '任务名称',
    enterTaskName: '请输入任务名称',
    taskClassPath: '任务类路径',
    enterTaskClassPath: '请输入任务类完整路径',
    cronExpression: 'Cron表达式',
    enterCronExpression: '请输入Cron表达式，如：0 0 12 * * ?',
    cronHelp: '格式：秒 分 时 日 月 周 [年]，例如：0 0 12 * * ? 表示每天12点执行',
    taskDescription: '任务描述',
    enterTaskDescription: '请输入任务描述',
  },

  // 确认对话框
  confirm: {
    deleteTitle: '确认删除',
    deleteMessage: '确定要删除任务 "{name}" 吗？',
    batchDeleteTitle: '批量删除确认',
    batchDeleteMessage: '确定要删除选中的 {count} 个任务吗？',
    confirmButton: '确定',
    cancelButton: '取消',
  },

  // 表单验证
  validation: {
    nameRequired: '请输入任务名称',
    nameLength: '任务名称长度在 2 到 50 个字符',
    classPathRequired: '请输入任务类路径',
    classPathPattern: '请输入有效的Java类路径',
    cronRequired: '请输入Cron表达式',
    cronPattern: '请输入有效的Cron表达式',
  },

  // 消息提示
  messages: {
    loadFailed: '获取任务列表失败',
    startSuccess: '任务启动成功',
    startFailed: '启动任务失败',
    stopSuccess: '任务停止成功',
    stopFailed: '停止任务失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    createSuccess: '创建成功',
    updateSuccess: '更新成功',
    submitFailed: '提交失败',
    batchDeleteSuccess: '成功删除 {count} 个任务',
    batchDeleteFailed: '批量删除任务失败',
  },
}

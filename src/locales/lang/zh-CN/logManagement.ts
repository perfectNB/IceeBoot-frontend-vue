export default {
  pageTitle: '日志管理',
  pageDescription: '查看和管理系统日志',

  // 操作按钮
  actions: {
    batchDelete: '批量删除',
    search: '搜索',
    reset: '重置',
    view: '查看',
    delete: '删除',
    close: '关闭',
  },

  // 搜索表单
  search: {
    logLevel: '日志级别',
    selectLogLevel: '请选择日志级别',
    module: '模块',
    enterModule: '请输入模块名称',
    keyword: '关键词',
    enterKeyword: '请输入关键词',
    timeRange: '时间范围',
    to: '至',
    startTime: '开始时间',
    endTime: '结束时间',
  },

  // 表格列
  table: {
    level: '级别',
    time: '时间',
    module: '模块',
    logContent: '日志内容',
    thread: '线程',
    className: '类名',
    operation: '操作',
  },

  // 对话框
  dialog: {
    title: '日志详情',
    logLevel: '日志级别',
    time: '时间',
    module: '模块',
    thread: '线程',
    className: '类名',
    logContent: '日志内容：',
    stackTrace: '堆栈信息：',
  },

  // 确认对话框
  confirm: {
    deleteTitle: '确认删除',
    deleteMessage: '确定要删除这条日志吗？',
    batchDeleteTitle: '批量删除确认',
    batchDeleteMessage: '确定要删除选中的 {count} 条日志吗？',
    confirmButton: '确定',
    cancelButton: '取消',
  },

  // 消息提示
  messages: {
    loadFailed: '获取日志数据失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    batchDeleteSuccess: '成功删除 {count} 条日志',
    batchDeleteFailed: '批量删除日志失败',
  },
}

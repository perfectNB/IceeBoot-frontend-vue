export default {
  title: '支付配置管理',
  description: '管理系统支付套餐配置',
  create: '新建配置',
  batchDelete: '批量删除',

  search: {
    configName: '配置名称',
    configNamePlaceholder: '请输入配置名称',
    status: '状态',
    statusPlaceholder: '请选择状态',
    search: '搜索',
    reset: '重置'
  },

  status: {
    enable: '启用',
    disable: '禁用'
  },

  table: {
    id: 'ID',
    configName: '配置名称',
    payCode: '支付策略编码',
    amount: '金额',
    status: '状态',
    description: '描述',
    createBy: '创建者',
    createTime: '创建时间',
    operation: '操作'
  },

  form: {
    configName: '配置名称',
    configNamePlaceholder: '请输入配置名称',
    configNameRequired: '请输入配置名称',
    configNameLength: '配置名称长度在 2 到 50 个字符',
    payCode: '支付策略编码',
    payCodePlaceholder: '请输入支付策略编码',
    payCodeRequired: '请输入支付策略编码',
    payCodeLength: '支付策略编码长度在 2 到 50 个字符',
    amount: '金额(元)',
    amountPlaceholder: '请输入金额',
    amountRequired: '请输入金额',
    amountFormat: '请输入正确的金额格式',
    description: '描述',
    descriptionPlaceholder: '请输入配置描述',
    descriptionRequired: '请输入描述',
    sort: '排序',
    sortRequired: '请输入排序',
    status: '状态',
    statusPlaceholder: '请选择状态',
    statusRequired: '请选择状态'
  },

  createTitle: '新建配置',
  editTitle: '编辑配置',
  edit: '编辑',
  goPay: '去支付',
  delete: '删除',
  cancel: '取消',
  confirm: '确定',

  deleteConfirm: '确定要删除配置 "{name}" 吗？',
  deleteTitle: '删除确认',
  batchDeleteConfirm: '确定要删除选中的 {count} 个配置吗？',
  batchDeleteTitle: '批量删除确认',

  statusChangeConfirm: '确定要{status}配置 "{name}" 吗？',
  statusChangeTitle: '状态变更确认',

  deleteSuccess: '配置删除成功',
  deleteFailed: '删除配置失败',
  batchDeleteSuccess: '成功删除 {count} 个配置',
  batchDeleteFailed: '批量删除配置失败',
  statusUpdated: '配置状态已{status}',
  statusUpdateFailed: '状态更新失败',
  createSuccess: '配置创建成功',
  updateSuccess: '配置更新成功',
  loadFailed: '加载配置数据失败',
  generatingPayLink: '正在生成支付链接...',
  payPageOpened: '支付页面已打开，请在新窗口中完成支付',
  getPayLinkFailed: '获取支付链接失败',

  enable: '启用',
  disable: '禁用'
}

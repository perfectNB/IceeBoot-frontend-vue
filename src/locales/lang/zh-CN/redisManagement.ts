export default {
  pageTitle: 'Redis管理',
  pageDescription: '管理Redis缓存数据',

  // 操作按钮
  actions: {
    addCache: '添加缓存',
    batchDelete: '批量删除',
    search: '搜索',
    reset: '重置',
    view: '查看',
    delete: '删除',
    close: '关闭',
    cancel: '取消',
    confirm: '确定',
    addField: '添加字段',
    addItem: '添加项',
    addMember: '添加成员',
  },

  // 搜索表单
  search: {
    keyName: '键名',
    enterKeyName: '请输入Redis键名',
    dataType: '数据类型',
    selectDataType: '请选择数据类型',
  },

  // 数据类型
  dataTypes: {
    string: '字符串',
    hash: '哈希',
    list: '列表',
    set: '集合',
    zset: '有序集合',
  },

  // 表格列
  table: {
    keyName: '键名',
    dataType: '数据类型',
    value: '值',
    ttl: '过期时间(秒)',
    neverExpire: '永不过期',
    expired: '已过期',
    size: '大小',
    operation: '操作',
  },

  // 查看详情对话框
  viewDialog: {
    title: 'Redis数据详情',
    keyName: '键名',
    dataType: '数据类型',
    ttl: '过期时间',
    ttlSeconds: '{ttl}秒',
    size: '大小',
    dataContent: '数据内容：',
  },

  // 新增对话框
  createDialog: {
    title: '添加Redis缓存',
    keyName: '键名',
    enterKeyName: '请输入Redis键名',
    dataType: '数据类型',
    selectDataType: '请选择数据类型',
    ttl: '过期时间',
    ttlPlaceholder: '-1表示永不过期',
    ttlTip: '单位：秒，-1表示永不过期',
    dataContent: '数据内容',
    enterStringContent: '请输入字符串内容',
    fieldName: '字段名',
    fieldValue: '字段值',
    listItemValue: '列表项值',
    setMemberValue: '集合成员值',
    score: '分数',
    memberValue: '成员值',
  },

  // 确认对话框
  confirm: {
    deleteTitle: '确认删除',
    deleteMessage: '确定要删除Redis键 "{key}" 吗？',
    batchDeleteTitle: '批量删除确认',
    batchDeleteMessage: '确定要删除选中的 {count} 个Redis键吗？',
    confirmButton: '确定',
    cancelButton: '取消',
  },

  // 表单验证
  validation: {
    keyRequired: '请输入Redis键名',
    typeRequired: '请选择数据类型',
    contentRequired: '请输入数据内容',
    enterStringContent: '请输入字符串内容',
    addHashField: '请至少添加一个有效的哈希字段',
    addListItem: '请至少添加一个有效的列表项',
    addSetMember: '请至少添加一个有效的集合成员',
    addZsetMember: '请至少添加一个有效的有序集合成员',
    enterValidContent: '请输入有效的数据内容',
  },

  // 消息提示
  messages: {
    loadFailed: '获取Redis数据失败',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    batchDeleteSuccess: '成功删除 {count} 个Redis键',
    batchDeleteFailed: '批量删除Redis键失败',
    createSuccess: '添加Redis缓存成功',
    createFailed: '添加Redis缓存失败',
  },
}

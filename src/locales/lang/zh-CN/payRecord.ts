export default {
  title: '支付记录管理',
  description: '查看和管理系统支付记录',
  batchDelete: '批量删除',
  export: '导出',

  search: {
    orderNo: '订单号',
    orderNoPlaceholder: '请输入订单号',
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    payType: '支付方式',
    payTypePlaceholder: '请选择支付方式',
    payStatus: '支付状态',
    payStatusPlaceholder: '请选择状态',
    dateRange: '时间范围',
    rangeSeparator: '至',
    startDate: '开始日期',
    endDate: '结束日期',
    search: '搜索',
    reset: '重置'
  },

  payType: {
    wechat: '微信支付',
    alipay: '支付宝',
    bank: '网银支付'
  },

  payStatus: {
    paying: '支付中',
    success: '支付成功',
    failed: '支付失败',
    refunded: '已退款'
  },

  table: {
    id: 'ID',
    outTradeNo: '商户订单号',
    tradeNo: '第三方订单号',
    orderName: '订单名称',
    username: '用户名',
    payAmount: '支付金额',
    payType: '支付方式',
    payStatus: '支付状态',
    configName: '套餐名称',
    remark: '备注',
    createTime: '创建时间',
    operation: '操作'
  },

  detail: {
    id: '记录ID',
    outTradeNo: '商户订单号',
    tradeNo: '第三方订单号',
    orderName: '订单名称',
    username: '用户名',
    userId: '用户ID',
    payAmount: '支付金额',
    payType: '支付方式',
    payStatus: '支付状态',
    configName: '套餐名称',
    remark: '备注',
    createTime: '创建时间',
    updateTime: '更新时间',
    none: '暂无',
    noRemark: '无'
  },

  detailTitle: '支付记录详情',
  detailButton: '详情',
  delete: '删除',
  close: '关闭',

  deleteConfirm: '确定要删除订单号为 "{orderNo}" 的记录吗？',
  deleteTitle: '删除确认',
  confirm: '确定',
  cancel: '取消',

  batchDeleteConfirm: '确定要删除选中的 {count} 条记录吗？',
  batchDeleteTitle: '批量删除确认',

  deleteSuccess: '支付记录删除成功',
  deleteFailed: '删除支付记录失败',
  batchDeleteSuccess: '成功删除 {count} 条记录',
  batchDeleteFailed: '批量删除支付记录失败',
  exportInProgress: '导出功能开发中...',
  detailFailed: '获取支付记录详情失败',
  loadFailed: '加载支付记录失败'
}

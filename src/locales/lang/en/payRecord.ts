export default {
  title: 'Payment Records',
  description: 'View and manage system payment records',
  batchDelete: 'Batch Delete',
  export: 'Export',

  search: {
    orderNo: 'Order No.',
    orderNoPlaceholder: 'Enter order number',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    payType: 'Payment Type',
    payTypePlaceholder: 'Select payment type',
    payStatus: 'Payment Status',
    payStatusPlaceholder: 'Select status',
    dateRange: 'Date Range',
    rangeSeparator: 'to',
    startDate: 'Start Date',
    endDate: 'End Date',
    search: 'Search',
    reset: 'Reset'
  },

  payType: {
    wechat: 'WeChat Pay',
    alipay: 'Alipay',
    bank: 'Bank Transfer'
  },

  payStatus: {
    paying: 'Paying',
    success: 'Success',
    failed: 'Failed',
    refunded: 'Refunded'
  },

  table: {
    id: 'ID',
    outTradeNo: 'Merchant Order No.',
    tradeNo: 'Third-party Order No.',
    orderName: 'Order Name',
    username: 'Username',
    payAmount: 'Amount',
    payType: 'Payment Type',
    payStatus: 'Status',
    configName: 'Package Name',
    remark: 'Remark',
    createTime: 'Create Time',
    operation: 'Operation'
  },

  detail: {
    id: 'Record ID',
    outTradeNo: 'Merchant Order No.',
    tradeNo: 'Third-party Order No.',
    orderName: 'Order Name',
    username: 'Username',
    userId: 'User ID',
    payAmount: 'Amount',
    payType: 'Payment Type',
    payStatus: 'Status',
    configName: 'Package Name',
    remark: 'Remark',
    createTime: 'Create Time',
    updateTime: 'Update Time',
    none: 'None',
    noRemark: 'No remark'
  },

  detailTitle: 'Payment Record Details',
  detailButton: 'Details',
  delete: 'Delete',
  close: 'Close',

  deleteConfirm: 'Are you sure you want to delete the record with order number "{orderNo}"?',
  deleteTitle: 'Confirm Delete',
  confirm: 'Confirm',
  cancel: 'Cancel',

  batchDeleteConfirm: 'Are you sure you want to delete {count} selected records?',
  batchDeleteTitle: 'Confirm Batch Delete',

  deleteSuccess: 'Payment record deleted successfully',
  deleteFailed: 'Failed to delete payment record',
  batchDeleteSuccess: 'Successfully deleted {count} records',
  batchDeleteFailed: 'Failed to batch delete payment records',
  exportInProgress: 'Export feature is under development...',
  detailFailed: 'Failed to get payment record details',
  loadFailed: 'Failed to load payment records'
}

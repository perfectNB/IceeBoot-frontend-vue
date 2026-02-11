export default {
  title: 'Payment Configuration',
  description: 'Manage system payment package configuration',
  create: 'Create Configuration',
  batchDelete: 'Batch Delete',

  search: {
    configName: 'Configuration Name',
    configNamePlaceholder: 'Enter configuration name',
    status: 'Status',
    statusPlaceholder: 'Select status',
    search: 'Search',
    reset: 'Reset'
  },

  status: {
    enable: 'Enable',
    disable: 'Disable'
  },

  table: {
    id: 'ID',
    configName: 'Configuration Name',
    payCode: 'Payment Code',
    amount: 'Amount',
    status: 'Status',
    description: 'Description',
    createBy: 'Created By',
    createTime: 'Create Time',
    operation: 'Operation'
  },

  form: {
    configName: 'Configuration Name',
    configNamePlaceholder: 'Enter configuration name',
    configNameRequired: 'Please enter configuration name',
    configNameLength: 'Configuration name length should be between 2 and 50 characters',
    payCode: 'Payment Code',
    payCodePlaceholder: 'Enter payment code',
    payCodeRequired: 'Please enter payment code',
    payCodeLength: 'Payment code length should be between 2 and 50 characters',
    amount: 'Amount (¥)',
    amountPlaceholder: 'Enter amount',
    amountRequired: 'Please enter amount',
    amountFormat: 'Please enter a valid amount format',
    description: 'Description',
    descriptionPlaceholder: 'Enter configuration description',
    descriptionRequired: 'Please enter description',
    sort: 'Sort Order',
    sortRequired: 'Please enter sort order',
    status: 'Status',
    statusPlaceholder: 'Select status',
    statusRequired: 'Please select status'
  },

  createTitle: 'Create Configuration',
  editTitle: 'Edit Configuration',
  edit: 'Edit',
  goPay: 'Go to Pay',
  delete: 'Delete',
  cancel: 'Cancel',
  confirm: 'Confirm',

  deleteConfirm: 'Are you sure you want to delete configuration "{name}"?',
  deleteTitle: 'Confirm Delete',
  batchDeleteConfirm: 'Are you sure you want to delete {count} selected configurations?',
  batchDeleteTitle: 'Confirm Batch Delete',

  statusChangeConfirm: 'Are you sure you want to {status} configuration "{name}"?',
  statusChangeTitle: 'Confirm Status Change',

  deleteSuccess: 'Configuration deleted successfully',
  deleteFailed: 'Failed to delete configuration',
  batchDeleteSuccess: 'Successfully deleted {count} configurations',
  batchDeleteFailed: 'Failed to batch delete configurations',
  statusUpdated: 'Configuration status {status}',
  statusUpdateFailed: 'Failed to update status',
  createSuccess: 'Configuration created successfully',
  updateSuccess: 'Configuration updated successfully',
  loadFailed: 'Failed to load configuration data',
  generatingPayLink: 'Generating payment link...',
  payPageOpened: 'Payment page opened, please complete payment in the new window',
  getPayLinkFailed: 'Failed to get payment link',

  enable: 'enabled',
  disable: 'disabled'
}

export default {
  pageTitle: 'Redis Management',
  pageDescription: 'Manage Redis cache data',

  // Action buttons
  actions: {
    addCache: 'Add Cache',
    batchDelete: 'Batch Delete',
    search: 'Search',
    reset: 'Reset',
    view: 'View',
    delete: 'Delete',
    close: 'Close',
    cancel: 'Cancel',
    confirm: 'Confirm',
    addField: 'Add Field',
    addItem: 'Add Item',
    addMember: 'Add Member',
  },

  // Search form
  search: {
    keyName: 'Key Name',
    enterKeyName: 'Please enter Redis key name',
    dataType: 'Data Type',
    selectDataType: 'Please select data type',
  },

  // Data types
  dataTypes: {
    string: 'String',
    hash: 'Hash',
    list: 'List',
    set: 'Set',
    zset: 'Sorted Set',
  },

  // Table columns
  table: {
    keyName: 'Key Name',
    dataType: 'Data Type',
    value: 'Value',
    ttl: 'TTL (seconds)',
    neverExpire: 'Never Expire',
    expired: 'Expired',
    size: 'Size',
    operation: 'Operation',
  },

  // View dialog
  viewDialog: {
    title: 'Redis Data Details',
    keyName: 'Key Name',
    dataType: 'Data Type',
    ttl: 'TTL',
    ttlSeconds: '{ttl} seconds',
    size: 'Size',
    dataContent: 'Data Content:',
  },

  // Create dialog
  createDialog: {
    title: 'Add Redis Cache',
    keyName: 'Key Name',
    enterKeyName: 'Please enter Redis key name',
    dataType: 'Data Type',
    selectDataType: 'Please select data type',
    ttl: 'TTL',
    ttlPlaceholder: '-1 means never expire',
    ttlTip: 'Unit: seconds, -1 means never expire',
    dataContent: 'Data Content',
    enterStringContent: 'Please enter string content',
    fieldName: 'Field Name',
    fieldValue: 'Field Value',
    listItemValue: 'List Item Value',
    setMemberValue: 'Set Member Value',
    score: 'Score',
    memberValue: 'Member Value',
  },

  // Confirm dialog
  confirm: {
    deleteTitle: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete Redis key "{key}"?',
    batchDeleteTitle: 'Batch Delete Confirmation',
    batchDeleteMessage: 'Are you sure you want to delete the selected {count} Redis keys?',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },

  // Form validation
  validation: {
    keyRequired: 'Please enter Redis key name',
    typeRequired: 'Please select data type',
    contentRequired: 'Please enter data content',
    enterStringContent: 'Please enter string content',
    addHashField: 'Please add at least one valid hash field',
    addListItem: 'Please add at least one valid list item',
    addSetMember: 'Please add at least one valid set member',
    addZsetMember: 'Please add at least one valid sorted set member',
    enterValidContent: 'Please enter valid data content',
  },

  // Messages
  messages: {
    loadFailed: 'Failed to load Redis data',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    batchDeleteSuccess: 'Successfully deleted {count} Redis keys',
    batchDeleteFailed: 'Failed to batch delete Redis keys',
    createSuccess: 'Redis cache added successfully',
    createFailed: 'Failed to add Redis cache',
  },
}

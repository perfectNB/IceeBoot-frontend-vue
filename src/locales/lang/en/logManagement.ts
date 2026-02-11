export default {
  pageTitle: 'Log Management',
  pageDescription: 'View and manage system logs',

  // Action buttons
  actions: {
    batchDelete: 'Batch Delete',
    search: 'Search',
    reset: 'Reset',
    view: 'View',
    delete: 'Delete',
    close: 'Close',
  },

  // Search form
  search: {
    logLevel: 'Log Level',
    selectLogLevel: 'Please select log level',
    module: 'Module',
    enterModule: 'Please enter module name',
    keyword: 'Keyword',
    enterKeyword: 'Please enter keyword',
    timeRange: 'Time Range',
    to: 'To',
    startTime: 'Start Time',
    endTime: 'End Time',
  },

  // Table columns
  table: {
    level: 'Level',
    time: 'Time',
    module: 'Module',
    logContent: 'Log Content',
    thread: 'Thread',
    className: 'Class Name',
    operation: 'Operation',
  },

  // Dialog
  dialog: {
    title: 'Log Details',
    logLevel: 'Log Level',
    time: 'Time',
    module: 'Module',
    thread: 'Thread',
    className: 'Class Name',
    logContent: 'Log Content:',
    stackTrace: 'Stack Trace:',
  },

  // Confirm dialog
  confirm: {
    deleteTitle: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this log?',
    batchDeleteTitle: 'Batch Delete Confirmation',
    batchDeleteMessage: 'Are you sure you want to delete the selected {count} logs?',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },

  // Messages
  messages: {
    loadFailed: 'Failed to load log data',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    batchDeleteSuccess: 'Successfully deleted {count} logs',
    batchDeleteFailed: 'Failed to batch delete logs',
  },
}

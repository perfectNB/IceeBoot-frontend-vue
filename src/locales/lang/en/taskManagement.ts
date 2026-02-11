export default {
  pageTitle: 'Task Management',
  pageDescription: 'Manage system scheduled tasks',

  // Action buttons
  actions: {
    addTask: 'Add Task',
    batchDelete: 'Batch Delete',
    search: 'Search',
    reset: 'Reset',
    start: 'Start',
    stop: 'Stop',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
  },

  // Search form
  search: {
    taskName: 'Task Name',
    enterTaskName: 'Please enter task name',
    taskStatus: 'Task Status',
    selectTaskStatus: 'Please select task status',
  },

  // Task status
  status: {
    active: 'Running',
    inactive: 'Stopped',
  },

  // Table columns
  table: {
    taskName: 'Task Name',
    taskClass: 'Task Class',
    cronExpression: 'Cron Expression',
    status: 'Status',
    remark: 'Remark',
    operation: 'Operation',
  },

  // Dialog
  dialog: {
    addTitle: 'Add Task',
    editTitle: 'Edit Task',
    taskName: 'Task Name',
    enterTaskName: 'Please enter task name',
    taskClassPath: 'Task Class Path',
    enterTaskClassPath: 'Please enter full task class path',
    cronExpression: 'Cron Expression',
    enterCronExpression: 'Please enter Cron expression, e.g.: 0 0 12 * * ?',
    cronHelp: 'Format: second minute hour day month week [year], e.g.: 0 0 12 * * ? means execute at 12:00 every day',
    taskDescription: 'Task Description',
    enterTaskDescription: 'Please enter task description',
  },

  // Confirm dialog
  confirm: {
    deleteTitle: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete task "{name}"?',
    batchDeleteTitle: 'Batch Delete Confirmation',
    batchDeleteMessage: 'Are you sure you want to delete the selected {count} tasks?',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },

  // Form validation
  validation: {
    nameRequired: 'Please enter task name',
    nameLength: 'Task name length should be between 2 and 50 characters',
    classPathRequired: 'Please enter task class path',
    classPathPattern: 'Please enter a valid Java class path',
    cronRequired: 'Please enter Cron expression',
    cronPattern: 'Please enter a valid Cron expression',
  },

  // Messages
  messages: {
    loadFailed: 'Failed to load task list',
    startSuccess: 'Task started successfully',
    startFailed: 'Failed to start task',
    stopSuccess: 'Task stopped successfully',
    stopFailed: 'Failed to stop task',
    deleteSuccess: 'Deleted successfully',
    deleteFailed: 'Failed to delete',
    createSuccess: 'Created successfully',
    updateSuccess: 'Updated successfully',
    submitFailed: 'Failed to submit',
    batchDeleteSuccess: 'Successfully deleted {count} tasks',
    batchDeleteFailed: 'Failed to batch delete tasks',
  },
}

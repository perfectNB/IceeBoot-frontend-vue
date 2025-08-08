import request from '@/utils/request'

export interface Task {
  id?: string
  name: string
  className: string
  cronExpression: string
  status: string
  description: string
  lastExecuteTime?: string
  nextExecuteTime?: string
  createTime?: string
  updateTime?: string
}

export interface TaskQueryParams {
  page: number
  size: number
  name?: string
  status?: string
}

export interface TaskResponse {
  list: Task[]
  total: number
}

// 获取任务列表
export const getTasks = (params: TaskQueryParams) => {
  return request<TaskResponse>({
    url: '/api/v1/tasks',
    method: 'GET',
    params
  })
}

// 创建任务
export const createTask = (data: Omit<Task, 'id'>) => {
  return request<Task>({
    url: '/api/v1/tasks',
    method: 'POST',
    data
  })
}

// 更新任务
export const updateTask = (id: string, data: Partial<Task>) => {
  return request<Task>({
    url: `/api/v1/tasks/${id}`,
    method: 'PUT',
    data
  })
}

// 删除任务
export const deleteTask = (id: string) => {
  return request({
    url: `/api/v1/tasks/${id}`,
    method: 'DELETE'
  })
}

// 启动任务
export const startTask = (id: string) => {
  return request({
    url: `/api/v1/tasks/${id}/start`,
    method: 'POST'
  })
}

// 停止任务
export const stopTask = (id: string) => {
  return request({
    url: `/api/v1/tasks/${id}/stop`,
    method: 'POST'
  })
}
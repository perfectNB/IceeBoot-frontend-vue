import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockTaskService } from '@/mock/services/task'

export interface Task {
  id?: string
  name: string
  className: string
  cronExpression: string
  status: string
  description: string
  lastExecuteTime?: string
  nextExecuteTime?: string | null
  createTime?: string
  updateTime?: string
}

export interface TaskQueryParams {
  pageNum: number
  pageSize: number
  name?: string
  status?: string
  [key: string]: unknown
}

export interface TaskResponse {
  records: Task[]
  total: number
  current: number
  size: number
  pages: number
  hasPrevious: boolean
  hasNext: boolean
}

// 获取任务列表
export const getTasks = async (params: TaskQueryParams): Promise<TaskResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockTaskService.getTasks(params)
  } else {
    // 调用真实API
    const response = await request.get<TaskResponse>('/api/v1/tasks',  params )
    const apiResponse = response as unknown as {code: number, message: string, data: TaskResponse, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取任务列表响应数据格式错误')
    }
    return apiResponse.data
  }
}

// 创建任务
export const createTask = async (data: Omit<Task, 'id'>): Promise<Task> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockTaskService.createTask(data)
  } else {
    // 调用真实API
    const response = await request.post<Task>('/api/v1/tasks', data)
    return response.data
  }
}

// 更新任务
export const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockTaskService.updateTask(id, data)
  } else {
    // 调用真实API
    const response = await request.put<Task>(`/api/v1/tasks/${id}`, data)
    return response.data
  }
}

// 删除任务
export const deleteTask = async (id: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockTaskService.deleteTask(id)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/tasks/${id}`)
  }
}

// 启动任务
export const startTask = async (id: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockTaskService.startTask(id)
  } else {
    // 调用真实API
    await request.post(`/api/v1/tasks/${id}/start`)
  }
}

// 停止任务
export const stopTask = async (id: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockTaskService.stopTask(id)
  } else {
    // 调用真实API
    await request.post(`/api/v1/tasks/${id}/stop`)
  }
}

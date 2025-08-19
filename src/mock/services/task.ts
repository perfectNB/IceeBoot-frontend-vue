import { taskData } from '../data/task'
import type { Task as MockTask } from '../data/task'
import type { Task, TaskQueryParams, TaskResponse } from '@/api/task'

export class MockTaskService {
  // 获取任务列表
  static async getTasks(params: TaskQueryParams): Promise<TaskResponse> {
    const { page = 1, size = 20, name, status } = params
    
    // 过滤数据
    let filteredData = [...taskData]
    
    if (name) {
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(name.toLowerCase())
      )
    }
    
    if (status) {
      filteredData = filteredData.filter(item => item.status === status)
    }
    
    // 转换为API格式
    const convertedList: Task[] = filteredData.map(item => ({
      id: item.id,
      name: item.name,
      className: item.className,
      cronExpression: item.cronExpression,
      status: item.status,
      description: item.description,
      lastExecuteTime: item.lastExecuteTime,
      nextExecuteTime: item.nextExecuteTime,
      createTime: item.createTime,
      updateTime: item.updateTime
    }))
    
    // 分页
    const total = filteredData.length
    const start = (page - 1) * size
    const end = start + size
    const records = convertedList.slice(start, end)
    const pages = Math.ceil(total / size)
    
    return {
      records,
      total,
      current: page,
      size,
      pages,
      hasPrevious: page > 1,
      hasNext: page < pages
    }
  }
  
  // 创建任务
  static async createTask(data: Omit<Task, 'id'>): Promise<Task> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newId = Date.now().toString()
    
    const mockTask: MockTask = {
      id: newId,
      name: data.name,
      className: data.className,
      cronExpression: data.cronExpression,
      status: data.status,
      description: data.description,
      lastExecuteTime: data.lastExecuteTime,
      nextExecuteTime: data.nextExecuteTime,
      createTime: now,
      updateTime: now
    }
    
    taskData.push(mockTask)
    
    return {
      id: newId,
      name: data.name,
      className: data.className,
      cronExpression: data.cronExpression,
      status: data.status,
      description: data.description,
      lastExecuteTime: data.lastExecuteTime,
      nextExecuteTime: data.nextExecuteTime,
      createTime: now,
      updateTime: now
    }
  }
  
  // 更新任务
  static async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const index = taskData.findIndex(item => item.id === id)
    if (index === -1) {
      throw new Error(`任务 "${id}" 不存在`)
    }
    
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const updatedMockTask: MockTask = {
      ...taskData[index],
      ...data,
      id: taskData[index].id,
      updateTime: now
    }
    
    taskData[index] = updatedMockTask
    
    return {
      id: updatedMockTask.id,
      name: updatedMockTask.name,
      className: updatedMockTask.className,
      cronExpression: updatedMockTask.cronExpression,
      status: updatedMockTask.status,
      description: updatedMockTask.description,
      lastExecuteTime: updatedMockTask.lastExecuteTime,
      nextExecuteTime: updatedMockTask.nextExecuteTime,
      createTime: updatedMockTask.createTime,
      updateTime: updatedMockTask.updateTime
    }
  }
  
  // 删除任务
  static async deleteTask(id: string): Promise<void> {
    const index = taskData.findIndex(item => item.id === id)
    if (index > -1) {
      taskData.splice(index, 1)
    }
  }
  
  // 启动任务
  static async startTask(id: string): Promise<void> {
    const index = taskData.findIndex(item => item.id === id)
    if (index > -1) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      taskData[index].status = 'running'
      taskData[index].lastExecuteTime = now
      taskData[index].updateTime = now
    }
  }
  
  // 停止任务
  static async stopTask(id: string): Promise<void> {
    const index = taskData.findIndex(item => item.id === id)
    if (index > -1) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
      taskData[index].status = 'stopped'
      taskData[index].updateTime = now
    }
  }
}
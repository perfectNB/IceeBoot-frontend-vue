import { request } from '@/utils/request'
import type { Student, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockStudentService } from '@/mock/services/student'

// 获取Student列表
export const getStudentList = async (params?: PageParams): Promise<PageResult<Student>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const mockStudents = await MockStudentService.getStudentList(params || { page: 1, size: 20 })
    return mockStudents
  } else {
    // 调用真实API
    const response = await request.get<PageResult<Student>>('/api/v1/student', { params })
    return response.data
  }
}

// 创建Student
export const createStudent = async (data: Partial<Student>): Promise<Student> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const result = await MockStudentService.createStudent(data)
    return result
  } else {
    // 调用真实API
    const response = await request.post<Student>('/api/v1/student', data)
    return response.data
  }
}

// 更新Student
export const updateStudent = async (id: string | number, data: Partial<Student>): Promise<Student> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const result = await MockStudentService.updateStudent(Number(id), data)
    return result
  } else {
    // 调用真实API
    const response = await request.put<Student>('/api/v1/student/' + id, data)
    return response.data
  }
}

// 获取Student详情
export const getStudentById = async (id: string | number): Promise<Student> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<Student>('/api/v1/student/' + id)
    return response.data
  }
}

// 删除Student
export const deleteStudent = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockStudentService.deleteStudent(Number(id))
    return true
  } else {
    // 调用真实API
    await request.delete('/api/v1/student/' + id)
    return true
  }
}

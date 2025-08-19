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
    const response = await request.get<{result: PageResult<Student>}>('/api/v1/student', { params })
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<Student>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Student列表响应数据格式错误')
    }
    return apiResponse.result
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
    const response = await request.post<{result: Student}>('/api/v1/student', data)
    const apiResponse = response as unknown as {code: number, message: string, result: Student, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('创建Student响应数据格式错误')
    }
    return apiResponse.result
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
    const response = await request.put<{result: Student}>('/api/v1/student/' + id, data)
    const apiResponse = response as unknown as {code: number, message: string, result: Student, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('更新Student响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取Student详情
export const getStudentById = async (id: string | number): Promise<Student> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{result: Student}>('/api/v1/student/' + id)
    const apiResponse = response as unknown as {code: number, message: string, result: Student, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Student详情响应数据格式错误')
    }
    return apiResponse.result
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
    const response = await request.delete<{result: boolean}>('/api/v1/student/' + id)
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除Student响应数据格式错误')
    }
    return true
  }
}

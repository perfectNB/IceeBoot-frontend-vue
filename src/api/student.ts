import { request } from '@/utils/request'
import type { Student, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockStudentService } from '@/mock/services/student'

// Student查询参数
export interface StudentQueryParams {
  pageNum: number
  pageSize: number
  name?: string
  age?: string
  sex?: string
  number?: string
  major?: string
  [key: string]: unknown
}

// Student响应数据
export interface StudentResponse extends PageResult<Student> {
  current: number
  size: number
  pages: number
}

// 获取Student列表
export const getStudentList = async (params: StudentQueryParams): Promise<StudentResponse> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const mockParams = {
      page: params.pageNum,
      size: params.pageSize,
      name: params.name,
      age: params.age,
      sex: params.sex,
      number: params.number,
      major: params.major
    }
    const mockResult = await MockStudentService.getStudentList(mockParams)
    return {
      ...mockResult,
      current: params.pageNum,
      size: params.pageSize,
      pages: Math.ceil(mockResult.total / params.pageSize)
    }
  } else {
    // 调用真实API
    const response = await request.get<{result: StudentResponse}>('/api/v1/student', params)
    const apiResponse = response as unknown as {code: number, message: string, result: StudentResponse, success: boolean}
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
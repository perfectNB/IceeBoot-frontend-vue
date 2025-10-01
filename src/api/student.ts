import { request } from '@/utils/request'
import type { Student, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockStudentService } from '@/mock/services/student'

// 获取学生列表
export const getStudentList = async (params: PageParams): Promise<PageResult<Student>> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentList(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<Student>}>('/api/v1/student', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<Student>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取学生列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建学生
export const createStudent = async (data: Partial<Student>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockStudentService.createStudent(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/student', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建学生失败')
    }
  }
}

// 更新学生
export const updateStudent = async (id: string | number, data: Partial<Student>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockStudentService.updateStudent(Number(id), data)
  } else {
    // 调用真实API
    const requestData = { ...data, id }
    const response = await request.put('/api/v1/student', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新学生失败')
    }
  }
}

// 删除学生（批量删除）
export const deleteStudents = async (ids: (string | number)[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.deleteStudents(ids.map(Number))
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/student', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除学生失败')
    }
    return true
  }
}

// 删除单个学生（兼容性保留）
export const deleteStudent = async (id: string | number): Promise<boolean> => {
  return await deleteStudents([id])
}

// 获取学生详情
export const getStudentById = async (id: string | number): Promise<Student> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{result: Student}>('/api/v1/student/' + id)
    const apiResponse = response as unknown as {code: number, message: string, result: Student, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取学生详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

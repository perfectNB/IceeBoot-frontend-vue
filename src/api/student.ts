import { request } from '@/utils/request'
import type { Student, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockStudentService } from '@/mock/services/student'

// 获取学生列表
export const getStudentList = async (params: PageParams): Promise<PageResult<Student>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentList(params)
  } else {
    // 调用真实API
    return await request.get<PageResult<Student>>('/api/v1/student', params)
  }
}

// 创建学生
export const createStudent = async (data: Partial<Student>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockStudentService.createStudent(data)
  } else {
    // 调用真实API
    await request.post('/api/v1/student', data)
  }
}

// 更新学生
export const updateStudent = async (id: string | number, data: Partial<Student>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockStudentService.updateStudent(Number(id), data)
  } else {
    // 调用真实API
    const requestData = { ...data, id }
    await request.put('/api/v1/student', requestData)
  }
}

// 删除学生（批量删除）
export const deleteStudents = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.deleteStudents(ids.map(Number))
  } else {
    // 调用真实API
    await request.delete('/api/v1/student', {}, {
      data: ids.map(Number)
    })
    return true
  }
}

// 删除单个学生（兼容性保留）
export const deleteStudent = async (id: string | number): Promise<boolean> => {
  return await deleteStudents([id])
}

// 获取学生详情
export const getStudentById = async (id: string | number): Promise<Student> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockStudentService.getStudentById(Number(id))
  } else {
    // 调用真实API
    return await request.get<Student>('/api/v1/student/' + id)
  }
}

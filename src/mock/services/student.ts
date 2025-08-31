/**
 * MockStudent服务
 */

import type { Student, PageParams, PageResult } from '@/types'
import { mockStudents } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class MockStudentService {

  // 获取Student列表
  static async getStudentList(params: PageParams): Promise<PageResult<Student>> {
    await mockDelay()
    mockLog('获取Student列表', params)

    let filteredList = [...mockStudents]

    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredList = filteredList.filter(item =>
        item.name.toString().toLowerCase().includes(keyword) ||
        item.age.toString().toLowerCase().includes(keyword) ||
        item.sex.toString().toLowerCase().includes(keyword) ||
        item.number.toString().toLowerCase().includes(keyword) ||
        item.major.toString().toLowerCase().includes(keyword)
      )
    }

    // 分页
    const total = filteredList.length
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 20
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredList.slice(start, end)
    const pages = Math.ceil(total / pageSize)

    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }

  // 获取所有Student
  static async getAllStudents(): Promise<Student[]> {
    await mockDelay()
    mockLog('获取所有Student')
    return [...mockStudents]
  }

  // 根据ID获取Student
  static async getStudentById(id: number): Promise<Student> {
    await mockDelay()
    mockLog('根据ID获取Student', { id })

    const item = mockStudents.find(r => r.id === id)
    if (!item) {
      throw new Error('Student不存在')
    }

    return item
  }

  // 创建Student
  static async createStudent(data: Partial<Student>): Promise<Student> {
    await mockDelay()
    mockLog('创建Student', data)

    const newItem: Student = {
      id: Math.max(...mockStudents.map(r => Number(r.id))) + 1,
      name: data.name || '曾南斌',
      age: data.age || 23,
      sex: data.sex || '男',
      number: data.number || '2018220111',
      major: data.major || '软件工程',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    mockStudents.push(newItem)
    return newItem
  }

  // 更新Student
  static async updateStudent(id: number, data: Partial<Student>): Promise<Student> {
    await mockDelay()
    mockLog('更新Student', { id, data })

    const index = mockStudents.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Student不存在')
    }

    const updatedItem = {
      ...mockStudents[index],
      ...data,
      id: id,
      updateTime: new Date().toISOString()
    }

    mockStudents[index] = updatedItem
    return updatedItem
  }

  // 删除Student
  static async deleteStudent(id: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除Student', { id })

    const index = mockStudents.findIndex(r => r.id === id)
    if (index === -1) {
      throw new Error('Student不存在')
    }

    mockStudents.splice(index, 1)
    return true
  }
}

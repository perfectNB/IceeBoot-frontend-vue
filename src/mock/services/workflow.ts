/**
 * Workflow Mock服务
 */

import { mockDelay, mockLog } from '@/config/mock'
import {
  mockWorkflowDefinitions,
  mockProcessInstances,
  mockTasks,
  mockWorkflowNodes,
  mockWorkflowXml
} from '../data/workflow'
import type {
  WorkflowDefinition,
  ProcessInstance,
  ProcessStartDTO,
  ProcessInstanceDeleteDTO,
  TaskItem,
  TaskCompleteDTO,
  TaskJumpDTO,
  WorkflowNode
} from '@/api/workflow'

export class MockWorkflowService {
  // 获取工作流定义列表
  static async getWorkflowDefinitions(params?: { latestOnly?: boolean }): Promise<WorkflowDefinition[]> {
    await mockDelay()
    mockLog('获取工作流定义列表', params)

    let definitions = [...mockWorkflowDefinitions]

    // 如果只获取最新版本
    if (params?.latestOnly) {
      const latestMap = new Map<string, WorkflowDefinition>()
      definitions.forEach(def => {
        const existing = latestMap.get(def.key!)
        if (!existing || (def.version! > existing.version!)) {
          latestMap.set(def.key!, def)
        }
      })
      definitions = Array.from(latestMap.values())
    }

    return definitions
  }

  // 部署工作流定义
  static async deployWorkflowDefinition(payload: {
    file: File
    name?: string
    category?: string
    tenantId?: string
  }): Promise<Record<string, unknown>> {
    await mockDelay()
    mockLog('部署工作流定义', payload)

    const newDefinition: WorkflowDefinition = {
      id: `workflow-def-${Date.now()}`,
      key: payload.name?.toLowerCase().replace(/\s+/g, '-') || 'new-workflow',
      name: payload.name || '新工作流',
      version: 1,
      category: payload.category || 'general',
      deploymentId: `deploy-${Date.now()}`,
      tenantId: payload.tenantId || 'tenant-1',
      resourceName: payload.file.name,
      diagramResourceName: payload.file.name.replace('.bpmn', '.png'),
      description: '通过Mock部署的工作流'
    }

    mockWorkflowDefinitions.push(newDefinition)

    return {
      success: true,
      message: '工作流部署成功',
      data: newDefinition
    }
  }

  // 获取工作流定义XML
  static async getWorkflowDefinitionXml(definitionId: string): Promise<string> {
    await mockDelay()
    mockLog('获取工作流定义XML', definitionId)

    const xml = mockWorkflowXml[definitionId]
    if (!xml) {
      throw new Error(`工作流定义 "${definitionId}" 的XML不存在`)
    }

    return xml
  }

  // 获取工作流定义图表
  static async getWorkflowDefinitionDiagram(definitionId: string): Promise<Record<string, unknown>> {
    await mockDelay()
    mockLog('获取工作流定义图表', definitionId)

    const definition = mockWorkflowDefinitions.find(d => d.id === definitionId)
    if (!definition) {
      throw new Error(`工作流定义 "${definitionId}" 不存在`)
    }

    return {
      definitionId,
      diagramUrl: `/mock/diagrams/${definition.diagramResourceName}`,
      nodes: mockWorkflowNodes[definitionId] || []
    }
  }

  // 获取工作流定义节点
  static async getWorkflowDefinitionNodes(definitionId: string): Promise<WorkflowNode[]> {
    await mockDelay()
    mockLog('获取工作流定义节点', definitionId)

    const nodes = mockWorkflowNodes[definitionId]
    if (!nodes) {
      throw new Error(`工作流定义 "${definitionId}" 的节点不存在`)
    }

    return nodes
  }

  // 启动工作流流程
  static async startWorkflowProcess(data: ProcessStartDTO): Promise<ProcessInstance> {
    await mockDelay()
    mockLog('启动工作流流程', data)

    const definition = mockWorkflowDefinitions.find(d => d.key === data.processDefinitionKey)
    if (!definition) {
      throw new Error(`工作流定义 "${data.processDefinitionKey}" 不存在`)
    }

    const newInstance: ProcessInstance = {
      id: `process-${Date.now()}`,
      processInstanceId: `process-${Date.now()}`,
      processDefinitionId: definition.id,
      processDefinitionKey: definition.key,
      processDefinitionName: definition.name,
      processDefinitionVersion: definition.version,
      deploymentId: definition.deploymentId,
      businessKey: data.businessKey || `biz-${Date.now()}`,
      name: `${definition.name} - ${new Date().toLocaleString()}`,
      description: '通过Mock启动的流程实例',
      startTime: new Date().toISOString(),
      startUserId: 'admin',
      activityId: 'start',
      suspended: false,
      ended: false,
      tenantId: definition.tenantId,
      processVariables: data.variables || {}
    }

    mockProcessInstances.push(newInstance)

    return newInstance
  }

  // 获取流程实例
  static async getWorkflowProcess(processInstanceId: string): Promise<ProcessInstance> {
    await mockDelay()
    mockLog('获取流程实例', processInstanceId)

    const instance = mockProcessInstances.find(p => p.processInstanceId === processInstanceId)
    if (!instance) {
      throw new Error(`流程实例 "${processInstanceId}" 不存在`)
    }

    return instance
  }

  // 删除流程实例
  static async deleteWorkflowProcess(processInstanceId: string, data?: ProcessInstanceDeleteDTO): Promise<void> {
    await mockDelay()
    mockLog('删除流程实例', { processInstanceId, data })

    const index = mockProcessInstances.findIndex(p => p.processInstanceId === processInstanceId)
    if (index === -1) {
      throw new Error(`流程实例 "${processInstanceId}" 不存在`)
    }

    mockProcessInstances.splice(index, 1)

    // 同时删除相关任务
    const taskIndexes = mockTasks
      .map((task, idx) => task.processInstanceId === processInstanceId ? idx : -1)
      .filter(idx => idx !== -1)
      .reverse()

    taskIndexes.forEach(idx => mockTasks.splice(idx, 1))
  }

  // 获取流程实例节点
  static async getWorkflowProcessNodes(processInstanceId: string): Promise<WorkflowNode[]> {
    await mockDelay()
    mockLog('获取流程实例节点', processInstanceId)

    const instance = mockProcessInstances.find(p => p.processInstanceId === processInstanceId)
    if (!instance) {
      throw new Error(`流程实例 "${processInstanceId}" 不存在`)
    }

    const nodes = mockWorkflowNodes[instance.processDefinitionId!]
    if (!nodes) {
      return []
    }

    // 根据流程状态更新节点状态
    return nodes.map(node => ({
      ...node,
      status: node.activityId === instance.activityId ? 'active' :
              instance.ended ? 'completed' : node.status
    }))
  }

  // 检查流程是否结束
  static async checkWorkflowProcessEnded(processInstanceId: string): Promise<boolean> {
    await mockDelay()
    mockLog('检查流程是否结束', processInstanceId)

    const instance = mockProcessInstances.find(p => p.processInstanceId === processInstanceId)
    if (!instance) {
      throw new Error(`流程实例 "${processInstanceId}" 不存在`)
    }

    return instance.ended || false
  }

  // 结束流程实例
  static async endWorkflowProcess(processInstanceId: string): Promise<void> {
    await mockDelay()
    mockLog('结束流程实例', processInstanceId)

    const instance = mockProcessInstances.find(p => p.processInstanceId === processInstanceId)
    if (!instance) {
      throw new Error(`流程实例 "${processInstanceId}" 不存在`)
    }

    instance.ended = true
    instance.activityId = 'end'

    // 删除相关任务
    const taskIndexes = mockTasks
      .map((task, idx) => task.processInstanceId === processInstanceId ? idx : -1)
      .filter(idx => idx !== -1)
      .reverse()

    taskIndexes.forEach(idx => mockTasks.splice(idx, 1))
  }

  // 获取用户任务
  static async getUserTasks(assignee: string): Promise<TaskItem[]> {
    await mockDelay()
    mockLog('获取用户任务', assignee)

    return mockTasks.filter(task => task.assignee === assignee)
  }

  // 获取候选任务
  static async getCandidateTasks(candidateUser: string): Promise<TaskItem[]> {
    await mockDelay()
    mockLog('获取候选任务', candidateUser)

    // 返回未分配的任务（assignee为null）
    return mockTasks.filter(task => !task.assignee)
  }

  // 完成任务
  static async completeTask(taskId: string, data?: TaskCompleteDTO): Promise<void> {
    await mockDelay()
    mockLog('完成任务', { taskId, data })

    const taskIndex = mockTasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      throw new Error(`任务 "${taskId}" 不存在`)
    }

    const task = mockTasks[taskIndex]

    // 更新流程变量
    if (data?.variables && task.processInstanceId) {
      const instance = mockProcessInstances.find(p => p.processInstanceId === task.processInstanceId)
      if (instance) {
        instance.processVariables = {
          ...instance.processVariables,
          ...data.variables
        }
      }
    }

    // 删除任务
    mockTasks.splice(taskIndex, 1)
  }

  // 任务跳转
  static async jumpTask(taskId: string, data: TaskJumpDTO): Promise<void> {
    await mockDelay()
    mockLog('任务跳转', { taskId, data })

    const task = mockTasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`任务 "${taskId}" 不存在`)
    }

    // 更新任务定义键
    task.taskDefinitionKey = data.targetActivityId
    task.name = `跳转到 ${data.targetActivityId}`

    // 更新流程实例的当前活动
    if (task.processInstanceId) {
      const instance = mockProcessInstances.find(p => p.processInstanceId === task.processInstanceId)
      if (instance) {
        instance.activityId = data.targetActivityId
      }
    }
  }
}

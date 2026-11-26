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
  WorkflowNode
} from '@/api/workflow'

import { demoUserId } from './auth'
import { mockUsers } from '../data/user'

function actor() {
  const user = mockUsers.find(row => Number(row.id) === demoUserId())
  if (!user) throw new Error('请先登录')
  return user
}

function candidate(task: TaskItem, name: string) {
  return !task.assignee && task.candidateUser === name
}

export class MockWorkflowService {
  // 获取工作流定义列表
  static async getWorkflowDefinitions(params?: { latestOnly?: boolean }): Promise<WorkflowDefinition[]> {
    await mockDelay()
    mockLog('获取工作流定义列表', params)

    let definitions = [...mockWorkflowDefinitions]

    // 如果只获取最新版本
    if (params?.latestOnly !== false) {
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

    const xml = await payload.file.text()
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    const process = document.getElementsByTagNameNS('*', 'process')[0]
    const key = process?.getAttribute('id')
    if (!key || document.querySelector('parsererror')) throw new Error('缺少有效的 BPMN 流程')
    const version = Math.max(0, ...mockWorkflowDefinitions.filter(d => d.key === key).map(d => d.version || 0)) + 1
    const newDefinition: WorkflowDefinition = {
      id: `workflow-def-${Date.now()}`,
      key,
      name: payload.name || '新工作流',
      version,
      category: payload.category || 'general',
      deploymentId: `deploy-${Date.now()}`,
      tenantId: payload.tenantId || 'tenant-1',
      resourceName: payload.file.name,
      diagramResourceName: payload.file.name.replace('.bpmn', '.png'),
      description: '通过Mock部署的工作流'
    }

    const id = newDefinition.id!
    mockWorkflowXml[id] = xml
    mockWorkflowNodes[id] = Array.from(process.children)
      .filter(el => ['startEvent', 'endEvent', 'userTask'].includes(el.localName))
      .map((el, i) => ({ id: el.id, activityId: el.id, name: el.getAttribute('name') || el.id,
        type: el.localName, x: 15 + i * 130, y: 30, width: 105, height: 45 }))
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

    return renderDiagram(mockWorkflowNodes[definitionId] || [])

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

    const definition = mockWorkflowDefinitions.filter(d => d.key === data.processDefinitionKey).sort((a,b) => (b.version || 0) - (a.version || 0))[0]
    if (!definition) {
      throw new Error(`工作流定义 "${data.processDefinitionKey}" 不存在`)
    }

    const id = crypto.randomUUID()
    const newInstance: ProcessInstance = {
      id,
      processInstanceId: id,
      processDefinitionId: definition.id,
      processDefinitionKey: definition.key,
      processDefinitionName: definition.name,
      processDefinitionVersion: definition.version,
      deploymentId: definition.deploymentId,
      businessKey: data.businessKey || `biz-${Date.now()}`,
      name: `${definition.name} - ${new Date().toLocaleString()}`,
      description: '通过Mock启动的流程实例',
      startTime: new Date().toISOString(),
      startUserId: String(actor().id),
      activityId: 'start',
      suspended: false,
      ended: false,
      tenantId: definition.tenantId,
      processVariables: data.variables || {}
    }

    const first = mockWorkflowNodes[definition.id!]?.find(n => n.type === 'userTask')
    if (first) {
      newInstance.activityId = first.activityId
      mockTasks.push({ id: crypto.randomUUID(), processInstanceId: id, processDefinitionId: definition.id,
        name: first.name, taskDefinitionKey: first.activityId, candidateUser: actor().username, createTime: newInstance.startTime })
    } else {
      newInstance.ended = true
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

    if (mockProcessInstances[index]!.ended) throw new Error('流程已结束')
    mockProcessInstances[index]!.ended = true
    mockProcessInstances[index]!.activityId = 'end'

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

    await this.deleteWorkflowProcess(processInstanceId)
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
    return mockTasks.filter(task => candidate(task, candidateUser))
  }

  // 完成任务
  static async completeTask(taskId: string, data?: TaskCompleteDTO): Promise<void> {
    await mockDelay()
    mockLog('完成任务', { taskId, data })

    const taskIndex = mockTasks.findIndex(t => t.id === taskId)
    if (taskIndex === -1) {
      throw new Error(`任务 "${taskId}" 不存在`)
    }

    const task = mockTasks[taskIndex]!
    if (![String(actor().id), actor().username].includes(task.assignee || '')) throw new Error('只能办理自己的任务')

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

    mockTasks.splice(taskIndex, 1)
    const instance = mockProcessInstances.find(row => row.id === task.processInstanceId)
    if (instance && !mockTasks.some(row => row.processInstanceId === instance.id)) {
      const steps = (mockWorkflowNodes[instance.processDefinitionId!] || []).filter(n => n.type === 'userTask')
      const index = steps.findIndex(n => n.activityId === task.taskDefinitionKey)
      const next = index >= 0 ? steps[index + 1] : undefined
      instance.activityId = next?.activityId || 'end'
      instance.ended = !next
      if (next) mockTasks.push({ ...task, id: crypto.randomUUID(), taskDefinitionKey: next.activityId,
        name: next.name, assignee: undefined, candidateUser: actor().username })
    }
  }

  static async myTasks() {
    const user = actor()
    return mockTasks.filter(row => row.assignee === user.username || row.assignee === String(user.id) || candidate(row, user.username))
  }

  static async claim(id: string, release: boolean) {
    const task = mockTasks.find(row => row.id === id)
    const user = actor()
    if (!task) throw new Error('任务不存在')
    if (release) {
      if (![user.username, String(user.id)].includes(task.assignee || '')) throw new Error('任务不属于当前用户')
      task.assignee = undefined
    } else {
      if (!candidate(task, user.username)) throw new Error('当前用户不能认领')
      task.assignee = user.username
    }
  }

  static async instanceDiagram(id: string) {
    return renderDiagram(await this.getWorkflowProcessNodes(id))
  }
}

function renderDiagram(nodes: WorkflowNode[]) {
  const width = Math.max(200, ...nodes.map(n => (n.x || 0) + (n.width || 100) + 20))
  const height = Math.max(80, ...nodes.map(n => (n.y || 0) + (n.height || 45) + 20))
  const shapes = nodes.map(n => {
    const x = n.x || 0, y = n.y || 0
    const label = (n.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<rect x="${x}" y="${y}" width="${n.width || 100}" height="${n.height || 45}" rx="7" fill="${n.status === 'active' ? '#c6e2ff' : '#ebeff5'}"/><text x="${x + 5}" y="${y + 25}" font-size="12">${label}</text>`
  })
  return { contentType: 'image/svg+xml', content: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes.join('')}</svg>` }
}

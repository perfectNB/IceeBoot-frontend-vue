import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockWorkflowService } from '@/mock/services/workflow'

export interface WorkflowDefinition {
  id?: string
  key?: string
  name?: string
  version?: number
  category?: string
  deploymentId?: string
  tenantId?: string
  resourceName?: string
  diagramResourceName?: string
  description?: string
  [key: string]: unknown
}

export interface WorkflowNode {
  id?: string
  activityId?: string
  name?: string
  type?: string
  x?: number
  y?: number
  width?: number
  height?: number
  status?: string
  [key: string]: unknown
}

export interface ProcessInstance {
  id?: string
  processInstanceId?: string
  processDefinitionId?: string
  processDefinitionKey?: string
  processDefinitionName?: string
  processDefinitionVersion?: number
  deploymentId?: string
  businessKey?: string
  name?: string
  description?: string
  startTime?: string
  startUserId?: string
  activityId?: string
  suspended?: boolean
  ended?: boolean
  tenantId?: string
  processVariables?: Record<string, unknown>
  [key: string]: unknown
}

export interface ProcessStartDTO {
  processDefinitionKey: string
  businessKey?: string
  variables?: Record<string, unknown>
}

export interface ProcessInstanceDeleteDTO {
  processInstanceId: string
  deleteReason?: string
}

export interface TaskItem {
  id?: string
  name?: string
  description?: string
  priority?: number
  owner?: string
  assignee?: string
  processInstanceId?: string
  executionId?: string
  processDefinitionId?: string
  createTime?: string
  taskDefinitionKey?: string
  dueDate?: string
  category?: string
  parentTaskId?: string
  tenantId?: string
  formKey?: string
  taskLocalVariables?: Record<string, unknown>
  processVariables?: Record<string, unknown>
  claimTime?: string
  businessKey?: string
  localizedName?: string
  localizedDescription?: string
  delegationState?: string
  suspended?: boolean
  appVersion?: number
  [key: string]: unknown
}

export interface TaskCompleteDTO {
  taskId?: string
  variables?: Record<string, unknown>
}

export const getWorkflowDefinitions = async (params?: { latestOnly?: boolean }): Promise<WorkflowDefinition[]> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowDefinitions(params)
  }
  return await request.get<WorkflowDefinition[]>('/api/v1/workflow/definitions', params)
}

export const deployWorkflowDefinition = async (payload: {
  file: File
  name?: string
  category?: string
  tenantId?: string
}): Promise<Record<string, unknown>> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.deployWorkflowDefinition(payload)
  }
  const formData = new FormData()
  formData.append('file', payload.file)
  if (payload.name) formData.append('name', payload.name)
  if (payload.category) formData.append('category', payload.category)
  if (payload.tenantId) formData.append('tenantId', payload.tenantId)
  return await request.post<Record<string, unknown>>('/api/v1/workflow/deploy', formData as unknown as Record<string, unknown>, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const getWorkflowDefinitionXml = async (definitionId: string): Promise<string> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowDefinitionXml(definitionId)
  }
  return await request.get<string>(`/api/v1/workflow/definitions/${encodeURIComponent(definitionId)}/xml`)
}

export const getWorkflowDefinitionDiagram = async (definitionId: string): Promise<Record<string, unknown>> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowDefinitionDiagram(definitionId)
  }
  return await request.get<Record<string, unknown>>(`/api/v1/workflow/definitions/${encodeURIComponent(definitionId)}/diagram`)
}

export const getWorkflowDefinitionNodes = async (definitionId: string): Promise<WorkflowNode[]> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowDefinitionNodes(definitionId)
  }
  return await request.get<WorkflowNode[]>(`/api/v1/workflow/definitions/${encodeURIComponent(definitionId)}/nodes`)
}

export const startWorkflowProcess = async (data: ProcessStartDTO): Promise<ProcessInstance> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.startWorkflowProcess(data)
  }
  return await request.post<ProcessInstance>('/api/v1/workflow/start', data as unknown as Record<string, unknown>)
}

export const getWorkflowProcess = async (processInstanceId: string): Promise<ProcessInstance> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowProcess(processInstanceId)
  }
  return await request.get<ProcessInstance>(`/api/v1/workflow/process/${encodeURIComponent(processInstanceId)}`)
}

export const deleteWorkflowProcess = async (processInstanceId: string, data?: ProcessInstanceDeleteDTO): Promise<void> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.deleteWorkflowProcess(processInstanceId, data)
  }
  await request.delete(`/api/v1/workflow/process/${encodeURIComponent(processInstanceId)}`, {}, { data })
}

export const getWorkflowProcessNodes = async (processInstanceId: string): Promise<WorkflowNode[]> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getWorkflowProcessNodes(processInstanceId)
  }
  return await request.get<WorkflowNode[]>(`/api/v1/workflow/process/${encodeURIComponent(processInstanceId)}/nodes`)
}

export const checkWorkflowProcessEnded = async (processInstanceId: string): Promise<boolean> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.checkWorkflowProcessEnded(processInstanceId)
  }
  return await request.get<boolean>(`/api/v1/workflow/process/${encodeURIComponent(processInstanceId)}/ended`)
}

export const endWorkflowProcess = async (processInstanceId: string): Promise<void> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.endWorkflowProcess(processInstanceId)
  }
  await request.post(`/api/v1/workflow/process/${encodeURIComponent(processInstanceId)}/end`, {})
}

export const getUserTasks = async (assignee: string): Promise<TaskItem[]> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getUserTasks(assignee)
  }
  return await request.get<TaskItem[]>(`/api/v1/workflow/tasks/user/${encodeURIComponent(assignee)}`)
}

export const getCandidateTasks = async (candidateUser: string): Promise<TaskItem[]> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.getCandidateTasks(candidateUser)
  }
  return await request.get<TaskItem[]>(`/api/v1/workflow/tasks/candidate/${encodeURIComponent(candidateUser)}`)
}

export const completeTask = async (taskId: string, data?: TaskCompleteDTO): Promise<void> => {
  if (isMockEnabled()) {
    return await MockWorkflowService.completeTask(taskId, data)
  }
  await request.post(`/api/v1/workflow/task/${encodeURIComponent(taskId)}/complete`, data as unknown as Record<string, unknown>)
}

export async function myWorkflowTasks(): Promise<TaskItem[]> {
  return isMockEnabled() ? MockWorkflowService.myTasks() : request.get('/api/v1/workflow/tasks/my')
}

export async function claimWorkflowTask(id: string, release = false): Promise<void> {
  if (isMockEnabled()) return MockWorkflowService.claim(id, release)
  await request.post(`/api/v1/workflow/task/${encodeURIComponent(id)}/${release ? 'unclaim' : 'claim'}`, {})
}

export async function workflowInstanceDiagram(id: string): Promise<Record<string, unknown>> {
  return isMockEnabled() ? MockWorkflowService.instanceDiagram(id)
    : request.get(`/api/v1/workflow/process/${encodeURIComponent(id)}/diagram`)
}

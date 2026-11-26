/**
 * Workflow相关Mock数据
 */

import type { WorkflowDefinition, ProcessInstance, TaskItem, WorkflowNode } from '@/api/workflow'

// 工作流定义Mock数据
export const mockWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: 'workflow-def-1',
    key: 'leave-approval',
    name: '请假审批流程',
    version: 1,
    category: 'approval',
    deploymentId: 'deploy-1',
    tenantId: 'tenant-1',
    resourceName: 'leave-approval.bpmn20.xml',
    diagramResourceName: 'leave-approval.png',
    description: '员工请假审批工作流'
  },
  {
    id: 'workflow-def-2',
    key: 'expense-reimbursement',
    name: '费用报销流程',
    version: 1,
    category: 'finance',
    deploymentId: 'deploy-2',
    tenantId: 'tenant-1',
    resourceName: 'expense-reimbursement.bpmn20.xml',
    diagramResourceName: 'expense-reimbursement.png',
    description: '员工费用报销审批工作流'
  },
  {
    id: 'workflow-def-3',
    key: 'purchase-order',
    name: '采购订单流程',
    version: 2,
    category: 'procurement',
    deploymentId: 'deploy-3',
    tenantId: 'tenant-1',
    resourceName: 'purchase-order.bpmn20.xml',
    diagramResourceName: 'purchase-order.png',
    description: '采购订单审批工作流'
  },
  {
    id: 'workflow-def-4',
    key: 'contract-approval',
    name: '合同审批流程',
    version: 1,
    category: 'legal',
    deploymentId: 'deploy-4',
    tenantId: 'tenant-1',
    resourceName: 'contract-approval.bpmn20.xml',
    diagramResourceName: 'contract-approval.png',
    description: '合同审批工作流'
  }
]

// 流程实例Mock数据
export const mockProcessInstances: ProcessInstance[] = [
  {
    id: 'process-1',
    processInstanceId: 'process-1',
    processDefinitionId: 'workflow-def-1',
    processDefinitionKey: 'leave-approval',
    processDefinitionName: '请假审批流程',
    processDefinitionVersion: 1,
    deploymentId: 'deploy-1',
    businessKey: 'leave-001',
    name: '张三的请假申请',
    description: '请假3天',
    startTime: '2024-01-15 09:00:00',
    startUserId: 'user-1',
    activityId: 'task-manager-approval',
    suspended: false,
    ended: false,
    tenantId: 'tenant-1',
    processVariables: {
      applicant: '张三',
      days: 3,
      reason: '家庭事务'
    }
  },
  {
    id: 'process-2',
    processInstanceId: 'process-2',
    processDefinitionId: 'workflow-def-2',
    processDefinitionKey: 'expense-reimbursement',
    processDefinitionName: '费用报销流程',
    processDefinitionVersion: 1,
    deploymentId: 'deploy-2',
    businessKey: 'expense-001',
    name: '李四的报销申请',
    description: '差旅费报销',
    startTime: '2024-01-16 10:30:00',
    startUserId: 'user-2',
    activityId: 'task-finance-review',
    suspended: false,
    ended: false,
    tenantId: 'tenant-1',
    processVariables: {
      applicant: '李四',
      amount: 5000,
      type: '差旅费'
    }
  },
  {
    id: 'process-3',
    processInstanceId: 'process-3',
    processDefinitionId: 'workflow-def-1',
    processDefinitionKey: 'leave-approval',
    processDefinitionName: '请假审批流程',
    processDefinitionVersion: 1,
    deploymentId: 'deploy-1',
    businessKey: 'leave-002',
    name: '王五的请假申请',
    description: '请假1天',
    startTime: '2024-01-14 14:00:00',
    startUserId: 'user-3',
    activityId: 'end',
    suspended: false,
    ended: true,
    tenantId: 'tenant-1',
    processVariables: {
      applicant: '王五',
      days: 1,
      reason: '个人事务',
      approved: true
    }
  }
]

// 任务Mock数据
export const mockTasks: TaskItem[] = [
  {
    id: 'task-1',
    name: '经理审批',
    description: '审批张三的请假申请',
    priority: 50,
    assignee: 'admin',
    processInstanceId: 'process-1',
    executionId: 'exec-1',
    processDefinitionId: 'workflow-def-1',
    createTime: '2024-01-15 09:00:00',
    taskDefinitionKey: 'task-manager-approval',
    category: 'approval',
    tenantId: 'tenant-1',
    businessKey: 'leave-001',
    processVariables: {
      applicant: '张三',
      days: 3,
      reason: '家庭事务'
    },
    suspended: false
  },
  {
    id: 'task-2',
    name: '财务审核',
    description: '审核李四的报销申请',
    priority: 50,
    assignee: 'admin',
    processInstanceId: 'process-2',
    executionId: 'exec-2',
    processDefinitionId: 'workflow-def-2',
    createTime: '2024-01-16 10:30:00',
    taskDefinitionKey: 'task-finance-review',
    category: 'finance',
    tenantId: 'tenant-1',
    businessKey: 'expense-001',
    processVariables: {
      applicant: '李四',
      amount: 5000,
      type: '差旅费'
    },
    suspended: false
  },
  {
    id: 'task-3',
    candidateUser: 'admin',
    name: 'HR审批',
    description: '候选任务 - 需要认领',
    priority: 30,
    processInstanceId: 'process-1',
    executionId: 'exec-3',
    processDefinitionId: 'workflow-def-1',
    createTime: '2024-01-15 09:05:00',
    taskDefinitionKey: 'task-hr-approval',
    category: 'approval',
    tenantId: 'tenant-1',
    businessKey: 'leave-001',
    suspended: false
  }
]

// 工作流节点Mock数据
export const mockWorkflowNodes: Record<string, WorkflowNode[]> = {
  'workflow-def-1': [
    {
      id: 'node-1',
      activityId: 'start',
      name: '开始',
      type: 'startEvent',
      x: 100,
      y: 100,
      width: 36,
      height: 36,
      status: 'completed'
    },
    {
      id: 'node-2',
      activityId: 'task-submit',
      name: '提交申请',
      type: 'userTask',
      x: 200,
      y: 100,
      width: 100,
      height: 80,
      status: 'completed'
    },
    {
      id: 'node-3',
      activityId: 'task-manager-approval',
      name: '经理审批',
      type: 'userTask',
      x: 350,
      y: 100,
      width: 100,
      height: 80,
      status: 'active'
    },
    {
      id: 'node-4',
      activityId: 'task-hr-approval',
      name: 'HR审批',
      type: 'userTask',
      x: 500,
      y: 100,
      width: 100,
      height: 80,
      status: 'pending'
    },
    {
      id: 'node-5',
      activityId: 'end',
      name: '结束',
      type: 'endEvent',
      x: 650,
      y: 100,
      width: 36,
      height: 36,
      status: 'pending'
    }
  ],
  'workflow-def-2': [
    {
      id: 'node-6',
      activityId: 'start',
      name: '开始',
      type: 'startEvent',
      x: 100,
      y: 100,
      width: 36,
      height: 36,
      status: 'completed'
    },
    {
      id: 'node-7',
      activityId: 'task-submit',
      name: '提交报销',
      type: 'userTask',
      x: 200,
      y: 100,
      width: 100,
      height: 80,
      status: 'completed'
    },
    {
      id: 'node-8',
      activityId: 'task-finance-review',
      name: '财务审核',
      type: 'userTask',
      x: 350,
      y: 100,
      width: 100,
      height: 80,
      status: 'active'
    },
    {
      id: 'node-9',
      activityId: 'end',
      name: '结束',
      type: 'endEvent',
      x: 500,
      y: 100,
      width: 36,
      height: 36,
      status: 'pending'
    }
  ]
}

// 工作流XML定义Mock数据
export const mockWorkflowXml: Record<string, string> = {
  'workflow-def-1': `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="leave-approval" name="请假审批流程">
    <startEvent id="start" name="开始"/>
    <userTask id="task-submit" name="提交申请"/>
    <userTask id="task-manager-approval" name="经理审批"/>
    <userTask id="task-hr-approval" name="HR审批"/>
    <endEvent id="end" name="结束"/>
  </process>
</definitions>`,
  'workflow-def-2': `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <process id="expense-reimbursement" name="费用报销流程">
    <startEvent id="start" name="开始"/>
    <userTask id="task-submit" name="提交报销"/>
    <userTask id="task-finance-review" name="财务审核"/>
    <endEvent id="end" name="结束"/>
  </process>
</definitions>`
}

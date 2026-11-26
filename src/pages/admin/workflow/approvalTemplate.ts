// Names are localized by the caller. The assigned user ID comes from the signed-in account.
export function approvalTemplate(userId: number | string | undefined, names: string[]) {
  const id = 'Approval_' + crypto.randomUUID().replace(/-/g, '')
  const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const [process, start, task, end] = names.map(attr)
  const assignee = userId == null ? '' : ` activiti:assignee="${attr(String(userId))}"`
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:activiti="http://activiti.org/bpmn" xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0" targetNamespace="http://iceeboot.com/workflow">
  <bpmn:process id="${id}" name="${process}" isExecutable="true">
    <bpmn:startEvent id="Start" name="${start}" />
    <bpmn:sequenceFlow id="ToReview" sourceRef="Start" targetRef="Review" />
    <bpmn:userTask id="Review" name="${task}"${assignee} />
    <bpmn:sequenceFlow id="ToEnd" sourceRef="Review" targetRef="End" />
    <bpmn:endEvent id="End" name="${end}" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram"><bpmndi:BPMNPlane id="Plane" bpmnElement="${id}">
    <bpmndi:BPMNShape id="Start_di" bioc:stroke="#287d67" bioc:fill="#e4f5ee" bpmnElement="Start"><dc:Bounds x="150" y="150" width="36" height="36"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="Review_di" bioc:stroke="#375f9e" bioc:fill="#eaf2ff" bpmnElement="Review"><dc:Bounds x="252" y="136" width="118" height="64"/></bpmndi:BPMNShape>
    <bpmndi:BPMNShape id="End_di" bioc:stroke="#52657e" bioc:fill="#f3f6fa" bpmnElement="End"><dc:Bounds x="436" y="150" width="36" height="36"/></bpmndi:BPMNShape>
    <bpmndi:BPMNEdge id="ToReview_di" bpmnElement="ToReview"><di:waypoint x="186" y="168"/><di:waypoint x="252" y="168"/></bpmndi:BPMNEdge>
    <bpmndi:BPMNEdge id="ToEnd_di" bpmnElement="ToEnd"><di:waypoint x="370" y="168"/><di:waypoint x="436" y="168"/></bpmndi:BPMNEdge>
  </bpmndi:BPMNPlane></bpmndi:BPMNDiagram>
</bpmn:definitions>`
}

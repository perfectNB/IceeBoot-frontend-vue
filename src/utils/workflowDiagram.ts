export const normalizeDiagramImage = (payload: Record<string, unknown> | string): string => {
  if (typeof payload === 'string') {
    return buildImageSource(payload)
  }
  const normalizedPayloads: Record<string, unknown>[] = [payload]
  const dataPayload = payload.data
  if (dataPayload && typeof dataPayload === 'object') {
    normalizedPayloads.push(dataPayload as Record<string, unknown>)
  }
  const resultPayload = payload.result
  if (resultPayload && typeof resultPayload === 'object') {
    normalizedPayloads.push(resultPayload as Record<string, unknown>)
  }
  const candidates = ['data', 'image', 'diagram', 'content', 'base64', 'diagramImage', 'file']
  for (const item of normalizedPayloads) {
    for (const key of candidates) {
      const value = item[key]
      if (typeof value === 'string' && value) {
        const contentType = resolveContentType(item)
        return buildImageSource(value, contentType)
      }
    }
  }
  return ''
}

const resolveContentType = (payload: Record<string, unknown>): string => {
  const contentType = payload.contentType
  if (typeof contentType === 'string' && contentType) return contentType
  const type = payload.type
  if (typeof type === 'string' && type) return type
  return ''
}

const buildImageSource = (value: string, contentType?: string): string => {
  if (value.startsWith('data:image')) return value
  const trimmed = value.trim()
  const isSvgText = trimmed.startsWith('<svg') || trimmed.includes('<svg')
  const isSvgBase64 = trimmed.startsWith('PD94') || trimmed.startsWith('PHN2Zy')
  if (isSvgText) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
  }
  if (isSvgBase64) {
    return `data:image/svg+xml;base64,${trimmed}`
  }
  if (contentType && contentType.includes('svg')) {
    return `data:${contentType};base64,${trimmed}`
  }
  if (contentType && contentType.startsWith('image/')) {
    return `data:${contentType};base64,${trimmed}`
  }
  return `data:image/png;base64,${trimmed}`
}

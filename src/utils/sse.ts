/** 处理跨网络分片的 UTF-8、CRLF、注释心跳及多行 data，不重试已经提交的请求。 */
export async function readEventStream<T>(body: ReadableStream<Uint8Array>, onEvent: (event: T) => void): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  function consume(final = false) {
    let boundary: RegExpExecArray | null
    while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
      if (boundary.index > 2 * 1024 * 1024) throw new Error('事件内容过大，连接已中断')
      const frame = buffer.slice(0, boundary.index)
      buffer = buffer.slice(boundary.index + boundary[0].length)
      const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).replace(/^ /, '')).join('\n')
      if (data) onEvent(JSON.parse(data) as T)
    }
    if (buffer.length > 2 * 1024 * 1024) throw new Error('事件内容过大，连接已中断')
    if (final && buffer.trim() && !buffer.trimStart().startsWith(':')) throw new Error('事件流未完整接收')
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      consume(done)
      if (done) break
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
// Vite 会把 worker 打包成独立 chunk
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

interface Props {
  url: string
  page: number
  onTotalPages?: (n: number) => void
}

interface DocEntry {
  promise: Promise<pdfjs.PDFDocumentProxy>
}

const docCache = new Map<string, DocEntry>()

/**
 * 先把整个 PDF 下载为 ArrayBuffer，再交给 pdf.js 渲染。
 * 不用 pdf.js 内置网络层的原因：部分托管网关返回 chunked + 不支持
 * Range 的响应，会让它的流式加载器永久挂起（无报错）。
 */
function getDoc(url: string): Promise<pdfjs.PDFDocumentProxy> {
  const cached = docCache.get(url)
  if (cached) return cached.promise

  const promise = (async () => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`PDF 下载失败 HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    return pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
  })()
  // 失败时清缓存，允许重试
  promise.catch(() => docCache.delete(url))
  docCache.set(url, { promise })
  return promise
}

export function PdfCanvas({ url, page, onTotalPages }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setLoading(true)
      setError(null)
      try {
        const doc = await getDoc(url)
        if (cancelled) return
        onTotalPages?.(doc.numPages)

        const pageNo = Math.min(Math.max(1, page), doc.numPages)
        const pdfPage = await doc.getPage(pageNo)
        if (cancelled) return

        // 按容器宽度适配（移动优先），DPR 通过把 scale × dpr 一并算入避免类型麻烦
        const cssWidth = canvas.parentElement?.clientWidth ?? 400
        const dpr = window.devicePixelRatio || 1
        const base = pdfPage.getViewport({ scale: 1 })
        const scale = (cssWidth / base.width) * dpr

        // 先设画布尺寸再渲染，避免闪烁残影
        const viewport = pdfPage.getViewport({ scale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${viewport.width / dpr}px`
        canvas.style.height = `${viewport.height / dpr}px`

        renderTaskRef.current?.cancel()
        const task = pdfPage.render({
          canvas,
          canvasContext: ctx,
          viewport,
        })
        renderTaskRef.current = task
        await task.promise
      } catch (e) {
        if ((e as { name?: string })?.name === 'RenderingCancelledException') return
        console.error('[MyDay] PDF 渲染失败', e)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    render()
    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
    }
  }, [url, page, onTotalPages])

  return (
    <div className="pdf-canvas-wrap-outer">
      {loading && !error && <div className="pdf-canvas-status">加载中…</div>}
      {error && <div className="pdf-canvas-status pdf-canvas-error">PDF 加载失败：{error}</div>}
      <div className="pdf-canvas-wrap">
        <canvas ref={canvasRef} className="pdf-canvas" />
      </div>
    </div>
  )
}

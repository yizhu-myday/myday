import { useEffect, useRef } from 'react'
import * as pdfjs from 'pdfjs-dist'
// Vite 会把 worker 打包成独立 chunk
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?worker'

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()

interface Props {
  url: string
  page: number
  onTotalPages?: (n: number) => void
}

/** 加载文档（缓存，避免翻页时重复下载解析） */
const docCache = new Map<string, Promise<pdfjs.PDFDocumentProxy>>()

function getDoc(url: string) {
  if (!docCache.has(url)) {
    const task = pdfjs.getDocument({ url })
    docCache.set(url, task.promise)
    // 加载失败时清掉缓存，下次可重试
    task.promise.catch(() => docCache.delete(url))
  }
  return docCache.get(url)!
}

export function PdfCanvas({ url, page, onTotalPages }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

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
        // RenderingCancelledException 是正常翻页竞争，忽略
        if ((e as { name?: string })?.name !== 'RenderingCancelledException') {
          console.error('[MyDay] PDF 渲染失败', e)
        }
      }
    }

    render()
    return () => {
      cancelled = true
      renderTaskRef.current?.cancel()
    }
  }, [url, page, onTotalPages])

  return (
    <div className="pdf-canvas-wrap">
      <canvas ref={canvasRef} className="pdf-canvas" />
    </div>
  )
}

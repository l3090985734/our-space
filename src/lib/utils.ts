export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Promise 超时兜底：防止 new Image() 加载不支持的格式（HEIC/RAW/损坏图片）
 * 时既不触发 onload 也不触发 onerror，导致 Promise 永久 pending →
 * UI 永远显示「压缩图片中」。
 *
 * 超过 timeoutMs 直接 reject，由调用方 catch 后降级或报错。
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(new Error(message))
      }, timeoutMs)
    }),
  ])
}

export async function sha256(message: string): Promise<string> {
  // 优先使用浏览器原生 crypto.subtle（HTTPS/localhost 可用）
  if (crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } catch {
      // crypto.subtle 存在但调用失败，回退到纯 JS
    }
  }
  // HTTP 环境或 crypto.subtle 不可用时的纯 JS SHA-256 回退
  return sha256Pure(message)
}

/** 纯 JavaScript SHA-256 实现，不依赖 crypto.subtle，HTTP 环境可用 */
function sha256Pure(message: string): string {
  function rotr(x: number, n: number) { return (x >>> n) | (x << (32 - n)) }
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]
  const bytes = new TextEncoder().encode(message)
  const bitLen = bytes.length * 8
  // Padding
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(padded.length - 4, bitLen, false)
  // Process blocks
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
  for (let i = 0; i < padded.length; i += 64) {
    const W = new Uint32Array(64)
    for (let t = 0; t < 16; t++) {
      W[t] = (padded[i + t * 4] << 24) | (padded[i + t * 4 + 1] << 16) | (padded[i + t * 4 + 2] << 8) | padded[i + t * 4 + 3]
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3)
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10)
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0
    }
    let [a, b, c, d, e, f, g, h] = H
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const ch = (e & f) ^ (~e & g)
      const temp1 = (h + S1 + ch + K[t] + W[t]) | 0
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (S0 + maj) | 0
      h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('')
}

export type CompressedImage = {
  blob: Blob
  format: 'webp' | 'jpeg'
  mimeType: string
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.8,
  format: 'webp' | 'jpeg' = 'webp'
): Promise<CompressedImage> {
  const task = new Promise<CompressedImage>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(objectUrl)

    const done = () => {
      try {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        // 避免超长图导致 canvas 显存爆炸（Safari 限制 ~4096px 高）
        const maxSafeHeight = 4096
        if (height > maxSafeHeight) {
          width = Math.round((width * maxSafeHeight) / height)
          height = maxSafeHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d', { alpha: format !== 'jpeg' })
        if (!ctx) {
          cleanup()
          reject(new Error('Failed to get canvas context'))
          return
        }

        // JPEG 背景填白，避免透明转黑色
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'
        canvas.toBlob(
          (blob) => {
            cleanup()
            if (blob) {
              resolve({ blob, format, mimeType })
            } else {
              // fallback：Safari 不支持 webp toBlob 时，用 jpeg 兜底
              // 并且把实际用的格式返回给调用方，确保后缀/Content-Type 全链路一致
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob) {
                    resolve({ blob: fallbackBlob, format: 'jpeg', mimeType: 'image/jpeg' })
                  } else {
                    reject(new Error('Failed to compress image'))
                  }
                },
                'image/jpeg',
                0.85
              )
            }
          },
          mimeType,
          quality
        )
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }

    img.onload = () => requestIdleCallback?.(done, { timeout: 120 }) ?? done()
    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
  return withTimeout(task, 60000, '图片压缩超时，请换一张小一点的图再试')
}

/**
 * 快速生成 400px 低质量预览图（<100KB），用于用户选图后 200ms 内渲染
 */
export async function fastPreview(file: File, maxWidth = 400): Promise<string> {
  const task = new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(objectUrl)

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no canvas ctx')
        ctx.imageSmoothingQuality = 'low'
        ctx.drawImage(img, 0, 0, width, height)
        cleanup()
        // 直接返回 dataURL，用于预览立刻显示（体积小不卡 UI）
        resolve(canvas.toDataURL('image/jpeg', 0.55))
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
  return withTimeout(task, 30000, '预览图生成超时，请重新选择图片')
}

export function generateThumbnail(
  file: File | Blob,
  maxSize = 40,
  quality = 0.3
): Promise<string> {
  const task = new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => URL.revokeObjectURL(objectUrl)

    img.onload = () => {
      try {
        let { width, height } = img
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.floor(width))
        canvas.height = Math.max(1, Math.floor(height))
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no canvas ctx')
        ctx.imageSmoothingQuality = 'low'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        cleanup()
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to load image'))
    }
    img.src = objectUrl
  })
  return withTimeout(task, 20000, '缩略图生成超时，请重新选择图片')
}

/** 上传进度事件回调 */
export type UploadProgress = {
  /** 0-100 */
  percent: number
  /** 已上传字节 */
  loaded: number
  /** 总字节 */
  total: number
  /** 当前速度 bytes/s（EMA 平滑） */
  speedBps: number
  /** 预估剩余秒数 */
  etaSec: number
  /** 已耗时秒数 */
  elapsedSec: number
}

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function formatSeconds(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '--'
  if (sec < 60) return `${Math.ceil(sec)} 秒`
  const m = Math.floor(sec / 60)
  const s = Math.ceil(sec % 60)
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

/** 基于 xhr 上传 + 进度回调（比 supabase-js 的 upload 多出 progress） */
export async function xhrUploadWithProgress(
  uploadUrl: string,
  supabaseAnonKey: string,
  file: Blob,
  mimeType: string,
  onProgress?: (p: UploadProgress) => void,
  signal?: AbortSignal
): Promise<{ path: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let lastLoaded = 0
    let lastTs = Date.now()
    // 指数移动平均，避免速度数字跳来跳去
    let emaSpeed = 0
    const alpha = 0.35
    const startTs = Date.now()

    // 根据 MIME 推断扩展名，保证 FormData 字段文件名与实际内容一致
    const fileExt = (() => {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg'
      if (mimeType.includes('png')) return 'png'
      return 'webp'
    })()

    signal?.addEventListener('abort', () => {
      try { xhr.abort() } catch { /* ignore */ }
      reject(new DOMException('Aborted', 'AbortError'))
    })

    xhr.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) {
        const now = Date.now()
        const dt = Math.max(1, (now - lastTs) / 1000)
        const instant = ((ev.loaded - lastLoaded) / dt)
        emaSpeed = emaSpeed === 0 ? instant : alpha * instant + (1 - alpha) * emaSpeed
        lastLoaded = ev.loaded
        lastTs = now
        const remainingBytes = Math.max(0, ev.total - ev.loaded)
        onProgress?.({
          percent: ev.total === 0 ? 0 : Math.min(100, Math.round((ev.loaded / ev.total) * 100)),
          loaded: ev.loaded,
          total: ev.total,
          speedBps: Math.round(emaSpeed),
          etaSec: emaSpeed > 0 ? Math.round(remainingBytes / emaSpeed) : 0,
          elapsedSec: Math.round((now - startTs) / 1000),
        })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          resolve({ path: json?.Key || json?.path || (uploadUrl.includes('/object/') ? uploadUrl.split('/object/')[1] : '') })
        } catch {
          resolve({ path: '' })
        }
      } else {
        let msg = xhr.statusText || `HTTP ${xhr.status}`
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (json?.error) msg = typeof json.error === 'string' ? json.error : JSON.stringify(json.error)
          if (json?.msg) msg = json.msg
        } catch { /* ignore parse fail */ }
        reject(new Error(msg))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败')))
    xhr.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))

    xhr.open('POST', uploadUrl, true)
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    // 用 multipart：Supabase storage object 端点要求 file 字段名必须叫 "file"
    // 文件名后缀必须与 Blob 实际内容 MIME 一致，否则 Content-Disposition 里的 filename
    // 和 MIME 不匹配会导致存储对象元数据错误、浏览器渲染失败
    const form = new FormData()
    form.append('file', file, `image.${fileExt}`)
    xhr.send(form)
  })
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  })
}

export function calculateDaysLeft(targetDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate + 'T00:00:00+08:00')
  target.setHours(0, 0, 0, 0)
  
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function calculateDaysSince(startDate: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const start = new Date(startDate + 'T00:00:00+08:00')
  start.setHours(0, 0, 0, 0)
  
  const diffMs = now.getTime() - start.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

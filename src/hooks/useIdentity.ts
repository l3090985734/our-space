import { useState } from 'react'
import type { Identity } from '../types'

const STORAGE_KEY = 'our-space-identity'

/** 同步读 identity：localStorage.getItem 是纯内存同步（<0.1ms），
 *  无需 useEffect + isLoading 闪一轮全屏 spinner 白屏。
 */
function readIdentity(): Identity | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'he' || saved === 'she') return saved
    return null
  } catch {
    // 隐私模式或 localStorage 不可用，返回 null 正常走 IdentityPicker。
    return null
  }
}

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(() => readIdentity())
  // isLoading 永远 false：直接同步初始化。保留返回字段避免类型破坏。
  const isLoading = false

  const selectIdentity = (id: Identity) => {
    try { localStorage.setItem(STORAGE_KEY, id) } catch {}
    setIdentity(id)
  }

  const clearIdentity = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setIdentity(null)
  }

  return { identity, isLoading, selectIdentity, clearIdentity }
}

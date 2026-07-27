type RefreshListener = () => void | Promise<void>
const listeners: Set<RefreshListener> = new Set()

export function triggerRefresh(): Promise<void> {
  const promises = [...listeners].map((fn) => {
    try {
      const result = fn()
      return result instanceof Promise ? result : Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  })
  return Promise.all(promises).then(() => {})
}

export function onRefresh(callback: RefreshListener) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

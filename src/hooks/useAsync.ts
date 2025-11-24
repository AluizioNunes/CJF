import { useCallback, useEffect, useRef, useState } from 'react'
import { message } from 'antd'

type DataOptions<T> = {
  auto?: boolean
  deps?: any[]
  onLoaded?: (value: T) => void
  errorTitle?: string
}

export function useAsyncData<T>(loader: () => Promise<T>, options: DataOptions<T> = {}) {
  const { auto = true, deps = [], onLoaded, errorTitle } = options
  const [data, setData] = useState<T>(undefined as unknown as T)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastRun = useRef(0)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    const runId = ++lastRun.current
    try {
      const result = await loader()
      if (runId === lastRun.current) {
        setData(result)
        onLoaded?.(result)
      }
    } catch (e: any) {
      const msg = e?.message || 'Falha ao carregar'
      setError(msg)
      message.error(errorTitle ? `${errorTitle}: ${msg}` : msg)
      // Para listas, manter data como array vazio quando falhar
      try { setData(([] as unknown) as T) } catch {}
      const status = typeof e?.status === 'number' ? e.status : 0
      const isCritical = !status || status >= 500
      if (import.meta.env.DEV) console.error('[Data]', e)
      else if (isCritical) console.warn('[Data:critical]', msg)
    } finally {
      if (runId === lastRun.current) setLoading(false)
    }
  }, [loader, onLoaded, errorTitle])

  useEffect(() => {
    if (auto) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, reload, setData, setError }
}

type SuccessMessage<R, A extends any[]> = string | ((result: R, args: A) => string)
type ActionOptions<R, A extends any[]> = {
  successMessage?: SuccessMessage<R, A>
  onSuccess?: (result: R) => void
  errorTitle?: string
}

export function useAsyncAction<A extends any[], R>(fn: (...args: A) => Promise<R>, options: ActionOptions<R, A> = {}) {
  const { successMessage, onSuccess, errorTitle } = options
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (...args: A) => {
    setLoading(true)
    try {
      const result = await fn(...args)
      if (successMessage) {
        const msg = typeof successMessage === 'function' ? successMessage(result, args) : successMessage
        if (msg) message.success(msg)
      }
      onSuccess?.(result)
      return result
    } catch (e: any) {
      const msg = e?.message || 'Falha na operação'
      message.error(errorTitle ? `${errorTitle}: ${msg}` : msg)
      const status = typeof e?.status === 'number' ? e.status : 0
      const isCritical = !status || status >= 500
      if (import.meta.env.DEV) console.error('[Action]', e)
      else if (isCritical) console.warn('[Action:critical]', msg)
      return undefined
    } finally {
      setLoading(false)
    }
  }, [fn, successMessage, onSuccess, errorTitle])

  return { run, loading }
}
type CacheEntry<T> = { value: T; expiresAt: number }

export class MemoryCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>()
  private defaultTtlMs: number

  constructor(defaultTtlMs = 5 * 60000) {
    this.defaultTtlMs = defaultTtlMs
  }

  get(key: string): T | undefined {
    const e = this.store.get(key)
    if (!e) return undefined
    if (Date.now() > e.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return e.value
  }

  set(key: string, value: T, ttlMs?: number) {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs)
    this.store.set(key, { value, expiresAt })
  }

  delete(key: string) {
    this.store.delete(key)
  }

  clear() {
    this.store.clear()
  }
}

export function memoizeAsync<F extends (...args: any[]) => Promise<any>>(
  fn: F,
  opts?: { ttlMs?: number; keyResolver?: (...args: Parameters<F>) => string }
) {
  const cache = new MemoryCache<Awaited<ReturnType<F>>>(opts?.ttlMs ?? 5 * 60000)
  return (async (...args: Parameters<F>): Promise<Awaited<ReturnType<F>>> => {
    const key = opts?.keyResolver ? opts.keyResolver(...args) : JSON.stringify(args)
    const hit = cache.get(key)
    if (hit !== undefined) return hit as Awaited<ReturnType<F>>
    const value = await fn(...args)
    cache.set(key, value)
    return value
  }) as F
}

// Cache simples baseado em URL para requisições JSON
const fetchJsonCache = new MemoryCache<any>(2 * 60000)
export async function cachedFetchJson(url: string): Promise<any> {
  const hit = fetchJsonCache.get(url)
  if (hit !== undefined) return hit
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao buscar ${url}`)
  const json = await resp.json()
  fetchJsonCache.set(url, json)
  return json
}
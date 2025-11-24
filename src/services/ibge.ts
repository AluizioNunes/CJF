export type SidraResponse = any

const BASE = 'https://servicodados.ibge.gov.br/api/v3/agregados'

// Helpers para montar períodos e converter resposta SIDRA em série
function toYYYYMM(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

function buildPeriodRange(inicio?: Date, fim?: Date) {
  const start = inicio ? toYYYYMM(inicio) : toYYYYMM(new Date(new Date().setFullYear(new Date().getFullYear() - 5)))
  const end = fim ? toYYYYMM(fim) : toYYYYMM(new Date())
  return `${start}-${end}`
}

export type SeriePonto = { data: Date; valor: number }

export function sidraToSerie(resp: SidraResponse): SeriePonto[] {
  try {
    const serieObj = resp?.[0]?.resultados?.[0]?.series?.[0]?.serie ?? {}
    return Object.entries(serieObj)
      .map(([per, val]: [string, any]) => {
        const year = Number(per.slice(0, 4))
        const month = Number(per.slice(4, 6)) - 1
        return { data: new Date(year, month, 1), valor: Number(val) }
      })
      .sort((a: SeriePonto, b: SeriePonto) => a.data.getTime() - b.data.getTime())
  } catch {
    return []
  }
}

import { memoizeAsync, cachedFetchJson } from '../utils/cache'

export async function fetchIPCAE(periodo: string) {
  // Tabela 7060, variável 63 (IPCA-15/Especial), Brasil (N1)
  const url = `${BASE}/7060/periodos/${periodo}/variaveis/63?localidades=N1[all]`
  return cachedFetchJson(url) as Promise<SidraResponse>
}

export async function fetchINPC(periodo: string) {
  // Tabela 1736, variável 44 (Variação mensal), Brasil (N1)
  const url = `${BASE}/1736/periodos/${periodo}/variaveis/44?localidades=N1[all]`
  return cachedFetchJson(url) as Promise<SidraResponse>
}

export async function fetchIpcaeSerie(opts?: { inicio?: Date; fim?: Date }): Promise<SeriePonto[]> {
  const periodo = buildPeriodRange(opts?.inicio, opts?.fim)
  const resp = await fetchIPCAE(periodo)
  return sidraToSerie(resp)
}

export async function fetchInpcSerie(opts?: { inicio?: Date; fim?: Date }): Promise<SeriePonto[]> {
  const periodo = buildPeriodRange(opts?.inicio, opts?.fim)
  const resp = await fetchINPC(periodo)
  return sidraToSerie(resp)
}

// Versões memoizadas por janela de período
export const fetchIpcaeSerieCached = memoizeAsync(fetchIpcaeSerie, {
  ttlMs: 10 * 60000,
  keyResolver: (opts?: { inicio?: Date; fim?: Date }) => {
    return `ipcae:${opts?.inicio?.toISOString() ?? 'none'}:${opts?.fim?.toISOString() ?? 'none'}`
  },
})

export const fetchInpcSerieCached = memoizeAsync(fetchInpcSerie, {
  ttlMs: 10 * 60000,
  keyResolver: (opts?: { inicio?: Date; fim?: Date }) => {
    return `inpc:${opts?.inicio?.toISOString() ?? 'none'}:${opts?.fim?.toISOString() ?? 'none'}`
  },
})
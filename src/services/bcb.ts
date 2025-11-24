import { format, parse } from 'date-fns'
import { cachedFetchJson, memoizeAsync } from '../utils/cache'

export type SeriePonto = { data: Date; valor: number }

function toBCBDate(d: Date) {
  return format(d, 'dd/MM/yyyy')
}

function parseBCBDate(s: string) {
  return parse(s, 'dd/MM/yyyy', new Date())
}

export async function fetchSgs(
  codigo: number | string,
  opts?: { inicio?: Date; fim?: Date }
): Promise<SeriePonto[]> {
  const base = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json`
  let url = base
  const isPossiblyDaily = String(codigo) === '11' // SELIC pode exigir janela de 10 anos

  const inicio = opts?.inicio ?? (isPossiblyDaily ? new Date(new Date().setFullYear(new Date().getFullYear() - 10)) : undefined)
  const fim = opts?.fim
  if (inicio) url += `&dataInicial=${toBCBDate(inicio)}`
  if (fim) url += `&dataFinal=${toBCBDate(fim)}`

  const json = await cachedFetchJson(url)
  if (!Array.isArray(json)) return []
  return json.map((row: any) => ({ data: parseBCBDate(row.data), valor: Number(String(row.valor).replace(',', '.')) }))
}

export async function fetchSelic(opts?: { inicio?: Date; fim?: Date }) {
  return fetchSgs(11, opts)
}

// Versão cacheada (memoizada) por janela de datas
export const fetchSelicCached = memoizeAsync(fetchSelic, {
  ttlMs: 10 * 60000,
  keyResolver: (opts?: { inicio?: Date; fim?: Date }) => {
    const i = opts?.inicio ? format(opts.inicio, 'yyyy-MM-dd') : 'none'
    const f = opts?.fim ? format(opts.fim, 'yyyy-MM-dd') : 'none'
    return `selic:${i}:${f}`
  },
})

export async function fetchIpca(opts?: { inicio?: Date; fim?: Date }) {
  return fetchSgs(433, opts)
}
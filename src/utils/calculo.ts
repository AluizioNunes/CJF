// Utilitários de cálculo para composição mensal SELIC e índices IPCA-E/INPC

export type SeriePonto = { data: Date; valor: number }

function toYearMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function agruparPorMes(serie: SeriePonto[]): Map<string, SeriePonto[]> {
  const map = new Map<string, SeriePonto[]>()
  for (const p of serie) {
    const k = toYearMonthKey(p.data)
    const arr = map.get(k) ?? []
    arr.push(p)
    map.set(k, arr)
  }
  return map
}

// SELIC (diária) → fator composto mensal ao longo do período
export function fatorCompostoSelicMensalAPartirDiaria(serieDiaria: SeriePonto[]): number {
  const grupos = agruparPorMes(serieDiaria)
  let fatorTotal = 1
  for (const arr of grupos.values()) {
    const fatorMes = arr.reduce((acc, p) => acc * (1 + p.valor / 100), 1)
    fatorTotal *= fatorMes
  }
  return fatorTotal
}

// SELIC (diária) método simples (não cumulativa)
export function fatorSelicSimples(serieDiaria: SeriePonto[]): number {
  const somaPercent = serieDiaria.reduce((acc, p) => acc + p.valor, 0)
  return 1 + somaPercent / 100
}

// Índices mensais (IPCA-E/INPC) → composição mensal multiplicativa
export function fatorCompostoMensal(serieMensal: SeriePonto[]): number {
  return serieMensal.reduce((acc, p) => acc * (1 + p.valor / 100), 1)
}

export type CombinacaoParametros = {
  valorInicial: number
  metodoSelic: 'simples' | 'mensal'
}

export function calcularCombinacaoIndices(
  params: CombinacaoParametros,
  opts: { selic?: SeriePonto[]; ipcae?: SeriePonto[]; inpc?: SeriePonto[] }
) {
  const fatorSelic = opts.selic
    ? (params.metodoSelic === 'mensal'
        ? fatorCompostoSelicMensalAPartirDiaria(opts.selic)
        : fatorSelicSimples(opts.selic))
    : 1

  const fatorIpcae = opts.ipcae ? fatorCompostoMensal(opts.ipcae) : 1
  const fatorInpc = opts.inpc ? fatorCompostoMensal(opts.inpc) : 1

  const fatorIndice = fatorIpcae * fatorInpc
  const valorCorrigidoPorIndice = params.valorInicial * fatorIndice
  const valorComSelic = valorCorrigidoPorIndice * fatorSelic

  return {
    fatorSelic,
    fatorIpcae,
    fatorInpc,
    fatorIndice,
    valorCorrigidoPorIndice,
    valorComSelic,
    valorFinal: valorComSelic,
    percentuais: {
      selic: (fatorSelic - 1) * 100,
      ipcae: (fatorIpcae - 1) * 100,
      inpc: (fatorInpc - 1) * 100,
      total: (fatorSelic * fatorIndice - 1) * 100,
    },
  }
}

// --- Juros fixos mensais ---
import { differenceInMonths } from 'date-fns'

export type JurosFixosParams = {
  taxaMensalPercent: number
  metodo: 'simples' | 'composto'
  inicio: Date
  fim: Date
}

export function fatorJurosFixosMensais(params: JurosFixosParams): number {
  const meses = Math.max(0, differenceInMonths(params.fim, params.inicio))
  const r = params.taxaMensalPercent / 100
  if (meses <= 0 || r <= 0) return 1
  if (params.metodo === 'simples') {
    return 1 + r * meses
  }
  // composto mensal
  return Math.pow(1 + r, meses)
}

export function calcularComIndicesEJuros(
  base: number,
  opts: { selic?: SeriePonto[]; ipcae?: SeriePonto[]; inpc?: SeriePonto[] },
  params: { metodoSelic: 'simples' | 'mensal'; juros?: JurosFixosParams }
) {
  const comb = calcularCombinacaoIndices({ valorInicial: base, metodoSelic: params.metodoSelic }, opts)
  const fatorJuros = params.juros ? fatorJurosFixosMensais(params.juros) : 1
  const valorFinal = comb.valorFinal * fatorJuros
  return { ...comb, fatorJuros, valorFinal }
}

// ---------------- Detalhamento mensal, regimes de juros, arredondamentos ----------------
import { addMonths, differenceInDays, endOfMonth, startOfMonth } from 'date-fns'

export type Arredondamento = { nivel: 'none' | 'mensal' | 'final'; casas?: number }
export type BaseTemporal = 'mensal' | 'diaria'

export type RegraMarcoJuros = {
  de?: Date
  ate?: Date
  metodo: 'simples' | 'composto' | 'selic' | 'legal' | 'nenhum'
  taxaMensalPercent?: number
}

export type DetalheMensalRow = {
  competencia: string // YYYY-MM
  indicePercent: number
  jurosPercent: number
  fatorIndiceAcumulado: number
  fatorJurosAcumulado: number
  valorCorrigidoAcumulado: number // sem juros
  valorJurosAcumulado: number
  valorFinalAcumulado: number
}

function roundIf(v: number, arred: Arredondamento | undefined): number {
  if (!arred || arred.nivel === 'none') return v
  const casas = arred.casas ?? 2
  const f = Math.pow(10, casas)
  return Math.round(v * f) / f
}

function competenciaKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function listarCompetencias(inicio: Date, fim: Date): Date[] {
  const start = startOfMonth(inicio)
  const end = startOfMonth(fim)
  const res: Date[] = []
  let cur = start
  while (cur <= end) {
    res.push(cur)
    cur = addMonths(cur, 1)
  }
  return res
}

function fracaoMes(inicio: Date, fim: Date, mes: Date): number {
  const inicioMes = startOfMonth(mes)
  const fimMes = endOfMonth(mes)
  const ini = inicio > inicioMes ? inicio : inicioMes
  const fi = fim < fimMes ? fim : fimMes
  if (fi < ini) return 0
  const diasPeriodo = differenceInDays(fi, ini) + 1
  const diasMes = differenceInDays(fimMes, inicioMes) + 1
  return Math.max(0, Math.min(1, diasPeriodo / diasMes))
}

function mapSerieMensalPorCompetencia(serie: SeriePonto[] | undefined): Map<string, number> {
  const m = new Map<string, number>()
  ;(serie ?? []).forEach(p => {
    m.set(competenciaKey(p.data), p.valor)
  })
  return m
}

function selicPercentPorMes(selicDiaria: SeriePonto[] | undefined): Map<string, number> {
  if (!selicDiaria || selicDiaria.length === 0) return new Map()
  const grupos = agruparPorMes(selicDiaria)
  const res = new Map<string, number>()
  for (const [key, arr] of grupos.entries()) {
    const fatorMes = arr.reduce((acc, p) => acc * (1 + p.valor / 100), 1)
    res.set(key, (fatorMes - 1) * 100)
  }
  return res
}

function obterTaxaDeJurosParaMes(
  mes: Date,
  regime: RegraMarcoJuros[] | undefined,
  defaultTaxa: number,
  defaultMetodo: 'simples' | 'composto' | 'selic' | 'nenhum'
): { taxa: number; metodo: 'simples' | 'composto' | 'selic' | 'legal' | 'nenhum' } {
  if (!regime || regime.length === 0) return { taxa: defaultTaxa, metodo: defaultMetodo }
  const d = mes
  for (const r of regime) {
    const deOk = r.de ? d >= startOfMonth(r.de) : true
    const ateOk = r.ate ? d <= startOfMonth(r.ate) : true
    if (deOk && ateOk) {
      return { taxa: r.taxaMensalPercent ?? 0, metodo: r.metodo }
    }
  }
  return { taxa: defaultTaxa, metodo: defaultMetodo }
}

export type CalcularDetalhadoOpts = {
  inicio: Date
  fim: Date
  base: BaseTemporal
  arredondamento?: Arredondamento
  selicDiaria?: SeriePonto[]
  ipcaeMensal?: SeriePonto[]
  inpcMensal?: SeriePonto[]
  jurosFixos?: { taxaMensalPercent: number; metodo: 'simples' | 'composto' }
  regimeMarcos?: RegraMarcoJuros[]
}

export function calcularDetalhadoMensal(
  valorInicial: number,
  opts: CalcularDetalhadoOpts
): { rows: DetalheMensalRow[]; totais: { fatorIndice: number; fatorJuros: number; valorFinal: number } } {
  const comps = listarCompetencias(opts.inicio, opts.fim)
  const ipcaeMap = mapSerieMensalPorCompetencia(opts.ipcaeMensal)
  const inpcMap = mapSerieMensalPorCompetencia(opts.inpcMensal)
  const selicMap = selicPercentPorMes(opts.selicDiaria)

  const rows: DetalheMensalRow[] = []
  let fatorIndiceAcum = 1
  let fatorJurosAcum = 1
  let principalCorrigido = valorInicial
  let jurosAcumulado = 0
  let valorFinalAcum = valorInicial

  for (const mes of comps) {
    const k = competenciaKey(mes)
    const indicePercentBruto = (ipcaeMap.get(k) ?? 0) + (inpcMap.get(k) ?? 0)
    const jurosDefault = opts.jurosFixos ?? { taxaMensalPercent: 0, metodo: 'simples' }
    const regimeMes = obterTaxaDeJurosParaMes(mes, opts.regimeMarcos, jurosDefault.taxaMensalPercent, jurosDefault.metodo)

    const fracao = opts.base === 'diaria' ? fracaoMes(opts.inicio, opts.fim, mes) : 1
    const indicePercent = indicePercentBruto * fracao
    let jurosPercent = regimeMes.metodo === 'selic' ? (selicMap.get(k) ?? 0) * fracao : (regimeMes.taxa * fracao)
    if (regimeMes.metodo === 'legal') {
      const selicMes = (selicMap.get(k) ?? 0) * fracao
      jurosPercent = Math.max(0, selicMes - indicePercent)
    }

    // Correção monetária (aplica no principal SEM juros)
    const fatorIndiceMes = 1 + indicePercent / 100
    principalCorrigido = principalCorrigido * fatorIndiceMes
    fatorIndiceAcum *= fatorIndiceMes

    // Juros de mora
    if (regimeMes.metodo === 'nenhum') {
      // nada
    } else if (regimeMes.metodo === 'simples') {
      const jurosMesValor = principalCorrigido * (jurosPercent / 100)
      const jm = roundIf(jurosMesValor, opts.arredondamento?.nivel === 'mensal' ? opts.arredondamento : undefined)
      jurosAcumulado += jm
      valorFinalAcum = principalCorrigido + jurosAcumulado
      // fator de juros acumulado aqui é calculado sobre base inicial equivalente
      // aproximamos por 1 + (jurosAcumulado / valorInicial)
      fatorJurosAcum = 1 + (jurosAcumulado / valorInicial)
    } else if (regimeMes.metodo === 'composto' || regimeMes.metodo === 'selic' || regimeMes.metodo === 'legal') {
      // Primeiro aplica correção no valor final acumulado, depois os juros compostos
      const valorAntesJuro = valorFinalAcum * fatorIndiceMes
      const incrementoJuro = valorAntesJuro * (jurosPercent / 100)
      const inc = roundIf(incrementoJuro, opts.arredondamento?.nivel === 'mensal' ? opts.arredondamento : undefined)
      valorFinalAcum = valorAntesJuro + inc
      // atualiza juros acumulado como diferença entre valorFinal e principal corrigido
      jurosAcumulado = valorFinalAcum - principalCorrigido
      // fatorJuros acumulado multiplicativo aproximado
      fatorJurosAcum *= 1 + (jurosPercent / 100)
    }

    // arredondamento mensal sobre principal e final
    if (opts.arredondamento?.nivel === 'mensal') {
      principalCorrigido = roundIf(principalCorrigido, opts.arredondamento)
      valorFinalAcum = roundIf(valorFinalAcum, opts.arredondamento)
    }

    rows.push({
      competencia: k,
      indicePercent,
      jurosPercent,
      fatorIndiceAcumulado: fatorIndiceAcum,
      fatorJurosAcumulado: fatorJurosAcum,
      valorCorrigidoAcumulado: principalCorrigido,
      valorJurosAcumulado: jurosAcumulado,
      valorFinalAcumulado: valorFinalAcum,
    })
  }

  // arredondamento final
  if (opts.arredondamento?.nivel === 'final') {
    principalCorrigido = roundIf(principalCorrigido, opts.arredondamento)
    valorFinalAcum = roundIf(valorFinalAcum, opts.arredondamento)
  }

  const totais = {
    fatorIndice: fatorIndiceAcum,
    fatorJuros: fatorJurosAcum,
    valorFinal: valorFinalAcum,
  }

  return { rows, totais }
}
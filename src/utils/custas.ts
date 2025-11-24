export type CustasItemRule = {
  id: string
  label: string
  tipo: 'fixo' | 'percentual' | 'diligencia'
  valorFixo?: number
  percentual?: number // 0.01 = 1%
  minimo?: number
  maximo?: number
  baseKm?: number // valor base por diligência
  valorPorKm?: number // adicional por km
}

export type CustasCalcInput = {
  valorCausa?: number
  valorExecutado?: number
  distanciaKm?: number
  quantidade?: number
  isento?: boolean
}

export type CustasCalcResult = {
  itens: { id: string; label: string; quantidade: number; valorUnitario: number; subtotal: number }[]
  total: number
}

export function calcularItem(rule: CustasItemRule, input: CustasCalcInput): { valorUnitario: number } {
  if (rule.tipo === 'fixo') {
    return { valorUnitario: rule.valorFixo ?? 0 }
  }
  if (rule.tipo === 'percentual') {
    const base = (input.valorCausa ?? input.valorExecutado ?? 0)
    let v = base * (rule.percentual ?? 0)
    if (rule.minimo != null) v = Math.max(v, rule.minimo)
    if (rule.maximo != null) v = Math.min(v, rule.maximo)
    return { valorUnitario: v }
  }
  if (rule.tipo === 'diligencia') {
    const base = rule.baseKm ?? 0
    const extra = (input.distanciaKm ?? 0) * (rule.valorPorKm ?? 0)
    return { valorUnitario: base + extra }
  }
  return { valorUnitario: 0 }
}

export function calcularCustas(rules: CustasItemRule[], inputs: Record<string, CustasCalcInput>): CustasCalcResult {
  const itens = rules.map((r) => {
    const input = inputs[r.id] ?? {}
    const q = input.quantidade ?? 1
    const { valorUnitario } = calcularItem(r, input)
    return {
      id: r.id,
      label: r.label,
      quantidade: q,
      valorUnitario,
      subtotal: valorUnitario * q,
    }
  })
  const total = itens.reduce((acc, it) => acc + it.subtotal, 0)
  return { itens, total }
}

// Regras padrão (placeholders) — substituir conforme o Manual CJF 2025
export const regrasCustas = {
  acoesCiveis: [
    { id: 'distribuicao', label: 'Custas de distribuição (percentual sobre o valor da causa)', tipo: 'percentual', percentual: 0.01, minimo: 50 },
    { id: 'citacao', label: 'Citação e atos iniciais (fixo por ato)', tipo: 'fixo', valorFixo: 30 },
    { id: 'audiencia', label: 'Audiência (fixo por audiência)', tipo: 'fixo', valorFixo: 80 },
  ] as CustasItemRule[],
  recursosCiveis: [
    { id: 'preparo', label: 'Preparo (percentual sobre o valor da causa)', tipo: 'percentual', percentual: 0.02, minimo: 80 },
    { id: 'embargosDeclaracao', label: 'Embargos de declaração (fixo)', tipo: 'fixo', valorFixo: 40 },
  ] as CustasItemRule[],
  execucao: [
    { id: 'taxaExecucao', label: 'Taxa de execução (percentual sobre valor executado)', tipo: 'percentual', percentual: 0.01, minimo: 60 },
    { id: 'penhora', label: 'Atos de penhora/avaliação (fixo por ato)', tipo: 'fixo', valorFixo: 50 },
  ] as CustasItemRule[],
  embargosIncidentes: [
    { id: 'embargosExecucao', label: 'Embargos à execução (fixo)', tipo: 'fixo', valorFixo: 70 },
    { id: 'incidenteProcessual', label: 'Incidente processual (fixo por incidente)', tipo: 'fixo', valorFixo: 45 },
  ] as CustasItemRule[],
  mandadosServicos: [
    { id: 'diligencia', label: 'Diligência de oficial (base + km)', tipo: 'diligencia', baseKm: 60, valorPorKm: 1.5 },
    { id: 'certidao', label: 'Certidão/cópia (fixo por unidade)', tipo: 'fixo', valorFixo: 5 },
  ] as CustasItemRule[],
}
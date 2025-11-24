import type { RegionalCustasConfig } from './types'

const TRF1: RegionalCustasConfig = {
  regiao: 'TRF1',
  tabelaI: { percentual: 0.01, minimo: 50, maximo: undefined },
  tabelaIII: {
    itens: [
      { id: 'arrematacao', label: 'Arrematação', valor: 0 },
      { id: 'adjudicacao', label: 'Adjudicação', valor: 0 },
      { id: 'remicao', label: 'Remição', valor: 0 },
      { id: 'certidao', label: 'Certidões', valor: 5 },
      { id: 'reprografia', label: 'Reprografia / cópias', valor: 1 },
    ],
  },
  porteRemessaRetorno: [
    { subsecao: 'SJDF-Distrito Federal', valor: 0 },
    { subsecao: 'SJGO-Goiás', valor: undefined },
    { subsecao: 'SJMT-Mato Grosso', valor: undefined },
    { subsecao: 'SJBA-Bahia', valor: undefined },
    { subsecao: 'SJAM-Amazonas', valor: undefined },
    { subsecao: 'SJPA-Pará', valor: undefined },
    { subsecao: 'SJRO-Rondônia', valor: undefined },
    { subsecao: 'SJAC-Acre', valor: undefined },
    { subsecao: 'SJRR-Roraima', valor: undefined },
    { subsecao: 'SJPI-Piauí', valor: undefined },
    { subsecao: 'SJMA-Maranhão', valor: undefined },
    { subsecao: 'SJTO-Tocantins', valor: undefined },
  ],
  sources: [
    'https://www.trf1.jus.br/sjap/processual/calculos-custas-e-despesas-processuais',
    'https://portal.trf1.jus.br/sjgo/processual/calculos-custas-e-despesas-processuais/calculos-custas-e-despesas-processuais.htm',
  ],
  observacoes: 'Valores definidos por portarias regionais; DF/E-Proc com isenções de porte. Tabela I: 1% base, mínimo R$ 50.',
  updatedAt: new Date().toISOString(),
}

export default TRF1
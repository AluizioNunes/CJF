import type { RegionalCustasConfig } from './types'

const TRF1: RegionalCustasConfig = {
  regiao: 'TRF1',
  tabelaI: { percentual: undefined, minimo: undefined, maximo: undefined },
  tabelaIII: {
    itens: [
      { id: 'arrematacao', label: 'Arrematação', valor: undefined },
      { id: 'adjudicacao', label: 'Adjudicação', valor: undefined },
      { id: 'remicao', label: 'Remição', valor: undefined },
      { id: 'certidao', label: 'Certidões', valor: undefined },
      { id: 'reprografia', label: 'Reprografia / cópias', valor: undefined },
    ],
  },
  porteRemessaRetorno: [
    { subsecao: 'SJDF-Distrito Federal', valor: undefined },
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
  observacoes: 'Valores definidos por portarias regionais; DF costuma ter exceção para porte.'
}

export default TRF1
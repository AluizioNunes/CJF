import type { RegionalCustasConfig } from './types'

const CJF: RegionalCustasConfig = {
  regiao: 'CJF',
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
  porteRemessaRetorno: [],
  sources: [
    'https://www.cjf.jus.br/publico/biblioteca/Res%20267-2013.pdf',
  ],
  observacoes: 'Manual CJF 2025 referencia fórmulas, valores conforme tribunais regionais e Lei 9.289/1996.',
}

export default CJF
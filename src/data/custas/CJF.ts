import type { RegionalCustasConfig } from './types'

const CJF: RegionalCustasConfig = {
  regiao: 'CJF',
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
  porteRemessaRetorno: [],
  sources: [
    'https://www.cjf.jus.br/publico/biblioteca/Res%20267-2013.pdf',
  ],
  observacoes: 'Manual CJF 2025 referencia fórmulas; valores regionais prevalecem. Tabela I: 1% base, mínimo R$ 50 como padrão inicial.',
  updatedAt: new Date().toISOString(),
}

export default CJF
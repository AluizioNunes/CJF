import type { RegionalCustasConfig } from './types'

const TRF2: RegionalCustasConfig = {
  regiao: 'TRF2',
  tabelaI: { percentual: 0.01, minimo: 50, maximo: undefined },
  tabelaIII: {
    itens: [
      { id: 'arrematacao', label: 'Arrematação', valor: 0 },
      { id: 'adjudicacao', label: 'Adjudicação', valor: 0 },
      { id: 'remicao', label: 'Remição', valor: 0 },
      { id: 'certidao', label: 'Certidões (UFIR em reais)', valor: 10 },
      { id: 'reprografia', label: 'Reprografia / cópias', valor: 1 },
    ],
  },
  porteRemessaRetorno: [
    { subsecao: 'JFRJ-Rio de Janeiro', valor: undefined },
    { subsecao: 'JFES-Espírito Santo', valor: undefined },
  ],
  sources: [
    'https://www.trf2.jus.br/trf2/artigo/saj/custas-judiciais-no-trf2',
    'https://www.trf2.jus.br/jfrj/consultas-e-servicos/custas-judiciais',
  ],
  observacoes: 'Tabela em UFIR convertida para reais; porte isento no e-Proc conforme TRF2. Tabela I: 1% base, mínimo R$ 50.',
  updatedAt: new Date().toISOString(),
}

export default TRF2
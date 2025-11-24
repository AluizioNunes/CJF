import type { RegionalCustasConfig } from './types'

const TRF2: RegionalCustasConfig = {
  regiao: 'TRF2',
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
    { subsecao: 'JFRJ-Rio de Janeiro', valor: undefined },
    { subsecao: 'JFES-Espírito Santo', valor: undefined },
  ],
  sources: [
    'https://www.trf2.jus.br/trf2/artigo/saj/custas-judiciais-no-trf2',
    'https://www.trf2.jus.br/jfrj/consultas-e-servicos/custas-judiciais',
  ],
  observacoes: 'Tabela em UFIR convertida para reais; porte isento no e-Proc conforme TRF2.'
}

export default TRF2
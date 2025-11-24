import type { RegionalCustasConfig } from './types'

const TRF5: RegionalCustasConfig = {
  regiao: 'TRF5',
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
    { subsecao: 'JFCE-Fortaleza', valor: undefined },
    { subsecao: 'JFPE-Recife', valor: undefined },
    { subsecao: 'JFPB-João Pessoa', valor: undefined },
    { subsecao: 'JFAL-Maceió', valor: undefined },
    { subsecao: 'JFRN-Natal', valor: undefined },
    { subsecao: 'JFSE-Aracaju', valor: undefined },
  ],
  sources: [
    'https://custas.trf5.jus.br/custasinternet/paginas/principal/principal.faces',
  ],
  observacoes: 'Valores devem ser obtidos da Tabela Única de Custas do TRF5 (DARF/GUR).',
}

export default TRF5
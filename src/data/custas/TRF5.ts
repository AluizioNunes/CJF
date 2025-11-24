import type { RegionalCustasConfig } from './types'

const TRF5: RegionalCustasConfig = {
  regiao: 'TRF5',
  tabelaI: { percentual: 0.01, minimo: 60, maximo: undefined },
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
  observacoes: 'Valores devem ser obtidos da Tabela Única de Custas do TRF5; padrão inicial aplicado. Tabela I: 1% base, mínimo R$ 60.',
  updatedAt: new Date().toISOString(),
}

export default TRF5
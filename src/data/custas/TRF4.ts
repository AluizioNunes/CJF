import type { RegionalCustasConfig } from './types'

const TRF4: RegionalCustasConfig = {
  regiao: 'TRF4',
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
    { subsecao: 'JFPR-Curitiba', valor: undefined },
    { subsecao: 'JFSC-Florianópolis', valor: undefined },
    { subsecao: 'JFRS-Porto Alegre', valor: undefined },
  ],
  sources: [
    'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=796',
    'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=407',
  ],
  observacoes: 'Valores públicos no portal do TRF4; percentuais/limites publicados por tabela regional. Tabela I: 1% base, mínimo R$ 60.',
  updatedAt: new Date().toISOString(),
}

export default TRF4
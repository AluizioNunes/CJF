import type { RegionalCustasConfig } from './types'

const TRF4: RegionalCustasConfig = {
  regiao: 'TRF4',
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
    { subsecao: 'JFPR-Curitiba', valor: undefined },
    { subsecao: 'JFSC-Florianópolis', valor: undefined },
    { subsecao: 'JFRS-Porto Alegre', valor: undefined },
  ],
  sources: [
    'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=796',
    'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=407',
  ],
  observacoes: 'Valores públicos no portal do TRF4; percentuais/limites publicados por tabela regional.',
}

export default TRF4
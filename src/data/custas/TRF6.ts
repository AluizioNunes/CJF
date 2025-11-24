import type { RegionalCustasConfig } from './types'

const TRF6: RegionalCustasConfig = {
  regiao: 'TRF6',
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
    { subsecao: 'JFMG-Belo Horizonte', valor: undefined },
    { subsecao: 'JFMG-Uberlândia', valor: undefined },
    { subsecao: 'JFMG-Juiz de Fora', valor: undefined },
  ],
  sources: [
    'https://portal.trf6.jus.br/calculo-de-custas/custas-processuais/',
    'https://portal.trf6.jus.br/wp-content/uploads/2024/03/Portaria-Presi-32-2022-TRF6.pdf',
  ],
  observacoes: 'Portarias do TRF6 definem valores e procedimentos; e-Proc integra emissão/controle.'
}

export default TRF6
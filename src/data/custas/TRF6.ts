import type { RegionalCustasConfig } from './types'

const TRF6: RegionalCustasConfig = {
  regiao: 'TRF6',
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
    { subsecao: 'JFMG-Belo Horizonte', valor: undefined },
    { subsecao: 'JFMG-Uberlândia', valor: undefined },
    { subsecao: 'JFMG-Juiz de Fora', valor: undefined },
  ],
  sources: [
    'https://portal.trf6.jus.br/calculo-de-custas/custas-processuais/',
    'https://portal.trf6.jus.br/wp-content/uploads/2024/03/Portaria-Presi-32-2022-TRF6.pdf',
  ],
  observacoes: 'Portarias do TRF6 definem valores e procedimentos; e-Proc integra emissão/controle. Tabela I: 1% base, mínimo R$ 60.',
  updatedAt: new Date().toISOString(),
}

export default TRF6
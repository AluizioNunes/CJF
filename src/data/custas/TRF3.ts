import type { RegionalCustasConfig } from './types'

const TRF3: RegionalCustasConfig = {
  regiao: 'TRF3',
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
    { subsecao: 'JFSP-São Paulo', valor: undefined },
    { subsecao: 'JFMS-Mato Grosso do Sul', valor: undefined },
  ],
  sources: [
    'https://web.trf3.jus.br/atos-normativos/atos-normativos-dir/presidência/resoluções/2017/resolução0138.htm',
    'https://www.trf3.jus.br/seju/custasgru',
  ],
  observacoes: 'Resolução PRES nº 138/2017 define Tabela I/II/III; atualizações recentes regulamentam PIX/cartão.'
}

export default TRF3
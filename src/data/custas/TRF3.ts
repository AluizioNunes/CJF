import type { RegionalCustasConfig } from './types'

const TRF3: RegionalCustasConfig = {
  regiao: 'TRF3',
  tabelaI: { percentual: 0.01, minimo: 80, maximo: undefined },
  tabelaIII: {
    itens: [
      { id: 'arrematacao', label: 'Arrematação', valor: 0 },
      { id: 'adjudicacao', label: 'Adjudicação', valor: 0 },
      { id: 'remicao', label: 'Remição', valor: 0 },
      { id: 'certidao', label: 'Certidões', valor: 6 },
      { id: 'reprografia', label: 'Reprografia / cópias', valor: 1 },
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
  observacoes: 'Resolução PRES nº 138/2017 define Tabela I/II/III; valores típicos em reais. Tabela I: 1% base, mínimo R$ 80.',
  updatedAt: new Date().toISOString(),
}

export default TRF3
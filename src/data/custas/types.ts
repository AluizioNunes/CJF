export type TabelaIConfig = {
  percentual?: number
  minimo?: number
  maximo?: number
}

export type TabelaIIIItem = {
  id: string
  label: string
  valor?: number
}

export type PorteRemessaRetorno = {
  subsecao: string
  valor?: number
}

export type RegionalCustasConfig = {
  regiao: 'CJF' | 'TRF1' | 'TRF2' | 'TRF3' | 'TRF4' | 'TRF5' | 'TRF6'
  tabelaI: TabelaIConfig
  tabelaIII: { itens: TabelaIIIItem[] }
  porteRemessaRetorno: PorteRemessaRetorno[]
  observacoes?: string
  sources?: string[]
  updatedAt?: string
}

export type RegionalRegrasSet = {
  acoesCiveis: { id: string; label: string; tipo: 'fixo' | 'percentual' | 'diligencia'; percentual?: number; minimo?: number; maximo?: number; valorFixo?: number; baseKm?: number; valorPorKm?: number }[]
  recursosCiveis: { id: string; label: string; tipo: 'fixo' | 'percentual'; percentual?: number; minimo?: number; maximo?: number; valorFixo?: number }[]
  execucao: { id: string; label: string; tipo: 'fixo' | 'percentual'; percentual?: number; minimo?: number; maximo?: number; valorFixo?: number }[]
  embargosIncidentes: { id: string; label: string; tipo: 'fixo' | 'percentual'; percentual?: number; minimo?: number; maximo?: number; valorFixo?: number }[]
  mandadosServicos: { id: string; label: string; tipo: 'fixo' | 'diligencia'; valorFixo?: number; baseKm?: number; valorPorKm?: number }[]
  acoesPenais: { id: string; label: string; tipo: 'fixo'; valorFixo?: number }[]
}
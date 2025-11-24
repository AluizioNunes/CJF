import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CustasItemRule } from '../utils/custas'

export type IndexadorSelecionado = {
  selic: boolean
  ipcae: boolean
  inpc: boolean
}

export type ParametrosCalculo = {
  valorInicial: number
  inicioPeriodo: string // ISO date
  fimPeriodo?: string // ISO date
  indexadores: IndexadorSelecionado
  metodoSelic: 'simples' | 'mensal'
  // Strict presets (manual)
  modoEstrito?: boolean
  regrasEstritas?: {
    tributario: {
      baseTemporal: 'mensal' | 'diaria'
      arredondamento: 'none' | 'mensal' | 'final'
      selicMetodo: 'simples' | 'mensal'
      indexadores: IndexadorSelecionado
      documentacao?: string
    }
    previdenciario: {
      baseTemporal: 'mensal' | 'diaria'
      arredondamento: 'none' | 'mensal' | 'final'
      indexadores: IndexadorSelecionado
      jurosPadrao: { taxaMensalPercent: number; metodo: 'simples' | 'composto' }
      usarMarcos?: boolean
      marcoTipo?: 'ajuizamento' | 'citacao' | 'sentenca'
      documentacao?: string
    }
    condenatorias: {
      baseTemporal: 'mensal' | 'diaria'
      arredondamento: 'none' | 'mensal' | 'final'
      indexadores: IndexadorSelecionado
      jurosPadrao: { taxaMensalPercent: number; metodo: 'simples' | 'composto' }
      usarMarcos?: boolean
      marcoTipo?: 'ajuizamento' | 'citacao' | 'sentenca'
      documentacao?: string
    }
  }
  // Custas Processuais: regras e tratamento de gratuidade/isenções
  custas?: {
    regiao?: 'CJF' | 'TRF1' | 'TRF2' | 'TRF3' | 'TRF4' | 'TRF5' | 'TRF6'
    regras: {
      acoesCiveis: CustasItemRule[]
      recursosCiveis: CustasItemRule[]
      execucao: CustasItemRule[]
      embargosIncidentes: CustasItemRule[]
      mandadosServicos: CustasItemRule[]
      acoesPenais: CustasItemRule[]
    }
    tabelasRegionais?: {
      CJF?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF1?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF2?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF3?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF4?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF5?: NonNullable<ParametrosCalculo['custas']>['regras']
      TRF6?: NonNullable<ParametrosCalculo['custas']>['regras']
    }
    gratuidade: {
      modo: 'zerarTudo' | 'isentarItens'
      isentos: {
        acoesCiveis?: string[]
        recursosCiveis?: string[]
        execucao?: string[]
        embargosIncidentes?: string[]
        mandadosServicos?: string[]
        acoesPenais?: string[]
      }
      observacoes?: string
    }
  }
}

type ParamsContextType = {
  parametros: ParametrosCalculo
  setParametros: (p: ParametrosCalculo) => void
}

const DEFAULT_PARAMS: ParametrosCalculo = {
  valorInicial: 10000,
  inicioPeriodo: new Date(new Date().getFullYear(), 0, 1).toISOString(),
  fimPeriodo: new Date().toISOString(),
  indexadores: { selic: true, ipcae: true, inpc: true },
  metodoSelic: 'simples',
  modoEstrito: false,
  regrasEstritas: {
    tributario: {
      baseTemporal: 'mensal',
      arredondamento: 'mensal',
      selicMetodo: 'simples',
      indexadores: { selic: true, ipcae: false, inpc: false },
      documentacao: 'Tributário: SELIC mensal simples; sem juros separados; arredondamento mensal.'
    },
    previdenciario: {
      baseTemporal: 'mensal',
      arredondamento: 'mensal',
      indexadores: { selic: false, ipcae: false, inpc: true },
      jurosPadrao: { taxaMensalPercent: 0.5, metodo: 'simples' },
      usarMarcos: true,
      marcoTipo: 'ajuizamento',
      documentacao: 'Previdenciário: INPC + juros de 0,5% a.m. simples; marcos pelo ajuizamento.'
    },
    condenatorias: {
      baseTemporal: 'mensal',
      arredondamento: 'mensal',
      indexadores: { selic: false, ipcae: true, inpc: false },
      jurosPadrao: { taxaMensalPercent: 1.0, metodo: 'simples' },
      usarMarcos: true,
      marcoTipo: 'ajuizamento',
      documentacao: 'Condenatórias: IPCA-E + juros de 1% a.m. simples; marcos pelo ajuizamento.'
    }
  },
  custas: {
    regiao: 'CJF',
    regras: {
      acoesCiveis: [
        { id: 'distribuicao', label: 'Custas de distribuição (percentual sobre o valor da causa)', tipo: 'percentual', percentual: 0.01, minimo: 50 },
        { id: 'citacao', label: 'Citação e atos iniciais (fixo por ato)', tipo: 'fixo', valorFixo: 30 },
        { id: 'audiencia', label: 'Audiência (fixo por audiência)', tipo: 'fixo', valorFixo: 80 },
      ],
      recursosCiveis: [
        { id: 'preparo', label: 'Preparo (percentual sobre o valor da causa)', tipo: 'percentual', percentual: 0.02, minimo: 80 },
        { id: 'embargosDeclaracao', label: 'Embargos de declaração (fixo)', tipo: 'fixo', valorFixo: 40 },
      ],
      execucao: [
        { id: 'taxaExecucao', label: 'Taxa de execução (percentual sobre valor executado)', tipo: 'percentual', percentual: 0.01, minimo: 60 },
        { id: 'penhora', label: 'Atos de penhora/avaliação (fixo por ato)', tipo: 'fixo', valorFixo: 50 },
      ],
      embargosIncidentes: [
        { id: 'embargosExecucao', label: 'Embargos à execução (fixo)', tipo: 'fixo', valorFixo: 70 },
        { id: 'incidenteProcessual', label: 'Incidente processual (fixo por incidente)', tipo: 'fixo', valorFixo: 45 },
      ],
      mandadosServicos: [
        { id: 'diligencia', label: 'Diligência de oficial (base + km)', tipo: 'diligencia', baseKm: 60, valorPorKm: 1.5 },
        { id: 'certidao', label: 'Certidão/cópia (fixo por unidade)', tipo: 'fixo', valorFixo: 5 },
      ],
      acoesPenais: []
    },
    tabelasRegionais: {
      CJF: undefined,
      TRF1: undefined,
      TRF2: undefined,
      TRF3: undefined,
      TRF4: undefined,
      TRF5: undefined,
      TRF6: undefined,
    },
    gratuidade: {
      modo: 'zerarTudo',
      isentos: {
        acoesCiveis: [],
        recursosCiveis: [],
        execucao: [],
        embargosIncidentes: [],
        mandadosServicos: [],
        acoesPenais: [],
      },
      observacoes: 'Configuração inicial de gratuidade/isenções. Ajustar conforme Manual CJF 2025.'
    }
  }
}

const ParamsContext = createContext<ParamsContextType | undefined>(undefined)

export const ParamsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [parametros, setParametrosState] = useState<ParametrosCalculo>(() => {
    const raw = localStorage.getItem('cjf:parametros')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        // Merge with defaults to ensure new fields exist
        return {
          ...DEFAULT_PARAMS,
          ...parsed,
          regrasEstritas: {
            ...DEFAULT_PARAMS.regrasEstritas,
            ...(parsed.regrasEstritas ?? {})
          },
          custas: {
            regiao: parsed.custas?.regiao ?? DEFAULT_PARAMS.custas!.regiao,
            regras: {
              acoesCiveis: parsed.custas?.regras?.acoesCiveis ?? DEFAULT_PARAMS.custas!.regras.acoesCiveis,
              recursosCiveis: parsed.custas?.regras?.recursosCiveis ?? DEFAULT_PARAMS.custas!.regras.recursosCiveis,
              execucao: parsed.custas?.regras?.execucao ?? DEFAULT_PARAMS.custas!.regras.execucao,
              embargosIncidentes: parsed.custas?.regras?.embargosIncidentes ?? DEFAULT_PARAMS.custas!.regras.embargosIncidentes,
              mandadosServicos: parsed.custas?.regras?.mandadosServicos ?? DEFAULT_PARAMS.custas!.regras.mandadosServicos,
              acoesPenais: parsed.custas?.regras?.acoesPenais ?? DEFAULT_PARAMS.custas!.regras.acoesPenais,
            },
            tabelasRegionais: {
              CJF: parsed.custas?.tabelasRegionais?.CJF ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.CJF,
              TRF1: parsed.custas?.tabelasRegionais?.TRF1 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF1,
              TRF2: parsed.custas?.tabelasRegionais?.TRF2 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF2,
              TRF3: parsed.custas?.tabelasRegionais?.TRF3 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF3,
              TRF4: parsed.custas?.tabelasRegionais?.TRF4 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF4,
              TRF5: parsed.custas?.tabelasRegionais?.TRF5 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF5,
              TRF6: parsed.custas?.tabelasRegionais?.TRF6 ?? DEFAULT_PARAMS.custas!.tabelasRegionais?.TRF6,
            },
            gratuidade: {
              modo: parsed.custas?.gratuidade?.modo ?? DEFAULT_PARAMS.custas!.gratuidade.modo,
              isentos: {
                acoesCiveis: parsed.custas?.gratuidade?.isentos?.acoesCiveis ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.acoesCiveis,
                recursosCiveis: parsed.custas?.gratuidade?.isentos?.recursosCiveis ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.recursosCiveis,
                execucao: parsed.custas?.gratuidade?.isentos?.execucao ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.execucao,
                embargosIncidentes: parsed.custas?.gratuidade?.isentos?.embargosIncidentes ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.embargosIncidentes,
                mandadosServicos: parsed.custas?.gratuidade?.isentos?.mandadosServicos ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.mandadosServicos,
                acoesPenais: parsed.custas?.gratuidade?.isentos?.acoesPenais ?? DEFAULT_PARAMS.custas!.gratuidade.isentos.acoesPenais,
              },
              observacoes: parsed.custas?.gratuidade?.observacoes ?? DEFAULT_PARAMS.custas!.gratuidade.observacoes,
            }
          }
        }
      } catch {}
    }
    return DEFAULT_PARAMS
  })

  useEffect(() => {
    localStorage.setItem('cjf:parametros', JSON.stringify(parametros))
  }, [parametros])

  const value = useMemo(() => ({
    parametros,
    setParametros: setParametrosState,
  }), [parametros])

  return <ParamsContext.Provider value={value}>{children}</ParamsContext.Provider>
}

export const useParametros = () => {
  const ctx = useContext(ParamsContext)
  if (!ctx) throw new Error('useParametros must be used within ParamsProvider')
  return ctx
}
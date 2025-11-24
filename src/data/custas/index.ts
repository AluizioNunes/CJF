import type { RegionalCustasConfig, RegionalRegrasSet } from './types'
import CJF from './CJF'
import TRF1 from './TRF1'
import TRF2 from './TRF2'
import TRF3 from './TRF3'
import TRF4 from './TRF4'
import TRF5 from './TRF5'
import TRF6 from './TRF6'

export const REGIONAL_CONFIGS: Record<string, RegionalCustasConfig> = {
  CJF,
  TRF1,
  TRF2,
  TRF3,
  TRF4,
  TRF5,
  TRF6,
}

// RegionalRegrasSet agora centralizado em src/data/custas/types.ts

export function getRegionalDefaults(regiao: 'CJF' | 'TRF1' | 'TRF2' | 'TRF3' | 'TRF4' | 'TRF5' | 'TRF6'): RegionalRegrasSet {
  void regiao
  // Fórmulas sem números — placeholders; valores são preenchidos via configuração regional
  return {
    acoesCiveis: [
      { id: 'distribuicao', label: 'Distribuição (percentual sobre valor da causa) — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'citacao', label: 'Citação e atos iniciais (fixo por ato)', tipo: 'fixo', valorFixo: 0 },
    ],
    recursosCiveis: [
      { id: 'preparo', label: 'Preparo (percentual sobre valor da causa) — Tabela I, metade na interposição', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'porte', label: 'Porte de remessa e retorno (fixo, por região; dispensado em autos eletrônicos)', tipo: 'fixo', valorFixo: 0 },
    ],
    execucao: [
      { id: 'liquidacao', label: 'Liquidação (nos autos): isenta', tipo: 'fixo', valorFixo: 0 },
      { id: 'cumprimentoNosAutos', label: 'Cumprimento de sentença (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
      { id: 'impugnacao', label: 'Impugnação ao cumprimento (metade final das custas) — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'execucaoExtrajudicial', label: 'Execução de título extrajudicial — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'execucaoFiscal', label: 'Execução fiscal — Tabela I (alínea a)', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'leilaoPraca', label: 'Leilão/Praça — Tabela III (arrematação/adjudicação/remição)', tipo: 'fixo', valorFixo: 0 },
    ],
    embargosIncidentes: [
      { id: 'embargosExecucao', label: 'Embargos à execução (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
      { id: 'invalidacaoArrematacaoNosAutos', label: 'Invalidade de arrematação (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
      { id: 'acaoAutonomaInvalidacao', label: 'Ação autônoma de invalidação — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'embargosTerceiros', label: 'Embargos de terceiros — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
      { id: 'incidenteApenso', label: 'Incidente apenso: sem custas', tipo: 'fixo', valorFixo: 0 },
    ],
    mandadosServicos: [
      { id: 'diligencia', label: 'Diligência de oficial (base + km) — Tabela única regional', tipo: 'diligencia', baseKm: 0, valorPorKm: 0 },
      { id: 'certidao', label: 'Certidões e reproduções — Tabela III/Regional (fixo por unidade)', tipo: 'fixo', valorFixo: 0 },
    ],
    acoesPenais: [
      { id: 'acaoPenalPublica', label: 'Ação penal pública: custas finais pelo réu se condenado', tipo: 'fixo', valorFixo: 0 },
      { id: 'acaoPenalPrivada', label: 'Ação penal privada: preparo antecipado pelo querelante', tipo: 'fixo', valorFixo: 0 },
    ],
  }
}
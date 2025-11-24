// Fontes oficiais para consulta de custas por região
// Inclui páginas de cálculo, portarias/resoluções e orientações.

export type RegionalSource = {
  name: string;
  url: string;
  type: 'html' | 'pdf' | 'calculator';
  notes?: string;
};

export type RegionalSourcesMap = Record<string, RegionalSource[]>;

export const REGIONAL_SOURCES: RegionalSourcesMap = {
  CJF: [
    {
      name: 'Manual de Cálculos da Justiça Federal (Res. CJF 267/2013, alterada pela 658/2020) – Cap. Custas',
      url: 'https://www.cjf.jus.br/publico/biblioteca/Res%20267-2013.pdf',
      type: 'pdf',
      notes: 'Diretrizes gerais e fórmulas; valores mínimos/máximos definidos pelos TRFs.'
    },
    {
      name: 'Notícia: Manual atualizado e capítulos (inclui Custas Processuais)',
      url: 'https://www.cjf.jus.br/cjf/noticias/2013/dezembro-1/nova-versao-do-manual-de-calculos-da-justica-federal-esta-disponivel-para-consulta',
      type: 'html'
    }
  ],
  TRF1: [
    {
      name: 'Cálculos, custas e despesas processuais – SJAP',
      url: 'https://www.trf1.jus.br/sjap/processual/calculos-custas-e-despesas-processuais',
      type: 'html',
      notes: 'Instruções e link para sistema; aplica 1% com limites conforme Tabela I.'
    },
    {
      name: 'Cálculos, custas e despesas – SJGO (Manual, DARF/GRU, sistema)',
      url: 'https://portal.trf1.jus.br/sjgo/processual/calculos-custas-e-despesas-processuais/calculos-custas-e-despesas-processuais.htm',
      type: 'html'
    }
  ],
  TRF2: [
    {
      name: 'Custas judiciais no TRF2 (tabela e UFIR em reais)',
      url: 'https://www.trf2.jus.br/trf2/artigo/saj/custas-judiciais-no-trf2',
      type: 'html',
      notes: 'Lista valores em reais (UFIR 1,0641); porte isento em e-Proc.'
    },
    {
      name: 'Custas judiciais – JFRJ (orientações e e-Proc GRU)',
      url: 'https://www.trf2.jus.br/jfrj/consultas-e-servicos/custas-judiciais',
      type: 'html'
    }
  ],
  TRF3: [
    {
      name: 'Resolução PRES nº 138/2017 (tabelas de custas e normas gerais)',
      url: 'https://web.trf3.jus.br/atos-normativos/atos-normativos-dir/presidência/resoluções/2017/resolução0138.htm',
      type: 'html',
      notes: 'Tabela I/II/III com UFIR e equivalentes em reais; atualizações recentes via PRES 790/2025.'
    },
    {
      name: 'Custas/GRU – sistema e orientações',
      url: 'https://www.trf3.jus.br/seju/custasgru',
      type: 'html'
    }
  ],
  TRF4: [
    {
      name: 'Despesas Processuais na Justiça Federal (1º grau) – Portaria 619/2012',
      url: 'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=796',
      type: 'html',
      notes: 'Tabela I e III com valores mínimos/máximos explícitos em reais.'
    },
    {
      name: 'Porte de remessa e retorno para o TRF4',
      url: 'https://www.trf4.jus.br/trf4/controlador.php?acao=pagina_visualizar&id_pagina=407',
      type: 'html',
      notes: 'Isenções em e-Proc; exceções por subseção.'
    }
  ],
  TRF5: [
    {
      name: 'Sistema oficial de cálculo de custas TRF5',
      url: 'https://custas.trf5.jus.br/custasinternet/paginas/principal/principal.faces',
      type: 'calculator',
      notes: 'Calculadora pública (custas iniciais/recursais/porte); e-processos isentos de porte.'
    }
  ],
  TRF6: [
    {
      name: 'Custas processuais – página oficial (roteiros e portarias)',
      url: 'https://portal.trf6.jus.br/calculo-de-custas/custas-processuais/',
      type: 'html'
    },
    {
      name: 'Portaria PRESI nº 32/2022 – TRF6 (tabelas de custas)',
      url: 'https://portal.trf6.jus.br/wp-content/uploads/2024/03/Portaria-Presi-32-2022-TRF6.pdf',
      type: 'pdf'
    }
  ]
};

export function getRegionalSources(region: keyof typeof REGIONAL_SOURCES) {
  return REGIONAL_SOURCES[region] ?? [];
}
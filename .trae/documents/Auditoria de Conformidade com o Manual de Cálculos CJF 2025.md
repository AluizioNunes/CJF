## Objetivo
- Ler e extrair o conteúdo completo de `d:\PROJETOS\CJF\Backend\manual_de_calculos_2025_vf.pdf` e confrontar regra a regra com a implementação atual.
- Produzir um relatório de conformidade apontando aderências, divergências e ajustes necessários.

## Escopo da Verificação
- Indexadores e fontes: SELIC diária (BCB SGS 11), IPCA-E (IBGE SIDRA 7060 var. 63), INPC (SIDRA 1736 var. 44).
- Regimes por matéria e sujeito passivo: Tributário, Previdenciário, Condenatórias/Desapropriação; Fazenda Pública vs Particular.
- Marcos temporais (EC 113/114): transição em 11/2021/12/2021 entre índices e SELIC.
- Regimes de juros: simples/composto, percentuais usuais (0,5% a.m. e 1% a.m.).
- Base temporal: mensal vs diária (pro rata em meses iniciais/finais).
- Arredondamentos: mensal (2 casas) e somente final.
- Relatórios e detalhamentos.
- Custas processuais: Tabela I/III, porte de remessa/retorno, isenções.

## Mapeamento na Aplicação
- Núcleo de cálculo: `src/utils/calculo.ts`
  - SELIC diária → fator mensal composto: `fatorCompostoSelicMensalAPartirDiaria` em `src/utils/calculo.ts:20-29`.
  - SELIC simples (soma de diárias): `fatorSelicSimples` em `src/utils/calculo.ts:31-35`.
  - Composição mensal de índices (IPCA-E/INPC): `fatorCompostoMensal` em `src/utils/calculo.ts:37-40`.
  - Combinação índices + SELIC: `calcularCombinacaoIndices` em `src/utils/calculo.ts:47-79`.
  - Juros fixos mensais simples/composto: `fatorJurosFixosMensais` em `src/utils/calculo.ts:91-100`.
  - Detalhamento mensal com marcos, base temporal e arredondamento: `calcularDetalhadoMensal` em `src/utils/calculo.ts:220-305`.
- Fontes oficiais:
  - BCB SELIC (diária): `src/services/bcb.ts:32-44`.
  - IBGE IPCA-E: `src/services/ibge.ts:49-53`; INPC: `src/services/ibge.ts:55-59`.
- Telas de cálculo:
  - Tributário (SELIC): `src/pages/Calculos/Tributario.tsx` aplicado com detalhe mensal.
  - Previdenciário (INPC + juros; SELIC para Fazenda a partir de 12/2021): `src/pages/Calculos/Previdenciario.tsx`.
  - Condenatórias/Desapropriação (IPCA-E + juros; SELIC para Fazenda a partir de 12/2021): `src/pages/Calculos/Condenatorias.tsx`.
  - Atualização Monetária consolidada por tipo e devedor: `src/pages/Calculos/AtualizacaoMonetaria.tsx`.
- Custas: utilitários em `src/utils/custas.ts` e estrutura regional em `src/data/custas/*` (valores majoritariamente placeholders).

## Método para Ler o Manual
- Extrair o texto do PDF e capítulos (índices, juros, custas, regras de arredondamento e transições) com ferramenta de extração de texto.
- Estruturar um checklist por capítulo/regra com referências (artigos, parágrafos, fórmulas) e datas de vigência.

## Validação Determinística
- Montar casos de teste reproduzindo exemplos do manual (quando houver):
  - Tributário: período de X meses com SELIC diária, comparar fator mensal e valor final.
  - Previdenciário: INPC + 0,5% a.m. simples; com marco de ajuizamento e transição para SELIC (Fazenda) em 12/2021.
  - Condenatórias: IPCA-E + 1% a.m. simples até 11/2021; SELIC de 12/2021 em diante (Fazenda). Particular permanece com IPCA-E + juros.
  - Base diária: validar pro rata em meses iniciais/finais.
  - Arredondamentos: confirmar mensal vs final conforme exemplos do manual.
- Criar testes unitários para `src/utils/calculo.ts` e scripts de validação de séries (mock/fixtures) sem depender de rede.

## Pontos Prováveis de Ajuste
- Representação do fator de juros acumulado para método simples é aproximada (`src/utils/calculo.ts:255-262`); alinhar à fórmula exata do manual, caso exigido.
- Confirmar data de transição exata (11/2021 vs 12/2021) para cada matéria conforme o manual; ajustar constantes em telas e lógica de corte.
- Custas: popular Tabela I/III, porte e isenções por região a partir do manual e atos regionais; substituir placeholders em `src/data/custas/*`.
- Marcos processuais adicionais (citação/sentença): há suporte de estrutura (`ParamsContext`), mas telas usam predominantemente ajuizamento; estender UI para seleção do tipo de marco quando necessário.
- Documentar e fixar arredondamento exigido (mensal/final) por tipo de cálculo nas presets de modo estrito.

## Entregáveis
- Relatório de conformidade com referências ao manual (capítulo/linha) e mapas para funções/arquivos do código.
- Conjunto de testes unitários cobrindo as fórmulas e transições.
- Ajustes de código e telas onde houver divergências.
- Planilha/JSON de custas por região com fontes citadas.

## Próximos Passos (após aprovação)
- Executar extração do PDF e montar checklist.
- Implementar testes e rodar contra a base atual.
- Aplicar correções identificadas (juros simples fator, datas de transição, presets estritos, UI de marcos).
- Preencher dados de custas regionais com validação automática de fontes (script existente em `scripts/update-custas.mjs`).
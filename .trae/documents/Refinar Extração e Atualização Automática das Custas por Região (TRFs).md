## Objetivo
- Refinar a coleta automática de valores (certidões, reprografia, Tabela I: percentuais/mínimos, porte) por TRF, distinguindo UFIR vs reais e cobrindo TRF1, TRF2, TRF3, TRF4, TRF5, TRF6.
- Atualizar a configuração local automaticamente quando a extração for bem-sucedida, registrando um log de alterações no relatório `last-update.json`.

## Abrangência por Região
- TRF2 (HTML):
  - Seletores dedicados para UFIR vigente e valores em reais (quando a página já traz conversão).
  - Regra: se valor declaradamente em UFIR, calcular reais pela UFIR extraída; se em reais, usar diretamente.
- TRF4 (HTML):
  - Seletores para Tabela I (mínimo), itens Tabela III (certidões, reprografia) e observações de porte por subseção.
- TRF6 (PDF):
  - Padrões robustos para trechos de Tabela I (percentual/mínimo) e Tabela III (itens), diferenciando listas/tabelas.
  - Normalização de números (R$ e separadores) e fallback para execução via CLI.
- TRF1 (HTML múltiplas páginas):
  - Seletores para páginas SJAP/SJGO; consolidar resultados e resolver conflitos.
- TRF3 (HTML)
  - Seletores na RES PRES nº 138/2017 (tabelas) e na página Custas/GRU para valores de aplicação prática.
- TRF5 (aplicação/calculadora)
  - Estratégia: buscar documentação pública estática (portaria/nota técnica). Se a aplicação for dinâmica, usar endpoint/HTML alternativo (quando disponível) ou deixar como “manual required” com marcação.

## Diferenciação UFIR vs Reais
- Heurística de detecção:
  - Palavras-chave: “UFIR”, “UFIR/RJ”, “em UFIR” vs “R$”, “em reais”.
  - Conversão: quando UFIR for fornecida, aplicar multiplicação (ex.: certidão = UFIR × fator próprio) e registrar no relatório a taxa usada.
- Campos afetados:
  - Tabela III: certidões, reprografia; Tabela I: mínimos e percentuais quando o documento usar base UFIR ou valores nominais.

## Atualização Automática da Configuração
- Pipeline no script:
  - Coleta → Normalização → Comparação (config vs extraído) → Proposta de mudança (diffs) → Aplicação controlada.
- Modos:
  - Dry-run (padrão): apenas reporta `extractedSummary` e `differences` no `last-update.json`.
  - Auto-update (flag): aplica alterações nos arquivos `src/data/custas/*.ts`, preservando `observacoes` e adicionando `updatedAt`, e registra `appliedChanges` no relatório.
- Segurança:
  - Atualiza somente campos com extração “confiável” (valor presente, número válido, origem com status OK), mantendo outras entradas inalteradas.

## Robustez e Tratamento de Erros
- Timeouts e 403/504: repetição limitada, fallback para fontes alternativas do mesmo TRF.
- PDFs grandes: extração paginada quando necessário; regexes com tolerância a variações de acentuação/espécies.
- HTML dinâmico: evitar execução de JS; preferir páginas estáticas/documentos; caso necessário, marcar a região como “requere interação manual”.

## Estrutura de Código (sem alterar ainda)
- Ampliação de `scripts/update-custas.mjs`:
  - Funções por região: `extractTRF1`, `extractTRF2`, `extractTRF3`, `extractTRF4`, `extractTRF5`, `extractTRF6`.
  - `normalizeCurrency` e `detectUFIR`/`convertUFIRToBRL`.
  - `applyRegionalConfigChanges(region, extracted)` condicionada a flag (ex.: `--apply`).
- Relatório:
  - `extractedSummary` com campos normalizados (BRL/UFIR e real/convertido).
  - `differences` detalhadas por campo.
  - `appliedChanges` quando auto-update estiver habilitado.

## Testes e Validação
- Casos de teste por região com HTML/PDF salvos (fixtures) para garantir estabilidade dos seletores.
- Validação pós-aplicação: rodar `npm run build` para garantir integridade; reexecutar `update:custas` para confirmar zero divergências em campos atualizados.

## Entregáveis
- Script atualizado com cobertura TRF1, TRF3, TRF5 e seletores robustos em TRF2/TRF4/TRF6.
- Relatório enriquecido (`last-update.json`) com extrações por região, diferenças e (quando habilitado) mudanças aplicadas.
- Documentação curta em comentários do script indicando manutenção dos seletores e pontos de ajuste por região.

## Próximo Passo (após aprovação)
- Implementar funções de extração por região e o modo `--apply`.
- Criar fixtures e rodar validações; ajustar seletores e regexes conforme necessário.
- Executar `update:custas` (dry-run) e depois com `--apply` para atualizar números locais com precisão.
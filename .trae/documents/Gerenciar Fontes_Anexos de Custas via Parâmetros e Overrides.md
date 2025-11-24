## Objetivo
- Permitir configurar links alternativos e anexos de arquivos por região (TRFs) através dos parâmetros do sistema.
- Integrar um arquivo `src/data/custas/overrides.json` que o validador lerá e mesclará com as fontes oficiais.
- Adicionar UI para cadastrar essas fontes e exportar um JSON pronto para ser colocado como `overrides.json`.

## Alterações Técnicas
- Tipos: estender `ParametrosCalculo` com campos para overrides de fontes.
- UI: em `Sistema/Parametros`, adicionar seção para gerenciar fontes por região (nome, URL, tipo) e botão de exportação.
- Validador: ler `overrides.json` além de `sources.ts` e mesclar por região; suportar URLs locais `file://` e caminhos de arquivo para PDF/HTML.

## Fluxo
- Usuário cadastra fontes/anexos na página de Parâmetros.
- Exporta JSON das fontes cadastradas e salva em `src/data/custas/overrides.json`.
- Executa `npm run update:custas` para validar/usar fontes oficiais + overrides.

## Entregáveis
- Tipagem atualizada e UI para cadastro/exportação.
- `overrides.json` inicial.
- Script de validação com suporte a overrides e arquivos locais.
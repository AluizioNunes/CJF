## Objetivo
- Repaginar a aplicação com navegação organizada, telas limpas e máscaras adequadas para valores.

## Alterações Principais
- Navbar: migrar para layout com Sider (menu lateral) + Header único com título/usuário/tema.
- Máscaras de valores: criar componentes `MoneyInput` (R$ com separadores) e `PercentInput` (% com formatação) e aplicá-los aos campos monetários/percentuais.
- Limpeza de telas: remover a seção de anexos/overrides dos Parâmetros (informação desnecessária para uso comum); padronizar espaçamentos/alinhamentos.
- Tema: ajustar tokens globais (bordas, fontes, espaçamentos) para visual mais moderno.

## Arquivos a editar/criar
- Criar `src/components/MoneyInput.tsx` e `src/components/PercentInput.tsx`.
- Atualizar páginas com inputs monetários/percentuais (Parâmetros, Custas e Calculos) para usar os novos componentes.
- Atualizar `src/App.tsx` para layout com `Sider` e remover Header duplicado.
- Limpar `src/pages/Sistema/Parametros.tsx` removendo o card de overrides.
- Ajustar `App.css`/tokens de `ConfigProvider` para visual consistente.

## Verificação
- Build sem erros.
- Navegação funcional com Sider.
- Campos de valores exibindo formatação R$ 1.234,56 e % com separadores.
- Telas com alinhamento e sem informações desnecessárias.

## Entrega
- Código atualizado, UI mais profissional e consistente, sem alterar lógica de negócio.
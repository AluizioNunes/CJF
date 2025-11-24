import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  pt: {
    translation: {
      header: {
        title: 'ITFACT - CJF',
        theme: { dark: 'Dark', light: 'Light' },
        user: 'Admin',
      },
      menu: {
        dashboard: 'Dashboard',
        sistema: 'Sistema',
        calculos: 'Cálculos',
        custas: 'Custas Processuais',
        tributario: 'Tributário',
        previdenciario: 'Previdenciário',
        condenatorias: 'Condenatórias',
        escritorios: 'Escritórios',
        advogados: 'Advogados',
        clientes: 'Clientes',
        causas_processos: 'Causas e Processos',
        especialidades: 'Especialidades',
        parametros: 'Parâmetros',
        usuarios: 'Usuários',
        perfil: 'Perfil',
        permissoes: 'Permissões',
        custas_diretrizes: 'Diretrizes Gerais',
        custas_acoes_civeis: 'Ações Cíveis em Geral',
        custas_recursos_civeis: 'Recursos Cíveis',
        custas_execucao: 'Execução',
        custas_embargos_incidentes: 'Embargos e Incidentes',
        custas_mandados_servicos: 'Mandados e Serviços Oficiais',
        custas_acoes_penais: 'Ações Penais',
        custas_isencoes_gratuidade: 'Isenções e Gratuidade',
      },
      pages: {
        custas: {
          diretrizes: { title: 'Custas Processuais · Diretrizes Gerais' },
          acoesCiveis: { title: 'Custas Processuais · Ações Cíveis em Geral' },
          recursosCiveis: { title: 'Custas Processuais · Recursos Cíveis' },
          execucao: { title: 'Custas Processuais · Execução' },
          embargosIncidentes: { title: 'Custas Processuais · Embargos e Incidentes' },
          mandadosServicos: { title: 'Custas Processuais · Mandados e Serviços Oficiais' },
          acoesPenais: { title: 'Custas Processuais · Ações Penais' },
          isencoesGratuidade: { title: 'Custas Processuais · Isenções e Gratuidade' },
          fields: {
            valorCausa: 'Valor da causa (R$)',
            valorExecutado: 'Valor executado (R$)',
            quantidade: 'Quantidade',
            distanciaKm: 'Distância (km)',
            isencaoGratuidade: 'Isenção/Gratuidade',
            isencao: 'Isenção aplicada',
            gratuidade: 'Gratuidade de justiça',
            calcular: 'Calcular custas',
            adicionar: 'Adicionar item',
            remover: 'Remover',
            resultado: 'Resultado',
            total: 'Total',
            item: 'Item',
            valorUnitario: 'Valor unitário (R$)',
            subtotal: 'Subtotal (R$)'
          }
        },
        parametros: {
          title: 'Parâmetros de Cálculo',
          preview: { title: 'Pré-visualização das séries' },
          strictMode: 'Aplicar presets rígidos (manual CJF)',
          regras: {
            title: 'Regras por tipo (estrito)'
            , desc: 'Defina base temporal, arredondamentos e regimes padrão por tipo de cálculo. Estas regras serão impostas nas telas de cálculo quando o modo estrito estiver ativo.'
            , doc: 'Descrição/Documentação da regra'
          },
        },
        escritorios: { title: 'Escritórios', novo: 'Novo Escritório', editar: 'Editar Escritório' },
        calculos: {
          tributario: { title: 'Cálculo Tributário' },
          previdenciario: { title: 'Cálculo Previdenciário' },
          condenatorias: { title: 'Cálculo de Condenatórias' },
          fields: {
            valorInicial: 'Valor inicial (R$)',
            inicioPeriodo: 'Início do período',
            fimPeriodo: 'Fim do período',
            metodoSelic: 'Método SELIC',
            jurosMensais: 'Juros de mora mensal (%)',
            metodoJuros: 'Método dos juros',
            presetJuros: 'Preset de juros',
            usarMarcos: 'Usar marcos (ajuizamento)',
            dataAjuizamento: 'Data de ajuizamento',
            jurosAntes: 'Juros antes (%)',
            jurosDepois: 'Juros depois (%)',
            metodoDepois: 'Método depois do marco',
            baseTemporal: 'Base temporal',
            arredondamento: 'Arredondamento',
            mostrarDetalhe: 'Mostrar detalhamento mensal',
            relatorioMensal: 'Relatório mensal detalhado',
            calcular: 'Calcular',
          }
        },
      },
    },
  },
  en: {
    translation: {
      header: {
        title: 'ITFACT - CJF',
        theme: { dark: 'Dark', light: 'Light' },
        user: 'Admin',
      },
      menu: {
        dashboard: 'Dashboard',
        sistema: 'System',
        calculos: 'Calculations',
        custas: 'Court Costs',
        tributario: 'Tax',
        previdenciario: 'Social Security',
        condenatorias: 'Court Judgments',
        escritorios: 'Offices',
        advogados: 'Lawyers',
        clientes: 'Clients',
        causas_processos: 'Cases and Proceedings',
        especialidades: 'Specialties',
        parametros: 'Parameters',
        usuarios: 'Users',
        perfil: 'Profile',
        permissoes: 'Permissions',
        custas_diretrizes: 'General Guidelines',
        custas_acoes_civeis: 'Civil Actions (General)',
        custas_recursos_civeis: 'Civil Appeals',
        custas_execucao: 'Execution',
        custas_embargos_incidentes: 'Objections & Incidents',
        custas_mandados_servicos: 'Writs & Official Services',
        custas_acoes_penais: 'Criminal Actions',
        custas_isencoes_gratuidade: 'Exemptions & Legal Aid',
      },
      pages: {
        custas: {
          diretrizes: { title: 'Court Costs · General Guidelines' },
          acoesCiveis: { title: 'Court Costs · Civil Actions (General)' },
          recursosCiveis: { title: 'Court Costs · Civil Appeals' },
          execucao: { title: 'Court Costs · Execution' },
          embargosIncidentes: { title: 'Court Costs · Objections & Incidents' },
          mandadosServicos: { title: 'Court Costs · Writs & Official Services' },
          acoesPenais: { title: 'Court Costs · Criminal Actions' },
          isencoesGratuidade: { title: 'Court Costs · Exemptions & Legal Aid' },
          fields: {
            valorCausa: 'Claim amount (R$)',
            valorExecutado: 'Executed amount (R$)',
            quantidade: 'Quantity',
            distanciaKm: 'Distance (km)',
            isencaoGratuidade: 'Exemption/Legal aid',
            isencao: 'Exemption applied',
            gratuidade: 'Legal aid (fee waiver)',
            calcular: 'Calculate costs',
            adicionar: 'Add item',
            remover: 'Remove',
            resultado: 'Result',
            total: 'Total',
            item: 'Item',
            valorUnitario: 'Unit value (R$)',
            subtotal: 'Subtotal (R$)'
          }
        },
        parametros: {
          title: 'Calculation Parameters',
          preview: { title: 'Series Preview' },
          strictMode: 'Apply strict presets (CJF manual)',
          regras: {
            title: 'Rules by type (strict)'
            , desc: 'Set time base, rounding and default regimes per calculation type. These rules are enforced on calculation pages when strict mode is active.'
            , doc: 'Rule description/documentation'
          },
        },
        escritorios: { title: 'Offices', novo: 'New Office', editar: 'Edit Office' },
        calculos: {
          tributario: { title: 'Tax Calculation' },
          previdenciario: { title: 'Social Security Calculation' },
          condenatorias: { title: 'Judgment Calculations' },
          fields: {
            valorInicial: 'Initial amount (R$)',
            inicioPeriodo: 'Start date',
            fimPeriodo: 'End date',
            metodoSelic: 'SELIC method',
            jurosMensais: 'Monthly default interest (%)',
            metodoJuros: 'Interest method',
            presetJuros: 'Interest preset',
            usarMarcos: 'Use milestones (filing)',
            dataAjuizamento: 'Filing date',
            jurosAntes: 'Interest before (%)',
            jurosDepois: 'Interest after (%)',
            metodoDepois: 'Method after milestone',
            baseTemporal: 'Time base',
            arredondamento: 'Rounding',
            mostrarDetalhe: 'Show monthly breakdown',
            relatorioMensal: 'Detailed monthly report',
            calcular: 'Calculate',
          }
        },
      },
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  })

export default i18n
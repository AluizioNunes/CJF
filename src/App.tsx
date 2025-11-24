import { Layout, Menu, theme, Typography, Space, Avatar, ConfigProvider, Switch, Spin } from 'antd'
import {
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  ProfileOutlined,
  SolutionOutlined,
  IdcardOutlined,
  ClusterOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useMemo, useState, Suspense, lazy } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Parametros = lazy(() => import('./pages/Sistema/Parametros'))
const Escritorios = lazy(() => import('./pages/Sistema/Escritorios'))
const Advogados = lazy(() => import('./pages/Sistema/Advogados'))
const Clientes = lazy(() => import('./pages/Sistema/Clientes'))
const CausasProcessos = lazy(() => import('./pages/Sistema/CausasProcessos'))
const Especialidades = lazy(() => import('./pages/Sistema/Especialidades'))
const Usuarios = lazy(() => import('./pages/Sistema/Usuarios'))
const Perfil = lazy(() => import('./pages/Sistema/Perfil'))
const Permissoes = lazy(() => import('./pages/Sistema/Permissoes'))
const Login = lazy(() => import('./pages/Login'))
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { useTranslation } from 'react-i18next'
const Tributario = lazy(() => import('./pages/Calculos/Tributario'))
const Previdenciario = lazy(() => import('./pages/Calculos/Previdenciario'))
const Condenatorias = lazy(() => import('./pages/Calculos/Condenatorias'))
const AtualizacaoMonetaria = lazy(() => import('./pages/Calculos/AtualizacaoMonetaria'))
const DiretrizesGerais = lazy(() => import('./pages/Custas/DiretrizesGerais'))
const AcoesCiveisGeral = lazy(() => import('./pages/Custas/AcoesCiveisGeral'))
const RecursosCiveis = lazy(() => import('./pages/Custas/RecursosCiveis'))
const Execucao = lazy(() => import('./pages/Custas/Execucao'))
const EmbargosIncidentes = lazy(() => import('./pages/Custas/EmbargosIncidentes'))
const MandadosServicos = lazy(() => import('./pages/Custas/MandadosServicos'))
const AcoesPenais = lazy(() => import('./pages/Custas/AcoesPenais'))
const IsencoesGratuidade = lazy(() => import('./pages/Custas/IsencoesGratuidade'))

const { Header, Content } = Layout

function App() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname === '/login'

  const selectedKey = useMemo(() => {
    const path = location.pathname
    if (path === '/') return 'dashboard'
    return path
  }, [location.pathname])

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard').toUpperCase(),
      onClick: () => navigate('/'),
    },
    {
      key: 'calculos',
      icon: <SolutionOutlined />,
      label: t('menu.calculos').toUpperCase(),
      children: [
        { key: '/calculos/tributario', icon: <SolutionOutlined />, label: t('menu.tributario').toUpperCase(), onClick: () => navigate('/calculos/tributario') },
        { key: '/calculos/previdenciario', icon: <SolutionOutlined />, label: t('menu.previdenciario').toUpperCase(), onClick: () => navigate('/calculos/previdenciario') },
        { key: '/calculos/condenatorias', icon: <SolutionOutlined />, label: t('menu.condenatorias').toUpperCase(), onClick: () => navigate('/calculos/condenatorias') },
        { key: '/calculos/atualizacao', icon: <SolutionOutlined />, label: 'ATUALIZAÇÃO MONETÁRIA', onClick: () => navigate('/calculos/atualizacao') },
      ],
    },
    {
      key: 'custas',
      icon: <DollarOutlined />,
      label: t('menu.custas').toUpperCase(),
      children: [
        { key: '/custas/diretrizes-gerais', icon: <ProfileOutlined />, label: t('menu.custas_diretrizes').toUpperCase(), onClick: () => navigate('/custas/diretrizes-gerais') },
        { key: '/custas/acoes-civeis-geral', icon: <ProfileOutlined />, label: t('menu.custas_acoes_civeis').toUpperCase(), onClick: () => navigate('/custas/acoes-civeis-geral') },
        { key: '/custas/recursos-civeis', icon: <ProfileOutlined />, label: t('menu.custas_recursos_civeis').toUpperCase(), onClick: () => navigate('/custas/recursos-civeis') },
        { key: '/custas/execucao', icon: <ProfileOutlined />, label: t('menu.custas_execucao').toUpperCase(), onClick: () => navigate('/custas/execucao') },
        { key: '/custas/embargos-incidentes', icon: <ProfileOutlined />, label: t('menu.custas_embargos_incidentes').toUpperCase(), onClick: () => navigate('/custas/embargos-incidentes') },
        { key: '/custas/mandados-servicos', icon: <ProfileOutlined />, label: t('menu.custas_mandados_servicos').toUpperCase(), onClick: () => navigate('/custas/mandados-servicos') },
        { key: '/custas/acoes-penais', icon: <ProfileOutlined />, label: t('menu.custas_acoes_penais').toUpperCase(), onClick: () => navigate('/custas/acoes-penais') },
        { key: '/custas/isencoes-gratuidade', icon: <ProfileOutlined />, label: t('menu.custas_isencoes_gratuidade').toUpperCase(), onClick: () => navigate('/custas/isencoes-gratuidade') },
      ],
    },
    {
      key: 'sistema',
      icon: <SettingOutlined />,
      label: t('menu.sistema').toUpperCase(),
      children: [
        { key: '/sistema/escritorios', icon: <ClusterOutlined />, label: t('menu.escritorios').toUpperCase(), onClick: () => navigate('/sistema/escritorios') },
        { key: '/sistema/advogados', icon: <IdcardOutlined />, label: t('menu.advogados').toUpperCase(), onClick: () => navigate('/sistema/advogados') },
        { key: '/sistema/clientes', icon: <TeamOutlined />, label: t('menu.clientes').toUpperCase(), onClick: () => navigate('/sistema/clientes') },
        { key: '/sistema/causas-processos', icon: <SolutionOutlined />, label: t('menu.causas_processos').toUpperCase(), onClick: () => navigate('/sistema/causas-processos') },
        { key: '/sistema/especialidades', icon: <ProfileOutlined />, label: t('menu.especialidades').toUpperCase(), onClick: () => navigate('/sistema/especialidades') },
        { key: '/sistema/parametros', icon: <SettingOutlined />, label: t('menu.parametros').toUpperCase(), onClick: () => navigate('/sistema/parametros') },
        { key: '/sistema/usuarios', icon: <UserOutlined />, label: t('menu.usuarios').toUpperCase(), onClick: () => navigate('/sistema/usuarios') },
        { key: '/sistema/perfil', icon: <UserOutlined />, label: t('menu.perfil').toUpperCase(), onClick: () => navigate('/sistema/perfil') },
        { key: '/sistema/permissoes', icon: <UserOutlined />, label: t('menu.permissoes').toUpperCase(), onClick: () => navigate('/sistema/permissoes') },
      ],
    },
  ]

  return (
    <AuthProvider>
      <ConfigProvider theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
        {isLogin ? (
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}><Spin /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        ) : (
          <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ paddingInline: 16, background: colorBgContainer }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>{t('header.title')}</Typography.Title>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Typography.Text>{t('header.user')}</Typography.Text>
                  <Switch checked={dark} onChange={setDark} checkedChildren={t('header.theme.dark')} unCheckedChildren={t('header.theme.light')} />
                </Space>
              </div>
            </Header>

            <Header style={{ background: colorBgContainer }}>
              <Menu
                mode="horizontal"
                selectedKeys={[selectedKey]}
                items={items as any}
                style={{ borderBottom: 0 }}
              />
            </Header>

            <Content style={{ margin: '16px' }}>
              <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
                <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}><Spin /></div>}>
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/sistema/parametros" element={<ProtectedRoute><Parametros /></ProtectedRoute>} />
                    <Route path="/sistema/escritorios" element={<ProtectedRoute><Escritorios /></ProtectedRoute>} />
                    <Route path="/sistema/advogados" element={<ProtectedRoute><Advogados /></ProtectedRoute>} />
                    <Route path="/sistema/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
                    <Route path="/sistema/causas-processos" element={<ProtectedRoute><CausasProcessos /></ProtectedRoute>} />
                    <Route path="/sistema/especialidades" element={<ProtectedRoute><Especialidades /></ProtectedRoute>} />
                    <Route path="/sistema/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
                    <Route path="/sistema/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                    <Route path="/sistema/permissoes" element={<ProtectedRoute><Permissoes /></ProtectedRoute>} />
                    <Route path="/calculos/tributario" element={<ProtectedRoute><Tributario /></ProtectedRoute>} />
                    <Route path="/calculos/previdenciario" element={<ProtectedRoute><Previdenciario /></ProtectedRoute>} />
                    <Route path="/calculos/condenatorias" element={<ProtectedRoute><Condenatorias /></ProtectedRoute>} />
                    <Route path="/calculos/atualizacao" element={<ProtectedRoute><AtualizacaoMonetaria /></ProtectedRoute>} />
                    <Route path="/custas/diretrizes-gerais" element={<ProtectedRoute><DiretrizesGerais /></ProtectedRoute>} />
                    <Route path="/custas/acoes-civeis-geral" element={<ProtectedRoute><AcoesCiveisGeral /></ProtectedRoute>} />
                    <Route path="/custas/recursos-civeis" element={<ProtectedRoute><RecursosCiveis /></ProtectedRoute>} />
                    <Route path="/custas/execucao" element={<ProtectedRoute><Execucao /></ProtectedRoute>} />
                    <Route path="/custas/embargos-incidentes" element={<ProtectedRoute><EmbargosIncidentes /></ProtectedRoute>} />
                    <Route path="/custas/mandados-servicos" element={<ProtectedRoute><MandadosServicos /></ProtectedRoute>} />
                    <Route path="/custas/acoes-penais" element={<ProtectedRoute><AcoesPenais /></ProtectedRoute>} />
                    <Route path="/custas/isencoes-gratuidade" element={<ProtectedRoute><IsencoesGratuidade /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </div>
            </Content>
          </Layout>
        )}
      </ConfigProvider>
    </AuthProvider>
  )
}

export default App

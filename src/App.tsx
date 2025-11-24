import { Layout, theme, Typography, Space, Avatar, ConfigProvider, Switch, Spin, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  IdcardOutlined,
  ClusterOutlined,
  DollarOutlined,
  CalculatorOutlined,
  LineChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useMemo, useState, Suspense, lazy, useEffect } from 'react'
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
import './themes/blackgreen.css'
import './themes/deepblue.css'
import './themes/sunset.css'
import './themes/lightmint.css'
import './themes/monochrome.css'
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
  const [themeName, setThemeName] = useState<'default' | 'blackgreen' | 'deepblue' | 'sunset' | 'lightmint' | 'monochrome'>('default')
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const location = useLocation()
  const navigate = useNavigate()
  const isLogin = location.pathname === '/login'

  useMemo(() => location.pathname, [location.pathname])
  useEffect(() => {
    const classes = ['theme-blackgreen','theme-deepblue','theme-sunset','theme-lightmint','theme-monochrome']
    classes.forEach(c => document.body.classList.remove(c))
    if (themeName !== 'default') document.body.classList.add(`theme-${themeName}`)
  }, [themeName])

  const navCadastros = [
    { key: '/sistema/escritorios', icon: <ClusterOutlined />, label: t('menu.escritorios').toUpperCase(), onClick: () => navigate('/sistema/escritorios') },
    { key: '/sistema/advogados', icon: <IdcardOutlined />, label: t('menu.advogados').toUpperCase(), onClick: () => navigate('/sistema/advogados') },
    { key: '/sistema/clientes', icon: <TeamOutlined />, label: t('menu.clientes').toUpperCase(), onClick: () => navigate('/sistema/clientes') },
    { key: '/sistema/causas-processos', icon: <FileTextOutlined />, label: t('menu.causas_processos').toUpperCase(), onClick: () => navigate('/sistema/causas-processos') },
    { key: '/sistema/especialidades', icon: <BarChartOutlined />, label: t('menu.especialidades').toUpperCase(), onClick: () => navigate('/sistema/especialidades') },
  ]
  const navCalculos = [
    { key: '/calculos/tributario', icon: <DollarOutlined />, label: t('menu.tributario').toUpperCase(), onClick: () => navigate('/calculos/tributario') },
    { key: '/calculos/previdenciario', icon: <SafetyCertificateOutlined />, label: t('menu.previdenciario').toUpperCase(), onClick: () => navigate('/calculos/previdenciario') },
    { key: '/calculos/condenatorias', icon: <FileDoneOutlined />, label: t('menu.condenatorias').toUpperCase(), onClick: () => navigate('/calculos/condenatorias') },
    { key: '/calculos/atualizacao', icon: <LineChartOutlined />, label: 'ATUALIZAÇÃO MONETÁRIA', onClick: () => navigate('/calculos/atualizacao') },
  ]
  const navCustas = [
    { key: '/custas/diretrizes-gerais', icon: <FileTextOutlined />, label: t('menu.custas_diretrizes').toUpperCase(), onClick: () => navigate('/custas/diretrizes-gerais') },
    { key: '/custas/acoes-civeis-geral', icon: <FileTextOutlined />, label: t('menu.custas_acoes_civeis').toUpperCase(), onClick: () => navigate('/custas/acoes-civeis-geral') },
    { key: '/custas/recursos-civeis', icon: <FileTextOutlined />, label: t('menu.custas_recursos_civeis').toUpperCase(), onClick: () => navigate('/custas/recursos-civeis') },
    { key: '/custas/execucao', icon: <FileTextOutlined />, label: t('menu.custas_execucao').toUpperCase(), onClick: () => navigate('/custas/execucao') },
    { key: '/custas/embargos-incidentes', icon: <FileTextOutlined />, label: t('menu.custas_embargos_incidentes').toUpperCase(), onClick: () => navigate('/custas/embargos-incidentes') },
    { key: '/custas/mandados-servicos', icon: <EnvironmentOutlined />, label: t('menu.custas_mandados_servicos').toUpperCase(), onClick: () => navigate('/custas/mandados-servicos') },
    { key: '/custas/acoes-penais', icon: <FileTextOutlined />, label: t('menu.custas_acoes_penais').toUpperCase(), onClick: () => navigate('/custas/acoes-penais') },
    { key: '/custas/isencoes-gratuidade', icon: <FileDoneOutlined />, label: t('menu.custas_isencoes_gratuidade').toUpperCase(), onClick: () => navigate('/custas/isencoes-gratuidade') },
  ]
  const navSistema = [
    { key: '/sistema/usuarios', icon: <UserOutlined />, label: t('menu.usuarios').toUpperCase(), onClick: () => navigate('/sistema/usuarios') },
    { key: '/sistema/perfil', icon: <UserOutlined />, label: t('menu.perfil').toUpperCase(), onClick: () => navigate('/sistema/perfil') },
    { key: '/sistema/permissoes', icon: <UserOutlined />, label: t('menu.permissoes').toUpperCase(), onClick: () => navigate('/sistema/permissoes') },
    { key: '/sistema/parametros', icon: <SettingOutlined />, label: t('menu.parametros').toUpperCase(), onClick: () => navigate('/sistema/parametros') },
    { key: 'temas', label: 'TEMAS', children: [
      { key: 'theme-default', label: 'PADRÃO', onClick: () => { setThemeName('default'); setDark(false) } },
      { key: 'theme-blackgreen', label: 'BLACKGREEN', onClick: () => { setThemeName('blackgreen'); setDark(true) } },
      { key: 'theme-deepblue', label: 'DEEPBLUE', onClick: () => { setThemeName('deepblue'); setDark(true) } },
      { key: 'theme-sunset', label: 'SUNSET', onClick: () => { setThemeName('sunset'); setDark(false) } },
      { key: 'theme-lightmint', label: 'LIGHTMINT', onClick: () => { setThemeName('lightmint'); setDark(false) } },
      { key: 'theme-monochrome', label: 'MONOCHROME', onClick: () => { setThemeName('monochrome'); setDark(true) } },
    ]},
  ]

  return (
    <AuthProvider>
      <ConfigProvider
        theme={{
          algorithm: (() => {
            switch (themeName) {
              case 'blackgreen':
              case 'deepblue':
              case 'monochrome':
                return theme.darkAlgorithm
              case 'sunset':
              case 'lightmint':
              default:
                return theme.defaultAlgorithm
            }
          })(),
          token: (() => {
            switch (themeName) {
              case 'blackgreen':
                return {
                  colorPrimary: '#00f0ff',
                  colorInfo: '#00f0ff',
                  colorLink: '#00f0ff',
                  colorBgLayout: '#000000',
                  colorBgContainer: '#0a0a0a',
                  colorText: '#f0f0f0',
                  colorTextSecondary: '#bdbdbd',
                  borderRadius: 10,
                  controlOutline: '#00f0ff',
                }
              case 'deepblue':
                return {
                  colorPrimary: '#3b82f6',
                  colorInfo: '#3b82f6',
                  colorLink: '#60a5fa',
                  colorBgLayout: '#0b1220',
                  colorBgContainer: '#0f172a',
                  colorText: '#e5e7eb',
                  colorTextSecondary: '#94a3b8',
                  borderRadius: 10,
                  controlOutline: '#60a5fa',
                }
              case 'sunset':
                return {
                  colorPrimary: '#fb7185',
                  colorInfo: '#fb7185',
                  colorLink: '#f97316',
                  colorBgLayout: '#fff7ed',
                  colorBgContainer: '#fff1f2',
                  colorText: '#1f2937',
                  colorTextSecondary: '#6b7280',
                  borderRadius: 12,
                  controlOutline: '#f97316',
                }
              case 'lightmint':
                return {
                  colorPrimary: '#10b981',
                  colorInfo: '#10b981',
                  colorLink: '#14b8a6',
                  colorBgLayout: '#f0fdfa',
                  colorBgContainer: '#ecfeff',
                  colorText: '#0f172a',
                  colorTextSecondary: '#334155',
                  borderRadius: 10,
                  controlOutline: '#14b8a6',
                }
              case 'monochrome':
                return {
                  colorPrimary: '#9ca3af',
                  colorInfo: '#9ca3af',
                  colorLink: '#9ca3af',
                  colorBgLayout: '#0f0f0f',
                  colorBgContainer: '#171717',
                  colorText: '#e5e5e5',
                  colorTextSecondary: '#a3a3a3',
                  borderRadius: 8,
                  controlOutline: '#737373',
                }
              default:
                return {
                  colorPrimary: '#0E5E3E',
                  colorInfo: '#0E5E3E',
                  colorLink: '#0E5E3E',
                  borderRadius: 6,
                  colorBgLayout: '#ffffff',
                  colorBgContainer: '#ffffff',
                }
            }
          })(),
        }}
      >
        {isLogin ? (
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}><Spin /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </Suspense>
        ) : (
          <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ paddingInline: 16, background: themeName === 'blackgreen' ? '#000' : colorBgContainer }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Typography.Title level={4} style={{ margin: 0 }}>{t('header.title')}</Typography.Title>
                  <Button type="text" icon={<DashboardOutlined />} onClick={() => navigate('/')}>DASHBOARD</Button>
                  <Dropdown menu={{ items: navCadastros }}>
                    <Button type="text" icon={<IdcardOutlined />}>CADASTROS <DownOutlined /></Button>
                  </Dropdown>
                  <Dropdown menu={{ items: navCalculos }}>
                    <Button type="text" icon={<CalculatorOutlined />}>{t('menu.calculos').toUpperCase()} <DownOutlined /></Button>
                  </Dropdown>
                  <Dropdown menu={{ items: navCustas }}>
                    <Button type="text" icon={<DollarOutlined />}>{t('menu.custas').toUpperCase()} <DownOutlined /></Button>
                  </Dropdown>
                  <Dropdown menu={{ items: navSistema }}>
                    <Button type="text" icon={<SettingOutlined />}>{t('menu.sistema').toUpperCase()} <DownOutlined /></Button>
                  </Dropdown>
                </Space>
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Typography.Text>{t('header.user')}</Typography.Text>
                  <Switch checked={dark} onChange={setDark} checkedChildren={t('header.theme.dark')} unCheckedChildren={t('header.theme.light')} />
                </Space>
              </div>
            </Header>
              <Content style={{ margin: 0, padding: 16, background: themeName === 'blackgreen' ? '#000' : '#fff' }}>
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
              </Content>
          </Layout>
        )}
      </ConfigProvider>
    </AuthProvider>
  )
}

export default App

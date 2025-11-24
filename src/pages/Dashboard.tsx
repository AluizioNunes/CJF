import { Suspense, useEffect, useMemo, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Space, Button, message } from 'antd'
import { motion } from 'framer-motion'
import { lazy } from 'react'
const EChart = lazy(() => import('../components/EChart'))
import { useParametros } from '../context/ParamsContext'
import { fetchSelic } from '../services/bcb'
import { fetchIpcaeSerie, fetchInpcSerie } from '../services/ibge'
import type { SeriePonto } from '../services/bcb'
import {
  listarEscritorios,
  listarAdvogados,
  listarClientes,
  listarCausasProcessos,
  type Escritorio,
  type Advogado,
  type Cliente,
  type CausaProcesso,
} from '../services/api'

export default function Dashboard() {
  const { parametros } = useParametros()
  const [selic, setSelic] = useState<SeriePonto[]>([])
  const [ipcae, setIpcae] = useState<SeriePonto[]>([])
  const [inpc, setInpc] = useState<SeriePonto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCadastros, setLoadingCadastros] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [escritorios, setEscritorios] = useState<Escritorio[]>([])
  const [advogados, setAdvogados] = useState<Advogado[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [processos, setProcessos] = useState<CausaProcesso[]>([])
  async function handleSeed() {
    setSeeding(true)
    try {
      const res = await (await import('../services/api')).seedDemo()
      message.success(`Seed criado: ESP=${res.created.especialidades} | ESC=${res.created.escritorios} | ADV=${res.created.advogados} | PROC=${res.created.causas_processos}`)
      // Recarregar cadastros para refletir novas contagens
      const [es, ad, cl, pr] = await Promise.all([
        listarEscritorios().catch(() => []),
        listarAdvogados().catch(() => []),
        listarClientes().catch(() => []),
        listarCausasProcessos().catch(() => []),
      ])
      setEscritorios(es as Escritorio[])
      setAdvogados(ad as Advogado[])
      setClientes(cl as Cliente[])
      setProcessos(pr as CausaProcesso[])
    } catch (e: any) {
      message.error(`Falha ao criar dados: ${e?.message || e}`)
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    const inicio = parametros.inicioPeriodo ? new Date(parametros.inicioPeriodo) : undefined
    const fim = parametros.fimPeriodo ? new Date(parametros.fimPeriodo) : undefined
    setLoading(true)
    Promise.all([
      parametros.indexadores.selic ? fetchSelic({ inicio, fim }) : Promise.resolve([]),
      parametros.indexadores.ipcae ? fetchIpcaeSerie({ inicio, fim }) : Promise.resolve([]),
      parametros.indexadores.inpc ? fetchInpcSerie({ inicio, fim }) : Promise.resolve([]),
    ])
      .then(([s, e, n]) => { setSelic(s); setIpcae(e); setInpc(n) })
      .finally(() => setLoading(false))
  }, [parametros])

  // Atualização periódica de cadastros (contagens) a cada 60s
  useEffect(() => {
    let cancelled = false
    const fetchCadastros = async () => {
      setLoadingCadastros(true)
      try {
        const [es, ad, cl, pr] = await Promise.all([
          listarEscritorios().catch(() => []),
          listarAdvogados().catch(() => []),
          listarClientes().catch(() => []),
          listarCausasProcessos().catch(() => []),
        ])
        if (!cancelled) {
          setEscritorios(es as Escritorio[])
          setAdvogados(ad as Advogado[])
          setClientes(cl as Cliente[])
          setProcessos(pr as CausaProcesso[])
        }
      } finally {
        setLoadingCadastros(false)
      }
    }
    fetchCadastros()
    const id = setInterval(fetchCadastros, 60000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const chartOptions = useMemo(() => {
    const sData = selic.map(p => [p.data, p.valor])
    const eData = ipcae.map(p => [p.data, p.valor])
    const nData = inpc.map(p => [p.data, p.valor])
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['SELIC', 'IPCA-E', 'INPC'] },
      xAxis: { type: 'time' },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} %' } },
      series: [
        { name: 'SELIC', type: 'line', smooth: true, data: sData },
        { name: 'IPCA-E', type: 'line', smooth: true, data: eData },
        { name: 'INPC', type: 'line', smooth: true, data: nData },
      ],
    }
  }, [selic, ipcae, inpc])

  const totalPontos = selic.length + ipcae.length + inpc.length

  const acumuladoPercent = useMemo(() => {
    const sum = (arr: SeriePonto[]) => arr.reduce((acc, p) => acc + (isFinite(p.valor) ? p.valor : 0), 0)
    return sum(selic) + sum(ipcae) + sum(inpc)
  }, [selic, ipcae, inpc])

  const mediaMensal = useMemo(() => {
    const monthlySeries = [...ipcae, ...inpc]
    if (monthlySeries.length === 0) return 0
    const total = monthlySeries.reduce((acc, p) => acc + (isFinite(p.valor) ? p.valor : 0), 0)
    return total / monthlySeries.length
  }, [ipcae, inpc])

  const valorCorrigidoSimples = useMemo(() => {
    return parametros.valorInicial * (1 + acumuladoPercent / 100)
  }, [parametros.valorInicial, acumuladoPercent])

  // Contagens de cadastros
  const countEscritorios = escritoriosCount(escritorios)
  function escritoriosCount(arr: Escritorio[]) { return Array.isArray(arr) ? arr.length : 0 }
  const countAdvogados = Array.isArray(advogados) ? advogados.length : 0
  const countClientes = Array.isArray(clientes) ? clientes.length : 0
  const countProcessos = Array.isArray(processos) ? processos.length : 0

  // Soma de valores de causas (se o campo existir)
  const { somaValoresCausas, temCampoValor } = useMemo(() => {
    let sum = 0
    let hasField = false
    for (const p of processos) {
      const v: any = (p as any).valor ?? (p as any).valor_causa ?? (p as any).valorCausa ?? (p as any).valorDaCausa
      if (typeof v === 'number' && isFinite(v)) { sum += v; hasField = true }
    }
    return { somaValoresCausas: sum, temCampoValor: hasField }
  }, [processos])

  // Distribuição por status dos processos
  const statusCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of processos) {
      const st = (p as any).status ?? '—'
      m.set(st, (m.get(st) ?? 0) + 1)
    }
    return m
  }, [processos])
  const statusPieData = useMemo(() => Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value })), [statusCounts])

  const countsChartOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Escritórios', 'Advogados', 'Clientes', 'Processos'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [countEscritorios, countAdvogados, countClientes, countProcessos], itemStyle: { color: '#1677ff' } }],
  }), [countEscritorios, countAdvogados, countClientes, countProcessos])

  const statusPieOption = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal' },
    series: [{ type: 'pie', radius: '60%', data: statusPieData }],
  }), [statusPieData])

  // Destaques monetários (BCB/IBGE)
  const selicMesAtual = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const arr = selic.filter(p => p.data.getFullYear() === y && p.data.getMonth() === m)
    if (arr.length === 0) return 0
    const fator = arr.reduce((acc, p) => acc * (1 + p.valor / 100), 1)
    return (fator - 1) * 100
  }, [selic])
  const ipcaeYtd = useMemo(() => {
    const y = new Date().getFullYear()
    return ipcae.filter(p => p.data.getFullYear() === y).reduce((acc, p) => acc + (isFinite(p.valor) ? p.valor : 0), 0)
  }, [ipcae])
  const inpcYtd = useMemo(() => {
    const y = new Date().getFullYear()
    return inpc.filter(p => p.data.getFullYear() === y).reduce((acc, p) => acc + (isFinite(p.valor) ? p.valor : 0), 0)
  }, [inpc])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Indicadores de cadastros */}
        <Card loading={loadingCadastros} extra={<Button type="primary" onClick={handleSeed} loading={seeding}>CRIAR DADOS DE DEMONSTRAÇÃO</Button>}>
          <Typography.Title level={5}>Indicadores de Cadastros</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}><Card><Statistic title="Escritórios" value={countEscritorios} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Advogados" value={countAdvogados} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Clientes" value={countClientes} /></Card></Col>
            <Col xs={12} md={6}><Card><Statistic title="Processos" value={countProcessos} /></Card></Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24} md={12}><Card><Suspense fallback={<div style={{ height: 320 }} /> }><EChart option={countsChartOption} /></Suspense></Card></Col>
            <Col xs={24} md={12}><Card><Suspense fallback={<div style={{ height: 320 }} /> }><EChart option={statusPieOption} /></Suspense></Card></Col>
          </Row>
        </Card>

        {/* Destaques monetários e séries econômicas */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Typography.Title level={5}>Séries Econômicas (SELIC, IPCA-E, INPC)</Typography.Title>
              <Suspense fallback={<div style={{ height: 320 }} /> }>
                <EChart option={chartOptions} />
              </Suspense>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}><Card><Statistic title="Valor Base" prefix="R$" precision={2} value={parametros.valorInicial} /></Card></Col>
              <Col span={12}><Card><Statistic title="Pontos carregados" value={totalPontos} /></Card></Col>
              <Col span={12}><Card><Statistic title="Total acumulado (%)" precision={2} value={acumuladoPercent} /></Card></Col>
              <Col span={12}><Card><Statistic title="Variação mensal média (%)" precision={2} value={mediaMensal} /></Card></Col>
              <Col span={12}><Card><Statistic title="SELIC mês corrente (%)" precision={3} value={selicMesAtual} /></Card></Col>
              <Col span={12}><Card><Statistic title="IPCA-E acumulado (YTD) (%)" precision={2} value={ipcaeYtd} /></Card></Col>
              <Col span={12}><Card><Statistic title="INPC acumulado (YTD) (%)" precision={2} value={inpcYtd} /></Card></Col>
              <Col span={12}><Card><Statistic title="Valor corrigido (simples)" prefix="R$" precision={2} value={valorCorrigidoSimples} /></Card></Col>
              <Col span={24}>
                <Card>
                  <Typography.Paragraph>
                    Parâmetros: início {new Date(parametros.inicioPeriodo).toLocaleDateString()} | fim {parametros.fimPeriodo ? new Date(parametros.fimPeriodo).toLocaleDateString() : '—'}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">BCB/IBGE consultados periodicamente; dados mensais e diários conforme fonte.</Typography.Text>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Valores de causas */}
        <Card>
          <Typography.Title level={5}>Valores de Causas (soma)</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic title="Total (R$)" prefix="R$" precision={2} value={temCampoValor ? somaValoresCausas : 0} />
                {!temCampoValor && (
                  <Typography.Text type="secondary">Campo de valor não disponível nos processos. Podemos estender o backend para incluir este dado.</Typography.Text>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </motion.div>
  )
}
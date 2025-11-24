import { useEffect, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, InputNumber, Radio, Row, Select, Switch, Table, Typography, Space } from 'antd'
import { Dayjs } from 'dayjs'
import { fetchSelicCached } from '../../services/bcb'
import { fetchIpcaeSerieCached, fetchInpcSerieCached } from '../../services/ibge'
import { calcularDetalhadoMensal } from '../../utils/calculo'
import type { RegraMarcoJuros } from '../../utils/calculo'
import dayjs from 'dayjs'
import { listarClientes, listarCausasProcessos, listarEspecialidades, listarEscritorios, type Cliente, type CausaProcesso, type Especialidade, type Escritorio } from '../../services/api'

type TipoDevedor = 'fazenda' | 'particular'
type TipoAcao = 'condenatoria' | 'previdenciaria' | 'desapropriacao' | 'tributaria'

function toDateFromMonth(d: Dayjs | Date | string | undefined): Date | undefined {
  const jsDate = (d as any)?.toDate?.() ? (d as any).toDate() : (typeof d === 'string' ? new Date(d) : (d as Date))
  if (!jsDate || isNaN(jsDate.getTime())) return undefined
  return new Date(jsDate.getFullYear(), jsDate.getMonth(), 1)
}

const DEC_2021 = new Date(2021, 11, 1) // 2021-12-01
const NOV_2021 = new Date(2021, 10, 1) // 2021-11-01

export default function AtualizacaoMonetaria() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ valorOriginal: number; valorAtualizado: number; correcao: number; percentualTotal: number; indexadorUsado: string } | null>(null)
  const [detalhe, setDetalhe] = useState<any[]>([])

  // Seleção Cliente/Processo com mapeamento de especialidade/escritório
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [processos, setProcessos] = useState<CausaProcesso[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [escritorios, setEscritorios] = useState<Escritorio[]>([])
  const [clienteId, setClienteId] = useState<number | undefined>(undefined)
  const [processoId, setProcessoId] = useState<number | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      try {
        const [clis, procs, esps, escs] = await Promise.all([
          listarClientes(), listarCausasProcessos(), listarEspecialidades(), listarEscritorios()
        ])
        setClientes(Array.isArray(clis) ? clis : [])
        setProcessos(Array.isArray(procs) ? procs : [])
        setEspecialidades(Array.isArray(esps) ? esps : [])
        setEscritorios(Array.isArray(escs) ? escs : [])
      } catch {}
    }
    load()
  }, [])

  const loadPreset = (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const p = JSON.parse(raw)
      return {
        ...p,
        inicioPeriodo: p.inicioPeriodo ? dayjs(p.inicioPeriodo) : undefined,
        fimPeriodo: p.fimPeriodo ? dayjs(p.fimPeriodo) : undefined,
      }
    } catch { return null }
  }

  const savePreset = (scope: 'processo' | 'cliente') => {
    const values = form.getFieldsValue()
    const key = scope === 'processo' && processoId
      ? `cjf:calc_preset:atualizacao:processo:${processoId}`
      : (clienteId ? `cjf:calc_preset:atualizacao:cliente:${clienteId}` : null)
    if (!key) return
    const payload = {
      valorInicial: values.valorInicial ?? 0,
      inicioPeriodo: values.inicioPeriodo ? values.inicioPeriodo.format?.('YYYY-MM-DD') : values.inicioPeriodo,
      fimPeriodo: values.fimPeriodo ? values.fimPeriodo.format?.('YYYY-MM-DD') : values.fimPeriodo,
      tipoDevedor: values.tipoDevedor || 'fazenda',
      tipoAcao: values.tipoAcao || 'condenatoria',
      arredondamento: values.arredondamento || 'mensal',
      mostrarDetalhe: !!values.mostrarDetalhe,
    }
    localStorage.setItem(key, JSON.stringify(payload))
  }

  const mapTipoAcao = (espNome?: string | null): TipoAcao => {
    const n = (espNome || '').toLowerCase()
    if (n.includes('tribut')) return 'tributaria'
    if (n.includes('previd')) return 'previdenciaria'
    if (n.includes('desap')) return 'desapropriacao'
    return 'condenatoria'
  }
  const mapTipoDevedor = (escNome?: string | null): TipoDevedor => {
    const n = (escNome || '').toUpperCase()
    if (n.includes('FAZENDA') || n.includes('PÚBLICA') || n.includes('PUBLICA') || n.includes('UNIÃO') || n.includes('UNIAO') || n.includes('ESTADO') || n.includes('MUNICÍPIO') || n.includes('MUNICIPIO')) return 'fazenda'
    return 'particular'
  }

  const prefillFromSelection = (procId?: number, cliId?: number) => {
    let preset = procId ? loadPreset(`cjf:calc_preset:atualizacao:processo:${procId}`) : null
    if (!preset && cliId) preset = loadPreset(`cjf:calc_preset:atualizacao:cliente:${cliId}`)
    if (!preset) {
      // tenta inferir a partir de especialidade/escritório do processo
      const proc = processos.find(p => p.id === procId)
      const espNome = especialidades.find(e => e.id === proc?.especialidade_id)?.nome
      const escNome = escritorioNome(proc?.escritorio_id)
      preset = {
        valorInicial: 10000,
        inicioPeriodo: dayjs().subtract(6, 'month'),
        fimPeriodo: dayjs(),
        tipoDevedor: mapTipoDevedor(escNome),
        tipoAcao: mapTipoAcao(espNome),
        arredondamento: 'mensal',
        mostrarDetalhe: true,
      }
    }
    form.setFieldsValue(preset)
  }

  const escritorioNome = (id?: number | null) => (Array.isArray(escritorios) ? escritorios : []).find(e => e.id === id)?.nome || undefined

  const onCalculate = async () => {
    const values = form.getFieldsValue()
    const inicio: Date | undefined = toDateFromMonth(values.inicioPeriodo)
    const fim: Date | undefined = toDateFromMonth(values.fimPeriodo)
    const valorInicial = Number(values.valorInicial || 0)
    const tipoDevedor: TipoDevedor = values.tipoDevedor || 'fazenda'
    const tipoAcao: TipoAcao = values.tipoAcao || 'condenatoria'
    const arred: 'none' | 'mensal' | 'final' = values.arredondamento || 'mensal'
    const mostrarDetalhe: boolean = values.mostrarDetalhe ?? true
    if (!inicio || !fim || !valorInicial) return

    setLoading(true)
    try {
      // Decide indexadores/regime conforme tipo
      const regime: RegraMarcoJuros[] = []
      const opts: { ipcae?: any[]; inpc?: any[]; selic?: any[] } = {}
      let indexadorDesc = ''

      if (tipoAcao === 'tributaria') {
        const selic = await fetchSelicCached({ inicio, fim })
        opts.selic = selic
        regime.push({ de: inicio, ate: fim, metodo: 'selic' })
        indexadorDesc = 'SELIC (tributário)'
      } else if (tipoAcao === 'previdenciaria') {
        const inpc = await fetchInpcSerieCached({ inicio, fim })
        const selic = await fetchSelicCached({ inicio, fim })
        // INPC até nov/2021, depois SELIC para Fazenda; para particular manter INPC + juros
        const inpcFiltrada = inpc.filter(p => p.data < DEC_2021)
        opts.inpc = inpcFiltrada
        opts.selic = selic
        if (tipoDevedor === 'fazenda') {
          regime.push({ ate: NOV_2021, metodo: 'simples', taxaMensalPercent: 0.5 })
          regime.push({ de: DEC_2021, metodo: 'selic' })
          indexadorDesc = 'INPC + Juros (até 11/2021) / SELIC (de 12/2021)'
        } else {
          regime.push({ de: inicio, ate: fim, metodo: 'simples', taxaMensalPercent: 0.5 })
          indexadorDesc = 'INPC + Juros 0,5% a.m.'
        }
      } else if (tipoAcao === 'condenatoria' || tipoAcao === 'desapropriacao') {
        const ipcae = await fetchIpcaeSerieCached({ inicio, fim })
        const selic = await fetchSelicCached({ inicio, fim })
        const ipcaeFiltrada = (tipoDevedor === 'fazenda') ? ipcae.filter(p => p.data < DEC_2021) : ipcae
        opts.ipcae = ipcaeFiltrada
        opts.selic = selic
        if (tipoDevedor === 'fazenda') {
          regime.push({ ate: NOV_2021, metodo: 'simples', taxaMensalPercent: 1.0 })
          regime.push({ de: DEC_2021, metodo: 'selic' })
          indexadorDesc = 'IPCA-E + Juros (até 11/2021) / SELIC (de 12/2021)'
        } else {
          regime.push({ de: inicio, ate: fim, metodo: 'simples', taxaMensalPercent: 1.0 })
          indexadorDesc = 'IPCA-E + Juros 1% a.m.'
        }
      }

      const detalhado = calcularDetalhadoMensal(valorInicial, {
        inicio,
        fim,
        base: 'mensal',
        arredondamento: { nivel: arred, casas: 2 },
        selicDiaria: opts.selic,
        ipcaeMensal: opts.ipcae,
        inpcMensal: opts.inpc,
        regimeMarcos: regime,
      })

      const valorFinal = detalhado.totais.valorFinal
      const correcao = valorFinal - valorInicial
      const percentualTotal = (valorFinal / valorInicial - 1) * 100
      setResultado({ valorOriginal: valorInicial, valorAtualizado: valorFinal, correcao, percentualTotal, indexadorUsado: indexadorDesc })

      if (mostrarDetalhe) {
        const lastRows = detalhado.rows.slice(-6)
        setDetalhe(lastRows.map((r, i) => ({ key: i, competencia: r.competencia, indicePercent: r.indicePercent, jurosPercent: r.jurosPercent, valorCorrigidoAcumulado: r.valorCorrigidoAcumulado, valorJurosAcumulado: r.valorJurosAcumulado, valorFinalAcumulado: r.valorFinalAcumulado })))
      } else {
        setDetalhe([])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card title="Calculadora de Atualização Monetária" bordered>
          <Form form={form} layout="vertical" initialValues={{ valorInicial: 10000, tipoDevedor: 'fazenda', tipoAcao: 'condenatoria', arredondamento: 'mensal', mostrarDetalhe: true }}>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="clienteId" label="Cliente">
                  <Select
                    allowClear showSearch optionFilterProp="label"
                    value={clienteId}
                    onChange={(v) => { setClienteId(v); setProcessoId(undefined); prefillFromSelection(undefined, v) }}
                    options={(Array.isArray(clientes) ? clientes : []).map(c => ({ label: c.nome, value: c.id }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="processoId" label="Processo">
                  <Select
                    allowClear showSearch optionFilterProp="label"
                    value={processoId}
                    onChange={(v) => { setProcessoId(v); prefillFromSelection(v, clienteId) }}
                    options={(Array.isArray(processos) ? processos : [])
                      .filter(p => !clienteId || p.cliente_id === clienteId)
                      .map(p => ({ label: `${p.numero}${p.descricao ? ' - ' + p.descricao : ''}`, value: p.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Space style={{ marginBottom: 8 }}>
              <Button onClick={() => savePreset('processo')} disabled={!processoId}>Salvar parâmetros para este processo</Button>
              <Button onClick={() => savePreset('cliente')} disabled={!clienteId}>Salvar parâmetros padrão do cliente</Button>
            </Space>
            <Form.Item label="Valor Principal (R$)" name="valorInicial" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} min={0} step={1} />
            </Form.Item>
            <Form.Item label="Data Inicial" name="inicioPeriodo" rules={[{ required: true }]}> 
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Data Final" name="fimPeriodo" rules={[{ required: true }]}> 
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Tipo de Devedor" name="tipoDevedor"> 
              <Select options={[{ value: 'fazenda', label: 'Fazenda Pública' }, { value: 'particular', label: 'Particular/Empresa' }]} />
            </Form.Item>
            <Form.Item label="Tipo de Ação" name="tipoAcao"> 
              <Select options={[{ value: 'condenatoria', label: 'Condenatória Geral' }, { value: 'previdenciaria', label: 'Benefício Previdenciário' }, { value: 'desapropriacao', label: 'Desapropriação' }, { value: 'tributaria', label: 'Tributária' }]} />
            </Form.Item>
            <Form.Item label="Arredondamento" name="arredondamento">
              <Radio.Group options={[{ value: 'mensal', label: 'Mensal' }, { value: 'final', label: 'Somente no final' }, { value: 'none', label: 'Sem arredondamento' }]} />
            </Form.Item>
            <Form.Item name="mostrarDetalhe" label="Mostrar últimos 6 meses" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Button type="primary" onClick={onCalculate} loading={loading}>Calcular</Button>
          </Form>
        </Card>
      </Col>

      <Col span={12}>
        <Card title="Resultado" bordered>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
              <div className="ant-spin ant-spin-spinning" />
            </div>
          ) : resultado ? (
            <div className="space-y-4">
              <div style={{ background: 'linear-gradient(90deg, #1677ff, #0958d9)', borderRadius: 8, padding: 16, color: '#fff' }}>
                <div style={{ opacity: 0.9, marginBottom: 4 }}>Valor Atualizado</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{resultado.valorAtualizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Valor Original</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{resultado.valorOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
                <div style={{ background: '#f6ffed', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Correção Total</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#389e0d' }}>{resultado.correcao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
              </div>

              <div style={{ background: '#f9f0ff', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Percentual de Correção</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>{resultado.percentualTotal.toFixed(2)}%</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Indexador: {resultado.indexadorUsado}</div>
              </div>

              {detalhe.length > 0 && (
                <>
                  <Typography.Title level={5} style={{ marginTop: 16 }}>Últimos 6 Meses</Typography.Title>
                  <Table
                    size="small"
                    dataSource={detalhe}
                    columns={[
                      { title: 'Competência', dataIndex: 'competencia' },
                      { title: 'Índice (%)', dataIndex: 'indicePercent', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                      { title: 'Juros (%)', dataIndex: 'jurosPercent', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                      { title: 'Corrigido (R$)', dataIndex: 'valorCorrigidoAcumulado', render: (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                      { title: 'Juros acum. (R$)', dataIndex: 'valorJurosAcumulado', render: (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                      { title: 'Final (R$)', dataIndex: 'valorFinalAcumulado', render: (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                    ]}
                    pagination={false}
                  />
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: '#999' }}>Preencha os dados para calcular</div>
          )}
        </Card>
      </Col>
    </Row>
  )
}
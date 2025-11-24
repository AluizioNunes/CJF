import { useEffect, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, InputNumber, Radio, Row, Select, Switch, Table, Typography, Space } from 'antd'
import { fetchIpcaeSerieCached } from '../../services/ibge'
import { calcularComIndicesEJuros, calcularDetalhadoMensal } from '../../utils/calculo'
import type { RegraMarcoJuros } from '../../utils/calculo'
import { useTranslation } from 'react-i18next'
import { useParametros } from '../../context/ParamsContext'
import dayjs from 'dayjs'
import { listarClientes, listarCausasProcessos, type Cliente, type CausaProcesso } from '../../services/api'

export default function Condenatorias() {
  const { t } = useTranslation()
  const { parametros } = useParametros()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{ chave: string; valor: number }[]>([])
  const [detalhe, setDetalhe] = useState<any[]>([])
  const modoEstrito = !!parametros.modoEstrito
  const regras = parametros.regrasEstritas?.condenatorias

  // Seleção Cliente/Processo
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [processos, setProcessos] = useState<CausaProcesso[]>([])
  const [clienteId, setClienteId] = useState<number | undefined>(undefined)
  const [processoId, setProcessoId] = useState<number | undefined>(undefined)

  useEffect(() => {
    const load = async () => {
      try {
        const [clis, procs] = await Promise.all([listarClientes(), listarCausasProcessos()])
        setClientes(Array.isArray(clis) ? clis : [])
        setProcessos(Array.isArray(procs) ? procs : [])
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
        dataAjuizamento: p.dataAjuizamento ? dayjs(p.dataAjuizamento) : undefined,
      }
    } catch { return null }
  }

  const savePreset = (scope: 'processo' | 'cliente') => {
    const values = form.getFieldsValue()
    const key = scope === 'processo' && processoId
      ? `cjf:calc_preset:condenatorias:processo:${processoId}`
      : (clienteId ? `cjf:calc_preset:condenatorias:cliente:${clienteId}` : null)
    if (!key) return
    const payload = {
      valorInicial: values.valorInicial ?? 0,
      inicioPeriodo: values.inicioPeriodo ? values.inicioPeriodo.format?.('YYYY-MM-DD') : values.inicioPeriodo,
      fimPeriodo: values.fimPeriodo ? values.fimPeriodo.format?.('YYYY-MM-DD') : values.fimPeriodo,
      jurosMensais: values.jurosMensais ?? regras?.jurosPadrao?.taxaMensalPercent,
      metodoJuros: values.metodoJuros ?? regras?.jurosPadrao?.metodo ?? 'simples',
      usarMarcos: !!values.usarMarcos,
      dataAjuizamento: values.dataAjuizamento ? values.dataAjuizamento.format?.('YYYY-MM-DD') : values.dataAjuizamento,
      jurosAntesPercent: values.jurosAntesPercent ?? 0,
      jurosDepoisPercent: values.jurosDepoisPercent ?? values.jurosMensais ?? 0,
      metodoDepois: values.metodoDepois ?? values.metodoJuros ?? 'simples',
      baseTemporal: values.baseTemporal ?? 'mensal',
      arredondamento: values.arredondamento ?? 'mensal',
      mostrarDetalhe: !!values.mostrarDetalhe,
    }
    localStorage.setItem(key, JSON.stringify(payload))
  }

  const prefillFromSelection = (procId?: number, cliId?: number) => {
    let preset = procId ? loadPreset(`cjf:calc_preset:condenatorias:processo:${procId}`) : null
    if (!preset && cliId) preset = loadPreset(`cjf:calc_preset:condenatorias:cliente:${cliId}`)
    if (!preset) {
      preset = {
        valorInicial: 10000,
        inicioPeriodo: dayjs().subtract(6, 'month'),
        fimPeriodo: dayjs(),
        jurosMensais: regras?.jurosPadrao?.taxaMensalPercent ?? 1.0,
        metodoJuros: regras?.jurosPadrao?.metodo ?? 'simples',
        usarMarcos: regras?.usarMarcos ?? false,
        baseTemporal: regras?.baseTemporal ?? 'mensal',
        arredondamento: regras?.arredondamento ?? 'mensal',
        mostrarDetalhe: true,
      }
    }
    form.setFieldsValue(preset)
  }

  const onCalculate = async () => {
    const values = form.getFieldsValue()
    const inicio: Date = values.inicioPeriodo?.toDate?.() ?? new Date(values.inicioPeriodo)
    const fim: Date = values.fimPeriodo?.toDate?.() ?? new Date(values.fimPeriodo)
    const valorInicial = Number(values.valorInicial || 0)
    const jurosMensais = Number((modoEstrito ? regras?.jurosPadrao?.taxaMensalPercent : values.jurosMensais) || 0)
    const metodoJuros: 'simples' | 'composto' = (modoEstrito ? (regras?.jurosPadrao?.metodo || 'simples') : (values.metodoJuros || 'simples'))
    const usarMarcos = modoEstrito ? !!regras?.usarMarcos : !!values.usarMarcos
    const dataAjuiz = values.dataAjuizamento?.toDate?.() ?? (values.dataAjuizamento ? new Date(values.dataAjuizamento) : undefined)
    const jurosAntes = Number((modoEstrito ? regras?.jurosPadrao?.taxaMensalPercent : values.jurosAntesPercent) || 0)
    const jurosDepois = Number((modoEstrito ? regras?.jurosPadrao?.taxaMensalPercent : values.jurosDepoisPercent || jurosMensais || 0))
    const metodoDepois: 'simples' | 'composto' = (modoEstrito ? (regras?.jurosPadrao?.metodo || metodoJuros) : (values.metodoDepois || metodoJuros))
    const baseTemporal: 'mensal' | 'diaria' = (modoEstrito && regras?.baseTemporal) ? regras.baseTemporal : (values.baseTemporal || 'mensal')
    const arred: 'none' | 'mensal' | 'final' = (modoEstrito && regras?.arredondamento) ? regras.arredondamento : (values.arredondamento || 'mensal')
    setLoading(true)
    try {
      const ipcae = await fetchIpcaeSerieCached({ inicio, fim })
      const result = calcularComIndicesEJuros(
        valorInicial,
        { ipcae },
        { metodoSelic: 'mensal', juros: { taxaMensalPercent: jurosMensais, metodo: metodoJuros, inicio, fim } }
      )
      setRows([
        { chave: 'VALOR INICIAL', valor: valorInicial },
        { chave: 'FATOR IPCA-E', valor: result.fatorIpcae },
        { chave: 'FATOR JUROS', valor: result.fatorJuros },
        { chave: 'VALOR FINAL', valor: result.valorFinal },
      ])

      if (values.mostrarDetalhe) {
        const regime: RegraMarcoJuros[] | undefined = usarMarcos && dataAjuiz
          ? [
              { ate: new Date(dataAjuiz.getFullYear(), dataAjuiz.getMonth(), 1), metodo: 'simples', taxaMensalPercent: jurosAntes },
              { de: new Date(dataAjuiz.getFullYear(), dataAjuiz.getMonth(), 1), metodo: metodoDepois, taxaMensalPercent: jurosDepois },
            ]
          : undefined
        const detalhado = calcularDetalhadoMensal(valorInicial, {
          inicio,
          fim,
          base: baseTemporal,
          arredondamento: { nivel: arred, casas: 2 },
          ipcaeMensal: ipcae,
          regimeMarcos: regime,
          jurosFixos: usarMarcos ? undefined : { taxaMensalPercent: jurosMensais, metodo: metodoJuros },
        })
        setDetalhe(detalhado.rows.map((r, i) => ({ key: i, ...r })))
      } else {
        setDetalhe([])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row gutter={[16,16]}>
      <Col xs={24} md={12}>
        <Card title={t('pages.calculos.condenatorias.title')}>
          <Form form={form} layout="vertical" initialValues={{
            metodoJuros: regras?.jurosPadrao?.metodo ?? 'simples',
            jurosMensais: regras?.jurosPadrao?.taxaMensalPercent ?? undefined,
            arredondamento: regras?.arredondamento ?? 'mensal',
            baseTemporal: regras?.baseTemporal ?? 'mensal',
            preset: 'condenatorias_padrao',
            usarMarcos: regras?.usarMarcos ?? false
          }}>
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
            <Form.Item name="valorInicial" label={t('pages.calculos.fields.valorInicial')} rules={[{ required: true }]}> 
              <InputNumber min={0} style={{ width: '100%' }} prefix="R$" precision={2} />
            </Form.Item>
            <Form.Item name="inicioPeriodo" label={t('pages.calculos.fields.inicioPeriodo')} rules={[{ required: true }]}> 
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="fimPeriodo" label={t('pages.calculos.fields.fimPeriodo')} rules={[{ required: true }]}> 
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="preset" label={t('pages.calculos.fields.presetJuros')}>
              <Select
                options={[
                  { label: 'Padrão Condenatórias (1% a.m. simples)', value: 'condenatorias_padrao' },
                  { label: 'Personalizado', value: 'personalizado' },
                ]}
                onChange={(v) => {
                  if (v === 'condenatorias_padrao') {
                    form.setFieldsValue({ jurosMensais: 1.0, metodoJuros: 'simples' })
                  }
                }}
                disabled={modoEstrito}
              />
            </Form.Item>
            <Form.Item name="jurosMensais" label={t('pages.calculos.fields.jurosMensais')}> 
              <InputNumber min={0} style={{ width: '100%' }} suffix="%" precision={4} />
            </Form.Item>
            <Form.Item name="metodoJuros" label={t('pages.calculos.fields.metodoJuros')}>
              <Radio.Group disabled={modoEstrito}>
                <Radio value="simples">Simples</Radio>
                <Radio value="composto">Composto</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={t('pages.calculos.fields.usarMarcos')} name="usarMarcos" valuePropName="checked">
              <Switch disabled={modoEstrito} />
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="dataAjuizamento" label={t('pages.calculos.fields.dataAjuizamento')}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="jurosAntesPercent" label={t('pages.calculos.fields.jurosAntes')}>
                  <InputNumber min={0} style={{ width: '100%' }} suffix="%" precision={4} disabled={modoEstrito} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="jurosDepoisPercent" label={t('pages.calculos.fields.jurosDepois')}>
                  <InputNumber min={0} style={{ width: '100%' }} suffix="%" precision={4} disabled={modoEstrito} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="metodoDepois" label={t('pages.calculos.fields.metodoDepois')}>
                  <Radio.Group disabled={modoEstrito}>
                    <Radio value="simples">Simples</Radio>
                    <Radio value="composto">Composto</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="baseTemporal" label={t('pages.calculos.fields.baseTemporal')}>
                  <Radio.Group disabled={modoEstrito}>
                    <Radio value="mensal">Mensal</Radio>
                    <Radio value="diaria">Diária (pro rata)</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="arredondamento" label={t('pages.calculos.fields.arredondamento')}>
                  <Select disabled={modoEstrito}
                    options={[
                      { label: 'Nenhum', value: 'none' },
                      { label: 'Mensal (2 casas)', value: 'mensal' },
                      { label: 'Final (2 casas)', value: 'final' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="mostrarDetalhe" label={t('pages.calculos.fields.mostrarDetalhe')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={onCalculate}>{t('pages.calculos.fields.calcular')}</Button>
            </Form.Item>
            {modoEstrito && (
              <Typography.Paragraph type="secondary">
                {regras?.documentacao || 'Modo estrito ativo: regras de condenatórias aplicadas conforme presets.'}
              </Typography.Paragraph>
            )}
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Resultado" loading={loading}>
          <Table
            size="small"
            dataSource={rows.map((r, i) => ({ key: i, ...r }))}
            columns={[{ title: 'Chave', dataIndex: 'chave' }, { title: 'Valor', dataIndex: 'valor', render: (v: number) => typeof v === 'number' ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v }]}
            pagination={false}
          />
          {detalhe.length > 0 && (
            <>
              <Typography.Title level={5} style={{ marginTop: 16 }}>{t('pages.calculos.fields.relatorioMensal')}</Typography.Title>
              <Table
                size="small"
                dataSource={detalhe}
                columns={[
                  { title: 'Competência', dataIndex: 'competencia' },
                  { title: 'Índice (%)', dataIndex: 'indicePercent', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) },
                  { title: 'Juros (%)', dataIndex: 'jurosPercent', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) },
                  { title: 'Corrigido (R$)', dataIndex: 'valorCorrigidoAcumulado', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                  { title: 'Juros acum. (R$)', dataIndex: 'valorJurosAcumulado', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                  { title: 'Final (R$)', dataIndex: 'valorFinalAcumulado', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                ]}
                pagination={{ pageSize: 12 }}
              />
            </>
          )}
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            IPCA-E (SIDRA 7060, variável 63). Juros configuráveis.
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
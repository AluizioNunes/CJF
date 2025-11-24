import { useEffect, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, InputNumber, Radio, Row, Select, Switch, Table, Typography, Space } from 'antd'
import { fetchSelicCached } from '../../services/bcb'
import { calcularCombinacaoIndices, calcularDetalhadoMensal } from '../../utils/calculo'
import { useTranslation } from 'react-i18next'
import { useParametros } from '../../context/ParamsContext'
import dayjs from 'dayjs'
import { listarClientes, listarCausasProcessos, type Cliente, type CausaProcesso } from '../../services/api'

export default function Tributario() {
  const { t } = useTranslation()
  const { parametros } = useParametros()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{ chave: string; valor: number }[]>([])
  const [detalhe, setDetalhe] = useState<any[]>([])
  const modoEstrito = !!parametros.modoEstrito
  const regras = parametros.regrasEstritas?.tributario

  // Seleção de Cliente/Processo e preenchimento
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
      } catch (e) {
        // silencioso no DEV
      }
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
    } catch {
      return null
    }
  }

  const savePreset = (scope: 'processo' | 'cliente') => {
    const values = form.getFieldsValue()
    const key = scope === 'processo' && processoId
      ? `cjf:calc_preset:tributario:processo:${processoId}`
      : (clienteId ? `cjf:calc_preset:tributario:cliente:${clienteId}` : null)
    if (!key) return
    const payload = {
      valorInicial: values.valorInicial ?? 0,
      inicioPeriodo: values.inicioPeriodo ? values.inicioPeriodo.format?.('YYYY-MM-DD') : values.inicioPeriodo,
      fimPeriodo: values.fimPeriodo ? values.fimPeriodo.format?.('YYYY-MM-DD') : values.fimPeriodo,
      metodoSelic: values.metodoSelic || 'simples',
      baseTemporal: values.baseTemporal || 'mensal',
      arredondamento: values.arredondamento || 'mensal',
      mostrarDetalhe: !!values.mostrarDetalhe,
    }
    localStorage.setItem(key, JSON.stringify(payload))
  }

  const prefillFromSelection = (procId?: number, cliId?: number) => {
    // tenta preset por processo, senão por cliente, senão padrão
    let preset = procId ? loadPreset(`cjf:calc_preset:tributario:processo:${procId}`) : null
    if (!preset && cliId) preset = loadPreset(`cjf:calc_preset:tributario:cliente:${cliId}`)
    if (!preset) {
      preset = {
        valorInicial: 10000,
        inicioPeriodo: dayjs().subtract(6, 'month'),
        fimPeriodo: dayjs(),
        metodoSelic: regras?.selicMetodo ?? 'simples',
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
    const metodoSelic: 'simples' | 'mensal' = (modoEstrito && regras?.selicMetodo) ? regras.selicMetodo : (values.metodoSelic || 'simples')
    setLoading(true)
    try {
      const selic = await fetchSelicCached({ inicio, fim })
      const result = calcularCombinacaoIndices({ valorInicial, metodoSelic }, { selic })
      setRows([
        { chave: 'VALOR INICIAL', valor: valorInicial },
        { chave: 'FATOR SELIC', valor: result.fatorSelic },
        { chave: 'VALOR FINAL', valor: result.valorFinal },
      ])

      if (values.mostrarDetalhe) {
        const baseTemporal: 'mensal' | 'diaria' = (modoEstrito && regras?.baseTemporal) ? regras.baseTemporal : (values.baseTemporal || 'mensal')
        const arred: 'none' | 'mensal' | 'final' = (modoEstrito && regras?.arredondamento) ? regras.arredondamento : (values.arredondamento || 'mensal')
        const detalhado = calcularDetalhadoMensal(valorInicial, {
          inicio,
          fim,
          base: baseTemporal,
          arredondamento: { nivel: arred, casas: 2 },
          selicDiaria: selic,
          jurosFixos: { taxaMensalPercent: 0, metodo: 'simples' },
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
        <Card title={t('pages.calculos.tributario.title')}>
          <Form form={form} layout="vertical" initialValues={{
            metodoSelic: regras?.selicMetodo ?? 'simples',
            arredondamento: regras?.arredondamento ?? 'mensal',
            baseTemporal: regras?.baseTemporal ?? 'mensal'
          }}>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="clienteId" label="Cliente">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={clienteId}
                    onChange={(v) => { setClienteId(v); setProcessoId(undefined); prefillFromSelection(undefined, v) }}
                    options={(Array.isArray(clientes) ? clientes : []).map(c => ({ label: c.nome, value: c.id }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="processoId" label="Processo">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
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
            <Form.Item name="metodoSelic" label={t('pages.calculos.fields.metodoSelic')}>
              <Radio.Group disabled={modoEstrito}>
                <Radio value="simples">Capitalização simples</Radio>
                <Radio value="mensal">Fator mensal</Radio>
              </Radio.Group>
            </Form.Item>
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
                  <Select
                    disabled={modoEstrito}
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
                {regras?.documentacao || 'Modo estrito ativo: regras tributárias aplicadas conforme presets.'}
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
                  { title: 'SELIC (%)', dataIndex: 'indicePercent', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) },
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
            SELIC diária: janelas superiores a 10 anos serão automaticamente limitadas.
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
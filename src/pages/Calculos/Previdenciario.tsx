import { useEffect, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, Radio, Row, Select, Switch, Table, Typography, Space } from 'antd'
import { fetchInpcSerieCached } from '../../services/ibge'
import { calcularComIndicesEJuros, calcularDetalhadoMensal } from '../../utils/calculo'
import type { RegraMarcoJuros } from '../../utils/calculo'
import { useTranslation } from 'react-i18next'
import { useParametros } from '../../context/ParamsContext'
import dayjs from 'dayjs'
import { listarClientes, listarCausasProcessos, type Cliente, type CausaProcesso } from '../../services/api'
import InfoTooltip from '../../components/InfoTooltip'

export default function Previdenciario() {
  const { t } = useTranslation()
  const { parametros } = useParametros()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<{ chave: string; valor: number }[]>([])
  const [detalhe, setDetalhe] = useState<any[]>([])
  const modoEstrito = !!parametros.modoEstrito
  const regras = parametros.regrasEstritas?.previdenciario

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

  

  const savePreset = (scope: 'processo' | 'cliente') => {
    const values = form.getFieldsValue()
    const key = scope === 'processo' && processoId
      ? `cjf:calc_preset:previdenciario:processo:${processoId}`
      : (clienteId ? `cjf:calc_preset:previdenciario:cliente:${clienteId}` : null)
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
      const inpc = await fetchInpcSerieCached({ inicio, fim })
      const result = calcularComIndicesEJuros(
        valorInicial,
        { inpc },
        { metodoSelic: 'simples', juros: { taxaMensalPercent: jurosMensais, metodo: metodoJuros, inicio, fim } }
      )
      setRows([
        { chave: 'VALOR INICIAL', valor: valorInicial },
        { chave: 'FATOR INPC', valor: result.fatorInpc },
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
          inpcMensal: inpc,
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
        <Card title={<>
          {t('pages.calculos.previdenciario.title')}
          <InfoTooltip
            title="Previdenciário (INPC + juros)"
            content={<>
              <div>Indexador INPC; para Fazenda Pública, consolida até 12/2021 e aplica SELIC daí em diante.</div>
              <div>Referências: linhas 1837–1891 e 1922–1926. Serviços: `src/services/ibge.ts:55-59`.</div>
            </>}
          />
        </>}>
          <Form form={form} layout="vertical" initialValues={{
            metodoJuros: regras?.jurosPadrao?.metodo ?? 'simples',
            jurosMensais: regras?.jurosPadrao?.taxaMensalPercent ?? undefined,
            arredondamento: regras?.arredondamento ?? 'mensal',
            baseTemporal: regras?.baseTemporal ?? 'mensal',
            preset: 'previdenciario_padrao',
            usarMarcos: regras?.usarMarcos ?? false,
            fimPeriodo: dayjs()
          }}>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="clienteId" label="Cliente">
                  <Select
                    allowClear showSearch optionFilterProp="label"
                    value={clienteId}
                    onChange={(v) => { setClienteId(v); setProcessoId(undefined); form.setFieldsValue({ valorInicial: undefined, inicioPeriodo: undefined, fimPeriodo: dayjs() }) }}
                    options={(Array.isArray(clientes) ? clientes : []).map(c => ({ label: c.nome, value: c.id }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="processoId" label="Processo">
                  <Select
                    allowClear showSearch optionFilterProp="label"
                    value={processoId}
                    disabled={!clienteId}
                    onChange={(v) => { setProcessoId(v); const p = (processos||[]).find(x=>x.id===v); form.setFieldsValue({ valorInicial: p?.valor ?? undefined, inicioPeriodo: p?.dataDistribuicao ? dayjs(p.dataDistribuicao) : undefined, fimPeriodo: dayjs() }) }}
                    options={(Array.isArray(processos) ? processos : [])
                      .filter(p => !clienteId || p.cliente_id === clienteId)
                      .map(p => ({ label: `${p.numero}${p.descricao ? ' - ' + p.descricao : ''}`, value: p.id }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="marcoTipo" label="Marco temporal">
                  <Select options={[{ value: 'ajuizamento', label: 'Ajuizamento' }, { value: 'citacao', label: 'Citação' }, { value: 'sentenca', label: 'Sentença' }]} />
                </Form.Item>
              </Col>
            </Row>
            <Space style={{ marginBottom: 8 }}>
              <Button onClick={() => savePreset('processo')} disabled={!processoId}>Salvar parâmetros para este processo</Button>
              <Button onClick={() => savePreset('cliente')} disabled={!clienteId}>Salvar parâmetros padrão do cliente</Button>
            </Space>
            <Form.Item name="valorInicial" label={t('pages.calculos.fields.valorInicial')} rules={[{ required: true }]}> 
              <MoneyInput min={0} precision={2} disabled={!processoId} />
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
                  { label: 'Padrão Previdenciário (0,5% a.m. simples)', value: 'previdenciario_padrao' },
                  { label: 'Personalizado', value: 'personalizado' },
                ]}
                onChange={(v) => {
                  if (v === 'previdenciario_padrao') {
                    form.setFieldsValue({ jurosMensais: 0.5, metodoJuros: 'simples' })
                  }
                }}
                disabled={modoEstrito}
              />
            </Form.Item>
            <Form.Item name="jurosMensais" label={t('pages.calculos.fields.jurosMensais')}> 
              <PercentInput min={0} precision={4} />
            </Form.Item>
            <Form.Item name="metodoJuros" label={<>
              {t('pages.calculos.fields.metodoJuros')}
              <InfoTooltip content={<>
                <div>Simples: juros sobre principal corrigido mês a mês; Composto: acumula multiplicativamente.</div>
                <div>Implementação: `src/utils/calculo.ts:85-100, 252-272`.</div>
              </>} />
            </>}>
              <Radio.Group disabled={modoEstrito}>
                <Radio value="simples">Simples</Radio>
                <Radio value="composto">Composto</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={<>
              {t('pages.calculos.fields.usarMarcos')}
              <InfoTooltip content={<>
                <div>Permite dividir o período por um marco processual (ex.: ajuizamento/citação/sentença).</div>
                <div>Regime mensal detalhado: `src/utils/calculo.ts:220-305`.</div>
              </>} />
            </>} name="usarMarcos" valuePropName="checked">
              <Switch disabled={modoEstrito} />
            </Form.Item>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="dataAjuizamento" label={<>
                  {t('pages.calculos.fields.dataAjuizamento')}
                  <InfoTooltip content={<>
                    <div>Data do marco selecionado; define a transição de juros/regime.</div>
                  </>} />
                </>}>
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="jurosAntesPercent" label={t('pages.calculos.fields.jurosAntes')}>
                  <PercentInput min={0} precision={4} disabled={modoEstrito} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="jurosDepoisPercent" label={t('pages.calculos.fields.jurosDepois')}>
                  <PercentInput min={0} precision={4} disabled={modoEstrito} />
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
                {regras?.documentacao || 'Modo estrito ativo: regras previdenciárias aplicadas conforme presets.'}
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
            INPC (SIDRA 1736, variável 44) mensal, Brasil. Juros configuráveis.
          </Typography.Paragraph>
        </Card>
        <Card title="Ajuda" style={{ marginTop: 12 }}>
          <Typography.Paragraph>
            INPC como indexador; para Fazenda, consolida até 12/2021 e aplica SELIC (manual: 1837–1891 e 1922–1926).
          </Typography.Paragraph>
          <Typography.Paragraph>
            Séries: INPC `src/services/ibge.ts:55-59`; SELIC `src/services/bcb.ts:32-44`.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Núcleo: `src/utils/calculo.ts:37-40, 91-100, 220-305`.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Manual CJF PDF: <a href="https://www.cjf.jus.br/publico/biblioteca/Res%20267-2013.pdf" target="_blank">Abrir</a>
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
import MoneyInput from '../../components/MoneyInput'
import PercentInput from '../../components/PercentInput'
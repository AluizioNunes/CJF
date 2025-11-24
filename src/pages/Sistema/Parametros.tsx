import { useState } from 'react'
import { Button, Col, DatePicker, Form, Radio, Row, Switch, Table, Typography, Select, Input, Tabs, Space, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { useParametros } from '../../context/ParamsContext'
import type { ParametrosCalculo } from '../../context/ParamsContext'
import type { CustasItemRule } from '../../utils/custas'
import { fetchSelicCached } from '../../services/bcb'
import { fetchIpcaeSerieCached, fetchInpcSerieCached } from '../../services/ibge'
import { format } from 'date-fns'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import MoneyInput from '../../components/MoneyInput'
import PercentInput from '../../components/PercentInput'

export default function Parametros() {
  const { t } = useTranslation()
  const { parametros, setParametros } = useParametros()
  const [form] = Form.useForm<ParametrosCalculo>()
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewRows, setPreviewRows] = useState<{ indexador: string; data: string; valor: number }[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const onFinish = (values: ParametrosCalculo) => {
    const inicioPeriodoIso = values.inicioPeriodo
    const fimPeriodoIso = values.fimPeriodo
    setParametros({
      ...values,
      inicioPeriodo: inicioPeriodoIso,
      fimPeriodo: fimPeriodoIso,
    })
  }

  const handlePreview = async () => {
    const inicio = new Date(form.getFieldValue('inicioPeriodo') ?? parametros.inicioPeriodo)
    const fim = new Date(form.getFieldValue('fimPeriodo') ?? parametros.fimPeriodo ?? new Date())
    setPreviewLoading(true)
    try {
      const [s, e, n] = await Promise.all([
        form.getFieldValue(['indexadores','selic']) ? fetchSelicCached({ inicio, fim }) : Promise.resolve([]),
        form.getFieldValue(['indexadores','ipcae']) ? fetchIpcaeSerieCached({ inicio, fim }) : Promise.resolve([]),
        form.getFieldValue(['indexadores','inpc']) ? fetchInpcSerieCached({ inicio, fim }) : Promise.resolve([]),
      ])
      const rows = [
        ...s.map(r => ({ indexador: 'SELIC', data: format(r.data, 'dd/MM/yyyy'), valor: r.valor })),
        ...e.map(r => ({ indexador: 'IPCA-E', data: format(r.data, 'dd/MM/yyyy'), valor: r.valor })),
        ...n.map(r => ({ indexador: 'INPC', data: format(r.data, 'dd/MM/yyyy'), valor: r.valor })),
      ]
      setPreviewRows(rows)
      setPreviewOpen(true)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <Row gutter={[20, 20]}>
      <Col span={24}>
        <Typography.Title level={4} style={{ marginBottom: 12 }}>{t('pages.parametros.title')}</Typography.Title>
        <Form
            form={form}
            layout="vertical"
            initialValues={parametros}
            onFinish={onFinish}
          >
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item name="valorInicial" label="Valor inicial (R$)" rules={[{ required: true }]}> 
                  <MoneyInput min={0} precision={2} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Início do período" name="inicioPeriodo" rules={[{ required: true }]} getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })} getValueFromEvent={(d) => d?.toDate()?.toISOString()}> 
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Fim do período" name="fimPeriodo" rules={[({ getFieldValue }) => ({
                  validator() {
                    const selicChecked = !!getFieldValue(['indexadores','selic'])
                    const inicioIso = getFieldValue('inicioPeriodo')
                    const fimIso = getFieldValue('fimPeriodo')
                    if (selicChecked && inicioIso && fimIso) {
                      const diffYears = dayjs(fimIso).diff(dayjs(inicioIso), 'year', true)
                      if (diffYears > 10) return Promise.reject(new Error('Período superior a 10 anos quando SELIC diária está ativa.'))
                    }
                    return Promise.resolve()
                  }
                })]}> 
                  <Form.Item noStyle name="fimPeriodo" getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })} getValueFromEvent={(d) => d?.toDate()?.toISOString()}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5} style={{ marginBottom: 8 }}>Indexadores</Typography.Title>
            <Row gutter={12} style={{ marginBottom: 12 }}>
              <Col span={8}><Form.Item name={["indexadores","selic"]} valuePropName="checked"><Switch checkedChildren="SELIC" unCheckedChildren="SELIC" /></Form.Item></Col>
              <Col span={8}><Form.Item name={["indexadores","ipcae"]} valuePropName="checked"><Switch checkedChildren="IPCA-E" unCheckedChildren="IPCA-E" /></Form.Item></Col>
              <Col span={8}><Form.Item name={["indexadores","inpc"]} valuePropName="checked"><Switch checkedChildren="INPC" unCheckedChildren="INPC" /></Form.Item></Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Form.Item name="metodoSelic" label="Método SELIC">
                  <Radio.Group>
                    <Radio value="simples">Capitalização simples</Radio>
                    <Radio value="mensal">Fator mensal</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="preset" label="Preset de cálculo">
                  <Radio.Group onChange={(e) => {
                    const v = e.target.value as 'tributario' | 'previdenciario' | 'condenatorias'
                    if (v === 'tributario') form.setFieldsValue({ indexadores: { selic: true, ipcae: false, inpc: false }, metodoSelic: 'simples' })
                    if (v === 'previdenciario') form.setFieldsValue({ indexadores: { selic: false, ipcae: false, inpc: true }, metodoSelic: 'simples' })
                    if (v === 'condenatorias') form.setFieldsValue({ indexadores: { selic: false, ipcae: true, inpc: false }, metodoSelic: 'mensal' })
                  }}>
                    <Radio value="tributario">Tributário</Radio>
                    <Radio value="previdenciario">Previdenciário</Radio>
                    <Radio value="condenatorias">Condenatórias</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="modoEstrito" label={t('pages.parametros.strictMode')} valuePropName="checked">
              <Switch />
            </Form.Item>

            <Typography.Title level={5} style={{ marginTop: 8 }}>{t('pages.parametros.regras.title')}</Typography.Title>
              <Row gutter={12}>
                <Col span={24}>
                  <Typography.Paragraph type="secondary">
                    {t('pages.parametros.regras.desc')}
                  </Typography.Paragraph>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Tributário</Typography.Text>
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","tributario","baseTemporal"]} label={t('pages.calculos.fields.baseTemporal')}>
                        <Radio.Group>
                          <Radio value="mensal">Mensal</Radio>
                          <Radio value="diaria">Diária (pro rata)</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","tributario","arredondamento"]} label={t('pages.calculos.fields.arredondamento')}>
                        <Select options={[{ label: 'Nenhum', value: 'none' }, { label: 'Mensal (2 casas)', value: 'mensal' }, { label: 'Final (2 casas)', value: 'final' }]} />
                      </Form.Item>
                    </Col>
                  </Row>
                    <Form.Item name={["regrasEstritas","tributario","selicMetodo"]} label={t('pages.calculos.fields.metodoSelic')}>
                      <Radio.Group>
                        <Radio value="simples">Simples</Radio>
                        <Radio value="mensal">Mensal</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","tributario","documentacao"]} label={t('pages.parametros.regras.doc')}>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Previdenciário</Typography.Text>
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","previdenciario","baseTemporal"]} label={t('pages.calculos.fields.baseTemporal')}>
                        <Radio.Group>
                          <Radio value="mensal">Mensal</Radio>
                          <Radio value="diaria">Diária (pro rata)</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","previdenciario","arredondamento"]} label={t('pages.calculos.fields.arredondamento')}>
                        <Select options={[{ label: 'Nenhum', value: 'none' }, { label: 'Mensal (2 casas)', value: 'mensal' }, { label: 'Final (2 casas)', value: 'final' }]} />
                      </Form.Item>
                    </Col>
                  </Row>
                    <Form.Item name={["regrasEstritas","previdenciario","jurosPadrao","taxaMensalPercent"]} label={t('pages.calculos.fields.jurosMensais')}>
                      <PercentInput min={0} precision={4} />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","previdenciario","jurosPadrao","metodo"]} label={t('pages.calculos.fields.metodoJuros')}>
                      <Radio.Group>
                        <Radio value="simples">Simples</Radio>
                        <Radio value="composto">Composto</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","previdenciario","usarMarcos"]} label={t('pages.calculos.fields.usarMarcos')} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","previdenciario","marcoTipo"]} label="Marco temporal">
                      <Select options={[
                        { label: 'Ajuizamento', value: 'ajuizamento' },
                        { label: 'Citação', value: 'citacao' },
                        { label: 'Sentença', value: 'sentenca' },
                      ]} />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","previdenciario","documentacao"]} label={t('pages.parametros.regras.doc')}>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={8} xl={8}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Condenatórias</Typography.Text>
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","condenatorias","baseTemporal"]} label={t('pages.calculos.fields.baseTemporal')}>
                        <Radio.Group>
                          <Radio value="mensal">Mensal</Radio>
                          <Radio value="diaria">Diária (pro rata)</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name={["regrasEstritas","condenatorias","arredondamento"]} label={t('pages.calculos.fields.arredondamento')}>
                        <Select options={[{ label: 'Nenhum', value: 'none' }, { label: 'Mensal (2 casas)', value: 'mensal' }, { label: 'Final (2 casas)', value: 'final' }]} />
                      </Form.Item>
                    </Col>
                  </Row>
                    <Form.Item name={["regrasEstritas","condenatorias","jurosPadrao","taxaMensalPercent"]} label={t('pages.calculos.fields.jurosMensais')}>
                      <PercentInput min={0} precision={4} />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","condenatorias","jurosPadrao","metodo"]} label={t('pages.calculos.fields.metodoJuros')}>
                      <Radio.Group>
                        <Radio value="simples">Simples</Radio>
                        <Radio value="composto">Composto</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","condenatorias","usarMarcos"]} label={t('pages.calculos.fields.usarMarcos')} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","condenatorias","marcoTipo"]} label="Marco temporal">
                      <Select options={[
                        { label: 'Ajuizamento', value: 'ajuizamento' },
                        { label: 'Citação', value: 'citacao' },
                        { label: 'Sentença', value: 'sentenca' },
                      ]} />
                    </Form.Item>
                    <Form.Item name={["regrasEstritas","condenatorias","documentacao"]} label={t('pages.parametros.regras.doc')}>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                </Col>
              </Row>
            

            <Typography.Title level={5} style={{ marginTop: 16 }}>Custas Processuais</Typography.Title>
              <Typography.Paragraph type="secondary">
                Configure regras por módulo e o tratamento de gratuidade/isenções.
              </Typography.Paragraph>
              <Row gutter={12} style={{ marginBottom: 12 }}>
                <Col xs={24} md={12}>
                  <Form.Item name={[ 'custas', 'regiao' ]} label="Região (tabela)">
                    <Select 
                      options={[
                      { label: 'CJF (geral)', value: 'CJF' },
                      { label: 'TRF1', value: 'TRF1' },
                      { label: 'TRF2', value: 'TRF2' },
                      { label: 'TRF3', value: 'TRF3' },
                      { label: 'TRF4', value: 'TRF4' },
                      { label: 'TRF5', value: 'TRF5' },
                      { label: 'TRF6', value: 'TRF6' },
                    ]}
                      onChange={(regiao) => {
                        try {
                          // Aplica um conjunto básico de regras conforme a região selecionada (placeholders sem valores numéricos)
                          const base: NonNullable<ParametrosCalculo['custas']>['regras'] = {
                            acoesCiveis: [
                              { id: 'distribuicao', label: 'Distribuição (percentual sobre valor da causa) — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'citacao', label: 'Citação e atos iniciais (fixo por ato)', tipo: 'fixo', valorFixo: 0 },
                            ],
                            recursosCiveis: [
                              { id: 'preparo', label: 'Preparo (percentual sobre valor da causa) — Tabela I, metade na interposição', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'porte', label: 'Porte de remessa e retorno (fixo, por região; dispensado em autos eletrônicos)', tipo: 'fixo', valorFixo: 0 },
                            ],
                            execucao: [
                              { id: 'liquidacao', label: 'Liquidação (nos autos): isenta', tipo: 'fixo', valorFixo: 0 },
                              { id: 'cumprimentoNosAutos', label: 'Cumprimento de sentença (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
                              { id: 'impugnacao', label: 'Impugnação ao cumprimento (metade final das custas) — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'execucaoExtrajudicial', label: 'Execução de título extrajudicial — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'execucaoFiscal', label: 'Execução fiscal — Tabela I (alínea a)', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'leilaoPraca', label: 'Leilão/Praça — Tabela III (arrematação/adjudicação/remição)', tipo: 'fixo', valorFixo: 0 },
                            ],
                            embargosIncidentes: [
                              { id: 'embargosExecucao', label: 'Embargos à execução (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
                              { id: 'invalidacaoArrematacaoNosAutos', label: 'Invalidade de arrematação (nos autos): isento', tipo: 'fixo', valorFixo: 0 },
                              { id: 'acaoAutonomaInvalidacao', label: 'Ação autônoma de invalidação — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'embargosTerceiros', label: 'Embargos de terceiros — Tabela I', tipo: 'percentual', percentual: 0, minimo: 0, maximo: 0 },
                              { id: 'incidenteApenso', label: 'Incidente apenso: sem custas', tipo: 'fixo', valorFixo: 0 },
                            ],
                            mandadosServicos: [
                              { id: 'diligencia', label: 'Diligência de oficial (base + km) — Tabela única regional', tipo: 'diligencia', baseKm: 0, valorPorKm: 0 },
                              { id: 'certidao', label: 'Certidões e reproduções — Tabela III/Regional (fixo por unidade)', tipo: 'fixo', valorFixo: 0 },
                            ],
                            acoesPenais: [
                              { id: 'acaoPenalPublica', label: 'Ação penal pública: custas finais pelo réu se condenado', tipo: 'fixo', valorFixo: 0 },
                              { id: 'acaoPenalPrivada', label: 'Ação penal privada: preparo antecipado pelo querelante', tipo: 'fixo', valorFixo: 0 },
                            ],
                          }
                          form.setFieldValue(['custas','regras'], base)
                          form.setFieldValue(['custas','regiao'], regiao)
                        } catch {}
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Tabs
                defaultActiveKey="acoesCiveis"
                items={[
                  { key: 'acoesCiveis', label: 'Ações Cíveis em Geral', children: <RegrasCustasEditor moduleKey="acoesCiveis" form={form} /> },
                  { key: 'recursosCiveis', label: 'Recursos Cíveis', children: <RegrasCustasEditor moduleKey="recursosCiveis" form={form} /> },
                  { key: 'execucao', label: 'Execução', children: <RegrasCustasEditor moduleKey="execucao" form={form} /> },
                  { key: 'embargosIncidentes', label: 'Embargos e Incidentes', children: <RegrasCustasEditor moduleKey="embargosIncidentes" form={form} /> },
                  { key: 'mandadosServicos', label: 'Mandados e Serviços Oficiais', children: <RegrasCustasEditor moduleKey="mandadosServicos" form={form} /> },
                  { key: 'acoesPenais', label: 'Ações Penais', children: <RegrasCustasEditor moduleKey="acoesPenais" form={form} /> },
                  { key: 'gratuidade', label: 'Gratuidade/Isenções', children: <GratuidadeEditor form={form} /> },
                ]}
              />
            

            {/* Overrides removidos para simplificar a UI e reduzir ruído visual */}

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handlePreview}>{t('pages.parametros.preview.title')}</Button>
              <Button type="primary" htmlType="submit">Salvar Parâmetros</Button>
            </Space>
          </Form>
      </Col>
      <Modal
        title={t('pages.parametros.preview.title')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={<Button onClick={() => setPreviewOpen(false)}>Fechar</Button>}
      >
        <Table
          size="small"
          dataSource={previewRows.map((r, idx) => ({ key: idx, ...r }))}
          columns={[
            { title: 'Indexador', dataIndex: 'indexador' },
            { title: 'Data', dataIndex: 'data' },
            { title: 'Valor (%)', dataIndex: 'valor' },
          ]}
          pagination={{ pageSize: 10 }}
          loading={previewLoading}
        />
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          As APIs do BCB podem exigir janela máxima de 10 anos para séries diárias como SELIC (código 11).
        </Typography.Paragraph>
      </Modal>
    </Row>
  )
}

type RegrasCustasEditorProps = {
  moduleKey: keyof NonNullable<ParametrosCalculo['custas']>['regras']
  form: FormInstance<ParametrosCalculo>
}

function RegrasCustasEditor({ moduleKey, form }: RegrasCustasEditorProps) {
  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>{`Regras de ${labelFromModule(moduleKey)}`}</Typography.Text>
      <Form.List name={[ 'custas', 'regras', moduleKey ]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(field => {
              const currentTipo = form.getFieldValue([ 'custas', 'regras', moduleKey, field.name as number, 'tipo' ]) as CustasItemRule['tipo'] | undefined
              return (
                <div key={field.key} style={{ marginBottom: 12 }}>
                  <Row gutter={12}>
                    <Col xs={24} md={6}>
                      <Form.Item {...field} name={[field.name, 'id']} label="ID" rules={[{ required: true }]}> 
                        <Input placeholder="ex.: distribuicao" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={10}>
                      <Form.Item {...field} name={[field.name, 'label']} label="Descrição" rules={[{ required: true }]}> 
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item {...field} name={[field.name, 'tipo']} label="Tipo" rules={[{ required: true }]}> 
                        <Select options={[
                          { label: 'Fixo', value: 'fixo' },
                          { label: 'Percentual', value: 'percentual' },
                          { label: 'Diligência (base + km)', value: 'diligencia' },
                        ]} />
                      </Form.Item>
                    </Col>
                  </Row>
                  {currentTipo === 'fixo' && (
                    <Row gutter={12}>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'valorFixo']} label="Valor fixo (R$)">
                          <MoneyInput min={0} precision={2} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                  {currentTipo === 'percentual' && (
                    <Row gutter={12}>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'percentual']} label="Percentual (%)">
                          <PercentInput min={0} precision={4} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'minimo']} label="Mínimo (R$)">
                          <MoneyInput min={0} precision={2} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'maximo']} label="Máximo (R$)">
                          <MoneyInput min={0} precision={2} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                  {currentTipo === 'diligencia' && (
                    <Row gutter={12}>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'baseKm']} label="Base (R$)">
                          <MoneyInput min={0} precision={2} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item name={[field.name, 'valorPorKm']} label="Valor por km (R$)">
                          <MoneyInput min={0} precision={2} />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                  <Space>
                    <Button danger onClick={() => remove(field.name)}>Remover item</Button>
                  </Space>
                </div>
              )
            })}
            <Button type="dashed" onClick={() => add({ id: '', label: '', tipo: 'fixo' })} block>
              Adicionar item
            </Button>
          </>
        )}
      </Form.List>
    </div>
  )
}

function GratuidadeEditor({ form }: { form: FormInstance<ParametrosCalculo> }) {
  const regras = form.getFieldValue(['custas','regras']) as NonNullable<ParametrosCalculo['custas']>['regras'] | undefined
  const optionsFrom = (arr?: CustasItemRule[]) => (arr ?? []).map(r => ({ label: r.label, value: r.id }))
  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Configuração de Gratuidade/Isenções</Typography.Text>
      <Form.Item name={[ 'custas', 'gratuidade', 'modo' ]} label="Modo de gratuidade">
        <Select options={[
          { label: 'Zerar todas as custas', value: 'zerarTudo' },
          { label: 'Isentar itens específicos', value: 'isentarItens' },
        ]} />
      </Form.Item>
      <Typography.Paragraph type="secondary">
        Se optar por isentar itens específicos, selecione abaixo por módulo.
      </Typography.Paragraph>
      <Row gutter={12}>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'acoesCiveis' ]} label="Isentos — Ações Cíveis">
            <Select mode="multiple" options={optionsFrom(regras?.acoesCiveis)} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'recursosCiveis' ]} label="Isentos — Recursos Cíveis">
            <Select mode="multiple" options={optionsFrom(regras?.recursosCiveis)} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'execucao' ]} label="Isentos — Execução">
            <Select mode="multiple" options={optionsFrom(regras?.execucao)} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'embargosIncidentes' ]} label="Isentos — Embargos/Incidentes">
            <Select mode="multiple" options={optionsFrom(regras?.embargosIncidentes)} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'mandadosServicos' ]} label="Isentos — Mandados/Serviços">
            <Select mode="multiple" options={optionsFrom(regras?.mandadosServicos)} allowClear />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name={[ 'custas', 'gratuidade', 'isentos', 'acoesPenais' ]} label="Isentos — Ações Penais">
            <Select mode="multiple" options={optionsFrom(regras?.acoesPenais)} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name={[ 'custas', 'gratuidade', 'observacoes' ]} label="Observações">
        <Input.TextArea rows={3} />
      </Form.Item>
    </div>
  )
}

function labelFromModule(key: keyof NonNullable<ParametrosCalculo['custas']>['regras']): string {
  switch (key) {
    case 'acoesCiveis': return 'Ações Cíveis em Geral'
    case 'recursosCiveis': return 'Recursos Cíveis'
    case 'execucao': return 'Execução'
    case 'embargosIncidentes': return 'Embargos e Incidentes'
    case 'mandadosServicos': return 'Mandados e Serviços Oficiais'
    case 'acoesPenais': return 'Ações Penais'
    default: return String(key)
  }
}
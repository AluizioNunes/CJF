import { Card, Form, InputNumber, Table, Button, Row, Col, Typography, Switch, Input } from 'antd'
// MoneyInput não utilizado diretamente nesta tela
import InfoTooltip from '../../components/InfoTooltip'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { calcularCustas } from '../../utils/custas'
import type { CustasItemRule } from '../../utils/custas'
import { useParametros } from '../../context/ParamsContext'

export default function MandadosServicos() {
  const { t } = useTranslation()
  const { parametros } = useParametros()
  const [form] = Form.useForm()
  const [rows, setRows] = useState<{ key: string; item: string; quantidade: number; valorUnitario: number; subtotal: number }[]>([])
  const [total, setTotal] = useState<number>(0)
  const rules = useMemo<CustasItemRule[]>(() => parametros.custas?.regras.mandadosServicos ?? [], [parametros])
  const [loadingDist, setLoadingDist] = useState(false)
  const [coordsInfo, setCoordsInfo] = useState<string | undefined>(undefined)
  async function onFetchDistance() {
    const origin = form.getFieldValue('origemEnd') as string | undefined
    const dest = form.getFieldValue('destinoEnd') as string | undefined
    if (!origin || !dest) return
    try {
      setLoadingDist(true)
      const { getDistanceKmByAddresses } = await import('../../services/osrm')
      const res = await getDistanceKmByAddresses(origin, dest)
      if (res.km != null) {
        form.setFieldValue('distanciaKm', Number(res.km.toFixed(1)))
        setCoordsInfo(`Origem: ${res.origin?.lat?.toFixed(5)},${res.origin?.lon?.toFixed(5)} · Destino: ${res.dest?.lat?.toFixed(5)},${res.dest?.lon?.toFixed(5)}`)
      } else {
        setCoordsInfo('Não foi possível obter a distância (OSRM/Nominatim)')
      }
    } finally {
      setLoadingDist(false)
    }
  }

  const onCalculate = () => {
    const values = form.getFieldsValue()
    const isento: boolean = !!values.isento
    const inputs: Record<string, any> = {}
    const gratuidadeModo = parametros.custas?.gratuidade.modo ?? 'zerarTudo'
    const idsIsentos = parametros.custas?.gratuidade.isentos.mandadosServicos ?? []
    const rulesToUse = isento && gratuidadeModo === 'isentarItens' ? rules.filter(r => !idsIsentos.includes(r.id)) : rules
    for (const r of rulesToUse) {
      inputs[r.id] = {
        distanciaKm: values.distanciaKm,
        quantidade: values[`q_${r.id}`] ?? 1,
      }
    }
    const res = calcularCustas(rulesToUse, inputs)
    const itens = res.itens.map((it) => ({ key: it.id, item: it.label, quantidade: it.quantidade, valorUnitario: it.valorUnitario, subtotal: it.subtotal }))
    if (isento && gratuidadeModo === 'zerarTudo') {
      setRows(itens.map(r => ({ ...r, subtotal: 0, valorUnitario: 0 })))
      setTotal(0)
      return
    }
    setRows(itens)
    setTotal(res.total)
  }

  return (
    <Card title={<>
      {t('pages.custas.mandadosServicos.title')}
      <InfoTooltip content={<>
        <div>Diligência de oficial (base + km) e certidões conforme Tabela III.</div>
        <div>Exceções de porte em e-Proc conforme região.</div>
      </>} />
    </>}>
      <Form form={form} layout="vertical" initialValues={{}}>
        <Row gutter={[16,16]}>
          <Col xs={24} md={8}>
            <Form.Item name="distanciaKm" label={t('pages.custas.fields.distanciaKm')}>
              <InputNumber min={0} style={{ width: '100%' }} precision={1} />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name="origemEnd" label="Origem (endereço opcional)">
                  <Input placeholder="Rua, cidade/UF" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="destinoEnd" label="Destino (endereço opcional)">
                  <Input placeholder="Rua, cidade/UF" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Button onClick={onFetchDistance} loading={loadingDist}>Obter distância via OSRM</Button>
                {coordsInfo && (
                  <Typography.Text style={{ marginLeft: 8 }} type="secondary">{coordsInfo}</Typography.Text>
                )}
              </Col>
            </Row>
          </Col>
          <Col xs={24} md={16}>
            {rules.map((r) => (
              <Row key={r.id} gutter={8} align="middle">
                <Col flex="auto">
                  <Typography.Text>
                    {r.label}
                    <InfoTooltip content={<>
                      <div>Regra: {r.tipo === 'percentual' ? 'percentual' : r.tipo}</div>
                      <div>Base km e valor por km quando aplicável.</div>
                    </>} />
                  </Typography.Text>
                </Col>
                <Col>
                  <Form.Item name={`q_${r.id}`} label={t('pages.custas.fields.quantidade')} initialValue={1}>
                    <InputNumber min={0} />
                  </Form.Item>
                </Col>
              </Row>
            ))}
            <Row gutter={8} align="middle">
              <Col>
                <Form.Item name="isento" label={t('pages.custas.fields.isencaoGratuidade')} valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
        <Button type="primary" onClick={onCalculate}>{t('pages.custas.fields.calcular')}</Button>
      </Form>

      <Typography.Title level={5} style={{ marginTop: 16 }}>{t('pages.custas.fields.resultado')}</Typography.Title>
      <Table
        size="small"
        dataSource={rows.map((r) => ({ ...r }))}
        columns={[
          { title: t('pages.custas.fields.item'), dataIndex: 'item' },
          { title: t('pages.custas.fields.quantidade'), dataIndex: 'quantidade' },
          { title: t('pages.custas.fields.valorUnitario'), dataIndex: 'valorUnitario', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
          { title: t('pages.custas.fields.subtotal'), dataIndex: 'subtotal', render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        ]}
        pagination={false}
      />
      <Typography.Paragraph><b>{t('pages.custas.fields.total')}:</b> {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography.Paragraph>
      <Card title="Ajuda" style={{ marginTop: 12 }}>
        <Typography.Paragraph>
          Diligências calculadas por base + km; valores e exceções variam por TRF (ver `src/data/custas/*`).
        </Typography.Paragraph>
        <Typography.Paragraph>
          Regras de cálculo: `src/utils/custas.ts`.
        </Typography.Paragraph>
      </Card>
    </Card>
  )
}
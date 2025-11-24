import { Card, Form, Table, Button, Row, Col, Typography, Switch, InputNumber } from 'antd'
// MoneyInput não é utilizado diretamente nesta tela
import InfoTooltip from '../../components/InfoTooltip'
import { useTranslation } from 'react-i18next'
import { useMemo, useState } from 'react'
import { calcularCustas } from '../../utils/custas'
import type { CustasItemRule } from '../../utils/custas'
import { useParametros } from '../../context/ParamsContext'

export default function Execucao() {
  const { t } = useTranslation()
  const { parametros } = useParametros()
  const [form] = Form.useForm()
  const [rows, setRows] = useState<{ key: string; item: string; quantidade: number; valorUnitario: number; subtotal: number }[]>([])
  const [total, setTotal] = useState<number>(0)
  const rules = useMemo<CustasItemRule[]>(() => parametros.custas?.regras.execucao ?? [], [parametros])

  const onCalculate = () => {
    const values = form.getFieldsValue()
    const isento: boolean = !!values.isento
    const impugnacaoFlag: boolean = !!values.impugnacao
    const inputs: Record<string, any> = {}
    const gratuidadeModo = parametros.custas?.gratuidade.modo ?? 'zerarTudo'
    const idsIsentos = parametros.custas?.gratuidade.isentos.execucao ?? []
    const rulesToUse = isento && gratuidadeModo === 'isentarItens' ? rules.filter(r => !idsIsentos.includes(r.id)) : rules
    for (const r of rulesToUse) {
      inputs[r.id] = {
        valorExecutado: values.valorExecutado,
        quantidade: r.id === 'impugnacao' ? (impugnacaoFlag ? (values[`q_${r.id}`] ?? 1) : 0) : (values[`q_${r.id}`] ?? 1),
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
      {t('pages.custas.execucao.title')}
      <InfoTooltip content={<>
        <div>Taxa de execução e atos de penhora/avaliação conforme Tabela III.</div>
        <div>Base regional: `src/data/custas/sources.ts`.</div>
      </>} />
    </>}>
      <Form form={form} layout="vertical" initialValues={{}}>
        <Row gutter={[16,16]}>
          <Col xs={24} md={8}>
            <Form.Item name="valorExecutado" label={t('pages.custas.fields.valorExecutado')} rules={[{ required: true }]}> 
              <InputNumber min={0} style={{ width: '100%' }} prefix="R$" precision={2} />
            </Form.Item>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={8} align="middle">
              <Col>
                <Form.Item name="impugnacao" label="Há impugnação?" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            {rules.map((r) => (
              <Row key={r.id} gutter={8} align="middle">
                <Col flex="auto">
                  <Typography.Text>{r.label}</Typography.Text>
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
          Itens de execução (Tabela I e III) variam por região; ver `src/data/custas/*`.
        </Typography.Paragraph>
        <Typography.Paragraph>
          Regras de cálculo: `src/utils/custas.ts`.
        </Typography.Paragraph>
      </Card>
    </Card>
  )
}
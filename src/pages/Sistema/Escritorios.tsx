import { useEffect, useState } from 'react'
import { Button, Card, Drawer, Form, Input, message, Space, Table, Typography } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { criarEscritorio, excluirEscritorio, listarEscritorios, atualizarEscritorio } from '../../services/api'
import type { Escritorio } from '../../services/api'
import { useTranslation } from 'react-i18next'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Escritorios() {
  const { t } = useTranslation()
  const { data, loading, error, reload } = useAsyncData<Escritorio[]>(listarEscritorios, { errorTitle: 'Falha ao carregar Escritórios' })
  const [filtered, setFiltered] = useState<Escritorio[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Escritorio | null>(null)
  const [form] = Form.useForm<Omit<Escritorio, 'id'>>()
  const [q, setQ] = useState('')
  useEffect(() => { /* carregamento automático via hook */ }, [])

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(!query ? data : data.filter(r => (
      r.nome?.toUpperCase().includes(query) ||
      r.cnpj?.toUpperCase().includes(query) ||
      r.email?.toUpperCase().includes(query) ||
      r.telefone?.toUpperCase().includes(query)
    )))
  }, [q, data])

  const { run: saveEscritorio, loading: saving } = useAsyncAction(
    async (payload: Omit<Escritorio, 'id'>) => (editing ? atualizarEscritorio(editing.id, payload) : criarEscritorio(payload)),
    {
      successMessage: () => (editing ? 'Escritório atualizado' : 'Escritório criado'),
      onSuccess: () => { setOpen(false); setEditing(null); form.resetFields(); reload() }
    }
  )

  const { run: deleteEscritorioAction, loading: deleting } = useAsyncAction(
    async (id: number) => excluirEscritorio(id),
    { successMessage: 'Excluído', onSuccess: () => { reload() } }
  )

  const onCreate = async () => {
    const values = await form.validateFields()
    await saveEscritorio(values)
  }

  return (
    <Card title={t('pages.escritorios.title')}>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por nome, CNPJ, e-mail ou telefone" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); form.resetFields() }}>{t('pages.escritorios.novo')}</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: 'Nome', dataIndex: 'nome' },
          { title: 'CNPJ', dataIndex: 'cnpj' },
          { title: 'E-mail', dataIndex: 'email' },
          { title: 'Telefone', dataIndex: 'telefone' },
          {
            title: 'Ações',
            render: (_, record) => (
              <Space>
                <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ nome: record.nome, cnpj: record.cnpj, email: record.email, telefone: record.telefone }) }}>Editar</Button>
                <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteEscritorioAction(record.id) }}>Excluir</Button>
              </Space>
            )
          }
        ]}
      />
      <Drawer title={editing ? t('pages.escritorios.editar') : t('pages.escritorios.novo')} open={open} onClose={() => setOpen(false)} width={420}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onCreate} disabled={saving} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="cnpj" label="CNPJ" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input />
          </Form.Item>
          <Form.Item name="telefone" label="Telefone" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
      <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
        Esta tela consome o backend FastAPI em /escritorios. Em desenvolvimento, se o backend não estiver ativo, a lista virá vazia.
      </Typography.Paragraph>
    </Card>
  )
}
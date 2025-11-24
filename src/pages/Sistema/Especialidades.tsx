import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Space, Table } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarEspecialidades, criarEspecialidade, atualizarEspecialidade, excluirEspecialidade, type Especialidade } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Especialidades() {
  const { data, loading, error, reload } = useAsyncData<Especialidade[]>(listarEspecialidades, { errorTitle: 'Falha ao carregar Especialidades' })
  const [filtered, setFiltered] = useState<Especialidade[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Especialidade | null>(null)
  const [form] = Form.useForm<Omit<Especialidade, 'id'>>()
  const [q, setQ] = useState('')
  useEffect(() => { /* carregamento automático via hook */ }, [])

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(!query ? data : data.filter(r => (r.nome?.toUpperCase().includes(query)) || (r.descricao?.toUpperCase().includes(query))))
  }, [q, data])

  const { run: saveEspecialidade, loading: saving } = useAsyncAction(
    async (payload: Omit<Especialidade, 'id'>) => (editing ? atualizarEspecialidade(editing.id, payload) : criarEspecialidade(payload)),
    {
      successMessage: () => (editing ? 'Especialidade atualizada' : 'Especialidade criada'),
      onSuccess: () => { setOpen(false); setEditing(null); form.resetFields(); reload() }
    }
  )

  const { run: deleteEspecialidadeAction, loading: deleting } = useAsyncAction(
    async (id: number) => excluirEspecialidade(id),
    { successMessage: 'Excluído', onSuccess: () => { reload() } }
  )

  const onSave = async () => {
    const values = await form.validateFields()
    await saveEspecialidade(values)
  }

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'Descrição', dataIndex: 'descricao' },
    {
      title: 'Ações',
      render: (_: any, record: Especialidade) => (
        <Space>
          <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ nome: record.nome, descricao: record.descricao }) }}>Editar</Button>
          <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteEspecialidadeAction(record.id) }}>Excluir</Button>
        </Space>
      )
    }
  ], [form])

  return (
    <Card title="Especialidades">
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por nome ou descrição" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); form.resetFields() }}>Novo</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title={editing ? 'Editar Especialidade' : 'Nova Especialidade'} open={open} onClose={() => setOpen(false)} width={420}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onSave} disabled={saving} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}
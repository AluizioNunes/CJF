import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Space, Table } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarClientes, criarCliente, atualizarCliente, excluirCliente, type Cliente } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Clientes() {
  const { data, loading, error, reload } = useAsyncData<Cliente[]>(listarClientes, { errorTitle: 'Falha ao carregar Clientes' })
  const [filtered, setFiltered] = useState<Cliente[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form] = Form.useForm<Omit<Cliente, 'id'>>()
  const [q, setQ] = useState('')
  useEffect(() => { /* carregamento automático via hook */ }, [])

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(
      !query
        ? data
        : data.filter(r =>
            (r.nome?.toUpperCase().includes(query)) ||
            (r.cpf_cnpj?.toUpperCase().includes(query)) ||
            (r.email?.toUpperCase().includes(query)) ||
            (r.telefone?.toUpperCase().includes(query))
        )
    )
  }, [q, data])

  const { run: saveCliente, loading: saving } = useAsyncAction(
    async (payload: Omit<Cliente, 'id'>) => (editing ? atualizarCliente(editing.id, payload) : criarCliente(payload)),
    {
      successMessage: () => (editing ? 'Cliente atualizado' : 'Cliente criado'),
      onSuccess: () => { setOpen(false); setEditing(null); form.resetFields(); reload() }
    }
  )
  const { run: deleteCliente, loading: deleting } = useAsyncAction(
    async (id: number) => excluirCliente(id),
    { successMessage: 'Excluído', onSuccess: () => { reload() } }
  )

  const onSave = async () => {
    const values = await form.validateFields()
    await saveCliente(values)
  }

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'CPF/CNPJ', dataIndex: 'cpf_cnpj' },
    { title: 'E-mail', dataIndex: 'email' },
    { title: 'Telefone', dataIndex: 'telefone' },
    {
      title: 'Ações',
      render: (_: any, record: Cliente) => (
        <Space>
          <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ nome: record.nome, cpf_cnpj: record.cpf_cnpj, email: record.email, telefone: record.telefone }) }}>Editar</Button>
          <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteCliente(record.id) }}>Excluir</Button>
        </Space>
      )
    }
  ], [form])

  return (
    <Card title="Clientes">
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por nome, CPF/CNPJ, e-mail ou telefone" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); form.resetFields() }}>Novo</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title={editing ? 'Editar Cliente' : 'Novo Cliente'} open={open} onClose={() => setOpen(false)} width={420}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onSave} disabled={saving} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="cpf_cnpj" label="CPF/CNPJ" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
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
    </Card>
  )
}
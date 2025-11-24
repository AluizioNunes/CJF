import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Select, Space, Table, message } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarAdvogados, criarAdvogado, atualizarAdvogado, excluirAdvogado, listarEspecialidades, type Advogado, type Especialidade } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Advogados() {
  const { data: advogados, loading: advLoading, error: advError, reload: reloadAdvogados } = useAsyncData<Advogado[]>(listarAdvogados, { errorTitle: 'Falha ao carregar Advogados' })
  const { data: especialidades, loading: espLoading, error: espError, reload: reloadEspecialidades } = useAsyncData<Especialidade[]>(listarEspecialidades, { errorTitle: 'Falha ao carregar Especialidades' })
  const espList = Array.isArray(especialidades) ? especialidades : []
  const [filtered, setFiltered] = useState<Advogado[]>([])
  const loading = advLoading || espLoading
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Advogado | null>(null)
  const [form] = Form.useForm<Partial<Omit<Advogado, 'id'>>>()
  const [q, setQ] = useState('')
  const error = advError || espError
  const reload = () => { reloadAdvogados(); reloadEspecialidades() }
  useEffect(() => { /* carregamento automático via hooks */ }, [])

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(
      !query
        ? (advogados || [])
        : (advogados || []).filter(r =>
            (r.nome?.toUpperCase().includes(query)) ||
            (r.oab?.toUpperCase().includes(query)) ||
            (r.email?.toUpperCase().includes(query)) ||
            (r.telefone?.toUpperCase().includes(query))
        )
    )
  }, [q, advogados])

  const { run: saveAdvogado, loading: saving } = useAsyncAction(
    async (payload: Partial<Omit<Advogado, 'id'>>) => (editing ? atualizarAdvogado(editing.id, payload) : criarAdvogado(payload as Omit<Advogado, 'id'>)),
    {
      successMessage: () => (editing ? 'Advogado atualizado' : 'Advogado criado'),
      onSuccess: () => { setOpen(false); setEditing(null); form.resetFields(); reload() }
    }
  )
  const { run: deleteAdvogado, loading: deleting } = useAsyncAction(
    async (id: number) => excluirAdvogado(id),
    { successMessage: 'Excluído', onSuccess: () => { reload() } }
  )

  const onSave = async () => {
    const values = await form.validateFields()
    await saveAdvogado(values)
  }

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'OAB', dataIndex: 'oab' },
    { title: 'E-mail', dataIndex: 'email' },
    { title: 'Telefone', dataIndex: 'telefone' },
    { title: 'Especialidade', dataIndex: 'especialidade_id', render: (v: number | null) => (espList.find(e => e.id === v))?.nome || '—' },
    {
      title: 'Ações',
      render: (_: any, record: Advogado) => (
        <Space>
          <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ nome: record.nome, oab: record.oab, email: record.email, telefone: record.telefone, especialidade_id: record.especialidade_id || undefined }) }}>Editar</Button>
          <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteAdvogado(record.id) }}>Excluir</Button>
        </Space>
      )
    }
  ], [form, espList])

  return (
    <Card title="Advogados">
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por nome, OAB, e-mail ou telefone" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); form.resetFields() }}>Novo</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title={editing ? 'Editar Advogado' : 'Novo Advogado'} open={open} onClose={() => setOpen(false)} width={480}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onSave} disabled={saving} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="oab" label="OAB" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input />
          </Form.Item>
          <Form.Item name="telefone" label="Telefone" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="especialidade_id" label="Especialidade">
            <Select allowClear options={espList.map(e => ({ label: e.nome, value: e.id }))} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}
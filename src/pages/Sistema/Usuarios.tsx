import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Space, Table, Select } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario, listarAdvogados, listarCausasProcessos, listarEscritorios, type Usuario, type Advogado, type Escritorio, type CausaProcesso } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Usuarios() {
  const { data: usuarios, loading, error, reload } = useAsyncData<Usuario[]>(listarUsuarios, { errorTitle: 'Falha ao carregar Usuários' })
  const [filtered, setFiltered] = useState<Usuario[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form] = Form.useForm<Partial<Omit<Usuario, 'id'>> & { senha?: string }>()
  const [q, setQ] = useState('')
  useEffect(() => {}, [])

  const { data: advogados } = useAsyncData<Advogado[]>(listarAdvogados, { errorTitle: 'Falha ao carregar Advogados' })
  const advList = Array.isArray(advogados) ? advogados : []
  const [advOffices, setAdvOffices] = useState<Record<number, Escritorio[]>>({})

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(
      !query
        ? (usuarios || [])
        : (usuarios || []).filter(r =>
            (r.username?.toUpperCase().includes(query)) ||
            (r.nome?.toUpperCase().includes(query)) ||
            (r.email?.toUpperCase().includes(query)) ||
            (r.role?.toUpperCase().includes(query))
          )
    )
  }, [q, usuarios])

  useEffect(() => {
    (async () => {
      const us = usuarios || []
      const ids = Array.from(new Set(us.map(u => u.advogado_id).filter(Boolean))) as number[]
      if (!ids.length) return
      const [processos, escrit] = await Promise.all([listarCausasProcessos(), listarEscritorios()])
      const officeById = new Map<number, Escritorio>(escrit.map(e => [e.id, e]))
      const officesByAdv: Record<number, Escritorio[]> = {}
      ids.forEach(id => {
        const escIds = Array.from(new Set((processos as CausaProcesso[]).filter(p => p.advogado_id === id && p.escritorio_id).map(p => p.escritorio_id as number)))
        officesByAdv[id] = escIds.map(eid => officeById.get(eid)).filter(Boolean) as Escritorio[]
      })
      setAdvOffices(officesByAdv)
    })().catch(() => {})
  }, [usuarios])

  const { run: saveUsuario, loading: saving } = useAsyncAction(
    async (payload: Partial<Omit<Usuario, 'id'>> & { senha?: string }) => (editing ? atualizarUsuario(editing.id, payload) : criarUsuario(payload as any)),
    {
      successMessage: () => (editing ? 'Usuário atualizado' : 'Usuário criado'),
      onSuccess: () => { setOpen(false); setEditing(null); form.resetFields(); reload() }
    }
  )
  const { run: deleteUsuario, loading: deleting } = useAsyncAction(
    async (id: number) => excluirUsuario(id),
    { successMessage: 'Excluído', onSuccess: () => { reload() } }
  )

  const onSave = async () => {
    const values = await form.validateFields()
    await saveUsuario(values)
  }

  const columns = useMemo(() => [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'E-mail', dataIndex: 'email' },
    { title: 'Perfil', dataIndex: 'role' },
    { title: 'Permissões', dataIndex: 'permissoes' },
    { title: 'Escritórios', render: (_: any, record: Usuario) => (record.advogado_id ? (advOffices[record.advogado_id] || []).map(e => e.nome).join(', ') || '—' : (record.escritorios || '—')) },
    {
      title: 'Ações',
      render: (_: any, record: Usuario) => (
        <Space>
          <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ username: record.username, nome: record.nome, email: record.email, role: record.role, permissoes: record.permissoes, advogado_id: record.advogado_id || undefined }) }}>Editar</Button>
          <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteUsuario(record.id) }}>Excluir</Button>
        </Space>
      )
    }
  ], [form])

  return (
    <Card title="Usuários">
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por username, nome, e-mail ou perfil" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true); form.resetFields() }}>Novo</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title={editing ? 'Editar Usuário' : 'Novo Usuário'} open={open} onClose={() => setOpen(false)} width={480}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onSave} disabled={saving} loading={saving}>{editing ? 'Salvar' : 'Criar'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="Username" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]} getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="E-mail">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Perfil" getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="advogado_id" label="Advogado">
            <Select allowClear options={advList.map(a => ({ label: a.nome, value: a.id }))} />
          </Form.Item>
          <Form.Item name="permissoes" label="Permissões">
            <Input.TextArea rows={3} />
          </Form.Item>
          {!editing && (
            <Form.Item name="senha" label="Senha" rules={[{ required: true }]}> 
              <Input.Password />
            </Form.Item>
          )}
          {editing && (
            <Form.Item name="senha" label="Senha (opcional)"> 
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Drawer>
    </Card>
  )
}
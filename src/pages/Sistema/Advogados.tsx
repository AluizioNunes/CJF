import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Select, Space, Table, Tag } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarAdvogados, criarAdvogado, atualizarAdvogado, excluirAdvogado, listarEspecialidades, listarEscritorios, listarCausasProcessos, type Advogado, type Especialidade, type Escritorio, type CausaProcesso } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function Advogados() {
  const { data: advogados, loading: advLoading, error: advError, reload: reloadAdvogados, setData: setAdvogados } = useAsyncData<Advogado[]>(listarAdvogados, { errorTitle: 'Falha ao carregar Advogados' })
  const { data: especialidades, loading: espLoading, error: espError, reload: reloadEspecialidades } = useAsyncData<Especialidade[]>(listarEspecialidades, { errorTitle: 'Falha ao carregar Especialidades' })
  const { data: escritorios, loading: escLoading, error: escError, reload: reloadEscritorios } = useAsyncData<Escritorio[]>(listarEscritorios, { errorTitle: 'Falha ao carregar Escritórios' })
  const { data: processos, loading: procLoading, error: procError, reload: reloadProcessos } = useAsyncData<CausaProcesso[]>(listarCausasProcessos, { errorTitle: 'Falha ao carregar Processos' })
  const espList = Array.isArray(especialidades) ? especialidades : []
  const [filtered, setFiltered] = useState<Advogado[]>([])
  const loading = advLoading || espLoading || escLoading || procLoading
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Advogado | null>(null)
  const [form] = Form.useForm<Partial<Omit<Advogado, 'id'>>>()
  const [q, setQ] = useState('')
  const error = advError || espError || escError || procError
  const reload = () => { reloadAdvogados(); reloadEspecialidades(); reloadEscritorios(); reloadProcessos() }

  const officesByAdv = useMemo(() => {
    const p = Array.isArray(processos) ? processos : []
    const allOffices = Array.isArray(escritorios) ? escritorios : []
    const byId = new Map<number, Escritorio>(allOffices.map(e => [e.id, e]))
    const map: Record<number, Escritorio[]> = {}
    p.forEach(cp => {
      if (cp.advogado_id && cp.escritorio_id) {
        const arr = map[cp.advogado_id] || []
        const office = byId.get(cp.escritorio_id)
        if (office && !arr.find(o => o.id === office.id)) arr.push(office)
        map[cp.advogado_id] = arr
      }
    })
    return map
  }, [processos, escritorios])

  const tagColors = ['magenta','red','volcano','orange','gold','lime','green','cyan','blue','geekblue','purple']
  const tagColorFor = (seed: string | number) => {
    const n = typeof seed === 'number' ? seed : Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
    return tagColors[n % tagColors.length]
  }
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
      onSuccess: (result) => {
        const ids = (form.getFieldValue('escritorios_ids') || []) as number[]
        const offices = ids.map((id: number) => (Array.isArray(escritorios) ? escritorios : []).find(e => e.id === id)).filter(Boolean) as Escritorio[]
        setAdvogados((prev) => {
          const arr = Array.isArray(prev) ? [...prev] as Advogado[] : []
          const idx = arr.findIndex(a => a.id === (result as any)?.id)
          const merged = { ...(result as any), escritorios_ids: ids, escritorios: offices } as Advogado
          if (idx >= 0) arr[idx] = merged
          else arr.push(merged)
          return arr
        })
        setOpen(false); setEditing(null); form.resetFields()
      }
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
    { title: 'Escritórios', dataIndex: 'escritorios', render: (_: any, record: Advogado) => {
      const list = record.escritorios as Escritorio[] | undefined
      if (list && list.length) return (
        <Space wrap>
          {list.map(e => <Tag key={e.id} color={tagColorFor(e.id ?? e.nome)}>{e.nome}</Tag>)}
        </Space>
      )
      const ids = record.escritorios_ids || []
      if (ids.length && Array.isArray(escritorios)) {
        const names = ids.map(id => (escritorios as Escritorio[]).find(e => e.id === id)?.nome).filter(Boolean) as string[]
        return names.length ? (
          <Space wrap>
            {names.map((n, i) => <Tag key={`${record.id}-${i}`} color={tagColorFor(n)}>{n}</Tag>)}
          </Space>
        ) : '—'
      }
      const derived = officesByAdv[record.id] || officesByAdv[(record as any).advogado_id]
      if (derived && derived.length) return (
        <Space wrap>
          {derived.map(e => <Tag key={e.id} color={tagColorFor(e.id ?? e.nome)}>{e.nome}</Tag>)}
        </Space>
      )
      return '—'
    } },
    {
      title: 'Ações',
      render: (_: any, record: Advogado) => (
        <Space>
          <Button onClick={() => { setEditing(record); setOpen(true); form.setFieldsValue({ nome: record.nome, oab: record.oab, email: record.email, telefone: record.telefone, especialidade_id: record.especialidade_id || undefined, escritorios_ids: record.escritorios_ids || [] }) }}>Editar</Button>
          <Button danger disabled={deleting} loading={deleting} onClick={async () => { await deleteAdvogado(record.id) }}>Excluir</Button>
        </Space>
      )
    }
  ], [form, espList, escritorios, officesByAdv])

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
          <Form.Item name="escritorios_ids" label="Escritórios">
            <Select mode="multiple" allowClear options={(Array.isArray(escritorios) ? escritorios : []).map(e => ({ label: e.nome, value: e.id }))} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}
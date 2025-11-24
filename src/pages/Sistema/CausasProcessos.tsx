import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Select, Space, Table, Tag, message, Popover, Checkbox } from 'antd'
import ErrorBanner from '../../components/ErrorBanner'
import { listarCausasProcessos, listarAdvogados, listarClientes, listarEscritorios, listarEspecialidades, criarCausaProcesso, type CausaProcesso, type Advogado, type Cliente, type Escritorio, type Especialidade } from '../../services/api'
import { useAsyncAction, useAsyncData } from '../../hooks/useAsync'

export default function CausasProcessos() {
  const { data, loading: procLoading, error: procError, reload: reloadProc } = useAsyncData<CausaProcesso[]>(listarCausasProcessos, { errorTitle: 'Falha ao carregar Causas/Processos' })
  const { data: advogados, loading: advLoading, error: advError, reload: reloadAdv } = useAsyncData<Advogado[]>(listarAdvogados, { errorTitle: 'Falha ao carregar Advogados' })
  const { data: clientes, loading: cliLoading, error: cliError, reload: reloadCli } = useAsyncData<Cliente[]>(listarClientes, { errorTitle: 'Falha ao carregar Clientes' })
  const { data: escritorios, loading: escLoading, error: escError, reload: reloadEsc } = useAsyncData<Escritorio[]>(listarEscritorios, { errorTitle: 'Falha ao carregar Escritórios' })
  const { data: especialidades, loading: espLoading, error: espError, reload: reloadEsp } = useAsyncData<Especialidade[]>(listarEspecialidades, { errorTitle: 'Falha ao carregar Especialidades' })
  const [filtered, setFiltered] = useState<CausaProcesso[]>([])
  const [q, setQ] = useState('')
  const loading = procLoading || advLoading || cliLoading || escLoading || espLoading
  const error = procError || advError || cliError || escError || espError
  const reload = () => { reloadProc(); reloadAdv(); reloadCli(); reloadEsc(); reloadEsp() }
  useEffect(() => { /* carregamento automático via hooks */ }, [])

  // Fallbacks seguros para listas
  const advList = Array.isArray(advogados) ? advogados : []
  const cliList = Array.isArray(clientes) ? clientes : []
  const escList = Array.isArray(escritorios) ? escritorios : []
  const espList = Array.isArray(especialidades) ? especialidades : []

  useEffect(() => {
    const query = q.trim().toUpperCase()
    setFiltered(
      !query
        ? (data || [])
        : (data || []).filter(r =>
            (r.numero?.toUpperCase().includes(query)) ||
            ((r as any).descricao?.toUpperCase().includes(query)) ||
            ((r as any).status?.toUpperCase().includes(query))
        )
    )
  }, [q, data])

  const labelById = {
    advogado: (id: number | null | undefined) => advList.find(a => a.id === id)?.nome || '—',
    cliente: (id: number | null | undefined) => cliList.find(c => c.id === id)?.nome || '—',
    escritorio: (id: number | null | undefined) => escList.find(e => e.id === id)?.nome || '—',
    especialidade: (id: number | null | undefined) => espList.find(e => e.id === id)?.nome || '—',
  }
  // Definição completa de colunas e seletor de visibilidade
  const allColumnDefs = useMemo(() => ([
    { key: 'id', title: 'ID', dataIndex: 'id', width: 80 },
    { key: 'numero', title: 'Número', dataIndex: 'numero' },
    { key: 'descricao', title: 'Descrição', dataIndex: 'descricao' },
    { key: 'status', title: 'Status', dataIndex: 'status', render: (v: string | null) => v ? <Tag color="blue">{v}</Tag> : '—' },
    { key: 'cliente_id', title: 'Cliente', dataIndex: 'cliente_id', render: (v: number | null) => labelById.cliente(v) },
    { key: 'advogado_id', title: 'Advogado', dataIndex: 'advogado_id', render: (v: number | null) => labelById.advogado(v) },
    { key: 'escritorio_id', title: 'Escritório', dataIndex: 'escritorio_id', render: (v: number | null) => labelById.escritorio(v) },
    { key: 'especialidade_id', title: 'Especialidade', dataIndex: 'especialidade_id', render: (v: number | null) => labelById.especialidade(v) },
  ]), [advList, cliList, escList, espList])
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const raw = localStorage.getItem('cjf:causas_cols')
    return raw ? JSON.parse(raw) : ['id','numero','descricao','status','cliente_id','advogado_id','escritorio_id','especialidade_id']
  })
  useEffect(() => { localStorage.setItem('cjf:causas_cols', JSON.stringify(visibleColumnKeys)) }, [visibleColumnKeys])
  const columns = useMemo(() => allColumnDefs.filter(c => visibleColumnKeys.includes(c.key)), [allColumnDefs, visibleColumnKeys])

  // Criação de novo processo
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<Partial<Omit<CausaProcesso, 'id'>>>()
  const { run: createProcesso, loading: saving } = useAsyncAction(
    async (payload: Partial<Omit<CausaProcesso, 'id'>>) => criarCausaProcesso(payload as Omit<CausaProcesso, 'id'>),
    { successMessage: 'Processo criado', onSuccess: () => { setOpen(false); form.resetFields(); reload() } }
  )
  const onCreate = async () => {
    const values = await form.validateFields()
    await createProcesso(values)
  }
  const statusOptions = ['EM ANDAMENTO','RECURSO','SENTENÇA','SUSPENSO','ACORDO']

  return (
    <Card title="Causas e Processos">
      <Space style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Filtrar por número, descrição ou status" onSearch={(v) => setQ(v)} onChange={(e) => setQ(e.target.value)} style={{ width: 420 }} />
        <Popover
          trigger="click"
          placement="bottomLeft"
          content={
            <Checkbox.Group
              value={visibleColumnKeys}
              onChange={(vals) => setVisibleColumnKeys(vals as string[])}
            >
              <Space direction="vertical">
                {allColumnDefs.map(col => (
                  <Checkbox key={col.key} value={col.key}>{col.title as string}</Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          }
        >
          <Button>Selecionar colunas</Button>
        </Popover>
        <Button type="primary" onClick={() => { setOpen(true); form.resetFields() }}>CADASTRAR NOVO CAUSA PROCESSO</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title="Novo Causa/Processo" open={open} onClose={() => setOpen(false)} width={560}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancelar</Button><Button type="primary" onClick={onCreate} disabled={saving} loading={saving}>Criar</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="numero" label="Número" rules={[{ required: true }]}
            getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição"
            getValueFromEvent={(e) => (e?.target?.value ?? '').toUpperCase()}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select allowClear options={statusOptions.map(s => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="cliente_id" label="Cliente">
            <Select allowClear showSearch optionFilterProp="label"
              options={cliList.map(c => ({ label: c.nome, value: c.id }))} />
          </Form.Item>
          <Form.Item name="advogado_id" label="Advogado">
            <Select allowClear showSearch optionFilterProp="label"
              options={advList.map(a => ({ label: a.nome, value: a.id }))} />
          </Form.Item>
          <Form.Item name="escritorio_id" label="Escritório">
            <Select allowClear showSearch optionFilterProp="label"
              options={escList.map(e => ({ label: e.nome, value: e.id }))} />
          </Form.Item>
          <Form.Item name="especialidade_id" label="Especialidade">
            <Select allowClear showSearch optionFilterProp="label"
              options={espList.map(e => ({ label: e.nome, value: e.id }))} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}

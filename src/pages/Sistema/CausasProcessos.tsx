import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Form, Input, Select, Space, Table, Tag, Popover, Checkbox, Popconfirm, DatePicker } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
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
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
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
    const raw = q.trim()
    const upper = raw.toUpperCase()
    const from = dateRange ? (dateRange[0] ? dateRange[0].toDate() : null) : null
    const to = dateRange ? (dateRange[1] ? dateRange[1].toDate() : null) : null
    setFiltered((data || []).filter(r => {
      const baseMatch = !upper || r.numero?.toUpperCase().includes(upper) || (r as any).descricao?.toUpperCase().includes(upper) || (r as any).status?.toUpperCase().includes(upper)
      const d = r.dataDistribuicao ? new Date(r.dataDistribuicao) : null
      const dateMatch = !from && !to ? true : (
        (!from || (d && d >= from)) && (!to || (d && d <= to))
      )
      return baseMatch && dateMatch
    }))
  }, [q, dateRange, data])

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
    { key: 'dataDistribuicao', title: 'Data de Distribuição', dataIndex: 'dataDistribuicao', render: (v: string | null) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
    { key: 'valor', title: 'Valor da causa', dataIndex: 'valor', render: (v: number | null) => typeof v === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—' },
    { key: 'acoes', title: 'Ações', render: (_: any, row: CausaProcesso) => (
      <Space>
        <Button size="small" onClick={() => onEdit(row)}>Editar</Button>
        <Popconfirm title="Confirmar exclusão?" onConfirm={() => onDelete(row.id)}>
          <Button danger size="small">Excluir</Button>
        </Popconfirm>
        <Button size="small" onClick={() => onPrint(row)}>Imprimir</Button>
      </Space>
    ) },
  ]), [advList, cliList, escList, espList])
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    const raw = localStorage.getItem('cjf:causas_cols')
    const def = ['id','numero','descricao','status','cliente_id','advogado_id','escritorio_id','especialidade_id','dataDistribuicao','valor','acoes']
    let keys = raw ? JSON.parse(raw) : def
    if (!Array.isArray(keys)) keys = def
    if (!keys.includes('dataDistribuicao')) keys.push('dataDistribuicao')
    return keys
  })
  useEffect(() => { localStorage.setItem('cjf:causas_cols', JSON.stringify(visibleColumnKeys)) }, [visibleColumnKeys])
  const columns = useMemo(() => allColumnDefs.filter(c => visibleColumnKeys.includes(c.key)), [allColumnDefs, visibleColumnKeys])

  // Criação de novo processo
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create'|'edit'>('create')
  const [current, setCurrent] = useState<CausaProcesso | null>(null)
  const [form] = Form.useForm<Partial<Omit<CausaProcesso, 'id'>>>()
  const { run: createProcesso, loading: saving } = useAsyncAction(
    async (payload: Partial<Omit<CausaProcesso, 'id'>>) => criarCausaProcesso(payload as Omit<CausaProcesso, 'id'>),
    { successMessage: 'Processo criado', onSuccess: () => { setOpen(false); form.resetFields(); reload() } }
  )
  const { run: updateProcesso, loading: updating } = useAsyncAction(
    async (payload: { id: number; data: Partial<Omit<CausaProcesso, 'id'>> }) => (await import('../../services/api')).atualizarCausaProcesso(payload.id, payload.data),
    { successMessage: 'Processo atualizado', onSuccess: () => { setOpen(false); setCurrent(null); form.resetFields(); reload() } }
  )
  const { run: deleteProcesso } = useAsyncAction(
    async (id: number) => (await import('../../services/api')).excluirCausaProcesso(id),
    { successMessage: 'Processo excluído', onSuccess: () => reload() }
  )
  const onCreate = async () => {
    const values = await form.validateFields()
    await createProcesso(values)
  }
  const onEdit = (row: CausaProcesso) => {
    setMode('edit')
    setCurrent(row)
    setOpen(true)
    form.setFieldsValue({
      numero: row.numero,
      descricao: (row as any).descricao || undefined,
      status: (row as any).status || undefined,
      cliente_id: row.cliente_id,
      advogado_id: row.advogado_id,
      escritorio_id: row.escritorio_id,
      especialidade_id: row.especialidade_id,
      valor: (row as any).valor,
      dataDistribuicao: row.dataDistribuicao || undefined,
    })
  }
  const onUpdate = async () => {
    if (!current) return
    const values = await form.validateFields()
    await updateProcesso({ id: current.id, data: values })
  }
  const onDelete = async (id: number) => {
    await deleteProcesso(id)
  }
  const onPrint = (row: CausaProcesso) => {
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) return
    const cliente = labelById.cliente(row.cliente_id)
    const advogado = labelById.advogado(row.advogado_id)
    const escritorio = labelById.escritorio(row.escritorio_id)
    const especialidade = labelById.especialidade(row.especialidade_id)
    const valorFmt = typeof (row as any).valor === 'number' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((row as any).valor as number) : '—'
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Processo ${row.numero}</title><style>body{font-family:Arial;padding:24px}h1{font-size:18px}table{border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:8px}</style></head><body><h1>Processo</h1><table><tr><td>ID</td><td>${row.id}</td></tr><tr><td>Número</td><td>${row.numero}</td></tr><tr><td>Descrição</td><td>${(row as any).descricao || '—'}</td></tr><tr><td>Status</td><td>${(row as any).status || '—'}</td></tr><tr><td>Cliente</td><td>${cliente}</td></tr><tr><td>Advogado</td><td>${advogado}</td></tr><tr><td>Escritório</td><td>${escritorio}</td></tr><tr><td>Especialidade</td><td>${especialidade}</td></tr><tr><td>Valor da causa</td><td>${valorFmt}</td></tr></table><script>window.print();setTimeout(()=>window.close(),300)</script></body></html>`)
    w.document.close()
  }
  const statusOptions = ['EM ANDAMENTO','RECURSO','SENTENÇA','SUSPENSO','ACORDO']

  return (
    <Card title="Causas e Processos">
      <Space style={{ marginBottom: 12 }}>
        <Space.Compact>
          <Input allowClear placeholder="Filtrar por número, descrição ou status" value={q} onChange={(e) => setQ(e.target.value)} onPressEnter={() => setQ(q)} style={{ width: 360 }} />
          <Button onClick={() => setQ(q)}>Buscar</Button>
        </Space.Compact>
        <DatePicker.RangePicker allowClear value={dateRange ?? undefined} onChange={(vals) => setDateRange(vals as [Dayjs, Dayjs] | null)} format="YYYY-MM-DD" />
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
        <Button type="primary" onClick={() => { setMode('create'); setCurrent(null); setOpen(true); form.resetFields() }}>CADASTRAR NOVO CAUSA PROCESSO</Button>
      </Space>
      {error && <ErrorBanner message={error} onRetry={reload} style={{ marginBottom: 12 }} />}
      <Table rowKey="id" loading={loading} dataSource={filtered} columns={columns} />
      <Drawer title={mode === 'create' ? 'Novo Causa/Processo' : 'Editar Causa/Processo'} open={open} onClose={() => setOpen(false)} width={560}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            {mode === 'create' ? (
              <Button type="primary" onClick={onCreate} disabled={saving} loading={saving}>Criar</Button>
            ) : (
              <Button type="primary" onClick={onUpdate} disabled={updating} loading={updating}>Salvar</Button>
            )}
          </Space>
        }
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
          <Form.Item name="dataDistribuicao" label="Data de Distribuição"
            getValueProps={(v) => ({ value: v ? (typeof v === 'string' ? dayjs(v) : v) : undefined })}
            getValueFromEvent={(d) => d ? dayjs(d).format('YYYY-MM-DD') : undefined}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="valor" label="Valor da causa">
            <Input type="number" step="0.01" min={0} />
          </Form.Item>
        </Form>
      </Drawer>
    </Card>
  )
}

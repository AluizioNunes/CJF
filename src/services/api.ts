const API_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  'http://localhost:8000'

let token: string | null = localStorage.getItem('cjf:token') || null

export function setToken(t: string | null) {
  token = t
  if (t) localStorage.setItem('cjf:token', t)
  else localStorage.removeItem('cjf:token')
}

export function getToken() {
  return token
}

async function request(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const normalizeError = (status: number | null, bodyText: string | null, ct: string | null) => {
    let detail = ''
    if (bodyText) {
      try {
        const json = ct && ct.includes('application/json') ? JSON.parse(bodyText) : JSON.parse(bodyText)
        if (json && typeof json === 'object') {
          detail = (json.detail as string) || (json.message as string) || (json.error as string) || ''
        }
      } catch {
        // não é JSON; deixa como texto
      }
    }
    const prefix = status ? `API ${status}` : 'Erro de rede'
    const msg = detail ? `${prefix}: ${detail}` : `${prefix}: ${bodyText || 'Falha ao comunicar com o servidor'}`
    const err = new Error(msg)
    ;(err as any).status = status
    ;(err as any).detail = detail
    return err
  }

  try {
    const resp = await fetch(`${API_URL}${path}`, { ...init, headers })
    const ct = resp.headers.get('content-type') || ''
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      const err = normalizeError(resp.status, text, ct)
      if (import.meta.env.DEV) console.error('[API]', path, err)
      throw err
    }
    return ct.includes('application/json') ? resp.json() : resp.text()
  } catch (e: any) {
    if (import.meta.env.DEV) console.error('[API fetch]', path, e)
    const err = normalizeError(null, e?.message || null, null)
    throw err
  }
}

// Auth
export async function login(payload: { username: string; password: string }) {
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const t = (data as any).access_token || (data as any).token || null
    if (t) setToken(t)
    return data
  } catch (e) {
    // fallback de desenvolvimento: permite navegação local quando backend não está disponível
    if (import.meta.env.DEV) {
      setToken('dev-token')
      return { access_token: 'dev-token', dev: true }
    }
    throw e
  }
}

export async function logout() {
  setToken(null)
}

// Tipos e CRUD de Escritórios
export type Escritorio = { id: number; nome: string; cnpj?: string; email?: string; telefone?: string }

export async function listarEscritorios() {
  return request('/escritorios', { method: 'GET' }) as Promise<Escritorio[]>
}
export async function criarEscritorio(payload: Omit<Escritorio, 'id'>) {
  return request('/escritorios', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Escritorio>
}
export async function atualizarEscritorio(id: number, payload: Partial<Omit<Escritorio, 'id'>>) {
  return request(`/escritorios/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Escritorio>
}
export async function excluirEscritorio(id: number) {
  await request(`/escritorios/${id}`, { method: 'DELETE' })
}

// Parâmetros (persistência)
export async function salvarParametros(payload: any) {
  return request('/parametros', { method: 'POST', body: JSON.stringify(payload) })
}
export async function obterParametros() {
  return request('/parametros', { method: 'GET' })
}

// Tipos e CRUD de Especialidades
export type Especialidade = { id: number; nome: string; descricao?: string }
export async function listarEspecialidades() {
  return request('/especialidades', { method: 'GET' }) as Promise<Especialidade[]>
}
export async function criarEspecialidade(payload: Omit<Especialidade, 'id'>) {
  return request('/especialidades', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Especialidade>
}
export async function atualizarEspecialidade(id: number, payload: Partial<Omit<Especialidade, 'id'>>) {
  return request(`/especialidades/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Especialidade>
}
export async function excluirEspecialidade(id: number) {
  await request(`/especialidades/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Advogados
export type Advogado = { id: number; nome: string; oab?: string; email?: string; telefone?: string; especialidade_id?: number }
export async function listarAdvogados() {
  return request('/advogados', { method: 'GET' }) as Promise<Advogado[]>
}
export async function criarAdvogado(payload: Omit<Advogado, 'id'>) {
  return request('/advogados', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Advogado>
}
export async function atualizarAdvogado(id: number, payload: Partial<Omit<Advogado, 'id'>>) {
  return request(`/advogados/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Advogado>
}
export async function excluirAdvogado(id: number) {
  await request(`/advogados/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Clientes
export type Cliente = { id: number; nome: string; cpf_cnpj?: string; email?: string; telefone?: string }
export async function listarClientes() {
  return request('/clientes', { method: 'GET' }) as Promise<Cliente[]>
}
export async function criarCliente(payload: Omit<Cliente, 'id'>) {
  return request('/clientes', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Cliente>
}
export async function atualizarCliente(id: number, payload: Partial<Omit<Cliente, 'id'>>) {
  return request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Cliente>
}
export async function excluirCliente(id: number) {
  await request(`/clientes/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Causas/Processos
export type CausaProcesso = {
  id: number
  numero: string
  descricao?: string
  status?: string
  cliente_id?: number
  advogado_id?: number
  escritorio_id?: number
  especialidade_id?: number
  valor?: number
  dataDistribuicao?: string
}
export async function listarCausasProcessos() {
  const res = await request('/causas-processos', { method: 'GET' }) as any
  const arr = Array.isArray(res) ? res : []
  return arr.map((r: any) => ({
    ...r,
    dataDistribuicao: r.dataDistribuicao ?? r.data_distribuicao ?? r.dataDistribuicao,
  })) as CausaProcesso[]
}
export async function criarCausaProcesso(payload: Omit<CausaProcesso, 'id'>) {
  const res = await request('/causas-processos', { method: 'POST', body: JSON.stringify(payload) }) as any
  return { ...res, dataDistribuicao: res.dataDistribuicao ?? res.data_distribuicao } as CausaProcesso
}
export async function atualizarCausaProcesso(id: number, payload: Partial<Omit<CausaProcesso, 'id'>>) {
  const res = await request(`/causas-processos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as any
  return { ...res, dataDistribuicao: res.dataDistribuicao ?? res.data_distribuicao } as CausaProcesso
}
export async function excluirCausaProcesso(id: number) {
  await request(`/causas-processos/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Usuários
export type Usuario = { id: number; username: string; nome: string; email?: string; role?: string; permissoes?: string }
export async function listarUsuarios() {
  return request('/usuarios', { method: 'GET' }) as Promise<Usuario[]>
}
export async function criarUsuario(payload: { username: string; nome: string; email?: string; role?: string; permissoes?: string; senha?: string }) {
  return request('/usuarios', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Usuario>
}
export async function atualizarUsuario(id: number, payload: Partial<Omit<Usuario, 'id'>> & { senha?: string }) {
  return request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Usuario>
}
export async function excluirUsuario(id: number) {
  await request(`/usuarios/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Perfil
export type Perfil = { id: number; nome: string; descricao?: string }
export async function listarPerfis() {
  return request('/perfil', { method: 'GET' }) as Promise<Perfil[]>
}
export async function criarPerfil(payload: Omit<Perfil, 'id'>) {
  return request('/perfil', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Perfil>
}
export async function atualizarPerfil(id: number, payload: Partial<Omit<Perfil, 'id'>>) {
  return request(`/perfil/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Perfil>
}
export async function excluirPerfil(id: number) {
  await request(`/perfil/${id}`, { method: 'DELETE' })
}

// Tipos e CRUD de Permissões
export type Permissao = { id: number; nome: string; descricao?: string }
export async function listarPermissoes() {
  return request('/permissoes', { method: 'GET' }) as Promise<Permissao[]>
}
export async function criarPermissao(payload: Omit<Permissao, 'id'>) {
  return request('/permissoes', { method: 'POST', body: JSON.stringify(payload) }) as Promise<Permissao>
}
export async function atualizarPermissao(id: number, payload: Partial<Omit<Permissao, 'id'>>) {
  return request(`/permissoes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }) as Promise<Permissao>
}
export async function excluirPermissao(id: number) {
  await request(`/permissoes/${id}`, { method: 'DELETE' })
}

// Auditoria
export type Auditoria = { id: number; entidade: string; entidade_id?: number; acao: string; quem?: string; quando: string; diff?: string }
export async function listarAuditoria() {
  return request('/auditoria', { method: 'GET' }) as Promise<Auditoria[]>
}

// Auth/me
export async function me() {
  try {
    return await request('/auth/me', { method: 'GET' })
  } catch (e) {
    if (import.meta.env.DEV) {
      // Mock de usuário em desenvolvimento para evitar bloqueio quando backend estiver offline
      return {
        id: 0,
        username: 'dev',
        nome: 'Desenvolvimento',
        email: 'dev@example.com',
        role: 'admin',
        permissoes: 'all',
        dev: true,
      }
    }
    throw e
  }
}

// Seeds (criação de dados de demonstração)
export async function seedDemo() {
  return request('/seeds', { method: 'POST' }) as Promise<{ status: string; created: { especialidades: number; escritorios: number; advogados: number; causas_processos: number } }>
}
import { Button, Card, Form, Input, Typography, Select } from 'antd'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { listarEscritorios, type Escritorio } from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/'
  const [escritorios, setEscritorios] = useState<Escritorio[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    listarEscritorios().then((arr) => setEscritorios(arr as Escritorio[])).finally(() => setLoading(false))
  }, [])

  const onFinish = async (values: { username: string; password: string; escritorio_id: number }) => {
    await login(values.username, values.password, values.escritorio_id)
    navigate(from, { replace: true })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>Entrar</Typography.Title>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin' }}>
          <Form.Item name="username" label="Usuário" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Senha" rules={[{ required: true }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item name="escritorio_id" label="Escritório" rules={[{ required: true }]}> 
            <Select
              loading={loading}
              options={escritorios.map(e => ({ label: e.nome, value: e.id }))}
              placeholder="Selecione o escritório"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Entrar</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
import { Button, Card, Form, Input, Typography } from 'antd'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/'

  const onFinish = async (values: { username: string; password: string }) => {
    await login(values.username, values.password)
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
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Entrar</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
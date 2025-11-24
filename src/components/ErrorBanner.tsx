import { Alert, Button, Space } from 'antd'
import type { CSSProperties } from 'react'

type Props = {
  title?: string
  message: string
  onRetry: () => void
  style?: CSSProperties
}

export default function ErrorBanner({ title = 'Erro ao carregar', message, onRetry, style }: Props) {
  return (
    <Alert
      type="error"
      showIcon
      closable
      message={title}
      description={
        <Space>
          <span>{message}</span>
          <Button size="small" type="primary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </Space>
      }
      style={style}
    />
  )
}
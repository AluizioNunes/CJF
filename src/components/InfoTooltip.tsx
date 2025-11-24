import { InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import React from 'react'

type Props = {
  title?: string
  content: React.ReactNode
  style?: React.CSSProperties
}

export default function InfoTooltip({ title, content, style }: Props) {
  return (
    <Tooltip title={(
      <div style={{ maxWidth: 420 }}>
        {title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div> : null}
        <div style={{ fontSize: 12, lineHeight: 1.5 }}>{content}</div>
      </div>
    )}>
      <InfoCircleOutlined style={{ color: '#1677ff', marginLeft: 8, cursor: 'pointer', ...(style || {}) }} />
    </Tooltip>
  )
}
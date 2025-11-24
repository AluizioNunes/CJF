import { App } from 'antd'
import React, { useEffect } from 'react'
import { setMessageApi } from '../utils/ui'

export default function UiProvider({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp()
  useEffect(() => { setMessageApi(message) }, [message])
  return <>{children}</>
}
import React, { useState } from 'react'
import { InputNumber } from 'antd'

type Props = Omit<React.ComponentProps<typeof InputNumber>, 'formatter' | 'parser'> & {
  precision?: number
}

export default function MoneyInput({ precision = 2, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false)
  const parser = (value?: string) => {
    if (value == null) return undefined as unknown as number
    const raw = String(value).replace(/R\$\s?/g, '').trim()
    if (!raw) return undefined as unknown as number
    const digitsOnly = raw.replace(/[^0-9]/g, '')
    const hasComma = raw.includes(',')
    let nStr: string
    if (hasComma) {
      const decLen = (raw.split(',')[1] || '').replace(/[^0-9]/g, '').length
      const intPart = digitsOnly.slice(0, -decLen) || digitsOnly
      const decPart = decLen > 0 ? digitsOnly.slice(-decLen) : ''
      nStr = decLen > 0 ? `${intPart}.${decPart}` : intPart
    } else {
      nStr = digitsOnly
    }
    const n = Number(nStr)
    return Number.isNaN(n) ? undefined as unknown as number : n
  }
  const formatter = (value?: string | number) => {
    if (value == null || value === '') return ''
    if (focused && typeof value === 'string') return `R$ ${value}`
    const num = typeof value === 'number' ? value : parser(String(value))
    if (num == null || Number.isNaN(num as number)) return `R$ ${String(value)}`
    const br = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(num as number)
    return `R$ ${br}`
  }
  return (
    <InputNumber
      {...rest}
      style={{ width: '100%', ...(style || {}) }}
      formatter={formatter}
      parser={parser}
      precision={focused ? undefined : precision}
      onFocus={(e) => { setFocused(true); rest.onFocus?.(e as any) }}
      onBlur={(e) => { setFocused(false); rest.onBlur?.(e as any) }}
    />
  )
}
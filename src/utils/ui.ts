import type { MessageInstance } from 'antd/es/message/interface'

let msgApi: MessageInstance | null = null

export function setMessageApi(api: MessageInstance) {
  msgApi = api
}

export function getMessageApi(): MessageInstance | null {
  return msgApi
}
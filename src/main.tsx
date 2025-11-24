import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'antd/dist/reset.css'
import App from './App'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n'
import { BrowserRouter } from 'react-router-dom'
import { ParamsProvider } from './context/ParamsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <ParamsProvider>
          <App />
        </ParamsProvider>
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>,
)

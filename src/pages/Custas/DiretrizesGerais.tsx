import { Card, Typography, List } from 'antd'
import { useTranslation } from 'react-i18next'

export default function DiretrizesGerais() {
  const { t } = useTranslation()
  const items = [
    'Base legal e normatividade (Lei 9.289/96 e resoluções CJF)',
    'Arrecadação via GRU e identificação do processo/parte',
    'Formas de cálculo do valor e base de incidência',
    'Regras gerais de pagamento e momentos de exigência',
  ]

  return (
    <Card title={t('pages.custas.diretrizes.title')}>
      <Typography.Paragraph>
        Estrutura geral das custas processuais conforme o Manual CJF 2025.
      </Typography.Paragraph>
      <List dataSource={items} renderItem={(tEXt) => <List.Item>{tEXt}</List.Item>} />
    </Card>
  )
}
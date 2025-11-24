import { Card, Typography, List } from 'antd'
import { useTranslation } from 'react-i18next'

export default function AcoesPenais() {
  const { t } = useTranslation()
  const items = [
    'Custas no processo penal por atos praticados',
    'Hipóteses de isenção específicas',
    'Regras de pagamento e execução',
  ]
  return (
    <Card title={t('pages.custas.acoesPenais.title')}>
      <Typography.Paragraph>
        Custas aplicáveis às ações penais.
      </Typography.Paragraph>
      <List dataSource={items} renderItem={(x) => <List.Item>{x}</List.Item>} />
    </Card>
  )
}
import { Card, Typography, List } from 'antd'
import { useTranslation } from 'react-i18next'

export default function IsencoesGratuidade() {
  const { t } = useTranslation()
  const items = [
    'Assistência judiciária gratuita: requisitos e efeitos',
    'Isenções legais por natureza da ação/parte',
    'Extensão da gratuidade e limitações',
  ]
  return (
    <Card title={t('pages.custas.isencoesGratuidade.title')}>
      <Typography.Paragraph>
        Marco geral de isenções e gratuidade nas custas.
      </Typography.Paragraph>
      <List dataSource={items} renderItem={(x) => <List.Item>{x}</List.Item>} />
    </Card>
  )
}
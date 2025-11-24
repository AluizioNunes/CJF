import { memo, useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TitleComponent, TooltipComponent, GridComponent, LegendComponent, LineChart, BarChart, PieChart, CanvasRenderer])

type Props = { option: any; style?: React.CSSProperties }

function EChart({ option, style }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<any>(null)

  // Inicializa uma vez
  useEffect(() => {
    if (!ref.current) return
    chartRef.current = echarts.init(ref.current)
    const onResize = () => chartRef.current && chartRef.current.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
  }, [])

  // Atualiza opções sem reinicializar
  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, { notMerge: true })
    }
  }, [option])

  return <div ref={ref} style={{ width: '100%', height: 320, ...(style || {}) }} />
}

export default memo(EChart)
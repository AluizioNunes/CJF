// ESM script using pdfjs-dist to extract text from a local PDF
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function extractText(pdfPath) {
  const mod = await import('pdf-parse/node')
  const pdfParse = mod.default || mod
  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(dataBuffer)
  return data.text
}

async function main() {
  const pdfPath = path.resolve(__dirname, '..', 'Backend', 'manual_de_calculos_2025_vf.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF não encontrado em:', pdfPath)
    process.exit(1)
  }
  try {
    const text = await extractText(pdfPath)
    const outPath = path.resolve(__dirname, '..', 'Backend', 'manual_cjf_2025_extract.txt')
    fs.writeFileSync(outPath, text, 'utf8')
    console.log('Extração concluída. Arquivo gerado em:', outPath)
  } catch (err) {
    console.error('Falha ao extrair texto do PDF:', err)
    process.exit(1)
  }
}

main()
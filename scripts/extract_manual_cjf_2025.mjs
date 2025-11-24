// ESM script using pdfjs-dist to extract text from a local PDF
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
// Use legacy build for Node.js
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function extractText(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath))
  const loadingTask = pdfjsLib.getDocument({ data })
  const pdf = await loadingTask.promise
  let fullText = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const strings = content.items.map((item) => item.str)
    fullText += `\n\n=== Página ${pageNum} ===\n` + strings.join(' ')
  }
  return fullText
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
    console.error('Falha ao extrair texto do PDF via pdfjs-dist:', err)
    process.exit(1)
  }
}

main()
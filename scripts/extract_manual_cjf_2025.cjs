// Simple PDF text extractor for Backend/manual_de_calculos_2025_vf.pdf
// Produces Backend/manual_cjf_2025_extract.txt with raw text for grepping.
const fs = require('fs')
const path = require('path')
let pdf
try {
  pdf = require('pdf-parse')
  if (pdf && pdf.default) pdf = pdf.default
} catch (e) {
  console.error('Não foi possível carregar pdf-parse:', e)
  process.exit(1)
}

async function main() {
  const pdfPath = path.resolve(__dirname, '..', 'Backend', 'manual_de_calculos_2025_vf.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF não encontrado em:', pdfPath)
    process.exit(1)
  }
  const dataBuffer = fs.readFileSync(pdfPath)
  try {
    const data = await pdf(dataBuffer)
    const outPath = path.resolve(__dirname, '..', 'Backend', 'manual_cjf_2025_extract.txt')
    fs.writeFileSync(outPath, data.text, 'utf8')
    console.log('Extração concluída. Arquivo gerado em:', outPath)
    console.log('Páginas:', data.numpages)
  } catch (err) {
    console.error('Falha ao extrair texto do PDF:', err)
    process.exit(1)
  }
}

main()
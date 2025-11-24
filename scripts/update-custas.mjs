import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import axios from 'axios'
import { execFile } from 'node:child_process'

const ROOT = process.cwd()
const sourcesTsPath = path.resolve(ROOT, 'src', 'data', 'custas', 'sources.ts')
const outputPath = path.resolve(ROOT, 'src', 'data', 'custas', 'last-update.json')
const regionsDir = path.resolve(ROOT, 'src', 'data', 'custas')
const overridesJsonPath = path.resolve(ROOT, 'src', 'data', 'custas', 'overrides.json')

function readRegionalSourcesFromTs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const startIdx = content.indexOf('export const REGIONAL_SOURCES')
  if (startIdx < 0) throw new Error('REGIONAL_SOURCES not found')
  const tail = content.slice(startIdx)
  const endIdx = tail.indexOf('\n};')
  const objLiteral = tail.slice(tail.indexOf('{'), endIdx + 3) // includes closing '};'
  const js = 'const REGIONAL_SOURCES = ' + objLiteral + '\nREGIONAL_SOURCES'
  const sandbox = {}
  const script = new vm.Script(js)
  const result = script.runInNewContext(sandbox)
  return result
}

function readOverridesJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {}
    const raw = fs.readFileSync(filePath, 'utf8')
    const j = JSON.parse(raw)
    return j && typeof j === 'object' ? j : {}
  } catch {
    return {}
  }
}

async function checkUrl(url, type) {
  const startedAt = new Date().toISOString()
  try {
    if (/^file:\/\//i.test(url) || (/^(?!https?:)/i.test(url))) {
      const p = url.replace(/^file:\/\//i, '')
      const exists = fs.existsSync(p)
      return { url, type, status: exists ? 200 : 404, ok: exists, startedAt, finishedAt: new Date().toISOString() }
    }
    const res = await axios.get(url, {
      maxRedirects: 3,
      timeout: 15000,
      validateStatus: (s) => s >= 200 && s < 400,
    })
    return { url, type, status: res.status, ok: true, startedAt, finishedAt: new Date().toISOString() }
  } catch (err) {
    return { url, type, status: err?.response?.status ?? 0, ok: false, error: err?.message ?? String(err), startedAt, finishedAt: new Date().toISOString() }
  }
}

async function main() {
  const sourcesByRegion = readRegionalSourcesFromTs(sourcesTsPath)
  const overridesByRegion = readOverridesJson(overridesJsonPath)
  const regions = Object.keys(sourcesByRegion)
  const generatedAt = new Date().toISOString()
  const APPLY = process.argv.includes('--apply')

  const result = { generatedAt, regions: {} }
  for (const region of regions) {
    const sources = [ ...(sourcesByRegion[region] || []), ...((overridesByRegion?.[region] ?? [])) ]
    const statuses = []
    for (const src of sources) {
      statuses.push(await checkUrl(src.url, src.type))
    }
    const cfg = readRegionalConfig(region)
    const summary = summarizeConfig(cfg)
    const extracted = await extractRegionalNumbers(region, sources)
    const differences = diffConfigWithExtract(cfg, extracted)
    const regionEntry = {
      count: statuses.length,
      ok: statuses.filter(s => s.ok).length,
      fail: statuses.filter(s => !s.ok).length,
      sourcesStatus: statuses,
      configSummary: summary,
      extractedSummary: extracted,
      differences,
      updatedAt: new Date().toISOString(),
    }
    result.regions[region] = regionEntry
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`[update-custas] Wrote ${outputPath}. Regions: ${regions.length}`)
  for (const r of regions) {
    const info = result.regions[r]
    console.log(` - ${r}: ${info.ok}/${info.count} OK | config ok: ${info.configSummary?.ok ? 'yes' : 'no'}`)
    if (info.differences && info.differences.length) {
      console.log(`   diffs:`)
      for (const d of info.differences) {
        console.log(`   - ${d.field}: ${d.configured} -> ${d.extracted}`)
      }
    }
  }
}

main().catch((e) => {
  console.error('[update-custas] Failed:', e)
  process.exitCode = 1
})
function readRegionalConfig(region) {
  const filePath = path.resolve(regionsDir, `${region}.ts`)
  if (!fs.existsSync(filePath)) return null
  let content = fs.readFileSync(filePath, 'utf8')
  // Strip type imports/exports and convert default export to const
  content = content
    .replace(/import\s+type[\s\S]*?\n/g, '')
    .replace(/import[\s\S]*?\n/g, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/:\s*RegionalCustasConfig/g, '')
  const varName = region
  const js = content + `\nREGIONAL = (typeof ${varName} !== 'undefined' ? ${varName} : undefined)\nREGIONAL`
  const sandbox = {}
  try {
    const script = new vm.Script(js)
    const cfg = script.runInNewContext(sandbox)
    return cfg || null
  } catch (e) {
    return null
  }
}

function summarizeConfig(cfg) {
  if (!cfg) return { ok: false, reason: 'missing config' }
  const tI = cfg.tabelaI || {}
  const tIII = (cfg.tabelaIII && cfg.tabelaIII.itens) ? cfg.tabelaIII.itens : []
  const porte = Array.isArray(cfg.porteRemessaRetorno) ? cfg.porteRemessaRetorno : []
  const undefinedTIII = tIII.filter(i => i.valor == null).map(i => i.id)
  const undefinedPorte = porte.filter(p => p.valor == null).map(p => p.subsecao)
  const ok = (tI.percentual != null) && (tI.minimo != null) && undefinedTIII.length === 0
  return {
    ok,
    tabelaI: { percentual: tI.percentual ?? null, minimo: tI.minimo ?? null, maximo: tI.maximo ?? null },
    tabelaIIIUndefined: undefinedTIII,
    porteUndefined: undefinedPorte,
    updatedAt: cfg.updatedAt || null,
    observacoes: cfg.observacoes || null,
  }
}

function toNumber(val) {
  if (!val) return null
  const s = String(val).replace(/[^0-9,\.]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

async function extractFromPdf(url, patterns) {
  try {
    let buffer
    if (/^file:\/\//i.test(url) || (/^(?!https?:)/i.test(url))) {
      const p = url.replace(/^file:\/\//i, '')
      buffer = fs.readFileSync(p)
    } else {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
      buffer = res.data
    }
    let pdfParse
    try {
      const mod = await import('pdf-parse/node')
      pdfParse = mod.default || mod
    } catch {
      const mod = await import('pdf-parse')
      pdfParse = mod.default || mod
    }
    let text = ''
    try {
      const data = await (typeof pdfParse === 'function' ? pdfParse(buffer) : Promise.reject(new Error('not function')))
      text = data.text || ''
    } catch {
      const cliPath = path.resolve(ROOT, 'node_modules', 'pdf-parse', 'bin', 'cli.mjs')
      const args = ['text', /^https?:/i.test(url) ? url : buffer]
      text = await new Promise((resolve, reject) => {
        execFile('node', [cliPath, ...args], { timeout: 60000 }, (err, stdout) => {
          if (err) return reject(err)
          resolve(stdout || '')
        })
      })
    }
    const out = {}
    for (const key of Object.keys(patterns)) {
      const rx = patterns[key]
      const m = rx.exec(text)
      out[key] = m && (m[1] || m[0]) ? m[1] || m[0] : null
    }
    return { ok: true, raw: out, textLen: text.length }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

async function extractFromHtml(url, patterns) {
  try {
    let html
    if (/^file:\/\//i.test(url) || (/^(?!https?:)/i.test(url))) {
      const p = url.replace(/^file:\/\//i, '')
      html = fs.readFileSync(p, 'utf8')
    } else {
      const res = await axios.get(url, { timeout: 30000 })
      html = res.data || ''
    }
    const out = {}
    for (const key of Object.keys(patterns)) {
      const rx = patterns[key]
      const m = rx.exec(html)
      out[key] = m && (m[1] || m[0]) ? m[1] || m[0] : null
    }
    return { ok: true, raw: out, textLen: html.length }
  } catch (e) {
    return { ok: false, error: e?.message || String(e) }
  }
}

async function extractRegionalNumbers(region, sources) {
  if (region === 'TRF6') {
    const src = sources.find(s => s.url.includes('Portaria-Presi-32-2022')) || sources.find(s => s.type === 'pdf')
    if (!src) return null
    const res = await extractFromPdf(src.url, {
      tabelaI_percent: /Tabela\s*I[\s\S]*?(\d+\s*%)/i,
      tabelaI_minimo: /Tabela\s*I[\s\S]*?m[íi]nimo[\s\S]*?R\$\s*([0-9\.,]+)/i,
      certidao_brl: /Certid[ãa]o[\s\S]*?R\$\s*([0-9\.,]+)/i,
      reprografia_brl: /Reprografia[\s\S]*?R\$\s*([0-9\.,]+)/i,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      tabelaI: {
        percentual: toNumber(res.raw.tabelaI_percent?.match(/(\d+)/)?.[1]) ? (toNumber(res.raw.tabelaI_percent?.match(/(\d+)/)?.[1]) / 100) : null,
        minimo: toNumber(res.raw.tabelaI_minimo),
      },
      tabelaIII: {
        certidao: toNumber(res.raw.certidao_brl),
        reprografia: toNumber(res.raw.reprografia_brl),
      },
    }
  }
  if (region === 'TRF2') {
    const src = sources.find(s => s.url.includes('custas-judiciais-no-trf2')) || sources.find(s => s.type === 'html')
    if (!src) return null
    const res = await extractFromHtml(src.url, {
      ufir: /UFIR\s*([0-9\.,]+)/i,
      certidao_brl: /Certid[ãa]o[\s\S]*?R\$\s*([0-9\.,]+)/i,
      reprografia_brl: /Reprografia[\s\S]*?R\$\s*([0-9\.,]+)/i,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      ufir: toNumber(res.raw.ufir),
      tabelaIII: {
        certidao: toNumber(res.raw.certidao_brl),
        reprografia: toNumber(res.raw.reprografia_brl),
      },
    }
  }
  if (region === 'TRF4') {
    const src = sources.find(s => s.url.includes('id_pagina=796')) || sources.find(s => s.type === 'html')
    if (!src) return null
    const res = await extractFromHtml(src.url, {
      certidao_brl: /Certid[ãa]o[\s\S]*?R\$\s*([0-9\.,]+)/i,
      reprografia_brl: /Reprografia[\s\S]*?R\$\s*([0-9\.,]+)/i,
      minimoTI: /Tabela\s*I[\s\S]*?m[íi]nimo[\s\S]*?R\$\s*([0-9\.,]+)/i,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      tabelaI: { minimo: toNumber(res.raw.minimoTI) },
      tabelaIII: { certidao: toNumber(res.raw.certidao_brl), reprografia: toNumber(res.raw.reprografia_brl) },
    }
  }
  if (region === 'TRF1') {
    const src = sources.find(s => s.type === 'html')
    if (!src) return null
    const res = await extractFromHtml(src.url, {
      minimoTI: /Tabela\s*I[\s\S]*?m[íi]nimo[\s\S]*?R\$\s*([0-9\.,]+)/i,
      certidao_brl: /Certid[ãa]o[\s\S]*?R\$\s*([0-9\.,]+)/i,
      reprografia_brl: /Reprografia[\s\S]*?R\$\s*([0-9\.,]+)/i,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      tabelaI: { minimo: toNumber(res.raw.minimoTI) },
      tabelaIII: { certidao: toNumber(res.raw.certidao_brl), reprografia: toNumber(res.raw.reprografia_brl) },
    }
  }
  if (region === 'TRF3') {
    const src = sources.find(s => s.type === 'html')
    if (!src) return null
    const res = await extractFromHtml(src.url, {
      minimoTI: /Tabela\s*I[\s\S]*?m[íi]nimo[\s\S]*?R\$\s*([0-9\.,]+)/i,
      certidao_brl: /Certid[ãa]o[\s\S]*?R\$\s*([0-9\.,]+)/i,
    })
    if (!res.ok) return { ok: false, error: res.error }
    return {
      tabelaI: { minimo: toNumber(res.raw.minimoTI) },
      tabelaIII: { certidao: toNumber(res.raw.certidao_brl) },
    }
  }
  if (region === 'TRF5') {
    // Sem HTML estático confiável, retornar null para exigir verificação manual.
    return null
  }
  return null
}

function diffConfigWithExtract(cfg, ext) {
  const diffs = []
  if (!cfg || !ext) return diffs
  if (ext.tabelaI) {
    if (ext.tabelaI.percentual != null && cfg.tabelaI?.percentual !== ext.tabelaI.percentual) {
      diffs.push({ field: 'tabelaI.percentual', configured: cfg.tabelaI?.percentual ?? null, extracted: ext.tabelaI.percentual })
    }
    if (ext.tabelaI.minimo != null && cfg.tabelaI?.minimo !== ext.tabelaI.minimo && ext.tabelaI.minimo >= 5) {
      diffs.push({ field: 'tabelaI.minimo', configured: cfg.tabelaI?.minimo ?? null, extracted: ext.tabelaI.minimo })
    }
  }
  if (ext.tabelaIII) {
    if (ext.tabelaIII.certidao != null && ext.tabelaIII.certidao >= 1) {
      const cur = (cfg.tabelaIII?.itens || []).find(i => i.id === 'certidao')?.valor ?? null
      if (cur !== ext.tabelaIII.certidao) diffs.push({ field: 'tabelaIII.certidao', configured: cur, extracted: ext.tabelaIII.certidao })
    }
    if (ext.tabelaIII.reprografia != null && ext.tabelaIII.reprografia >= 0.5) {
      const cur = (cfg.tabelaIII?.itens || []).find(i => i.id === 'reprografia')?.valor ?? null
      if (cur !== ext.tabelaIII.reprografia) diffs.push({ field: 'tabelaIII.reprografia', configured: cur, extracted: ext.tabelaIII.reprografia })
    }
  }
  if (ext.ufir != null) {
    diffs.push({ field: 'ufir', configured: null, extracted: ext.ufir })
  }
  return diffs
}
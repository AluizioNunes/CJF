import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import axios from 'axios'

const ROOT = process.cwd()
const sourcesTsPath = path.resolve(ROOT, 'src', 'data', 'custas', 'sources.ts')
const outputPath = path.resolve(ROOT, 'src', 'data', 'custas', 'last-update.json')

function readRegionalSourcesFromTs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  // Remove type exports and helper function to keep a pure object definition
  let js = content
    .replace(/export\s+type[\s\S]*?;\n/g, '')
    .replace(/export\s+const\s+REGIONAL_SOURCES\s*:\s*RegionalSourcesMap\s*=\s*/g, 'const REGIONAL_SOURCES = ')
    .replace(/export\s+function\s+getRegionalSources[\s\S]*$/g, '')

  // Evaluate REGIONAL_SOURCES into a sandbox
  const sandbox = {}
  const script = new vm.Script(js + '\nREGIONAL_SOURCES')
  const result = script.runInNewContext(sandbox)
  return result
}

async function checkUrl(url, type) {
  const startedAt = new Date().toISOString()
  try {
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
  const regions = Object.keys(sourcesByRegion)
  const generatedAt = new Date().toISOString()

  const result = { generatedAt, regions: {} }
  for (const region of regions) {
    const sources = sourcesByRegion[region] || []
    const statuses = []
    for (const src of sources) {
      statuses.push(await checkUrl(src.url, src.type))
    }
    result.regions[region] = {
      count: statuses.length,
      ok: statuses.filter(s => s.ok).length,
      fail: statuses.filter(s => !s.ok).length,
      sourcesStatus: statuses,
      updatedAt: new Date().toISOString(),
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`[update-custas] Wrote ${outputPath}. Regions: ${regions.length}`)
  for (const r of regions) {
    const info = result.regions[r]
    console.log(` - ${r}: ${info.ok}/${info.count} OK`)
  }
}

main().catch((e) => {
  console.error('[update-custas] Failed:', e)
  process.exitCode = 1
})
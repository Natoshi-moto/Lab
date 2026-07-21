import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// BEGIN VERIFICATION-INFRASTRUCTURE — do not modify without UNFREEZE
// Algorithms defined in HANDY_CODE_SNIPPETS.MD "Build-time hash algorithms (Sweep 51)".
// Any change here requires explicit UNFREEZE in the sweep prompt and a fresh
// exporter_self_hash value posted in the delivery.

function viWalkSync(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files: string[] = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      files = files.concat(viWalkSync(full))
    } else if (e.isFile()) {
      files.push(full)
    }
  }
  return files
}

const _viSrcDir = path.resolve(__dirname, 'src')
const _viAllFiles = viWalkSync(_viSrcDir)
const _viRelFiles = _viAllFiles.map(f => {
  const rel = path.relative(_viSrcDir, f)
  return rel.split(path.sep).join('/')
})
_viRelFiles.sort()

const _viRunning = createHash('sha256')
for (const rel of _viRelFiles) {
  const bytes = fs.readFileSync(path.join(_viSrcDir, ...rel.split('/')))
  const fileHash = createHash('sha256').update(bytes).digest('hex')
  _viRunning.update(Buffer.from(rel, 'utf8'))
  _viRunning.update(Buffer.from([0x00]))
  _viRunning.update(Buffer.from(fileHash, 'utf8'))
  _viRunning.update(Buffer.from([0x00]))
}
const buildCommit = _viRunning.digest('hex')

const _viExporterBytes = fs.readFileSync(path.join(_viSrcDir, 'diagnosticExporter.ts'))
const exporterSelfHash = createHash('sha256').update(_viExporterBytes).digest('hex')
// END VERIFICATION-INFRASTRUCTURE

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
    __EXPORTER_SELF_HASH__: JSON.stringify(exporterSelfHash),
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
})

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const hostRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = path.join(hostRoot, 'public')
const staleFilename = 'nexus-agent-v0.12.html'
const liveFilename = 'nexus-agent-v0.14-scrubbed.html'
const studioPath = path.join(hostRoot, 'src/studios/nexusAgent/NexusAgentStudio.tsx')

async function walk(directory) {
  const paths = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) paths.push(...await walk(entryPath))
    else paths.push(entryPath)
  }
  return paths
}

const shippedFiles = await walk(publicRoot)
const staleFiles = shippedFiles.filter(file => path.basename(file) === staleFilename)
const staleReferences = []

for (const file of shippedFiles) {
  const contents = await readFile(file, 'utf8').catch(() => '')
  if (contents.includes(staleFilename)) staleReferences.push(path.relative(hostRoot, file))
}

const studio = await readFile(studioPath, 'utf8')
const failures = []
if (staleFiles.length) failures.push(`stale shipped files: ${staleFiles.map(file => path.relative(hostRoot, file)).join(', ')}`)
if (staleReferences.length) failures.push(`stale shipped references: ${staleReferences.join(', ')}`)
if (!studio.includes(`./nexus/${liveFilename}`)) failures.push(`live studio does not target ${liveFilename}`)

if (failures.length) {
  for (const failure of failures) console.error(`FAIL T-06: ${failure}`)
  process.exit(1)
}

console.log(`PASS T-06: ${staleFilename} is absent from shipped files and references`)
console.log(`PASS T-06: live studio targets ${liveFilename}`)

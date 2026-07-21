export type OdsCaseResult = 'PASS' | 'FAIL' | 'SKIP' | 'ERROR'

export type OdsSurface = 'host' | 'bridge' | 'broker' | 'agent' | 'creature' | 'sim' | 'drop' | 'security'

export type OdsCase = {
  id: string
  title: string
  surface: OdsSurface
  phase_min: number
  human_only: boolean
  steps: string[]
  expected: string[]
  collect: string[]
  risk: 'low' | 'medium' | 'high'
  p0: 'implemented'
}

export const ODS_P0_CASES: readonly OdsCase[] = Object.freeze([
  { id: 'ODS-ENV-001', title: 'Probe environment', surface: 'host', phase_min: 1, human_only: false, steps: ['Open the suite or run the case.'], expected: ['Mode, route, user agent, and viewport are recorded.'], collect: ['env.*'], risk: 'low', p0: 'implemented' },
  { id: 'ODS-HOST-001', title: 'Probe host and router mount', surface: 'host', phase_min: 1, human_only: false, steps: ['Probe the diagnostics host and embedded router selectors.'], expected: ['Diagnostics studio and Nexus iframe selectors are present.'], collect: ['artifacts.dom_probes'], risk: 'low', p0: 'implemented' },
  { id: 'ODS-BR-001', title: 'Trusted iframe diagnostic ping', surface: 'bridge', phase_min: 1, human_only: false, steps: ['Ask the embedded Nexus adapter to send diagnostic.ping.'], expected: ['Accepted count increases once and an ok receipt is recorded.'], collect: ['bridge.last_receipts', 'bridge.status_text'], risk: 'low', p0: 'implemented' },
  { id: 'ODS-BR-002', title: 'Foreign parent diagnostic ping', surface: 'bridge', phase_min: 1, human_only: false, steps: ['Send a protocol-shaped ping from the parent window.'], expected: ['Rejected count increases once with UNTRUSTED_SOURCE; no reply is sent.'], collect: ['bridge.last_receipts', 'timeline'], risk: 'medium', p0: 'implemented' },
  { id: 'ODS-BR-003', title: 'Malformed envelope', surface: 'bridge', phase_min: 1, human_only: false, steps: ['Send malformed bridge data from the trusted iframe.'], expected: ['Reject with MALFORMED_ENVELOPE and no crash.'], collect: ['bridge.last_receipts', 'timeline', 'console.errors'], risk: 'medium', p0: 'implemented' },
  { id: 'ODS-BR-004', title: 'Unknown channel', surface: 'bridge', phase_min: 1, human_only: false, steps: ['Send an unknown channel from the trusted iframe.'], expected: ['An explicit UNKNOWN_CHANNEL rejection receipt is returned.'], collect: ['bridge.last_receipts'], risk: 'medium', p0: 'implemented' },
  { id: 'ODS-BR-005', title: 'Ping burst', surface: 'bridge', phase_min: 1, human_only: false, steps: ['Send 20 diagnostic pings.'], expected: ['Host remains responsive and the bridge log truncates to its configured bound.'], collect: ['timeline', 'bridge'], risk: 'medium', p0: 'implemented' },
  { id: 'ODS-PATH-001', title: 'Probe Nexus iframe path', surface: 'host', phase_min: 1, human_only: false, steps: ['Read the embedded iframe src.'], expected: ['./nexus/os/Nexus_OS.html is reported.'], collect: ['artifacts.iframe_src'], risk: 'low', p0: 'implemented' },
  { id: 'ODS-PACK-001', title: 'Record build kind', surface: 'host', phase_min: 1, human_only: false, steps: ['Inspect the Vite mode.'], expected: ['dev or preview is recorded in env.build_kind.'], collect: ['env.build_kind'], risk: 'low', p0: 'implemented' },
])

export const ODS_SUITE_VERSION = '0.2.0-ods1'

import { useCallback, useEffect, useState } from 'react'

export const THEME_STORAGE_KEY = 'verse-studio:theme'

export const THEME_TOKEN_NAMES = [
  '--bg',
  '--surface',
  '--surface-2',
  '--surface-3',
  '--line',
  '--ink',
  '--ink-dim',
  '--ink-soft',
  '--ink-faint',
  '--accent',
  '--accent-bright',
  '--accent-dim',
  '--accent-soft',
  '--accent-contrast',
  '--danger',
  '--warning',
  '--info',
  '--warn',
  '--bad',
  '--good'
] as const

export type ThemeTokenName = typeof THEME_TOKEN_NAMES[number]
export type ThemePresetId = 'matrix' | 'paper' | 'midnight'
export type Theme = ThemePresetId

export interface ThemeSettings {
  preset: ThemePresetId
  overrides?: Partial<Record<ThemeTokenName, string>>
}

interface ThemePreset {
  id: ThemePresetId
  label: string
  tokens: Record<ThemeTokenName, string>
}

const PRESET_IDS: ThemePresetId[] = ['matrix', 'paper', 'midnight']
const PRESET_SET = new Set<string>(PRESET_IDS)
const CHANGE_EVENT = 'noted:theme-change'

export const THEME_PRESETS: Record<ThemePresetId, ThemePreset> = {
  matrix: {
    id: 'matrix',
    label: 'Matrix',
    tokens: {
      '--bg': '10 14 12',
      '--surface': '14 20 17',
      '--surface-2': '19 27 22',
      '--surface-3': '26 37 30',
      '--line': '32 48 39',
      '--ink': '205 235 214',
      '--ink-dim': '111 140 121',
      '--ink-soft': '111 140 121',
      '--ink-faint': '65 88 74',
      '--accent': '65 216 128',
      '--accent-bright': '107 242 162',
      '--accent-dim': '37 143 85',
      '--accent-soft': '37 143 85',
      '--accent-contrast': '6 20 12',
      '--danger': '240 86 106',
      '--warning': '227 179 65',
      '--info': '74 192 224',
      '--warn': '227 179 65',
      '--bad': '240 86 106',
      '--good': '65 216 128'
    }
  },
  paper: {
    id: 'paper',
    label: 'Paper',
    tokens: {
      '--bg': '250 249 246',
      '--surface': '250 249 246',
      '--surface-2': '243 241 236',
      '--surface-3': '230 227 220',
      '--line': '221 217 210',
      '--ink': '42 40 37',
      '--ink-dim': '86 82 76',
      '--ink-soft': '86 82 76',
      '--ink-faint': '138 133 125',
      '--accent': '109 91 156',
      '--accent-bright': '133 112 184',
      '--accent-dim': '83 70 121',
      '--accent-soft': '207 199 227',
      '--accent-contrast': '250 249 246',
      '--danger': '166 70 64',
      '--warning': '176 125 44',
      '--info': '61 125 154',
      '--warn': '176 125 44',
      '--bad': '166 70 64',
      '--good': '79 122 74'
    }
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    tokens: {
      '--bg': '16 17 19',
      '--surface': '24 25 27',
      '--surface-2': '32 33 36',
      '--surface-3': '42 45 49',
      '--line': '51 55 64',
      '--ink': '226 228 232',
      '--ink-dim': '155 163 175',
      '--ink-soft': '155 163 175',
      '--ink-faint': '107 114 128',
      '--accent': '178 155 223',
      '--accent-bright': '205 184 245',
      '--accent-dim': '120 99 166',
      '--accent-soft': '74 63 106',
      '--accent-contrast': '18 14 28',
      '--danger': '210 122 115',
      '--warning': '212 163 90',
      '--info': '107 180 211',
      '--warn': '212 163 90',
      '--bad': '210 122 115',
      '--good': '130 169 120'
    }
  }
}

function isPresetId(value: unknown): value is ThemePresetId {
  return typeof value === 'string' && PRESET_SET.has(value)
}

function normalizePreset(value: unknown): ThemePresetId {
  if (value === 'dark') return 'midnight'
  if (value === 'light') return 'paper'
  return isPresetId(value) ? value : 'matrix'
}

export function isRgbTriplet(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const parts = value.trim().split(/\s+/)
  if (parts.length !== 3) return false
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false
    const n = Number(part)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

function sanitizeOverrides(input: unknown): ThemeSettings['overrides'] {
  if (!input || typeof input !== 'object') return undefined
  const out: Partial<Record<ThemeTokenName, string>> = {}
  for (const token of THEME_TOKEN_NAMES) {
    const value = (input as Record<string, unknown>)[token]
    if (isRgbTriplet(value)) out[token] = value.trim().replace(/\s+/g, ' ')
  }
  return Object.keys(out).length ? out : undefined
}

export function normalizeThemeSettings(input: unknown): ThemeSettings {
  if (typeof input === 'string') {
    if (input === 'dark' || input === 'light') return { preset: normalizePreset(input) }
    try {
      return normalizeThemeSettings(JSON.parse(input))
    } catch {
      return { preset: 'matrix' }
    }
  }

  if (!input || typeof input !== 'object') return { preset: 'matrix' }
  const raw = input as Record<string, unknown>
  return {
    preset: normalizePreset(raw.preset),
    overrides: sanitizeOverrides(raw.overrides)
  }
}

export function readThemeSettings(): ThemeSettings {
  try {
    return normalizeThemeSettings(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return { preset: 'matrix' }
  }
}

export function applyThemeSettings(settings: ThemeSettings): void {
  const normalized = normalizeThemeSettings(settings)
  const root = document.documentElement
  root.dataset.theme = normalized.preset
  root.classList.remove('dark')

  for (const token of THEME_TOKEN_NAMES) {
    root.style.removeProperty(token)
  }

  if (normalized.overrides) {
    for (const [token, value] of Object.entries(normalized.overrides)) {
      if (THEME_TOKEN_NAMES.includes(token as ThemeTokenName) && isRgbTriplet(value)) {
        root.style.setProperty(token, value)
      }
    }
  }
}

export function writeThemeSettings(settings: ThemeSettings): ThemeSettings {
  const normalized = normalizeThemeSettings(settings)
  applyThemeSettings(normalized)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: normalized }))
  } catch {}
  return normalized
}

export function getEffectiveThemeToken(settings: ThemeSettings, token: ThemeTokenName): string {
  const normalized = normalizeThemeSettings(settings)
  return normalized.overrides?.[token] ?? THEME_PRESETS[normalized.preset].tokens[token]
}

export function rgbTripletToHex(value: string): string {
  if (!isRgbTriplet(value)) return '#000000'
  const [r, g, b] = value.split(/\s+/).map((n) => Number(n))
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
}

export function hexToRgbTriplet(value: string): string | null {
  const trimmed = value.trim()
  const match = /^#?([\da-f]{6})$/i.exec(trimmed)
  if (!match) return null
  const hex = match[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

function rgbToParts(value: string): [number, number, number] {
  const [r, g, b] = value.split(/\s+/).map((n) => Number(n))
  return [r, g, b]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const convert = (channel: number) => {
    const srgb = channel / 255
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b)
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(rgbToParts(a))
  const l2 = relativeLuminance(rgbToParts(b))
  const high = Math.max(l1, l2)
  const low = Math.min(l1, l2)
  return (high + 0.05) / (low + 0.05)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function hslToRgbTriplet(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360
  const sat = clamp(s, 0, 100) / 100
  const light = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * light - 1)) * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = light - c / 2
  let rp = 0
  let gp = 0
  let bp = 0
  if (hue < 60) [rp, gp, bp] = [c, x, 0]
  else if (hue < 120) [rp, gp, bp] = [x, c, 0]
  else if (hue < 180) [rp, gp, bp] = [0, c, x]
  else if (hue < 240) [rp, gp, bp] = [0, x, c]
  else if (hue < 300) [rp, gp, bp] = [x, 0, c]
  else [rp, gp, bp] = [c, 0, x]
  return [rp, gp, bp].map((v) => Math.round((v + m) * 255)).join(' ')
}

function withMinimumContrast(bg: string, hue: number, saturation: number, startLightness: number, preferLighter: boolean): string {
  const step = preferLighter ? 2 : -2
  let best = hslToRgbTriplet(hue, saturation, startLightness)
  if (contrastRatio(bg, best) >= 4.5) return best
  for (let l = startLightness; l >= 8 && l <= 96; l += step) {
    const candidate = hslToRgbTriplet(hue, saturation, l)
    best = candidate
    if (contrastRatio(bg, candidate) >= 4.5) return candidate
  }
  return best
}

export function createRandomThemeOverrides(): Partial<Record<ThemeTokenName, string>> {
  const baseHue = Math.floor(Math.random() * 360)
  const accentHue = (baseHue + (Math.random() < 0.5 ? 165 : 30)) % 360
  const bg = hslToRgbTriplet(baseHue, 28, 6)
  const ink = withMinimumContrast(bg, baseHue, 24, 86, true)
  const accent = withMinimumContrast(bg, accentHue, 68, 58, true)
  const accentDim = hslToRgbTriplet(accentHue, 52, 34)
  const warning = withMinimumContrast(bg, (baseHue + 70) % 360, 70, 58, true)
  const danger = withMinimumContrast(bg, (baseHue + 320) % 360, 70, 62, true)

  return {
    '--bg': bg,
    '--surface': hslToRgbTriplet(baseHue, 28, 8),
    '--surface-2': hslToRgbTriplet(baseHue, 26, 11),
    '--surface-3': hslToRgbTriplet(baseHue, 24, 16),
    '--line': hslToRgbTriplet(baseHue, 22, 23),
    '--ink': ink,
    '--ink-dim': hslToRgbTriplet(baseHue, 20, 66),
    '--ink-soft': hslToRgbTriplet(baseHue, 20, 66),
    '--ink-faint': hslToRgbTriplet(baseHue, 18, 44),
    '--accent': accent,
    '--accent-bright': withMinimumContrast(bg, accentHue, 76, 70, true),
    '--accent-dim': accentDim,
    '--accent-soft': accentDim,
    '--accent-contrast': hslToRgbTriplet(baseHue, 30, 7),
    '--danger': danger,
    '--warning': warning,
    '--info': withMinimumContrast(bg, (baseHue + 205) % 360, 68, 62, true),
    '--warn': warning,
    '--bad': danger,
    '--good': withMinimumContrast(bg, (baseHue + 120) % 360, 58, 58, true)
  }
}

export interface ThemeControls {
  settings: ThemeSettings
  setSettings: (settings: ThemeSettings) => void
  resetOverrides: () => void
  randomize: () => void
  setOverride: (token: ThemeTokenName, rgbTriplet: string) => void
  clearOverride: (token: ThemeTokenName) => void
  getToken: (token: ThemeTokenName) => string
}

export function useTheme(): [ThemePresetId, (preset: ThemePresetId | 'light' | 'dark') => void, () => void, ThemeControls] {
  const [settings, setSettingsState] = useState<ThemeSettings>(() => readThemeSettings())

  useEffect(() => {
    writeThemeSettings(settings)
  }, [settings])

  useEffect(() => {
    const sync = () => {
      const next = readThemeSettings()
      setSettingsState((cur) => JSON.stringify(cur) === JSON.stringify(next) ? cur : next)
    }
    window.addEventListener('storage', sync)
    window.addEventListener(CHANGE_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(CHANGE_EVENT, sync)
    }
  }, [])

  const setSettings = useCallback((next: ThemeSettings) => {
    setSettingsState(normalizeThemeSettings(next))
  }, [])

  const setPreset = useCallback((preset: ThemePresetId | 'light' | 'dark') => {
    setSettingsState((cur) => ({ ...cur, preset: normalizePreset(preset) }))
  }, [])

  const toggle = useCallback(() => {
    setSettingsState((cur) => {
      const current = normalizePreset(cur.preset)
      const index = PRESET_IDS.indexOf(current)
      return { ...cur, preset: PRESET_IDS[(index + 1) % PRESET_IDS.length] }
    })
  }, [])

  const resetOverrides = useCallback(() => {
    setSettingsState((cur) => ({ preset: normalizePreset(cur.preset) }))
  }, [])

  const randomize = useCallback(() => {
    setSettingsState((cur) => ({ preset: normalizePreset(cur.preset), overrides: createRandomThemeOverrides() }))
  }, [])

  const setOverride = useCallback((token: ThemeTokenName, rgbTriplet: string) => {
    if (!isRgbTriplet(rgbTriplet)) return
    setSettingsState((cur) => ({
      preset: normalizePreset(cur.preset),
      overrides: { ...(cur.overrides ?? {}), [token]: rgbTriplet.trim().replace(/\s+/g, ' ') }
    }))
  }, [])

  const clearOverride = useCallback((token: ThemeTokenName) => {
    setSettingsState((cur) => {
      const nextOverrides = { ...(cur.overrides ?? {}) }
      delete nextOverrides[token]
      return {
        preset: normalizePreset(cur.preset),
        overrides: Object.keys(nextOverrides).length ? nextOverrides : undefined
      }
    })
  }, [])

  const getToken = useCallback((token: ThemeTokenName) => getEffectiveThemeToken(settings, token), [settings])

  return [settings.preset, setPreset, toggle, { settings, setSettings, resetOverrides, randomize, setOverride, clearOverride, getToken }]
}

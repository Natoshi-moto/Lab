import { useEffect, useState } from 'react'
import { useWorkspace } from '../../context'
import { useSetFocus } from '../../focus/FocusContext'
import type { AppDesignBuild } from '../../types'
import { BuildHeader } from './BuildHeader'
import { ConstraintsPane } from './ConstraintsPane'
import { FeaturesPane } from './FeaturesPane'
import { ScreensPane } from './ScreensPane'
import { OverviewPane } from './OverviewPane'
import { DataShapesPane } from './DataShapesPane'
import { PhasesPane } from './PhasesPane'
import { ReviewsPane } from './ReviewsPane'
import { TagsBar } from '../../components/TagsBar'
import { LinksPanel } from '../../components/LinksPanel'
import { RelatedStrip } from '../../components/RelatedStrip'
import { SELECT_EVENT, type SelectIntent } from '../../util/navigate'

const BUILD_KEY = 'verse-studio:appdesign:lastBuild'
const TAB_KEY = 'verse-studio:appdesign:lastTab'

type Tab = 'overview' | 'constraints' | 'features' | 'screens' | 'data' | 'phases' | 'reviews'
const TABS: { id: Tab, label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'features', label: 'Features' },
  { id: 'screens', label: 'Screens' },
  { id: 'data', label: 'Data shapes' },
  { id: 'phases', label: 'Phases' },
  { id: 'reviews', label: 'Reviews' }
]

export function AppDesignStudio() {
  const ws = useWorkspace()
  const setFocus = useSetFocus()
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(() => {
    try { return localStorage.getItem(BUILD_KEY) } catch { return null }
  })
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const raw = localStorage.getItem(TAB_KEY)
      if (raw && TABS.some((t) => t.id === raw)) return raw as Tab
    } catch {}
    return 'overview'
  })

  // Drop a stale build selection.
  useEffect(() => {
    if (selectedBuildId && !ws.builds.find((b) => b.id === selectedBuildId)) {
      setSelectedBuildId(null)
    }
  }, [selectedBuildId, ws.builds])

  // Sweep 23: track activeRecord for Cmd+L.
  useEffect(() => {
    if (selectedBuildId && ws.builds.find((b) => b.id === selectedBuildId)) {
      ws.setActiveRecord({ id: selectedBuildId, type: 'build' })
      setFocus({ id: selectedBuildId, type: 'build', origin: 'app-design' })
    } else {
      ws.setActiveRecord(null)
      setFocus(null)
    }
    return () => {
      ws.setActiveRecord(null)
      setFocus(null)
    }
  }, [selectedBuildId, ws, setFocus])

  // Listen for "open this build" events from Shelf / Cmd+K.
  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<SelectIntent>).detail
      if (detail?.kind === 'build' && detail.id) {
        setSelectedBuildId(detail.id)
        setTab('overview')
      }
    }
    window.addEventListener(SELECT_EVENT, onSelect)
    return () => window.removeEventListener(SELECT_EVENT, onSelect)
  }, [])

  // Persist selections.
  useEffect(() => {
    try {
      if (selectedBuildId) localStorage.setItem(BUILD_KEY, selectedBuildId)
      else localStorage.removeItem(BUILD_KEY)
    } catch {}
  }, [selectedBuildId])
  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab) } catch {}
  }, [tab])

  const builds = [...ws.builds]
    .filter((b) => b.deletedAt === undefined)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const build = builds.find((b) => b.id === selectedBuildId) ?? null

  async function handleNewBuild() {
    const b = await ws.createBuild('Untitled Build')
    setSelectedBuildId(b.id)
    setTab('overview')
  }

  async function handleDeleteBuild() {
    if (!selectedBuildId) return
    const id = selectedBuildId
    setSelectedBuildId(null)
    await ws.softDeleteBuild(id)
  }

  return (
    <div className="h-full flex flex-col">
      <BuildSwitcher
        builds={builds}
        selectedId={selectedBuildId}
        onSelect={(id) => { setSelectedBuildId(id); setTab('overview') }}
        onNew={handleNewBuild}
      />
      {build ? (
        <div className="flex-1 flex flex-col min-h-0">
          <BuildHeader key={build.id} build={build} onDelete={handleDeleteBuild} />
          <TagsBar recordId={build.id} recordType="build" />
          <LinksPanel recordId={build.id} recordType="build" />
          <RelatedStrip recordId={build.id} recordType="build" />
          <TabNav tab={tab} onChange={setTab} />
          <div className="flex-1 overflow-auto">
            {tab === 'overview'    && <OverviewPane build={build} />}
            {tab === 'constraints' && <ConstraintsPane buildId={build.id} />}
            {tab === 'features'    && <FeaturesPane buildId={build.id} />}
            {tab === 'screens'     && <ScreensPane buildId={build.id} />}
            {tab === 'data'        && <DataShapesPane buildId={build.id} />}
            {tab === 'phases'      && <PhasesPane buildId={build.id} />}
            {tab === 'reviews'     && <ReviewsPane buildId={build.id} />}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-ink-faint text-sm">
          {builds.length === 0 ? 'Click + New build to start.' : 'Select a build.'}
        </div>
      )}
    </div>
  )
}

function BuildSwitcher({
  builds, selectedId, onSelect, onNew
}: {
  builds: AppDesignBuild[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="border-b border-line bg-surface-2 flex items-center gap-1 px-3 py-2 overflow-x-auto">
      {builds.map((b) => (
        <button
          key={b.id}
          onClick={() => onSelect(b.id)}
          className={`shrink-0 text-sm px-3 py-1 rounded transition-colors ${
            selectedId === b.id
              ? 'bg-surface text-ink border border-line'
              : 'text-ink-soft hover:text-ink hover:bg-surface'
          }`}
          data-test="build-pill"
          data-build-id={b.id}
        >
          {b.name || 'Untitled'}
        </button>
      ))}
      <button
        onClick={onNew}
        className="shrink-0 text-sm px-3 py-1 text-ink-soft hover:text-ink rounded hover:bg-surface"
        data-test="new-build"
      >
        + New build
      </button>
    </div>
  )
}

function TabNav({ tab, onChange }: { tab: Tab, onChange: (t: Tab) => void }) {
  return (
    <div className="border-b border-line bg-surface-2 px-4 flex gap-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`text-sm px-3 py-2 transition-colors border-b-2 -mb-px ${
            tab === t.id
              ? 'text-ink border-accent'
              : 'text-ink-soft hover:text-ink border-transparent'
          }`}
          data-test={`tab-${t.id}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

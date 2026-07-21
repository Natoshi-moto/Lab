// Retired Sweep 30 — tabs migrated to ScratchDrawer. File kept for git history.
import { useEffect, useState } from 'react'
import { useDocker, type DockerTab } from './DockerContext'
import { RecentlyDeleted } from './docker/RecentlyDeleted'
import { RecentItems }     from './docker/RecentItems'
import { Files }           from './docker/Files'
import { QuickAdd }        from './docker/QuickAdd'

/**
 * Docker chrome — four tabs anchored as a right-side inspector panel. The
 * active-tab state remains in DockerContext; the older expanded flag is kept
 * for API stability but the visual layer now treats any non-rail state as open.
 * Sweep 23 collapse persistence is preserved at `verse-studio:docker:collapsed`.
 */

interface TabDef {
  slug: DockerTab
  label: string
  /** 2-4 char rail icon for the collapsed state. */
  icon: string
}

const TABS: readonly TabDef[] = [
  { slug: 'recently-deleted', label: 'Recently Deleted', icon: 'RD'   },
  { slug: 'recent-items',     label: 'Recent Items',     icon: 'Rec'  },
  { slug: 'files',            label: 'Files',            icon: 'Fil'  },
  { slug: 'quick-add',        label: 'Quick Add',        icon: 'QA'   }
]

const COLLAPSED_KEY = 'verse-studio:docker:collapsed'

function DockerPanelContent({ active }: { active: DockerTab }) {
  return (
    <>
      {active === 'recently-deleted' && <RecentlyDeleted />}
      {active === 'recent-items'     && <RecentItems />}
      {active === 'files'            && <Files />}
      {active === 'quick-add'        && <QuickAdd />}
    </>
  )
}

export function Docker() {
  const docker = useDocker()
  const active = TABS.find((t) => t.slug === docker.activeTab) ?? TABS[0]

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? 'true' : 'false') } catch {}
  }, [collapsed])

  function openTab(slug: DockerTab) {
    docker.setActiveTab(slug)
    docker.setExpanded(true)
    setCollapsed(false)
  }

  if (collapsed) {
    return (
      <div
        data-test="docker"
        data-collapsed="true"
        data-expanded="false"
        className="w-8 h-full shrink-0 border-l border-line bg-surface-2 flex flex-col"
      >
        <div className="flex-1 min-h-0 flex flex-col items-center py-2 gap-0.5">
          {TABS.map((tab) => {
            const isActive = tab.slug === docker.activeTab
            return (
              <button
                key={tab.slug}
                onClick={() => openTab(tab.slug)}
                data-test={`docker-rail-icon-${tab.slug}`}
                data-docker-tab={tab.slug}
                data-active={isActive ? 'true' : 'false'}
                aria-pressed={isActive}
                title={tab.label}
                className={`w-8 h-8 flex items-center justify-center rounded-none text-[10px] leading-none transition-colors ${
                  isActive
                    ? 'bg-surface-3 text-ink'
                    : 'text-ink-faint hover:bg-surface-3 hover:text-ink'
                }`}
              >
                {tab.icon}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setCollapsed(false)}
          data-test="docker-collapse"
          aria-label="Expand Docker"
          title="Expand Docker"
          className="w-8 h-8 shrink-0 flex items-center justify-center text-xs text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
        >
          ▶
        </button>
      </div>
    )
  }

  return (
    <div
      data-test="docker"
      data-collapsed="false"
      data-expanded="true"
      className="w-72 h-full shrink-0 border-l border-line bg-surface-2 flex"
    >
      <div className="w-8 shrink-0 border-r border-line flex flex-col items-center py-2 gap-0.5">
        {TABS.map((tab) => {
          const isActive = tab.slug === docker.activeTab
          return (
            <button
              key={tab.slug}
              onClick={() => openTab(tab.slug)}
              data-test="docker-tab"
              data-docker-tab={tab.slug}
              data-active={isActive ? 'true' : 'false'}
              aria-pressed={isActive}
              title={tab.label}
              className={`w-8 h-8 flex items-center justify-center rounded-none text-[10px] leading-none transition-colors ${
                isActive
                  ? 'bg-surface-3 text-ink'
                  : 'text-ink-faint hover:bg-surface-3 hover:text-ink'
              }`}
            >
              {tab.icon}
            </button>
          )
        })}
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-8 shrink-0 border-b border-line px-3 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {active.label}
          </span>
          <button
            onClick={() => setCollapsed(true)}
            data-test="docker-collapse"
            aria-label="Collapse Docker to rail"
            title="Collapse Docker to rail"
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded text-xs text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
          >
            ◀
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-auto"
          data-test="docker-panel"
          data-docker-panel-tab={active.slug}
        >
          <DockerPanelContent active={docker.activeTab} />
        </div>
      </div>
    </div>
  )
}

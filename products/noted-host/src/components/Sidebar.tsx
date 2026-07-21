// Sweep 23 — collapsible sidebar with two new routes (Inbox, Atlas).
//
// Two render shapes — expanded (148px) and rail-collapsed (48px). The
// root <aside> stays mounted in both shapes; the cumulative-verify
// primary navigation follows the locked Noted Phase 0.1 order; legacy routes stay deep-linkable.

import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { InboxBadge } from './InboxBadge'
import { useTheme } from '../theme'
import { FocusToggleButton } from './FocusMode'
import { AppMark } from './AppMark'
import { APP_NAME, APP_TAGLINE } from '../appMeta'
import { useDevMode } from '../useDevMode'

const STORAGE_KEY = 'verse-studio:sidebar:collapsed'

const linkBase =
  'n-sidebar-link block rounded-lg px-2 py-1.5 text-xs transition-colors duration-150'
const linkInactive =
  'text-ink-soft hover:bg-surface-3/70 hover:text-ink'
const linkActive =
  'n-sidebar-active text-ink'

interface RouteSpec {
  to: string
  label: string
  icon: string  // 1-3 char text icon for rail mode
  // Sweep 60 — when true, the entry is hidden from the sidebar by default.
  // The route remains URL-reachable; only the menu surface honors this flag.
  // useDevMode() can re-expose all hidden entries at once.
  defaultHidden?: boolean
}

const ROUTES_MAKE: RouteSpec[] = [
  // Sweep 60 — Canvas leads the menu and is the default landing route.
  { to: '/nexus-router', label: 'Nexus Router', icon: 'Nx' },
  { to: '/canvas',     label: 'Canvas',     icon: 'C', defaultHidden: true },
  { to: '/projects',   label: 'Projects',   icon: 'Pj'  },
  { to: '/inbox',      label: 'Inbox',      icon: 'In', defaultHidden: true },
  { to: '/writing',    label: 'Writing',    icon: 'W'   },
  { to: '/notes',      label: 'Notes',      icon: 'N'   },
  { to: '/longform',   label: 'Longform',   icon: 'LF', defaultHidden: true },
  { to: '/app-design', label: 'App Design', icon: 'AD', defaultHidden: true },
  { to: '/prompts',    label: 'Prompts',    icon: 'Pr'  },
  { to: '/nexus-agent', label: 'Nexus Agent', icon: 'NA', defaultHidden: true },
  { to: '/prompt-studio-v3', label: 'Prompt Studio v3', icon: 'PS', defaultHidden: true }
]

const ROUTES_KEEP: RouteSpec[] = [
  { to: '/library', label: 'Library', icon: 'Lib', defaultHidden: true },
  { to: '/shelf',   label: 'Stash',   icon: 'Sh'  }
]

const ROUTES_SYSTEM: RouteSpec[] = [
  { to: '/diagnostics', label: 'Diagnostics', icon: 'Dx', defaultHidden: true },
  { to: '/settings', label: 'Settings', icon: 'Set' }
]

// Sweep 27: derive a `sidebar-link-{slug}` data-test attribute from the
// route path. Mandated by the prompt for sidebar-link-notes; applied
// uniformly so tests don't have to special-case which entries have the
// attribute. Slug is just the path with the leading slash stripped.
function sidebarLinkTest(to: string): string {
  return 'sidebar-link-' + to.replace(/^\//, '')
}

function Item({ to, label }: { to: string, label: string }) {
  const isInbox = to === '/inbox'
  if (to === '/scraps') {
    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `${linkBase} ${isActive ? linkActive : linkInactive} flex items-center justify-between gap-2`
        }
        data-test="sidebar-link-scraps"
      >
        <span className="truncate">{label}</span>
      </NavLink>
    )
  }
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? linkActive : linkInactive} flex items-center justify-between gap-2`
      }
      data-test={sidebarLinkTest(to)}
    >
      <span className="truncate">{label}</span>
      {isInbox && <InboxBadge />}
    </NavLink>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pt-3 pb-1 text-[9px] uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </div>
  )
}

function RailItem({ to, label, icon }: RouteSpec) {
  const isInbox = to === '/inbox'
  if (to === '/scraps') {
    return (
      <NavLink
        to={to}
        title={label}
        className={({ isActive }) =>
          `relative w-9 h-9 mx-auto flex items-center justify-center rounded text-[11px] font-medium tracking-wide transition-colors ${
            isActive ? 'n-sidebar-active text-ink' : 'text-ink-soft hover:bg-surface-3 hover:text-ink'
          }`
        }
        data-test="sidebar-link-scraps"
      >
        {icon}
      </NavLink>
    )
  }
  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        `relative w-9 h-9 mx-auto flex items-center justify-center rounded text-[11px] font-medium tracking-wide transition-colors ${
          isActive ? 'n-sidebar-active text-ink' : 'text-ink-soft hover:bg-surface-3 hover:text-ink'
        }`
      }
      data-test={sidebarLinkTest(to)}
    >
      {icon}
      {isInbox && <InboxBadge compact />}
    </NavLink>
  )
}


function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const [theme, , toggleTheme] = useTheme()
  const cycleLabel = theme === 'matrix' ? 'Paper' : theme === 'paper' ? 'Midnight' : 'Matrix'

  if (collapsed) {
    return (
      <div className="shrink-0 border-t border-line/80 py-2 space-y-1 bg-surface/35">
        <button
          onClick={toggleTheme}
          className="relative w-9 h-9 mx-auto flex items-center justify-center rounded text-[11px] font-medium tracking-wide text-ink-soft hover:bg-surface-3 hover:text-ink transition-colors"
          data-test="sidebar-theme-toggle"
          title={`Switch to ${cycleLabel} theme`}
          aria-label={`Switch to ${cycleLabel} theme`}
        >
          {theme === 'matrix' ? 'Pa' : theme === 'paper' ? 'Mi' : 'Mx'}
        </button>
        <FocusToggleButton compact />
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-line/80 p-2 flex items-center gap-2 bg-surface/35">
      <button
        onClick={toggleTheme}
        className="text-[11px] text-ink-soft hover:text-ink rounded px-2 py-1.5 hover:bg-surface-3 border border-line shrink-0"
        data-test="sidebar-theme-toggle"
        title={`Switch to ${cycleLabel} theme`}
      >
        {cycleLabel}
      </button>
      <FocusToggleButton />
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'true' } catch { return false }
  })
  const { devMode } = useDevMode()

  // Sweep 60 — hide `defaultHidden` entries unless dev mode is on.
  // Diagnostics is a DEV navigation surface; its direct route remains available in
  // production with an always-visible research/non-claims banner.
  const visibleMake = ROUTES_MAKE.filter((r) => !r.defaultHidden || devMode)
  const visibleKeep = ROUTES_KEEP.filter((r) => !r.defaultHidden || devMode)
  const visibleSystem = ROUTES_SYSTEM.filter((r) => !r.defaultHidden || import.meta.env.DEV)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false') } catch {}
  }, [collapsed])

  if (collapsed) {
    return (
      <aside
        className="w-12 shrink-0 border-r border-line n-sidebar-surface flex flex-col"
        data-test="sidebar"
        data-collapsed="true"
        data-focus-hide="sidebar"
      >
        <div className="border-b border-line py-2 flex flex-col items-center gap-1">
          <AppMark compact />
          <button
            onClick={() => setCollapsed(false)}
            className="w-8 h-7 flex items-center justify-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors"
            data-test="sidebar-collapse"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {visibleMake.map((r) => <RailItem key={r.to} {...r} />)}
          <div className="border-t border-line my-2" />
          {visibleKeep.map((r) => <RailItem key={r.to} {...r} />)}
          <div className="border-t border-line my-2" />
          {visibleSystem.map((r) => <RailItem key={r.to} {...r} />)}
        </nav>
        <SidebarFooter collapsed />
      </aside>
    )
  }

  return (
    <aside
      className="w-[148px] shrink-0 border-r border-line n-sidebar-surface flex flex-col"
      data-test="sidebar"
      data-collapsed="false"
      data-focus-hide="sidebar"
    >
      <div className="px-2 py-3 border-b border-line/80 flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex items-start gap-1.5">
          <AppMark />
          <div className="min-w-0 pt-0.5">
            <div className="text-sm font-semibold tracking-tight text-ink truncate">{APP_NAME}</div>
            {APP_TAGLINE ? <div className="text-[10px] leading-snug text-ink-faint mt-1 line-clamp-2">{APP_TAGLINE}</div> : null}
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-ink-faint hover:text-ink hover:bg-surface-3 transition-colors shrink-0 mt-0.5"
          data-test="sidebar-collapse"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <GroupLabel>Make</GroupLabel>
        <div className="px-2 space-y-0.5">
          {visibleMake.map((r) => <Item key={r.to} to={r.to} label={r.label} />)}
        </div>

        <GroupLabel>Keep</GroupLabel>
        <div className="px-2 space-y-0.5">
          {visibleKeep.map((r) => <Item key={r.to} to={r.to} label={r.label} />)}
        </div>

        <GroupLabel>System</GroupLabel>
        <div className="px-2 space-y-0.5">
          {visibleSystem.map((r) => <Item key={r.to} to={r.to} label={r.label} />)}
        </div>
      </nav>
      <SidebarFooter collapsed={false} />
    </aside>
  )
}

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { WorkspaceProvider, useWorkspace } from './context'
import { FocusModeProvider, useFocusMode } from './components/FocusMode'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { ScratchDrawer } from './components/ScratchDrawer'
import { SignalConsole } from './components/SignalConsole'
import { FocusHoverMenu } from './components/FocusHoverMenu'
import { ErrorScreen, LoadingScreen } from './components/ErrorScreen'
import { CommandPalette } from './components/CommandPalette'
import { NotificationToast } from './components/NotificationToast'
import { NexusPanel } from './components/NexusPanel'
import { WritingStudio } from './studios/writing/WritingStudio'
import { PoetryStudio } from './studios/poetry/PoetryStudio'
import { NotesStudio } from './studios/notes/NotesStudio'  // Sweep 27
import { LongformStudio } from './studios/longform/LongformStudio'
import { AppDesignStudio } from './studios/appdesign/AppDesignStudio'
import { Projects } from './studios/projects/Projects'
import { ScrapsStudio } from './studios/scraps/ScrapsStudio'
import { PromptStudio } from './studios/prompts/PromptStudio'
import { Canvas } from './studios/canvas/Canvas'
import { Atlas } from './studios/atlas/Atlas'
import { Library } from './studios/library/Library'
import { Shelf } from './studios/shelf/Shelf'
import { Settings } from './studios/settings/Settings'
import { Inbox } from './studios/inbox/Inbox'
import { NexusAgentStudio } from './studios/nexusAgent/NexusAgentStudio'
import { PromptStudioV3 } from './studios/promptStudioV3/PromptStudioV3'
import { NexusRouterStudio } from './studios/nexusRouter/NexusRouterStudio'
import { DiagnosticsStudio } from './studios/diagnostics/DiagnosticsStudio'
import { DB_NAME } from './db'
import { APP_NAME } from './appMeta'
import { FocusProvider } from './focus/FocusContext'
import { maybeSeedCanonicalCanvas, maybeDefaultCanvasToNexus } from './firstRunCanvas'



const COPIED_HISTORY_LIMIT = 200
const COPIED_TEXT_LIMIT = 500

function ClipboardCapture() {
  const ws = useWorkspace()
  const clipboardRef = useRef(ws.dockerClipboard)

  useEffect(() => {
    clipboardRef.current = ws.dockerClipboard
  }, [ws.dockerClipboard])

  useEffect(() => {
    function selectedTextFromCopyEvent(e: ClipboardEvent): string {
      const selectionText = document.getSelection()?.toString() ?? ''
      if (selectionText.trim()) return selectionText
      return e.clipboardData?.getData('text/plain') ?? ''
    }

    function handleCopy(e: ClipboardEvent) {
      const text = selectedTextFromCopyEvent(e).trim()
      if (!text) return

      const truncated = text.slice(0, COPIED_TEXT_LIMIT)
      const entries = [...clipboardRef.current].sort((a, b) => b.capturedAt - a.capturedAt)
      if (entries[0]?.text === truncated) return

      void (async () => {
        const created = await ws.captureClipboard({ text: truncated, sourceLabel: 'copied' })
        const nextEntries = [created, ...entries.filter((entry) => entry.id !== created.id)]
          .sort((a, b) => b.capturedAt - a.capturedAt)
        for (const overflow of nextEntries.slice(COPIED_HISTORY_LIMIT)) {
          await ws.removeClipboard(overflow.id)
        }
      })()
    }

    document.addEventListener('copy', handleCopy, { capture: true })
    return () => document.removeEventListener('copy', handleCopy, true)
  }, [ws.captureClipboard, ws.removeClipboard])

  return null
}

function BootstrapBlockedScreen() {
  return (
    <div className="h-full flex items-center justify-center p-8" data-test="bootstrap-blocked-screen">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface p-6 text-center shadow">
        <div className="text-sm uppercase tracking-widest text-ink-faint mb-3">{APP_NAME}</div>
        <h1 className="text-xl text-ink mb-3">Another tab has this app open.</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-5">
          Close all other tabs running {APP_NAME}, then reload this page.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded border border-line bg-surface-2 text-ink hover:bg-surface-3 transition-colors"
          data-test="bootstrap-reload"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </div>
  )
}

function BootstrapErrorScreen({ message }: { message: string | null }) {
  const [confirming, setConfirming] = useState(false)

  async function resetWorkspaceDatabase() {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME)
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
    window.location.reload()
  }

  return (
    <div className="h-full flex items-center justify-center p-8" data-test="bootstrap-error-screen">
      <div className="max-w-md w-full rounded-2xl border border-line bg-surface p-6 text-center shadow">
        <div className="text-sm uppercase tracking-widest text-ink-faint mb-3">{APP_NAME}</div>
        <h1 className="text-xl text-ink mb-3">The workspace could not be loaded.</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-5">
          This is usually caused by a database version conflict after an app update.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded border border-line bg-surface-2 text-ink hover:bg-surface-3 transition-colors"
            data-test="bootstrap-reload"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <div className="text-xs text-ink-faint">If reloading does not help:</div>
          <button
            type="button"
            className="px-4 py-2 rounded border border-line text-bad hover:bg-surface-2 transition-colors"
            data-test="bootstrap-reset"
            onClick={() => setConfirming(true)}
          >
            Reset workspace database
          </button>
        </div>
        <p className="mt-5 text-xs text-ink-faint leading-relaxed">
          ⚠ Reset clears all local data. Export your data first if possible.
        </p>
        {confirming && (
          <div className="mt-5 rounded border border-line bg-surface-2 p-3 text-left">
            <p className="text-sm text-ink-soft mb-3">
              This will permanently delete all local workspace data. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border border-line text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded border border-line text-bad hover:bg-surface-3 transition-colors"
                data-test="bootstrap-reset-confirm"
                onClick={resetWorkspaceDatabase}
              >
                Confirm reset
              </button>
            </div>
          </div>
        )}
        {message && (
          <details className="text-left text-xs text-ink-faint mt-6">
            <summary className="cursor-pointer">Technical detail</summary>
            <pre className="mt-2 p-3 bg-surface-2 rounded border border-line whitespace-pre-wrap break-words">{message}</pre>
          </details>
        )}
      </div>
    </div>
  )
}

function Shell() {
  const ws = useWorkspace()
  const { focus } = useFocusMode()
  const [signalConsoleOpen, setSignalConsoleOpen] = useState(false)
  const location = useLocation()
  // Sweep 59-R — top-level route segment is the natural dissolve unit
  // (e.g. /writing/abc and /writing/xyz should not re-animate the shell).
  const routeKey = '/' + (location.pathname.split('/').filter(Boolean)[0] ?? '')

  useEffect(() => {
    function handleSignalConsoleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
        e.preventDefault()
        setSignalConsoleOpen(open => !open)
      }
    }

    document.addEventListener('keydown', handleSignalConsoleShortcut)
    return () => document.removeEventListener('keydown', handleSignalConsoleShortcut)
  }, [])

  // Sweep 60 — first-run canonical canvas seed. Idempotent + empty-workspace
  // gated inside the module; we only need to fire it once per session,
  // after the workspace finishes hydrating. Failures are logged but never
  // block first paint or surface a user error.
  useEffect(() => {
    if (!ws.ready) return
    maybeSeedCanonicalCanvas(ws)
      .then(() => {
        // Sweep 61 — after the seed settles (or bails on an existing
        // workspace), repoint the Canvas default from the seed-written
        // Meridian project to the canonical Nexus project, once. Self-guarded
        // and non-clobbering; see maybeDefaultCanvasToNexus.
        maybeDefaultCanvasToNexus(ws)
      })
      .catch((err) => {
        console.error('[firstRunCanvas] seed failed:', err)
      })
    // ws.ready is the gating signal; the function itself reads whatever ws
    // arrays it needs at invocation time. We do not re-fire on ws mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.ready])
  if (ws.bootstrapStatus === 'loading') return <LoadingScreen />
  if (ws.bootstrapStatus === 'blocked') return <BootstrapBlockedScreen />
  if (ws.bootstrapStatus === 'error') return <BootstrapErrorScreen message={ws.bootstrapError} />
  if (ws.error) return <ErrorScreen message={ws.error} />
  if (!ws.ready) return <LoadingScreen />

  return (
    <div
      className="h-full flex n-noted-shell"
      data-test={focus ? 'focus-mode-active' : 'shell'}
      data-test-shell="true"
      data-focus={focus ? 'true' : 'false'}
      data-focus-mode={focus ? 'true' : 'false'}
      data-test-focus-mode-active={focus ? 'true' : 'false'}
    >
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div key={routeKey} className="n-route-transition h-full">
                <Routes>
                  <Route path="/" element={<Navigate to="/nexus-router" replace />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/writing/*" element={<WritingStudio />} />
                  <Route path="/notes/*" element={<NotesStudio />} />
                  <Route path="/poetry/*" element={<PoetryStudio />} />
                  <Route path="/longform/*" element={<LongformStudio />} />
                  <Route path="/app-design/*" element={<AppDesignStudio />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/prompts" element={<PromptStudio />} />
                  <Route path="/canvas" element={<Canvas />} />
                  <Route path="/nexus-router" element={<NexusRouterStudio />} />
                  <Route path="/diagnostics" element={<DiagnosticsStudio />} />
                  <Route path="/ods" element={<Navigate to="/diagnostics" replace />} />
                  <Route path="/nexus-agent" element={<NexusAgentStudio />} />
                  <Route path="/prompt-studio-v3" element={<PromptStudioV3 />} />
                  <Route path="/atlas" element={<Atlas />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/shelf/*" element={<Shelf />} />
                  <Route path="/scraps" element={<ScrapsStudio />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/canvas" replace />} />
                </Routes>
              </div>
            </main>
            <ScratchDrawer />
            <FocusHoverMenu />
          </div>
        </div>
        <NexusPanel />
      </div>
      <CommandPalette />
      <NotificationToast />
      <ClipboardCapture />
      {createPortal(<SignalConsole open={signalConsoleOpen} />, document.body)}
    </div>
  )
}

export default function App() {
  return (
    <WorkspaceProvider>
      <FocusProvider>
        <FocusModeProvider>
          <Shell />
        </FocusModeProvider>
      </FocusProvider>
    </WorkspaceProvider>
  )
}

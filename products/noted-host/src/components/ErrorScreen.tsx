import { APP_NAME } from '../appMeta'
import { AppMark } from './AppMark'
export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center n-private-glass border border-line rounded-2xl p-6">
        <div className="text-sm uppercase tracking-widest text-ink-faint mb-3">
          Storage unavailable
        </div>
        <h1 className="text-xl text-ink mb-3">{APP_NAME} can't open its database.</h1>
        <p className="text-ink-soft text-sm leading-relaxed mb-4">
          IndexedDB is required to save your work. This usually means the browser
          is in private mode, or storage permission is denied for this file.
        </p>
        <p className="text-ink-soft text-sm leading-relaxed mb-4">
          Please open this file in a normal Chrome window and allow site data,
          then reload.
        </p>
        <details className="text-left text-xs text-ink-faint mt-6">
          <summary className="cursor-pointer">Technical detail</summary>
          <pre className="mt-2 p-3 bg-surface-2 rounded border border-line whitespace-pre-wrap break-words">{message}</pre>
        </details>
      </div>
    </div>
  )
}

export function LoadingScreen() {
  return (
    <div className="h-full flex items-center justify-center p-8 n-noted-shell">
      <div className="n-private-glass border border-line rounded-2xl px-7 py-6 text-center n-soft-motion">
        <div className="flex justify-center mb-4"><AppMark showVersion={false} /></div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint mb-2">Private workspace</div>
        <div className="text-sm text-ink-soft">Loading your local knowledge foundry…</div>
      </div>
    </div>
  )
}

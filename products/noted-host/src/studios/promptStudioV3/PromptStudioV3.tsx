const PROMPT_STUDIO_V3_SRC = './nexus/prompt-studio-v3.html'

export function PromptStudioV3(): JSX.Element {
  function openStandalone() {
    window.open(PROMPT_STUDIO_V3_SRC, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="h-full min-h-0 flex flex-col bg-bg" data-test="prompt-studio-v3">
      <header className="shrink-0 border-b border-line bg-surface/80 px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink-faint">Embedded app</div>
          <h1 className="text-sm font-semibold text-ink mt-0.5">NEXUS Prompt Studio v3</h1>
          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed">
            Prompt forge, live analyzer, history, API runner, adversarial review, and CPL transformer mounted inside Noted.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={PROMPT_STUDIO_V3_SRC}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-line px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Open tab
          </a>
          <button
            type="button"
            onClick={openStandalone}
            className="rounded border border-line bg-surface-2 px-3 py-1.5 text-[11px] text-ink-soft hover:text-ink hover:bg-surface-3 transition-colors"
          >
            Pop out
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 bg-black">
        <iframe
          title="NEXUS Prompt Studio v3"
          src={PROMPT_STUDIO_V3_SRC}
          className="block h-full w-full border-0 bg-black"
          data-test="prompt-studio-v3-iframe"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads allow-same-origin"
        />
      </div>
    </section>
  )
}

# TOOLS

The `tools/` folder holds Node CLI utilities that operate on the codebase
without modifying it. They complement the test harness in `tests/`: tests
verify behavior; tools surface state.

Same constraints as the rest of the codebase. **No npm dependencies. No
build step.** Standard library only. They run from the archive root with
`node tools/<name>.js`.

---

## `tools/block-inspect.js` — single-file block analyzer

Point at any block `.html` and get back its contract: declared manifest
(emits / consumes / undoable), app metadata, statically-detected emit and
subscribe call sites, drift between manifest and call sites, classification
(client-backed / hand-rolled / kernel-host), size, and external `<script src>`
imports.

Companion to `tests/block-contract-tests.js`. The contract tests scan the
whole tree on every test run; this is the surface for the moment when you're
holding **one** block in your head and want a verdict in 200ms.

```bash
node tools/block-inspect.js blocks/apps/app-notepad.html
node tools/block-inspect.js blocks/apps/app-notepad.html --json
node tools/block-inspect.js blocks/apps/app-notepad.html --diff blocks/apps/app-files.html
```

The `--diff` mode side-by-sides two blocks' manifests — useful when migrating
a block onto the shared client and you want to confirm the new manifest is
contract-compatible with the old one.

Drift signals are informational, not failures:

- **emits used but not declared** — the block calls `nx.emit('foo', …)` but
  `manifest.emits` doesn't list `'foo'`. Almost always a bug — kernel will
  reject the emit at runtime. (Same finding as `block-contract-tests.js`
  Rule C, surfaced per-file.)
- **subscribes/handles on channels not in `manifest.consumes`** — the block
  calls `nx.subscribe('bar', …)` without declaring `'bar'` in consumes. The
  client throws on this, so it's a runtime crash if hit.
- **emits declared but no static call site** — the manifest declares
  `'baz'` but no `nx.emit('baz', …)` is found. May be dynamic (channel
  computed from a variable) or vestigial.
- **undoable not in emits** — `manifest.undoable` lists a channel not in
  `emits`. The shared client throws on this at boot.

Static analysis only. Channels constructed dynamically (computed strings)
are invisible.

---

## `tools/channel-atlas.js` — auto-generated channel registry

Walks `blocks/`, extracts every block's manifest, aggregates into a global
registry by channel, writes `docs/CHANNEL_ATLAS.md` showing for each channel
which blocks emit it, which consume it, and which hold it undoable.

```bash
node tools/channel-atlas.js              # write docs/CHANNEL_ATLAS.md
node tools/channel-atlas.js --stdout     # print the markdown to stdout
node tools/channel-atlas.js --json       # machine-readable registry
node tools/channel-atlas.js --check      # exit 1 if file is out of date
```

`--check` is wired into `tests/tools-tests.js` so the test harness fails
when someone adds a manifest channel without regenerating the atlas. That's
a feature: the doc is canonical, not aspirational.

The atlas surfaces the system's IPC topology at a glance. Connected channels
(emitter + consumer present) come first; orphans (one side only) come last
under "Unmatched" — those are either kernel-handled (`nexus.launch`), not
yet wired, or a sign of drift.

---

## `tools/spec-audit.js` — spec-vs-codebase drift detector

Given a markdown spec and a codebase root, reports every file path the spec
references that doesn't exist on disk, and every LANDMINE number it cites
that's higher than `docs/LANDMINES.md` actually contains.

```bash
node tools/spec-audit.js path/to/spec.md
node tools/spec-audit.js path/to/spec.md --root <codebase-root>
node tools/spec-audit.js path/to/spec.md --json
```

Built because of the Lattice Studio spec audit: a 19-section spec referenced
files (`engines/lattice-runtime.js`, `compose-stage.html`, `game-compositor.html`),
docs (`AI_EXPERIMENTAL_EXPANSION.md`), and landmines (#24, #25, #26) that
didn't exist in the canonical archive. Some were planned-future, some were
drift from prior conversation context, some were AI hallucination. Catching
this manually took close reading of the whole spec. The tool catches it in
one pass.

The output distinguishes "missing path the spec wants to add" from "missing
path the spec assumes exists" implicitly — both show up as missing. The
human reading the report decides which is which. The tool's job is to put
them on the table.

False positives are possible (a path quoted as a counterexample, a path the
spec spelled differently than the canonical archive). False negatives are
possible (paths constructed dynamically in code blocks, symbols not
referenced as paths). It's a candidate-surfacer, not a proof.

---

## Why these belong in `tools/` and not `tests/`

`tests/` exists to verify behavior — pass / fail, regression detection.
`tools/` exists to surface state — generate docs, inspect artifacts, audit
specs. The split mirrors the existing engines/ vs blocks/ split: engines
do the work, blocks display it. Same shape, different layer.

Tests in `tests/tools-tests.js` verify the tools themselves work. They run
under `bash tests/run.sh` like every other test file, so a tool regression
shows up in the same dashboard as an engine regression.

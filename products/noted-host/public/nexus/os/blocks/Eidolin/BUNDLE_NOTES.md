# Bundle notes

Packaged on: 2026-05-10
Project: nexus-lattice
Version: 0.2.0-gold

## Verification performed

The following command was run before packaging:

```bash
npm run verify
```

Result: passed.

Checks covered:

- TypeScript typecheck
- TypeScript build
- deterministic smoke test
- seam audit

Smoke anchors observed:

- Starter: `Mororo of the Mossbed`
- Manifestation slot: `manifest:v1:Glassfen-91:Neo:surface:6`
- Wild: `Fenvirellis of the Pale Vapor`
- Offspring: `Lueessvi under the Root Arch`
- Proof hash: `b7f72b1d`

## Run commands

```bash
npm install
npm run verify
python3 -m http.server 5173
```

Then open `http://localhost:5173/`.

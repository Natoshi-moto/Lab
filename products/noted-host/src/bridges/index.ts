export * from './nexusActionBroker'
export * from './nexusActionTypes'
export * from './nexusBridgeRegistry'
export * from './nexusBridgeTypes'
export * from './nexusHostBridge'
export * from './nexusNostrBridgeStub'
export * from './nexusPromptImportStub'
export * from './nexusUiPatchStub'
export * from './nostrBridgeTypes'

// ─── FILE FOOTER ─────────────────────────────────────────────
// SCOPE: Exposes bridge types and stubs from a single import surface for future blocks.
// LOAD-BEARING: src/bridges public barrel.
// DECISIONS:
//   - Keeps future imports stable as bridge modules grow.
//   - Includes stub modules deliberately so unresolved seams are visible in code.
//   - Avoids hiding bridge boundaries behind Noted studio components.
// OPEN: Split host-only and shared exports if browser block bundles need a smaller surface.
// VERIFY: npm run typecheck
// LAST-EDIT: GPT-5.5 Thinking · 2026-06-28 · added bridge barrel.
// ─────────────────────────────────────────────────────────────

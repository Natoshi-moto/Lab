# Noted — Beginner Guide

Noted is a private knowledge foundry: a local-first creative workspace for collecting ideas, writing, organizing projects, shaping prompts, and using a canvas to see relationships between pieces of work.

Tagline: **Private by default. Relational by design. Portable by right.**

This is early v0.01 software. It is useful for inspection and experimentation, but it is not a polished public release. Back up important work before relying on it.

## What “local-first” means here

For normal local use, Noted is designed to run on your machine. The current app does not require an account, hosted server, cloud sync, or telemetry service. Your workspace data is stored in browser/Electron local storage mechanisms on your device.

Local-first does not mean indestructible. Browser storage, Electron profiles, and generated files can still be deleted or corrupted. Export diagnostics/backups before risky changes.

## Running it locally

A technical helper can run:

```bash
npm ci
npm run dev
```

Then open the local development URL printed by Vite.

For checks, use:

```bash
npm run typecheck
npm run build
```

## Using the single-file HTML

Delivery bundles include generated single-file HTML artifacts such as `noted-v0.01.html` and `verse-studio.html`.

Those files are useful for quick inspection and portable local testing. Open them in a browser that allows the required local storage behavior. If a browser blocks storage for local files, use the development server path instead.


## AI Brief Export

In Prompt Studio, **Export AI brief** downloads a local JSON snapshot of your Noted graph for AI review. It does not send anything to the internet and it does not change your workspace. The downloaded JSON can still contain private titles and snippets, so only share it deliberately.



## Nexus Panel

The Nexus Panel is the right-side relational context panel. It is open by default so connections, tags, snapshots, and lineage are visible while you work. You can collapse it and Noted will remember your choice locally.

## Backups and diagnostics

Noted includes diagnostic/export surfaces in the app. Use those before major experiments or before reporting runtime evidence. A diagnostic bundle helps maintainers distinguish verified behavior from assumptions.


## Schema status

Current internal database/schema constants are `DB_VERSION = 11` and `SCHEMA_VERSION = 10` after Sweep 57. This is a local data-model alignment, not a public release or license decision. Older workspace exports up to schema 10 remain accepted by import.

## Practical safety notes

- Do not put irreplaceable work into early software without backups.
- Keep generated backups somewhere outside the app profile.
- If something looks wrong after an update, stop and export diagnostics before trying broad resets.
- Runtime UI verification for the latest UX changes may still be pending unless a later report says otherwise.

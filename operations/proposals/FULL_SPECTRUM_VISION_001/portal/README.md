# Mithub gateway v0

**Status:** `EXPERIMENT / STATUS_AUTHORITY: NONE`

This is the first runnable Mithub route: a dependency-free browser application that turns a raw thought into a separately labelled experiment seed while teaching the Full Spectrum method in the same interaction.

## Run locally

```bash
cd operations/proposals/FULL_SPECTRUM_VISION_001/portal
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`.

## What it does

- Keeps raw drafts in browser `localStorage`.
- Preserves the original thought separately from a structured interpretation.
- Offers `grow`, `attack`, `test`, and `just hold it` modes.
- Exports a machine-readable `mithub.experiment-seed/v0` JSON file.
- Stops at the canonical boundary and exports a separate proposal request.
- Embeds Full Spectrum University as a learn-by-doing path.
- Makes experimental/noncanonical status persistent and unmistakable.

## What it does not do

- No server, accounts, uploads, GitHub API, agent model, public posting or moderation backend.
- No ability to commit, push, merge, deploy, alter `main`, or clear repository reds.
- No claim that a fork or research purpose overrides licences or other rights.

The portal is a disposable route. Git records, LOOM records and repository policy outrank it.

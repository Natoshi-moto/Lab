# R001 architecture

```text
human / ChatGPT / Claude / local tools
                 |
             task object
                 |
       route compiler + manifest
                 |
      bounded inspection / return
                 |
      validation + proposal space
                 |
       human-authorized acceptance
                 |
  Git commit / tag / deterministic snapshot
                 |
      read-only audit observation overlay
```

## Authority stores

- Git history and repository files are durable authority.
- Generated ZIPs, route bundles and reports are transport artifacts bound by hashes.
- Caches under `derived/` are rebuildable and ignored.
- Local-only payloads remain outside Git; committed manifests may refer to them.

## One corpus, many lenses

Corpus records have one identity and one durable location. `domains/` and `programmes/` contain references. This allows work to cross fields without copy divergence.

## Current interface

R001 exposes the repository through `./nexus` and GitHub. A later web application can use the same objects and operations; it must not become a second authority database.

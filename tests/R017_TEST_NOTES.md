# R017 test notes

Baseline: `6ad3b470d190eafdde97143c7df0c8334a754764`  
Environment date: `2026-07-15`  
Status authority: `NONE`

Commands executed:

```bash
npm ci --ignore-scripts
python3 -m unittest -v tests.test_r017_replication
python3 -m unittest discover -s tests -v
./nexus doctor
./nexus verify
```

Observed results:

- Pinned `@noble/ed25519` 3.1.0 installed from the existing lockfile.
- R017 focused suite: 7 tests passed.
- Full repository suite: 192 tests passed.
- Doctor: pass with the expected dirty-worktree warning.
- Nexus verification: pass.
- Campaign report ID:
  `b67d6e09d422ec896298b01e850177bf910a787c807b66c174b2e86e485fcd1d`.

The run is bounded synthetic evidence. It does not establish consensus, fork
choice, global finality, Byzantine fault tolerance, physical host independence,
operational custody, economic value, or production security.

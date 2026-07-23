# bus message

```yaml
kind: DONE
seat: grok
utc: 2026-07-22
tip: 5b8aa8a
action_id: ram-bootstrap
paths:
  - RAM/
locks: []
next: other seats read RAM/PROTOCOL.md before multi-seat writes
do_not:
  - skip BOARD update after actions
  - stomp locks without STOLE_STALE_LOCK note
```

## Human

Bootstrapped root `RAM/` so multi-model desks can coordinate between actions and recover after operator-side chaos (recording saves, multi-terminal, etc.). Net-zero trust; not STATUS.

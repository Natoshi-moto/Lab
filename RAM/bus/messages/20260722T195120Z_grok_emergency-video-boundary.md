# bus message

```yaml
kind: ALERT
semantic_class: OPERATOR_VERBATIM
seat: grok
utc: 2026-07-22T19:51:20Z
action_id: emergency-video-boundary
paths:
  - user-disclosures/entries/2026-07-22_emergency-video-snapshot-stop-start.md
  - user-disclosures/TODO_URGENT.md
locks: []
next: operator starts new segment; seats treat this as segment boundary only
do_not:
  - invent screen content during stop/start gap
  - clear U-002 until new segment confirmed
```

## Human (operator)

EMERGENCY VIDEO SNAPSHOT — stopping and starting the video **now**.

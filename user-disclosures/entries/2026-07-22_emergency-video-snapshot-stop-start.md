# User disclosure — EMERGENCY video snapshot stop/start

**ID:** `USER-DISC-2026-07-22-emergency-video-snapshot-stop-start`  
**Date (UTC):** 2026-07-22T19:51:20Z (approx log time)  
**Source medium:** `chat` (operator emergency during live screen-record)  
**Recording segment:** **STOPPING current segment NOW → saving snapshot → STARTING new segment immediately**  
**status_authority:** `NONE`  
**Filed by:** human operator (ring-0)  
**Logged by seat:** Grok — verbatim intent preserved  

---

## Verbatim (operator)

> GROK I'M DOING AN EMERGENCY VIDEO SNAPSHOT PLEASE LOG IT THAT I'M STOPPING AND STARTING THE VIDEO NOW

---

## Machine log (seat)

```text
EVENT: EMERGENCY_VIDEO_SEGMENT_BOUNDARY
KIND: STOP_THEN_START
UTC_LOGGED: 2026-07-22T19:51:20Z
OPERATOR: ring-0
SEAT_SCRIBE: grok
ACTION: stop recording → save snapshot → start recording again
CONTINUITY: same work session; segment break only
```

## Sync note for next seat / after restart

1. Treat prior segment as closed at this boundary.  
2. New video segment continues the same desk (Magna Carta / three-pane / Lab PR #96 work).  
3. Mark `user-disclosures/TODO_URGENT.md` item for this boundary when operator confirms new segment is rolling.  
4. Do **not** invent what was on screen during the gap.

## Redactions

- None  

## Non-claims

Log only. Not a product claim. Not STATUS authority.

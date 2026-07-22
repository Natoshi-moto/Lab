#!/usr/bin/env python3
"""LOOM-TEST-C4-001 pipeline: build tagged derivative (TS-3/TS-6) + V-1 stripper.

Usage:
  loom_c4_pipeline.py build <raw_file> <derivative_out>
  loom_c4_pipeline.py strip <derivative_file> <raw_file>   # V-1 validator

The derivative wraps exact raw byte segments in content-addressed fences
(TS-3). Everything outside fences is LOOM markup and carries no payload.
V-1 (strip) extracts fence payloads, concatenates, sha256-compares to raw.
"""
import hashlib
import re
import sys

# Stage-2 segmentation (1-indexed start lines) and actor attribution.
# Boundaries chosen at speaker turns; UI chrome attributed actor=ui.
SEGMENTS = [
    (1, "ui", "ChatGPT Pro interface header"),
    (3, "chatgpt", "synthesis: project history as live prototype; proposed next move"),
    (87, "operator", "dial-up instruction"),
    (89, "chatgpt", "Cathedral R000 build report, source correction, first routed ambiguity"),
    (260, "operator", "attachment marker + handoff request"),
    (264, "chatgpt", "whole-system ideation handoff summary"),
]

# Stage-3 MARK lines: epistemic-event glyphs per record (TS-2), with rationale.
MARKS = {
    2: "💭 🌅  — speculative synthesis; first emergence of 'mine the evolutionary record / reconstruct the cathedral'",
    4: "🌅 🔄 🩹 🔥 🌗  — first-seen Cathedral R000 and 'boundary first'; reversal+whoopsie: prior archive names/hashes/build claims quarantined as session-reported, unverified; self-directed demolition targets; fork routed to operator left deliberately open",
    6: "💭 🔥  — bridge hypothesis (Research OS as trust substrate) presented explicitly as something to attack, not accept",
}

# Stage-4 claims (TS-4). cites= record IDs only (INV-3).
CLAIMS = [
    ('CLM.0001', '🌱', ['REC.20260722.c4.004'], 'A 6,859-word Cathedral R000 whitepaper exists as described (asserted in-session; artifact not verifiable from this transcript alone).'),
    ('CLM.0002', '📄', ['REC.20260722.c4.004'], 'ChatGPT quarantined previously stated archive names, hashes, build numbers, and kernel-progress claims as session-reported and unverified.'),
    ('CLM.0003', '🌱', ['REC.20260722.c4.006'], 'A 3,700-word self-contained whole-system ideation handoff exists as described (asserted in-session; artifact not verifiable from this transcript alone).'),
    ('CLM.0004', '📄', ['REC.20260722.c4.004'], "ChatGPT's synthesis points toward 'boundary first' and routes that fork to the operator; it is unresolved in this transcript."),
]

FENCE_OPEN = re.compile(rb'^<<<FENCE-([0-9a-f]{12})\n$')


def build(raw_path, out_path):
    data = open(raw_path, 'rb').read()
    lines = data.splitlines(keepends=True)
    n = len(lines)
    bounds = [s[0] - 1 for s in SEGMENTS] + [n]
    out = []
    out.append('🧭 RTE id=RTE.c4-tagged-derivative generated=2026-07-22T00:00:00Z from=[raw sha256=%s] ttl=none\n'
               % hashlib.sha256(data).hexdigest())
    out.append('# LOOM v0.1 tagged derivative — LOOM-TEST-C4-001. Payload lives only inside fences; all other lines are disposable markup.\n\n')
    for i, (seg, actor_note) in enumerate(zip(SEGMENTS, SEGMENTS)):
        start, actor, note = SEGMENTS[i]
        payload = b''.join(lines[bounds[i]:bounds[i + 1]])
        h = hashlib.sha256(payload).hexdigest()
        rec_id = 'REC.20260722.c4.%03d' % (i + 1)
        out.append('📜 REC id=%s ts=NA actor=%s privacy=SEALED sha256=%s\n' % (rec_id, actor, h))
        out.append('# %s\n' % note)
        out.append('<<<FENCE-%s\n' % h[:12])
        out.append(payload.decode('utf-8'))
        if not payload.endswith(b'\n'):
            out.append('\n# NOTE: payload above had no trailing newline; fence line added one — stripper must trim.\n')
        out.append('FENCE-%s\n' % h[:12])
        if (i + 1) in MARKS:
            out.append('MARK %s %s\n' % (rec_id, MARKS[i + 1]))
        out.append('\n')
    for cid, cls, cites, text in CLAIMS:
        out.append('⚖ CLM id=%s class=%s cites=[%s] supersedes=none\n  text="%s"\n' % (cid, cls, ','.join(cites), text))
    open(out_path, 'w', encoding='utf-8').write(''.join(out))
    print('derivative written: %s' % out_path)


def strip(deriv_path, raw_path):
    """V-1: extract fence payloads, concatenate, compare hash to raw."""
    raw = open(raw_path, 'rb').read()
    payload = []
    fence_tag = None
    trim_next = False
    for line in open(deriv_path, 'rb'):
        if fence_tag is None:
            m = FENCE_OPEN.match(line)
            if m:
                fence_tag = m.group(1)
            continue
        if line == b'FENCE-%s\n' % fence_tag:
            fence_tag = None
            continue
        payload.append(line)
    reassembled = b''.join(payload)
    h_raw, h_re = hashlib.sha256(raw).hexdigest(), hashlib.sha256(reassembled).hexdigest()
    print('raw         sha256=%s (%d bytes)' % (h_raw, len(raw)))
    print('reassembled sha256=%s (%d bytes)' % (h_re, len(reassembled)))
    if h_raw == h_re:
        print('V-1 PASS: byte-identical')
        return 0
    print('V-1 FAIL: source mutated or stripper defective')
    return 1


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'build':
        build(sys.argv[2], sys.argv[3])
    elif cmd == 'strip':
        sys.exit(strip(sys.argv[2], sys.argv[3]))

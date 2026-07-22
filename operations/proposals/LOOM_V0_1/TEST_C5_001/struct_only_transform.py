#!/usr/bin/env python3
"""LOOM-TEST-C5-001: derive the STRUCT-ONLY control render.

Deterministic transform of the TAGGED-MAX render: keeps every span boundary
ChatGPT chose, strips all glyph semantics.

  - each semantic glyph pair -> ⟪sN⟫ ... ⟪/sN⟫  (N = order of opening)
  - ISO thread IDs -> opaque T<n> (first-seen order; mapping written to
    stdout footer for sealing, must NOT be given to reader seats)
  - attribution emoji and [⌛]/[🚨☯🚨] markers -> removed
  - brace granularity nesting ({..{{{{{) -> ⟪d1⟫..⟪d5⟫ ... ⟪/dN⟫

Usage: struct_only_transform.py tagged.txt > struct_only.txt
"""
import re
import sys

PAIRS = [
    ("﴾", "﴿"), ("༺", "༻"), ("【", "】"), ("〖", "〗"), ("〔", "〕"),
    ("「", "」"), ("『", "』"), ("⸢", "⸣"), ("⸤", "⸥"), ("⸦", "⸧"),
    ("⟪", "⟫"), ("⟅", "⟆"), ("❨", "❩"), ("❪", "❫"), ("⟬", "⟭"),
    ("⟮", "⟯"), ("⦅", "⦆"), ("⦇", "⦈"), ("⦉", "⦊"), ("⦑", "⦒"),
    ("⦓", "⦔"), ("⦕", "⦖"), ("⟦", "⟧"), ("⟨", "⟩"), ("⁅", "⁆"),
    ("⦋", "⦌"), ("⦍", "⦎"), ("⦏", "⦐"),
]
OPEN = {o: c for o, c in PAIRS}
CLOSE = {c: o for o, c in PAIRS}
EMOJI = re.compile(
    r"\[⌛\]|\[🚨☯🚨\]|[⚖🔬📚📰📊🗣🕵️⚖️]"
)
ISO = re.compile(r"﴾(/?)ISO\.(\d+)﴿")


def transform(text: str) -> str:
    # 1. opaque the ISO thread IDs (before pair-walking; they use ﴾﴿)
    mapping: dict[str, str] = {}

    # \x01/\x02 are sentinels for the neutral token brackets, resolved at the
    # end — inserting literal ⟪⟫ here would collide with the semantic ⟪⟫ pair
    # in step 4.
    def iso_sub(m: re.Match) -> str:
        tid = m.group(2)
        if tid not in mapping:
            mapping[tid] = f"T{len(mapping) + 1}"
        return f"\x01{m.group(1)}{mapping[tid]}\x02"

    text = ISO.sub(iso_sub, text)
    # 2. strip attribution emoji / markers
    text = EMOJI.sub("", text)
    # 3. brace depth runs -> neutral depth tokens
    text = re.sub(r"\{{1,5}", lambda m: f"\x01d{len(m.group(0))}\x02", text)
    text = re.sub(r"\}{1,5}", lambda m: f"\x01/d{len(m.group(0))}\x02", text)
    # 4. semantic pairs -> numbered neutral spans (per-type stacks)
    out, stacks, n = [], {o: [] for o in OPEN}, 0
    for ch in text:
        if ch in OPEN:
            n += 1
            stacks[ch].append(n)
            out.append(f"\x01s{n}\x02")
        elif ch in CLOSE:
            stack = stacks[CLOSE[ch]]
            sid = stack.pop() if stack else "X"
            out.append(f"\x01/s{sid}\x02")
        else:
            out.append(ch)
    result = "".join(out).replace("\x01", "⟪").replace("\x02", "⟫")
    footer = "\n=== SEALED ISO MAPPING (do not give to seats) ===\n" + "\n".join(
        f"ISO.{k} -> {v}" for k, v in mapping.items()
    )
    return result + footer


if __name__ == "__main__":
    sys.stdout.write(transform(open(sys.argv[1], encoding="utf-8").read()))

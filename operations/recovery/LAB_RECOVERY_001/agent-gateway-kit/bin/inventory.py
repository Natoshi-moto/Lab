#!/usr/bin/env python3
"""Agent Gateway inventory: hash your scattered files, find duplicates and
divergent versions. Zero dependencies — Python 3.8+ standard library only.

Usage:
  python3 inventory.py PATH [PATH ...] [--out DIR] [--skip-over MB]

Outputs (in --out, default ./gateway-inventory):
  INVENTORY.json  — machine-readable: every file, size, mtime, sha256
  REPORT.md       — human-readable: duplicates, divergent version families
"""
import argparse, hashlib, json, os, re, sys, time
from collections import defaultdict
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", ".cache",
             ".npm", ".cargo", "ollama-downloads", ".Trash", "lost+found"}
COUNTER_RE = re.compile(r"\s*\((\d+)\)(?=\.[^.]+$|$)")  # "file(1).js" download counters
COPY_RE = re.compile(r"[\s_-](copy|final|new|old|backup|bak)\d*", re.IGNORECASE)

def sha256_file(path, bufsize=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(bufsize):
            h.update(chunk)
    return h.hexdigest()

def family_key(name: str) -> str:
    """Normalize a filename so likely versions of the same thing group together."""
    n = COUNTER_RE.sub("", name)
    n = COPY_RE.sub("", n)
    return n.lower()

def human(n):
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if n < 1024 or unit == "TB":
            return f"{n:.0f}{unit}" if unit == "B" else f"{n:.1f}{unit}"
        n /= 1024

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--out", default="gateway-inventory")
    ap.add_argument("--skip-over", type=float, default=500, help="skip files larger than this many MB (still listed, not hashed)")
    args = ap.parse_args()

    limit = int(args.skip_over * 1024 * 1024)
    records, errors = [], []
    t0 = time.time()
    for root in args.paths:
        root = Path(root).expanduser()
        if not root.exists():
            errors.append(f"missing path: {root}"); continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for fn in filenames:
                p = Path(dirpath) / fn
                try:
                    st = p.stat()
                    rec = {"path": str(p), "name": fn, "size": st.st_size,
                           "mtime": time.strftime("%Y-%m-%d", time.localtime(st.st_mtime))}
                    rec["sha256"] = sha256_file(p) if st.st_size <= limit else "SKIPPED_TOO_LARGE"
                    records.append(rec)
                except OSError as e:
                    errors.append(f"{p}: {e}")

    # Exact duplicates: same hash, >1 location
    by_hash = defaultdict(list)
    for r in records:
        if r["sha256"] not in ("SKIPPED_TOO_LARGE",) and r["size"] > 0:
            by_hash[r["sha256"]].append(r)
    dupes = {h: rs for h, rs in by_hash.items() if len(rs) > 1}
    wasted = sum(rs[0]["size"] * (len(rs) - 1) for rs in dupes.values())

    # Divergent families: same normalized name, >1 distinct hash
    by_family = defaultdict(set)
    fam_paths = defaultdict(list)
    for r in records:
        if r["sha256"] != "SKIPPED_TOO_LARGE" and r["size"] > 0:
            k = family_key(r["name"])
            by_family[k].add(r["sha256"])
            fam_paths[k].append(r)
    divergent = {k: fam_paths[k] for k, hs in by_family.items() if len(hs) > 1}

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    (out / "INVENTORY.json").write_text(json.dumps({
        "schema": "agent-gateway.inventory.v1",
        "generated_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "roots": [str(Path(p).expanduser()) for p in args.paths],
        "file_count": len(records), "errors": errors, "files": records,
    }, indent=1))

    lines = ["# Gateway Inventory Report", "",
             f"- **Files scanned:** {len(records)}  |  **Time:** {time.time()-t0:.1f}s",
             f"- **Exact duplicate groups:** {len(dupes)}  |  **Wasted space:** {human(wasted)}",
             f"- **Divergent version families:** {len(divergent)}  ← *these need human decisions*", ""]
    if divergent:
        lines += ["## ⚠ Divergent families (same name, DIFFERENT content — which is canonical?)", ""]
        ranked = sorted(divergent.items(), key=lambda kv: -len(set(r['sha256'] for r in kv[1])))
        for k, rs in ranked[:25]:
            lines.append(f"### `{k}` — {len(set(r['sha256'] for r in rs))} versions")
            for r in sorted(rs, key=lambda r: r["mtime"], reverse=True):
                lines.append(f"- `{r['sha256'][:12]}` {r['mtime']} {human(r['size']):>8}  {r['path']}")
            lines.append("")
    if dupes:
        lines += ["## Exact duplicates (identical bytes — safe to consolidate AFTER a decision)", ""]
        for h, rs in sorted(dupes.items(), key=lambda kv: -kv[1][0]["size"] * (len(kv[1]) - 1))[:15]:
            lines.append(f"- `{h[:12]}` ×{len(rs)} ({human(rs[0]['size'])} each)")
            for r in rs:
                lines.append(f"    - {r['path']}")
    if errors:
        lines += ["", "## Errors", ""] + [f"- {e}" for e in errors[:20]]
    lines += ["", "---", "*Next step: open TO_DO_LIST.md and turn each divergent family into a decision task.*"]
    (out / "REPORT.md").write_text("\n".join(lines))
    print(f"✔ {len(records)} files | {len(dupes)} duplicate groups ({human(wasted)} wasted) | "
          f"{len(divergent)} divergent families\n  → {out}/REPORT.md\n  → {out}/INVENTORY.json")

if __name__ == "__main__":
    sys.exit(main())

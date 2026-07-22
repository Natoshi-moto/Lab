#!/usr/bin/env python3
"""Agent Gateway freeze: snapshot a folder into a zip + SHA-256 sidecar.
The zip is your 'these exact bytes existed on this date' receipt.

Usage: python3 freeze.py FOLDER [--out DIR]
"""
import argparse, hashlib, sys, time, zipfile
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--out", default="gateway-freezes")
    args = ap.parse_args()
    src = Path(args.folder).expanduser().resolve()
    if not src.is_dir():
        print(f"not a folder: {src}"); return 1
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y-%m-%d_%H%M%S")
    zpath = out / f"{src.name}_{stamp}.zip"
    files = sorted(p for p in src.rglob("*") if p.is_file())
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, p.relative_to(src))
    digest = hashlib.sha256(zpath.read_bytes()).hexdigest()
    (zpath.with_suffix(".zip.sha256")).write_text(f"{digest}  {zpath.name}\n")
    print(f"✔ froze {len(files)} files → {zpath}\n  sha256: {digest}")
    print("  Keep the .sha256 sidecar with the zip. Anyone can verify with:")
    print(f"    sha256sum -c {zpath.name}.sha256")
    return 0

if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env bash
# One-shot verify for any AI taking over the Full Spectrum vision pack.
# status_authority: NONE
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../../.." && pwd)"
cd "$REPO"

echo "== check_claim_ids =="
bash "$ROOT/tools/check_claim_ids.sh"

echo "== required handoff files =="
for f in \
  HANDOFF_ANY_AI.md \
  OPERATOR_ONE_PAGE.md \
  READY_FOR_OPERATOR.md \
  PACK_INDEX.json \
  TASK_BOARD.json \
  CLAIMS.json \
  CLAIMS_REGISTER.md \
  MITHUB.md \
  PR_BODY.md \
  LOOM_RECORD_001_PACK_GENESIS.md \
  site/index.md
do
  test -f "$ROOT/$f" || { echo "MISSING $f"; exit 1; }
  echo "ok $f"
done

echo "== tasks present =="
for t in \
  TSK-FS-000_PROMOTE_OR_PARK.md \
  TSK-FS-001_PUSH_AND_PR.md \
  TSK-FS-002_EXPORT_CHAT_HASH.md \
  TSK-FS-010_TAILS_WORKLOAD_001.md \
  TSK-FS-020_NEXSIM_RECEIPT_SPEC.md \
  TSK-FS-030_MITHUB_CI_DUAL_WRITE.md \
  TSK-FS-040_HERMES_TEACHER_SKILLS_V0.md \
  TSK-FS-050_SITE_MARKDOWN_V0.md
do
  test -f "$ROOT/tasks/$t" || { echo "MISSING tasks/$t"; exit 1; }
done
echo "ok tasks"

echo "== skills present =="
for s in lab-enter ffd-enrich isomorphism-check nex-epoch0-warn mithub-pr-dual-write break-status; do
  test -f "$ROOT/skills/$s/SKILL.md" || { echo "MISSING skills/$s/SKILL.md"; exit 1; }
done
echo "ok skills"

echo "== workflow present =="
test -f "$REPO/.github/workflows/full-spectrum-claims.yml"
echo "ok workflow"

echo "== pack tree hash (info) =="
if [[ -f "$ROOT/PACK_TREE.sha256" ]]; then
  grep '^pack_tree_sha256=' "$ROOT/PACK_TREE.sha256" || true
else
  echo "WARN: PACK_TREE.sha256 missing — run tools/hash_pack.sh"
fi

echo "verify_pack: PASS"

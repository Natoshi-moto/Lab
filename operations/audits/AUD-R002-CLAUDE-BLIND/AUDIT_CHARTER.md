# Blind audit charter — AUD-R002-CLAUDE-BLIND

Audit the exact snapshot `NEXUS_LAB_R001_BASELINE_001.zip` with SHA-256 `33d3fb549d49e1ad02ac2b2880b5ab4336a6dc29a7142d3e33e4ec2694ad8603` and source commit `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8`.

Do not modify the target. Do not inherit the builder's conclusions. Return append-only observations with `status_authority: NONE`. A passing check is evidence only for the property checked.

The immutable subject is the tree at `baseline-001`, dereferencing to `7a8068fc6088b81cc9a7c94b49dc77e0abe592d8`. The R002 directory is a later external-witness overlay, not part of that subject. Independently attack archive substitution, movement or replacement of the tag, digest mismatch, route/target disagreement, and any ambiguous target binding.

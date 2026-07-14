# R016 claim matrix

| Statement | Disposition |
|---|---|
| Synthetic outputs can remain owned by a stable controller across key rotation | Targeted for demonstration |
| Transfer, rotate, recover, and revoke share one predecessor root and local writer order | Targeted for demonstration |
| Rotation requires active + guardian + new-key proof | Targeted for demonstration |
| Recovery requires 2-of-3 guardians + new-key proof | Targeted for demonstration |
| Revocation locks the controller and old keys cannot spend afterward | Targeted for demonstration |
| Accepted lifecycle events preserve synthetic supply | Targeted for demonstration |
| Crash recovery yields an old or complete-new local prefix and exact retry is idempotent | Targeted for demonstration |
| Separate implementations converge on the frozen transcript | Targeted for demonstration |
| The mechanism is money or has economic value | Explicitly not claimed |
| Private-key entropy, confidentiality, backup secrecy, secure erase, HSM or device safety | Explicitly not claimed |
| Guardian-key rotation, guardian replacement, or recovery-policy migration | Not implemented in V0 |
| Loss, compromise, guardian independence, or user intent is cryptographically detected | Explicitly not claimed |
| Recovery reverses a compromised transfer that committed first | Explicitly false |
| One local order is network consensus, fork choice, global finality, or availability | Explicitly not claimed |
| Caller anchors prove independent retention, rollback, fork, or tampering | Explicitly not claimed |
| A public checkpoint is imported or restores machine state | Not implemented in V0 |
| Physical power-loss durability or production security | Explicitly not claimed |
| Formal verification, external audit, regulatory approval, or live-pilot authorization | Explicitly not claimed |

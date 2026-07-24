# Promotion package

Choose exactly one mode in `change_origin`:

- `LAB_INTERNAL`: work that originated inside Lab. Every Sandbox field must be
  exactly `NOT_APPLICABLE`.
- `SANDBOX_PROMOTION`: work cited from `Natoshi-moto/Experimental-Sandbox`.
  Use one exact 40-character commit, one tag, and one immutable record URL.

Paste exactly one JSON block below. Do not add a second structured block. The
workflow checks the declared file list against this PR's actual changed files.
The package is a proposal, not accepted state. A passing check proves selected
provenance and formatting invariants only; it is not proof of safety, security,
correctness, usefulness, licence compatibility, or deployment suitability.

```json
{
  "schema": "nexus.experimental-sandbox-promotion/v1",
  "change_origin": "LAB_INTERNAL",
  "sandbox_repository": "NOT_APPLICABLE",
  "sandbox_commit": "NOT_APPLICABLE",
  "sandbox_tag": "NOT_APPLICABLE",
  "sandbox_record_url": "NOT_APPLICABLE",
  "sandbox_context": "NOT_APPLICABLE",
  "task_or_route_id": "",
  "baseline_lab_commit": "",
  "authority_used": "",
  "allowed_write_scope": [""],
  "files_proposed_for_lab": [
    {"path": "", "disposition": "DOCUMENTATION_ONLY"}
  ],
  "claim": "",
  "falsifier": "",
  "evidence_class": "DRAFT",
  "tests_run": [
    {"command": "", "result": "", "details": ""}
  ],
  "test_results": [""],
  "known_failures": [],
  "known_unknowns": [""],
  "non_claims": [""],
  "adversarial_review": {
    "performed": false,
    "summary": "",
    "findings": [],
    "limitations": []
  },
  "rights_and_licences": {
    "original_author_or_source": "",
    "source_repository": "",
    "source_commit": "",
    "source_licence": "",
    "files_modified": "",
    "third_party_material": "",
    "submitter_rights": "",
    "lab_mit_compatibility": "",
    "exceptions": ""
  },
  "security_and_privacy_impact": {
    "summary": "",
    "secrets_checked": "",
    "personal_data_checked": "",
    "external_systems": "",
    "risks": ""
  },
  "known_lab_red_impact": "NONE",
  "operator_decision_requested": {
    "action": "PARK",
    "rationale": "",
    "reversible": true,
    "stop_conditions": ""
  },
  "status_authority": "NONE"
}
```

## Plain-English operator card

- What is this?
- Why might it matter?
- What exactly happened?
- Which exact Sandbox state is cited, if any?
- What enters Lab, and what stays in Sandbox?
- What was tested, what failed, and what remains unknown?
- What rights and licences apply?
- Who or what could be harmed?
- What do reviewers disagree about?
- What exact reversible decision is requested?
- What is not being claimed?

A human decision is still required. This workflow never copies files, writes to
Lab, opens or approves a PR, or merges anything.

# Research Plan

## Governing question

What is the smallest coherent version of the Pain Tracker concept that can be
specified, implemented, and evaluated without presenting unvalidated clinical or
statistical interpretations as established facts?

## Scope

### Included

- Product purpose, users, contexts, indications, contraindications, and non-claims.
- Logging, journaling, local storage, review, and user-controlled export.
- Data model integrity, provenance, time handling, deletion, migration, and recovery.
- Privacy architecture, threat modelling, export lifecycle, and optional AI transfer.
- Accessibility, high-pain interaction design, error states, and foreseeable misuse.
- Statistical definitions for any retained descriptive or predictive feature.
- Testable functional and non-functional acceptance criteria.

### Excluded until separately authorized and evidenced

- Live patient deployment or collection of real health data.
- Diagnosis, treatment, triage, medication instruction, or emergency assessment.
- Claims of clinical validity, treatment efficacy, causal discovery, or flare prediction.
- Regulatory classification conclusions or legal advice.
- Production API integrations, publication, app-store release, or external data sharing.

## Work packages and gates

| ID | Work package | Required output | Gate |
|---|---|---|---|
| WP-01 | Intended purpose and claim inventory | Every product statement classified as descriptive, wellness, clinical, predictive, or aspirational | Human approval of the intended-use boundary |
| WP-02 | Safety and foreseeable misuse | Hazard register covering high-pain UX, alerts, medication language, false reassurance, and false alarms | No unresolved critical hazard in MVP scope |
| WP-03 | Statistical methods | Operational definitions, estimands, missingness, confounding, autocorrelation, multiplicity, validation, and reporting rules | Unsupported analytical features removed or labelled experimental |
| WP-04 | Privacy and security | Data-flow diagram, threat model, key lifecycle, backup/restore, deletion, export retention, and provider processing boundaries | Private-data non-reachability and export controls testable |
| WP-05 | Accessibility | Requirements for semantics, scaling, contrast, motion, non-colour cues, assistive input, charts, and exports | Automated checks plus task-based human testing defined |
| WP-06 | Requirements conversion | Stable IDs, priorities, preconditions, failure behaviour, acceptance tests, and traceability | Each MVP requirement has an objective verification method |
| WP-07 | MVP reduction | Staged scope separating diary/export functions from experimental analysis | Human approval before implementation planning |

## Initial findings to test

These are `DRAFT` hypotheses, not accepted findings:

1. The strongest initial product is a local-first diary and controlled export tool.
2. The pain-scale translation lacks a declared validation basis and should not enter
   clinical exports as an equivalent score without evidence.
3. Predictive, medication-efficacy, and AI leverage-point features materially expand
   safety and regulatory risk.
4. Database separation is a useful control but is not a complete privacy or security
   architecture.
5. The current build sweeps lack requirement-level acceptance tests and release gates.
6. The current feature count is too large for a credible first validation cycle.

## Proposed MVP boundary

- Configurable self-reported pain and capacity logging.
- User-defined activities and journal entries.
- Local encrypted persistence with explicit backup, recovery, and deletion behaviour.
- Timeline and simple descriptive summaries with transparent calculations.
- User-reviewed, user-initiated export of selected fields.
- Neutral language by default; optional tone must never replace safety information.

Weather prediction, medication evaluation, pre-flare alerts, topography inference,
automated clinical narration, and in-app AI remain outside the MVP until their claims,
hazards, evidence needs, and validation methods are separately approved.

## Completion criteria

The research project is ready for synthesis when all seven work packages have an
attributed output, every material claim has an evidence class, unresolved decisions
are explicit, and the proposed MVP has traceable acceptance criteria. Completion of
research does not itself authorize implementation or promotion.

# Pain Tracker Specification Hardening

## Project status

`DRAFT` research project. This directory is a reversible proposal and does not
alter Nexus canonical status, the active R017 work, or any accepted product claim.

## Objective

Evaluate and convert the Pain Tracker v1.4 product-design document into a
bounded, testable specification suitable for an Android prototype, while keeping
clinical, statistical, privacy, security, accessibility, and regulatory claims
explicitly separated from product aspirations.

## Source boundary

The source document remains outside Git in the operator's Downloads directory.
`SOURCE_REGISTER.md` records its exact filename, digest, inspection status, and
handling rule. No health records, credentials, API keys, or other user data are
in scope.

## Baseline

- Repository baseline: `6ad3b470d190eafdde97143c7df0c8334a754764`
- Working branch at project creation: `experiment/r019-vdf-quantum-break-demo`
- Created: `2026-07-15` (Europe/London)
- Evidence class at creation: `DRAFT`

## Outputs

1. Product boundary and intended-use/non-claims statement.
2. Requirements traceability matrix with measurable acceptance criteria.
3. Clinical-safety and statistical-method review.
4. Privacy threat model and data-lifecycle specification.
5. Accessibility requirements and verification matrix.
6. Reduced MVP scope and staged validation plan.
7. Open-decision register and final research synthesis.

## Non-claims

This project does not establish that the proposed app is clinically valid,
medically safe, secure, accessible, legally compliant, production-ready, or a
medical device of any particular classification. It does not authorize clinical
use, medication decisions, external distribution, or processing of live patient
data.

## Start here

Read `SOURCE_REGISTER.md`, then `RESEARCH_PLAN.md`. Resolve the intended-use gate
before treating predictive, medication, or AI-generated outputs as buildable
requirements.

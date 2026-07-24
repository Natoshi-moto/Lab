# THE COMMONS 001

**status_authority:** `NONE` — a proposal, an experiment, not accepted canon.

A first foundation for the operator's north star: a moral / intellectual /
artistic **commons with cryptographic memory**, deliberately outside the legacy
legal and financial systems. Not property, not currency, not a court, not a market
— **authorship kept, provenance proven, recognition earned.**

## Read in this order

1. **[`PRINCIPLES.md`](PRINCIPLES.md)** — the lodestone. What this is, the native
   vocabulary, and the old-world words that smuggle contradictions back in. Check
   every future idea against it.
2. **[`PRIMITIVE_SPEC.md`](PRIMITIVE_SPEC.md)** — the two signed records
   (authorship + recognition) and why *strict no sale* is structural here.
3. **[`commons/authorship.py`](commons/authorship.py)** — the working primitive.
   Run it to watch it breathe:
   ```bash
   python3 experiments/THE_COMMONS_001/commons/authorship.py
   ```
4. **`tests/test_commons_authorship.py`** — negative controls. Watch the verifier
   reject forgery, tampering and impersonation:
   ```bash
   python3 -m unittest tests.test_commons_authorship -v
   ```

## Status

Foundation only. It proves the *smallest living act* — a steward can sign a work
and anyone can verify it forever, with no way to sell or reassign it. It does
**not** yet include: a recognition graph with Sybil-resistance, a Nostr transport,
identity/steward-key stewardship UX, or any product surface. Those are next, and
each arrives with its own falsifier, per the Lab method.

# Reddit post — anchored verbatim copy — 2026-07-23

**Title:**

I'm not a coder. AI models built and audited this repo for 11 days. Here's a real bug they found in their own work, the fix, and the receipts. Please try to break it.

**Body:**

**What this is:** an 11-day-old public repo where one human (me — anonymous,
no CS training, not a coder) directs multiple AI models (Claude, Grok, Codex)
to build, attack, and audit each other's work. Everything is synthetic —
no token, no sale, no product, no investment anything. MIT licensed.

**Why I'm posting:** the project's own internal audit ended with this verdict:

> "The repo can prove what happened; it cannot prove who watched. Every
> attestation rests on a single witness. Put something a stranger can execute
> in front of strangers, and let the receipts face people who owe the project
> nothing."

You are the strangers. This post is that test.

**The 5-minute challenge.** The AIs claim they found a real bug in their own
toy-ledger economics (a negative parameter made it issue more tokens than
exist), fixed it, and left receipts. Verify or break it:

    git clone https://github.com/Natoshi-moto/Lab
    cd Lab
    python3 -m pytest tests/ -q        # ~200 tests (11 need `npm ci` first)

Reproduce the original exploit at the pre-fix commit:

    git checkout 8349de7
    python3 -c "
    import sys, random
    sys.path.insert(0,'experiments/BENEFICIAL_GENESIS_ECON_REDTEAM_001')
    from model.allocation import random_lottery_component
    r = random_lottery_component([('a',100)], 100, random.Random(42), lottery_share_bps=-1000)
    print('issued', sum(r.values()), 'from a pool of 100')"

You should see **110 issued from a pool of 100**. Then `git checkout main`,
run it again, and watch it fail closed. The receipt documenting this is at
`operations/receipts/BENEFICIAL_GENESIS_R1_SUPPLY_INVARIANT_REPAIR/RECEIPT.json`.

**What I'm asking for (in order of value to me):**
1. Run it and report what breaks on your machine — OS, versions, output.
2. Find an input that still violates the supply invariant post-fix.
3. Tell me where the receipts overclaim. The repo has a load-bearing
   `WHY_NOT_TO_TRUST_THIS_PROJECT.md` — add to it.

**What I already know, so nobody wastes time discovering it:** every
"independent audit" in the repo was AI seats on my own accounts — single
witness, zero external review until now. Commit counts are inflated by batch
tooling. The docs are way ahead of the software. It's all in the repo's own
audit files. The question isn't whether it's impressive — it's whether the
receipts survive contact with people who owe me nothing.

If it breaks in the open, that's the system working. That result gets
committed too.

**Operator's note — my exact words to the AI while prepping this post,
unedited, included at my own insistence:**

> please make a fucking noob toddler guide on how to save this video fedora
> 44 screen record after this audit and then safely post whatever you say to
> reddit and put the video on youtube with a link or hash or whatever and
> tell everyone please ^this veribatum^ all of it that I dont know what I'm
> doing but I need fucking help

That's the honest state of the human behind this. I don't know what I'm
doing and I need help. The AIs wrote everything else; I wrote that.

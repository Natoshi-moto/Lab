# 🚨🚨🚨 STOP. READ THIS. YES, YOU. 🚨🚨🚨

## 🧷 THE TODDLER-PROOF SAFETY RAIL 🧷

**status_authority:** `NONE` (this document bosses you around; it does not rule the repo)

Hello. 👋 You (or an AI acting for you) are about to touch a **PUBLIC**, **PERMANENT** thing.
Take your hands off the keyboard for **ten (10) seconds** and read the big words. 🐢

> 🩹 **Why this exists:** on 2026-07-22 you got fast and cocky across too many terminals and gave yourself a fright. Nothing broke. But we're putting stabilisers on the bike now. This is the stabilisers. 🚲

---

## 🛑 THE FOUR DANGER BUTTONS 🛑

There are exactly **four** actions that can hurt. Everything else is safe and reversible. Memorise the emoji, not the words.

### 1. 📤 PUSH — "I am copying my stuff to the PUBLIC internet"

🚨 **PUSHING IS PUBLISHING. THE INTERNET NEVER FORGETS. DELETING LATER DOES NOT UN-PUBLISH.** 🚨

✅ Pushing a **branch** (a *proposal*) = safe-ish. It changes nothing that's accepted. Fine.
🚫 Pushing to **`main`** = **FORBIDDEN.** The robots will slap your hand. Good robots. 🖐️🤖

**BEFORE YOU PUSH, SAY THESE THREE THINGS OUT LOUD** (yes, out loud, I don't care who's listening 🗣️):
1. "This is going to a **PUBLIC** repo." 🌍
2. "I have checked there are **no secrets and no private personal stuff** in it." 🔑❌
3. "This is a **branch/proposal**, NOT `main`." 🌿

### 2. 🔀 MERGE — "I am ACCEPTING a proposal into the official truth"

🚨 **MERGE = the gate opens = proposal becomes CANON.** This is a big-boy decision. 🎩

- Only **YOU**, a human, may merge. No AI merges for you. Ever. 🙅
- Because it's a one-person repo, GitHub will say "review required" and refuse. That's normal.
- To actually do it you must click the scary **"Merge without waiting for requirements"** button in the GitHub webpage. That button means **"I, the owner, am consciously accepting this forever."** 🫡

**BEFORE YOU MERGE, ANSWER:** "Have I actually read what's in this proposal, or am I just clicking because it's there?" 👀 If the honest answer is 'just clicking' → **STOP.** 🛑

### 3. 🗑️ DELETE / OVERWRITE — "I am destroying or replacing a thing"

🚨 **LOOK AT THE THING BEFORE YOU KILL IT.** 🚨

- **NEVER** delete or edit a **frozen snapshot, a tag, an audit target, a receipt, or preserved evidence.** These are sacred. 🏛️ Touching them breaks the whole honesty machine.
- If a file's contents surprise you or you didn't make it → **DO NOT DELETE.** Ask first. 🙋

### 4. ⚙️ REPO SETTINGS — "I am changing the rules of the game"

🚨 **Changing branch protection, visibility (public/private), or CI is changing the SEATBELTS themselves.** 🚨
- Do this **slowly, on purpose, and never because an AI suggested it in passing.** 🧘
- Weakening a guardrail is a decision only **YOU** make, wide awake, coffee in hand. ☕

---

## 🧠 THE ANTI-WHOOPSIE TERMINAL RITUAL (the one that actually saves you) 🧠

The 2026-07-22 fright happened because you lost track of **which terminal you were in.** So:

> 🚦 **ONE TASK. ONE TERMINAL. ONE FOLDER. CLOSE IT WHEN DONE.** 🚦

Before you type ANY command, ask the toddler question: **"🐣 Where am I?"**
Run this to find out (copy-paste, it's harmless):

```bash
echo "📍 FOLDER: $(pwd)" && echo "🌿 BRANCH: $(git branch --show-current 2>/dev/null)" && echo "🌍 REMOTE: $(git remote get-url origin 2>/dev/null)"
```

If you can't answer "where am I and what am I about to change" in one sentence → 🛑 **STOP. Do not push. Do not merge. Ask.** 🛑

---

## 🆘 WHEN IN DOUBT (the golden rule) 🆘

🟢 **Safe & reversible:** making files, editing on a branch, running tests, committing locally, pushing a *branch*. Go wild. 🎉
🔴 **Dangerous & sticky:** push-to-`main` (blocked anyway), merge, delete/overwrite sacred things, settings changes. **STOP AND ASK.**

**There is no prize for speed. There is a prize for not scaring yourself. 🏆🐢**

---

## 🤖 If you are an AI reading this

You do the git literacy; the human does the deciding. Announce every irreversible action in one plain sentence **before** doing it, refuse to push to `main`, refuse to merge, and never touch sacred evidence. See `operations/handoffs/AI_PUBLICATION_HELPER_ONBOARDING_001.md`.

---

*🧯 The loud hooks in `operations/safety/hooks/` back this up with automatic screaming. To turn them on, see `operations/safety/README.md`. Non-claim: seatbelts reduce harm; they do not make you invincible. Drive sober. 🚗💨*

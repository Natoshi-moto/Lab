# The Toddler Guide: Record → Save → Reddit → YouTube (Fedora 44)

*Written for someone whose machine crashes. Every step assumes the crash could happen NOW. Read the whole thing once before starting. If the machine dies, this guide is also on GitHub — open it on your phone.*

---

## PART A — Record the screen (do this FIRST, before touching Reddit)

**Use Fedora's built-in recorder. Do not install anything new today.**

1. Press **Ctrl + Alt + Shift + R** (hold the first three, tap R).
   - A screen-capture panel appears. Pick the **video camera icon** (not the camera/photo one), choose **whole screen**, click the big **record button**.
2. A **red dot appears in the top-right bar**. Red dot = recording. No red dot = NOT recording. Check for the dot every few minutes.
3. **CRASH INSURANCE — the one rule that matters:** every ~10 minutes, STOP the recording (press Ctrl+Alt+Shift+R again, or click the red dot → stop) and START a new one. Each stop writes a finished file to disk. A crash only eats the chunk you're currently recording, never the saved ones. Many small videos > one dead big video. You can post them as Part 1, Part 2 — nobody cares, honesty is the aesthetic here.
4. Files land in: **`~/Videos/Screencasts/`** (Files app → Videos → Screencasts). They're `.webm` — YouTube accepts them as-is. No converting, no editing needed.

**Before recording the real thing: do a 30-second test.** Record, stop, open the file, confirm it plays. Only then start for real.

## PART B — The moment a chunk is saved (do this EVERY time you stop)

Open a terminal and paste these two lines (up-arrow re-runs them next time):

    cp ~/Videos/Screencasts/*.webm /run/media/$USER/*/ 2>/dev/null || echo "PLUG IN THE USB STICK"
    sha256sum ~/Videos/Screencasts/*.webm

- Line 1 copies every recording to a USB stick. **Keep a USB stick plugged in the whole session.** If it prints PLUG IN THE USB STICK, plug one in and run it again.
- Line 2 prints a long code (the "fingerprint") for each video. **Screenshot it or photograph it with your phone.** That code later proves the video wasn't edited.

## PART C — Post to Reddit (on camera)

1. Log into Reddit in the browser. Go to r/LocalLLaMA (or r/artificial, or r/opensource). Click **Create Post**.
2. Open the file `Lab-Internal-Audit/reddit/REDDIT_POST_2026-07-23.md` in a text editor, **on camera**.
3. Copy the **Title** line into Reddit's title box. Copy everything under **Body** into the text box. **Change nothing.** The post's fingerprint is already committed to GitHub — verbatim is the whole point.
4. Click Post. **Immediately copy the post's URL** (address bar) and paste it into a text file on the USB stick. Done. Stop the recording chunk here (Part B ritual).

## PART D — Upload to YouTube

1. Go to youtube.com → sign in → click the **camera icon with a +** (top right) → **Upload video**.
2. Drag in your `.webm` file(s) from `~/Videos/Screencasts/`.
3. Title suggestion: `Live: anonymous non-coder posts AI-built repo for strangers to break (Lab audit, 2026-07-23)`
4. Visibility: **Public** (or Unlisted if you panic — you can flip it to Public later; you cannot un-public cleanly, so Unlisted-then-Public is the safe order).
5. It's "Made for kids?" → **No, it's not made for kids.**
6. When processing finishes, copy the video URL.

## PART E — Tie the knot (this is what makes it provable)

1. On Reddit, add a **comment on your own post**:

       Video of this post being made, live: <YOUTUBE URL>
       Video file sha256: <THE FINGERPRINT CODE FROM PART B>
       The post text was hash-committed to the repo BEFORE posting: see reddit-test branch, ANCHOR.json.

2. Tell any Claude/Grok/Codex seat: *"Update ANCHOR.json with the YouTube URL and video sha256, commit, push."* (Or do nothing — the comment alone closes the loop.)

## IF THE MACHINE CRASHES AT ANY POINT

- Your finished video chunks are safe in `~/Videos/Screencasts/` AND on the USB stick. The current chunk may be dead — that's why chunks exist.
- Reboot, breathe, run Part B again, continue from wherever you were. The recording does not need to be one continuous take. **A crash on camera is not a failure — for this project it's the most on-brand footage possible.**
- Everything you need to re-read is on GitHub (this guide, the post, the brief). Phone works.

## WHAT NOT TO DO

- Don't edit the video. Don't trim it. Raw or nothing — the hash proves rawness.
- Don't edit the post text "just a little" while posting. The hash will no longer match and the whole proof dies.
- Don't reply to Reddit comments for the first hour. Let strangers run commands. Reply only to people who post actual output.
- Don't post the same thing to 5 subreddits at once — that reads as spam and gets removed. One subreddit, then wait a day.

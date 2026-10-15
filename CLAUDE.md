# GamePay API Hub: project notes for Claude

The owner's own LLM API gateway (**new-api on Railway + DeepSeek**) plus a member-facing dashboard
(balance, API keys, usage, model list, channel status). Moved out of the `Gamepay-Hub` store repo so the
store stays untouched. Team giveaway / own use only: **not for resale** unless the owner raises it.

## Read first
1. `notes/HANDOFF.md`: current state, decisions, next steps, mistakes to avoid.
2. `notes/BOOK_BRIEF.md`: brief for the Burmese PDF book (`notes/book/` holds its build files).

## How to work with the owner
- Reply in **Burmese**, mentor / co-founder tone. Explain the *why*. One step at a time, no walls of text.
- The owner works from a phone/tablet and sends screenshots. Read typos generously.
- Be honest about what you could not verify. The sandbox cannot reach Railway, the gateway or DeepSeek.
- **Never ask the owner to paste secrets** (API keys, passwords, admin tokens) into chat. Say where they paste them themselves.
- **This repo is public.** Never commit keys, passwords, admin usernames or tokens. Never put an admin token in client-side code.
- Never invent API endpoints. Anything not confirmed (e.g. a per-key balance endpoint) must be tested by the owner with `curl` first.

## Git / release workflow
- Work on the branch the session assigns, commit clearly, push with `git push -u origin <branch>`.
- **Do not open a PR unless the owner says "Pr"**.

## Design language (dashboard)
Match the store: soft lavender glassmorphism with violet accents (royal violet `#6231c8`, page tint `#f6f3fd`,
border `#e3d9f6`, ink `#2a1a55`, rounded 14 to 22px, soft purple shadows). Mobile first.
The sister store repo is `Gamepay-Hub` (static site on GitHub Pages + Supabase).

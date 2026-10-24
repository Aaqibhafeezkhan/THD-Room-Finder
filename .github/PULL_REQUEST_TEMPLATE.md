<!--
Title: Conventional Commits; it becomes the merge commit's title on main.
  feat(focus): start a private focus session from room detail
  fix(rooms): keep lecture rooms below claimed rooms
  docs(contributing): explain /take
Types: feat · fix · docs · refactor · test · chore · ci · perf · build · revert
-->

## What and why

<!-- One paragraph: the behaviour this PR adds or changes, and why. -->

## Issue

Closes #
<!-- Use "Closes #n" for the issue this PR completes, "Refs #n" for related work.
     In a stack, close only this layer's issue, never the epic. -->

## Stack

<!-- Independent PR, or "Layer 2 of 3, based on #<pr>". Delete if independent. -->

## Verification

- [ ] `npm run typecheck && npm test && npm run build`
- [ ] Checked in the Vercel preview (link):
- [ ] EN and DE · light and dark · phone and desktop (UI changes)
- [ ] [Outage drill](https://github.com/arudaev/THD-Room-Finder/blob/main/docs/development/outage-drills.md) with THabella and the focus service down (changes that read either)

## Screenshots

<!-- Before / after for UI changes. -->

## Notes for review

<!-- Migrations, environment variables, follow-ups, anything deliberately left out. -->

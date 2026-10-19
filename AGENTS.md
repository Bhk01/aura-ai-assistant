<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## S-IT Hub

- Read SPEC.md at the start of every phase; it is the complete user brief. Pause after each phase for approval.
- This is Mode B: original design, no locked Figma export. Mode A restrictions in SPEC.md apply only if a locked export is later supplied; never run stateful Git commands.
- Preserve TanStack Start routing and use leaf route metadata; framework replacement is not supported.
- Keep semantic OKLCH tokens, bundled fonts, responsive layout and motion rules in src/styles.css; feature code consumes these roles.
- UI copy lives in src/logic/locales, accessed through the design context, so French, English and mirrored Arabic remain aligned. Replace this temporary design context with the approved language/state stack in the data phase.
- The phase 0 preview is explicitly non-persistent and uses static visual samples; no control may imply a completed data, AI, voice or native operation.
- Hub's Three.js scene is lazily imported after hydration; rendering materials consume design tokens so browser-only rendering never enters SSR execution.
- Keep phase work and review outcomes in roadmap.md and docs/DESIGN_REVIEW.md; later phases require their own approval.

# Repository guidance

## Commands
- Use pnpm (`pnpm-lock.yaml`). This is a single app, despite the presence of `pnpm-workspace.yaml`.
- `pnpm dev` starts Vite; `pnpm build` builds production output; `pnpm preview` serves that build.
- `pnpm check` runs SvelteKit sync followed by Svelte/TypeScript diagnostics; `pnpm check:watch` watches. There are no configured test, lint, or formatter commands.
- `prepare` suppresses sync failures, so a successful install does not establish correctness; use `pnpm check` explicitly.

## Toolchain gotchas
- SvelteKit 3 configuration lives inside `sveltekit({...})` in `vite.config.ts`, including compiler options and `adapter-auto`; there is no `svelte.config.js`.
- Runes mode is forced for project components. Use Svelte 5 runes and snippets, as in `src/routes/+layout.svelte`, rather than legacy component syntax.
- Shared imports use `#lib` / `#lib/*`, defined by `package.json` imports, not the older `$lib` convention.
- `tsconfig.json` extends `$app/tsconfig`; keep this setup rather than replacing it with an older SvelteKit template. `.svelte-kit/` is generated.
- Tailwind 4 is wired through `@tailwindcss/vite` and `src/routes/layout.css`, imported by the root layout; there is no Tailwind config or PostCSS setup.
- Deployment currently uses `adapter-auto`; select a target-specific adapter if the deployment environment is unsupported.

## Product context
- Atom uses `/atom/laboratorio` for the periodic-table explorer and `/atom/pruebas` for its timed campaign. The root route opens the laboratory.
- Before implementing workshops, read `docs/human-body-viewer-design.md` and the Atom-specific `docs/human-body-viewer-atom.md`; the README is generic scaffold documentation.
- The design requires separate rules per scale: higher-level workshops consume a piece's interface, not its internals. The initial playable scope is the Atom campaign followed by the opening Molecule water mission.
- The laboratory and campaign share the Atom model and renderer. Their specimen selections are independent. The Atom layout preserves an active round when navigating between the two routes. Cross-workshop inspection must restore the originating board and selection on return.

## Workshop architecture
- Use TypeScript classes for workshop rules, reactive state, and gameplay actions. Svelte components render that state and forward user input.
- Read [Workshop classes](.agents/skills/workshop-classes/SKILL.md) before implementing or reviewing workshop logic.

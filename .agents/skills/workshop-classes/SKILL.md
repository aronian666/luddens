---
name: workshop-classes
description: Design, implement, or review Human Body Viewer workshops using TypeScript classes for domain rules and reactive state, with Svelte components for rendering and input.
---

# Workshop classes

## Where behavior lives

- Put workshop rules in TypeScript classes under `src/lib`. Use `.ts` for classes that can work with plain TypeScript and `.svelte.ts` for classes that own reactive state using Svelte runes. Use `#lib/*` for shared imports.
- Keep mutable state private. Use getters for derived values and expose collections through read-only views or snapshots. For example, derive atomic charge from proton and electron counts instead of storing a second mutable charge field. Use `$derived` when a reactive computation needs caching.
- Use a setter for a direct assignment with a clear meaning, such as choosing a visible shell. Route it through the owning class so any invariants still apply. Use named methods such as `addProton()`, `placeElectron(orbital)`, and `undo()` for actions that validate a move, change related fields, or affect history or progress.
- Give constructors typed inputs and initialize fields explicitly. Use composition when a session needs to coordinate an atom, mission progress, and history. Introduce a base class when subclasses share concrete behavior.
- Pass plain values into the classes. Components translate DOM events into method arguments, bind simple settings through setters, and render getters and action results. Focus, layout, and DOM references stay with the UI.

## Atom and workshop boundaries

- Let the atom model own particle and orbital rules. Let the workshop session own missions, undo, reset, and progress. A rejected edit leaves the atom and history intact. Return a typed result so the UI can show feedback without interpreting the scientific rule.
- Share one session between the Orbital Workshop and Electron Cloud. The cloud reads atom state and offers display controls. The editor invokes mutation methods. Switching views preserves the current atom, mission, and undo history.
- Give each scale its own rules and expose a typed piece interface for the next scale. The Molecule workshop consumes the atom's bonding interface. Keep the molecule board and selection in the owning session so atom inspection can restore both on return.
- Serialize progress and other saved state through explicit typed snapshots. Reconstruct class instances from those snapshots and inject browser persistence at the application boundary.

A component can render `session.atom.charge` and call `session.addProton()` on a click. The session validates the move through the atom model, records a successful edit, and checks the mission. The component renders the result.

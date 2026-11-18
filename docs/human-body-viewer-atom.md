# Human Body Viewer — Atom Workshop

The Atom workshop is the campaign entry point. Players learn to distinguish element, isotope, and charge by editing atoms in the simulator.

[Back to the design overview](human-body-viewer-design.md)

## Pieces and rules

**Pieces:** protons, neutrons, electrons.

- **Protons** define the element (adding one changes the identity, e.g. carbon to nitrogen).
- **Electrons** define the charge: more or fewer than the protons gives an **ion**.
- **Neutrons** define the **isotope**. A nucleus with an unsuitable neutron/proton ratio is unstable.
- Electrons are placed following the real rules: at most 2 per orbital (Pauli exclusion), and one in each orbital before pairing up (Hund's rule). A third electron in 1s is rejected.

## Atom views

| View | What the player sees | What the player can do |
|---|---|---|
| **Orbital Workshop** | An editable nucleus and an electron diagram grouped by shell, subshell, and orbital slot. For example, shell 2 contains subshells 2s and 2p, and 2p has three orbital slots. | Add or remove protons, neutrons, and electrons. In configuration challenges, choose which orbital receives each electron. |
| **Electron Cloud** | A read-only, realistic-style visualization of the same atom's occupied orbitals as probability clouds. The shapes illustrate where an electron is likely to be found. Multi-electron clouds are teaching approximations. | Rotate, zoom, and filter visible shells or subshells. These controls affect the view. Particle editing and mission actions are available in the Orbital Workshop. |

Both views read the same atom state and display its element, mass number, charge, and electron configuration. Switching views preserves the build, mission, and undo history. The cloud view is available from the first Atom mission. The existing electron-count slider and Bohr diagram can serve as demo tools. The campaign uses the Orbital Workshop as its editor.

The workshop can place electrons automatically in missions about element, isotope, and charge. In the configuration mission, the player fills orbital slots manually. A third electron in one orbital is rejected. The configuration goal checks for the lowest-energy arrangement modeled for that challenge and provides a hint for allowed arrangements that miss the goal.

## Atom campaign

| Mission | Starting state and objective | Completion condition |
|---|---|---|
| Change the element | Start with neutral carbon-12. Turn it into nitrogen. | The nucleus has seven protons. Charge and neutron count are unrestricted by the mission. |
| Same element, different mass | Start with neutral oxygen-16. Make neutral oxygen-17. | Eight protons, nine neutrons, eight electrons. |
| Exact charge | Start with neutral sodium-23. Make Na⁺ while preserving the nucleus. | Eleven protons, twelve neutrons, ten electrons. |
| Arrange the electrons (optional) | Place seven electrons in the lowest-energy configuration for neutral nitrogen. | 1s² 2s² 2p³, with one electron in each 2p orbital. |
| Observe decay (optional) | Build a carbon-14 nucleus, predict the daughter element, then select **Fast-forward time**. | The player correctly predicts nitrogen and observes the beta decay into nitrogen-14. |
| Final challenge | Start with neutral oxygen-16. Deliver neutral fluorine-19. | Nine protons, ten neutrons, nine electrons. The player chooses the order of edits. |

The three required missions unlock the final challenge. Players can undo an edit, reset to the mission’s starting state, and request hints. Attempts and hints carry no penalty. Completed missions and workshop unlocks are saved. Optional missions remain available after advancing. Passing it unlocks the Molecule workshop and its opening mission, **Build Water**. The player gets two hydrogen atoms and one oxygen atom, completes the Lewis structure, and sees the result in 3D. Inspecting the oxygen opens the Atom workshop in the context of that piece. Returning restores the board and selection.

## Planned Electron Cloud improvements

- Real radial part (hydrogen-atom wavefunctions) so you can see **radial nodes** (2s has an empty inner sphere, 3s has two).
- Real spherical harmonics, including the "donut" of the dz² orbital.
- **Positive and negative phase** in two colors (key for explaining bonding as overlap of same-phase lobes).
- Two styles: point cloud (probability density) and translucent surface (the classic textbook image).
- Size depends on effective nuclear charge, so orbitals contract as atomic number increases.
- Scientific note: for multi-electron atoms there is no exact solution; hydrogen-like orbitals with effective charge are used. This is the standard teaching approximation.

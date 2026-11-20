# Human Body Viewer — Atom Workshop

The Atom workshop is the campaign entry point. Players learn to distinguish element, isotope, and charge by editing atoms in the simulator.

[Back to the design overview](human-body-viewer-design.md)

## Pieces and rules

**Pieces:** protons, neutrons, electrons.

- **Protons** define the element (adding one changes the identity, e.g. carbon to nitrogen).
- **Electrons** define the charge: more or fewer than the protons gives an **ion**.
- **Neutrons** define the **isotope**. A nucleus with an unsuitable neutron/proton ratio is unstable.
- Electrons are placed following the real rules: at most 2 per orbital (Pauli exclusion), and one in each orbital before pairing up (Hund's rule). A third electron in 1s is rejected.

## Atom routes

| Route | Purpose |
|---|---|
| `/atom/laboratorio` | Open learning view. Select any of the 118 elements from the periodic table, read its particle counts and electron configuration, and inspect the orbitals in Three.js. |
| `/atom/laboratorio/comparar` | Compare up to ten neutral atoms on a common scale. Group headers select the first available members by atomic number. The models share one orthographic camera, a Z-up grid with 50 pm divisions on all three coordinate planes, and synchronized electron samples. Each model is identified by its symbol and scaled to the [single-bond covalent radius](https://doi.org/10.1002/chem.200800987). |
| `/atom/pruebas` | Normal campaign with three particle trials followed by Electron configuration. All four trials have three stars. |
| `/atom/pruebas/[nivel]` | Full-screen timed trial, with electron configuration available after the campaign path. |

In the configuration round, the player clicks each orbital slot or presses Enter to cycle through empty, spin up, and paired spins. Tab moves between controls in the Möller diagram. Activating a subshell fills the subshells that precede it, leaving the chosen and later slots as they are. The order shows the element’s symbol and name. A third electron in one orbital is rejected. Delivery checks the lowest-energy arrangement modeled for that challenge. The two routes use the same atom model and keep independent selections. The level route occupies the viewport. The lab and level list use bottom navigation. Returning from gameplay leaves the active round in the Atom layout with its timer running.

## Timed order ladder

Each order requests a complete atom or ion. Its card shows the element symbol, an upper-left mass number, and an upper-right superscript for nonzero charge. The laboratory and all orders share three element colors: blue for metals, amber for metalloids, and mint green for nonmetals. The table has a legend and each selected element or order names its category. This teaching palette uses B, Si, Ge, As, Sb and Te as metalloids. Halogens and noble gases share the nonmetal color. For the heaviest elements, the colors follow periodic position. Changing the isotope or charge preserves the element’s category. Players start with an empty workspace for every order. The first three rounds use numeric inputs and submit with the Send button or Enter. Focus returns to the proton input after each submission. In the configuration round, the nucleus is set from the order and players fill only the orbital slots. The configuration round delivers automatically once the proton, neutron, and electron totals match and the orbital configuration is correct. The completed order remains visible briefly before the next order. The orbital round also checks the ground-state configuration.

Opening an unlocked trial starts its timer and first order immediately. Reopening an active trial during the same visit resumes the current order. Choosing a different unlocked trial starts a fresh round there and retains every star already earned. Normal mode uses the meadow map and shows the atomic number at the lower left of every particle order.

| Trial | Time | Example order |
|---|---:|---|
| Átomos neutros | 120 s | Neutral carbon-12 |
| Isótopos | 135 s | Neutral carbon-13 |
| Iones | 150 s | Carbon-12 with charge +1 |
| Configuración electrónica | 180 s | Ground-state electron configuration of carbon |

All four trials keep serving orders until time expires. Each correct order scores 100 base points. Three consecutive correct orders activate ×2 and six activate ×3. A wrong submission loses that order and resets the streak. After the error animation, play advances to the next order with a fresh workspace. Players keep their earned points and see the number of lost orders at the end of the round. In the configuration trial the game checks the arrangement when its electron count matches the order; intermediate edits below that count are free. A correct answer shows a checkmark and floating points. An incorrect answer shakes the order and shows a cross. The flame appears during a streak and changes from orange to gold to blue with the multiplier. Reduced-motion settings keep the marks and point values visible. Players can mute sound or pause the flame.

| Stars in one round | Minimum score |
|---|---:|
| ★ | 800 |
| ★★ | 1700 |
| ★★★ | 3200 |

Crossing a threshold immediately banks the highest star count for that trial. The first star unlocks the next trial, including the separate configuration level after Iones. Its first star unlocks Molecules. Players can earn all three stars in one round and continue scoring until the timer ends. Each replay starts at zero points and retains the best star count. The unified save keeps the higher of the former Easy and Hard counts for each trial.

Players choose an inclusive maximum atomic number on the campaign map or during a round: 2 (He), 10 (Ne), 18 (Ar), 36 (Kr), 54 (Xe), 86 (Rn) or 118 (Og). The initial maximum is 10. The choice is saved across trials and is independent of stars. Changing the limit keeps the clock, score and streak. Eligible orders keep their targets and any work in progress. Pending orders outside the new range are replaced without a penalty. All four trials draw from shuffled decks filtered by the selected maximum. Neutral and configuration orders use the periodic catalog, isotope orders use observed masses, and ion orders use cataloged charges.

## Laboratory orbital representations

- **Probability cloud**. Three.js draws samples from the squared hydrogenic wavefunction for occupied s, p, d, and f orbitals. Approximate screening adjusts each orbital's radial scale. Point density represents probability. A student can inspect one occupied orbital or view the selected sublevels together.
- **Orbital shape**. A shaded surface visualizes a real spherical harmonic. Extensions estimated from the radial distributions set the relative sizes of layered surfaces. It illustrates angular shape. Use the cloud to examine radial nodes. The s, p, d, and f colors are shared across the diagram and renderer. Each orbital uses a single hue across all its lobes. Its principal level and orientation vary its family hue.

The laboratory opens the occupied orbitals of the selected element as layers. A proton slider changes elements alongside the periodic table. The orbital diagrams show representative spin occupancy, grouped by shell and subshell. A Möller diagram places subshells by principal level and orbital type. The rank numbers show the approximate diagonal filling order, while the counts follow the selected atom’s reference configuration. Each subshell in the diagram contains its spin boxes directly. Students can independently show or hide occupied orbitals. Empty slots stay blank and are excluded from the 3D scene. Students can rotate and zoom, align the camera to either end of X, Y, or Z and reset the view using the viewport gizmo, and switch between representations using controls over the viewport. The nucleus is scaled relative to 1s so the inner orbital remains visible when zooming. Cloud points and electron markers scale with their orbital radius. Perspective changes their apparent size with distance from the camera. Both representations share the same scale and sampled positions. Playback starts paused. Play, pause, and previous and next frame buttons control the sequence, and a speed selector sets the sampling cadence to 1×, 2×, or 3×, with 2× selected initially. Returning to a frame restores its sampled positions for each visible electron. When changing elements, the camera eases back to its framing distance. Reduced-motion preferences suppress automatic camera motion. Neutron counts refer to a representative isotope. Configurations from meitnerium onward are marked as estimates.

Ground-state configuration reference: [NIST Periodic Table of the Elements](https://www.nist.gov/pml/periodic-table-elements).

# Interactive Human Body Viewer: Design Document

An educational 3D game where players complete simulator challenges to unlock progressively more complex workshops, from atoms to organ systems and whole-body exploration.

---

## 1. Core Idea

Every level of the hierarchy is a mini-application with its own mechanics, but all of them share one idea:

> **Each workshop builds on what the player learned in the previous one.**

What you build at a lower level becomes a compact piece you use at the next level up. The upper level **never sees the inside** of the piece, only its interface (what it can connect to, what goes in, what comes out). To see the inside, you zoom down.

---

## 2. Architecture

### 2.1 Level hierarchy

```
Subatomic particle (proton, neutron, electron)   ← base pieces, the viewer stops here
        ↓
Atom
        ↓
Molecule
        ↓
Macromolecule
        ↓
Organelle
        ↓
Cell
        ↓
Tissue
        ↓
Organ
        ↓
Organ system
        ↓
Organism (whole-body view)
```

Quarks (which make up protons and neutrons) are deliberately out of scope.

### 2.2 Every level has inputs and an output

| Level | Pieces you use (palette) | Piece you produce | What decides validity |
|---|---|---|---|
| Atom | Protons, neutrons, electrons | An element, ion, or isotope | Nucleus rules and electron filling rules |
| Molecule | Elements (atoms) | A molecule | Valence, octet rule, electronegativity |
| Macromolecule | Molecules (monomers) | A macromolecule | Compatible functional groups |
| Organelle | Macromolecules | An organelle | Function and affinity for water |
| Cell | Organelles | A cell | Which processes it needs |
| Tissue | Cells | A tissue | Function and signaling |
| Organ | Tissues | An organ | Function and organization |
| Organ system | Organs | An organ system | Coordination between organs |

**Example:** on the molecule screen, oxygen is just an "O" piece with 2 bonding hooks. You see no nucleus and no electrons. On the macromolecule screen, water or an amino acid are simple icons, not a cluster of atoms.

### 2.3 The black-box principle

Seen from above, each piece is defined only by its **interface**:

- Atom → its valence (how many hooks it has and of what kind).
- Molecule → its functional groups.
- Amino acid → its two connectable ends.
- Mitochondrion → what goes in and what comes out.

Consequences:

- **Data is hierarchical**: every object knows what it is made of.
- **Rules live separately per level**: nothing gets mixed.
- The upper level uses the piece interface for its own rules. Exploration links can skip scales when relevant, such as opening a sodium ion from a cell.

### 2.4 Two directions of movement

1. **Build upward**: you use the current level's palette and produce a piece for the next level.
2. **Explore downward (zoom)**: you tap any piece and go inside to see what it's made of, all the way down to particles.

Both coexist. In the campaign, zoom opens detailed views at unlocked levels. Locked levels can appear in the campaign map as previews with their unlock requirements.

### 2.5 Two working modes

| Mode | Levels | What the user does |
|---|---|---|
| **Build** | Atom, molecule, simple macromolecule | Assembles pieces and the system validates with real rules |
| **Explore** | Organelle and above | Zooms, toggles layers, and experiments with processes (for example, switch off the mitochondrion and see what happens) |

Solid rules (chemistry) allow building. From the organelle level upward the rules are about **flow and function**, not bonds, so you explore instead of forcing a puzzle mechanic that doesn't fit.

### 2.6 Campaign progression

- The campaign starts in the Atom workshop. Each workshop defines its unlock condition. Atom uses a ladder of timed order rounds and requires one star per level to advance. Later Explore levels can use experiments with observable goals as their required missions.
- Every mission provides a starting state, an observable goal, and the pieces or controls needed to reach it. The simulator checks the result. Any sequence of permitted actions can satisfy a construction goal.
- The player can undo each move, reset the mission, and request hints. Attempts and hints carry no progression penalty. Completed missions and workshop unlocks are saved so the player can resume the campaign.
- Unlocked workshops can be revisited. Optional missions offer more experiments and can be completed after advancing.
- The first playable campaign includes the Atom workshop, its final challenge, and the opening Molecule mission. An optional open palette can be considered later.

---

## 3. Level by Level

### 3.1 Atom

The campaign opens with the [Atom Workshop specification](human-body-viewer-atom.md), which covers particle editing, both atom views, and the missions that unlock Molecule.

### 3.2 Molecule

**Pieces:** elements, seen only as a symbol with its valence hooks.

**Two synchronized views** (a single internal structure feeds both):

1. **2D view, Lewis board ("school style")**: this is the construction tool.
   - Atoms as symbols with valence dots around them.
   - When brought together, dots pair up and become bond lines (single, double, triple).
   - Shows live whether each atom satisfies the octet (or duet for H and He).
   - Ions appear in brackets with their charge, and the transfer is animated as an electron jumping across.
2. **3D view, "how it looks in reality"** (read-only, generated from the board):
   - **Geometry** (VSEPR): water bent, CO₂ linear, NH₃ trigonal pyramidal, CH₄ tetrahedral. Lone pairs take up space.
   - **Polarity**: partial charges δ+ and δ−, dipole moment arrow. Explains why water is polar and CO₂ is not (the dipoles cancel).
   - Approximate **electrostatic potential map**: red = negative, blue = positive.
   - Representations: ball-and-stick, space-filling spheres (relative real size), and later the bonding orbitals overlapping.
   - **Cross-highlighting**: tapping a bond or atom in one view lights it up in the other.

**Bonding rules:**

- **Are there free hooks left?** An atom that has used all of its hooks doesn't accept another bond.
- **Is the result stable?** Octet or duet satisfied.
- **Bond type by electronegativity difference**: small = covalent, intermediate = polar covalent, large (metal + nonmetal) = ionic.
- **Multiple bonds** (O=O, N≡N).
- **Ionic**: one atom gives up and another gains electrons (drag a valence electron). If the transfer makes no sense (chlorine with chlorine), it is rejected and sharing is the stable outcome.
- **Charge balance**: Mg²⁺ needs two Cl⁻, so the user discovers MgCl₂, Na₂O, CaF₂, Al₂O₃. A total-charge counter shows when the compound is neutral.
- **Crystal**: ionic compounds don't form discrete molecules but a lattice of alternating ions. A "view the crystal" button repeats the pattern in 3D (a bridge toward the tissue level).

**Initial scope:** first 18 elements and unambiguous molecules (H₂O, CO₂, NH₃, CH₄, O₂, N₂). For a later phase: resonance (O₃, benzene), isomers, transition metals with variable charge (Fe²⁺/Fe³⁺), and polyatomic ions (NH₄⁺, OH⁻, SO₄²⁻) as special pieces.

### 3.3 Macromolecule

**Pieces:** molecules, especially monomers (amino acids, nucleotides, glucose units). Building atom by atom no longer applies.

- **Proteins**: the peptide bond joins two amino acids and **releases a water molecule**. A peptide is built piece by piece.
- **Starch and cellulose**: repeated glucose.
- **DNA**: four pieces with A–T and C–G pairing, a puzzle in itself.
- Real large structures (proteins, DNA) are loaded already solved from structure databases, with different representations (spheres, ribbons, sticks).
- Compatibility rule: functional groups (amino + carboxyl, etc.).

### 3.4 Organelle

**Pieces:** macromolecules (proteins, lipids, DNA).

- The criterion stops being chemical and becomes about **flow**: the cell breaks down glucose in the cytosol, and pyruvate can then enter the mitochondrion. An exploration can trace this flow and show how mitochondrial respiration contributes to ATP production.
- **Membrane**: this one can be nearly simulated with simple rules; phospholipids (water-loving head, water-avoiding tail) self-organize into a bilayer.
- Organelles with labeled parts and simple animation (mitochondrion, nucleus, ribosome, Golgi...).

### 3.5 Cell

**Pieces:** organelles.

- Model with its organelles; tapping one leads to its level.
- Compare animal vs plant cells and cell types (neuron, red blood cell).
- Here **signaling** systems begin, rather than bonds.
- Connection with what was learned earlier: Na⁺, K⁺, Ca²⁺, and Cl⁻ ions crossing the membrane generate a nerve impulse.

### 3.6 Tissue, organ, organ system, organism

**Pieces:** cells, tissues, organs, and organ systems respectively.

- **Tissue**: repeated cells forming epithelium, muscle, etc., with shape depending on function.
- **Organ**: layered model, cross-sections, animations (beating heart). The most complex ones use external anatomical models; simple ones can be schematic.
- **Organ system**: body with **toggleable layers** (skeletal, circulatory, nervous...).
- **Organism**: whole-body view from which you zoom downward once unlocked.
- **Explore** mode: toggle layers, switch parts off, and see the consequences.

---

## 4. Simulator Feedback

- **Rejected action.** A third electron in an orbital exceeds its capacity. The build stays as it was, and the interface explains the rule.
- **Goal still open.** An allowed edit can leave a mission unfinished. Show the resulting element, isotope, charge, or structure so the player can see what changed.
- **Simulated consequence.** A radioactive isotope can remain on the board for inspection. In the carbon-14 mission, **Fast-forward time** runs a visibly accelerated animation of beta emission and the change to nitrogen-14.
- **Outside the model.** If the simulator lacks a rule or data for an arrangement, identify the limit of the exercise. Each workshop defines the outcomes it can model.

After an edit, the player can undo the last action or reset to the mission's starting state. The active goal and optional hints remain available. Decay animation can use a flash and camera close-up to emphasize the transformation.

---

## 5. Scientific Limits (what is not simulated)

- **Protein folding**: already-solved structures are loaded; at most a pre-recorded transition is animated.
- **Live molecular dynamics** of many molecules: replaced by simplified animations that represent the process.
- Octet and valence rules guide the initial Lewis exercises. Validation applies to the supported catalog, with exceptions such as SF₆ and PCl₅ outside the initial scope.
- Nuclear stability is approximated with simple rules; the real nucleus is more complex.
- Orbitals of multi-electron atoms are a didactic approximation.
- The electrostatic potential map is approximated with partial charges; it is not an exact quantum calculation.

---

## 6. Suggested Roadmap

1. **Atom**. Build the timed order ladder with saved best scores, and a separate read-only laboratory for exploring orbitals from a periodic table.
2. **Molecule unlock**. Build the opening water mission with a Lewis board and synchronized 3D view. Verify that inspecting an atom and returning preserves the board.
3. **Molecule workshop expansion**. Add the rest of the initial molecule catalog, polarity, and ionic examples, then define the final challenge that unlocks Macromolecule.
4. **Ionic crystal visualization**. Extend the Molecule workshop with a lattice view.
5. **Macromolecule workshop**. Define monomer challenges and its unlock condition.
6. **Organelle and Cell**. Define experiments and progression for Explore mode.
7. **Tissue, Organ, Organ System, and Organism**. Extend anatomy exploration and connect it to unlocked workshops.

---

## 7. Non-Negotiable Principles

- Each workshop builds on the previous one. Exploration can follow relevant links across scales.
- The upper level doesn't see the inside; only the piece's interface.
- Rules live separately per level.
- The campaign unlocks workshops in order. Players can revisit unlocked workshops and inspect their pieces.
- Simulator feedback explains rejected actions, unfinished goals, and the consequences the model supports.
- The science must be correct where it aims to teach; everything else can be schematic.

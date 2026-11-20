import { Atom, subshells } from './atom.js';
import { orbitalLetters } from './elements.js';

export class OrbitalBoard {
	readonly columns = [...orbitalLetters];
	readonly rows = Array.from({ length: 7 }, (_, index) => ({
		level: index + 1,
		cells: this.columns.map(letter => subshells.find(group => group.name === (index + 1) + letter))
	}));
	readonly iguanoRows = Array.from({ length: 8 }, (_, index) => ({
		level: index + 1,
		cells: subshells.filter(group => group.shell + orbitalLetters.indexOf(group.name[1]) === index + 1)
	}));
	#marks = $state.raw<readonly number[]>([]);
	#history = $state.raw<readonly (readonly number[])[]>([]);

	has(slot: number, spin: 1 | 2) { return Boolean((this.#marks[slot] ?? 0) & spin); }
	get canUndo() { return this.#history.length > 0; }

	private electronsAt(slot: number) {
		return Number(this.has(slot, 1)) + Number(this.has(slot, 2));
	}

	get terms() {
		const terms = subshells.map(({ name, orbitals }) => ({
			name,
			count: orbitals.reduce((sum, slot) => sum + this.electronsAt(slot), 0)
		}));
		return terms.slice(0, terms.findLastIndex(term => term.count > 0) + 1);
	}

	toggle(slot: number, spin: 1 | 2) {
		const marks = [...this.#marks];
		marks[slot] = (marks[slot] ?? 0) ^ spin;
		this.#history = [...this.#history, this.#marks];
		this.#marks = marks;
	}

	undo() {
		if (!this.canUndo) return;
		this.#marks = this.#history.at(-1)!;
		this.#history = this.#history.slice(0, -1);
	}

	matches(target: Atom) {
		const counts = target.orbitals.map((_, slot) => this.electronsAt(slot));
		return counts.every((count, slot) => count !== 1 || this.has(slot, 1)) &&
			new Atom(target.protons, target.neutrons, counts).matchesConfiguration(target);
	}
}

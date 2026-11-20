import { orbitalLetters, periodicCatalog, subshellNames } from './elements.js';
import { maxObservedNeutrons } from './isotope-status.js';

const fillingRank = (name: string) => Number(name[0]) + orbitalLetters.indexOf(name[1]);

let slotCount = 0;
export const subshells = [...subshellNames]
	.sort((a, b) => fillingRank(a) - fillingRank(b) || Number(a[0]) - Number(b[0]))
	.map(name => ({
		name,
		shell: Number(name[0]),
		orbitals: Array.from({ length: 2 * orbitalLetters.indexOf(name[1]) + 1 }, () => slotCount++)
	}));

export type Particle = 'protons' | 'neutrons' | 'electrons';

export const particleMaximum = { protons: periodicCatalog.length, neutrons: maxObservedNeutrons, electrons: slotCount * 2 } as const;

export class Atom {
	readonly #orbitals: readonly number[];
	constructor(readonly protons: number, readonly neutrons: number, electrons: number | readonly number[]) {
		this.#orbitals = Object.freeze(typeof electrons === 'number' ? Atom.fill(electrons) : Array.from({ length: slotCount }, (_, slot) => electrons[slot] ?? 0));
	}

	static fill(electrons: number) {
		const slots = Array<number>(slotCount).fill(0);
		for (const group of subshells) {
			for (let pass = 0; pass < 2; pass++) {
				for (const slot of group.orbitals) {
					if (electrons === 0) return slots;
					slots[slot]++;
					electrons--;
				}
			}
		}
		return slots;
	}

	get orbitals() { return this.#orbitals; }
	get electrons() { return this.#orbitals.reduce((sum, count) => sum + count, 0); }
	get charge() { return this.protons - this.electrons; }
	get chargeLabel() { return this.charge > 0 ? '+' + this.charge : String(this.charge); }
	get nuclideCharge() {
		if (!this.charge) return '';
		const magnitude = Math.abs(this.charge);
		return (magnitude === 1 ? '' : String(magnitude)) + (this.charge > 0 ? '+' : '−');
	}
	get mass() { return this.protons + this.neutrons; }
	get symbol() { return periodicCatalog[this.protons - 1]?.symbol ?? '—'; }
	get name() { return periodicCatalog[this.protons - 1]?.name ?? 'Núcleo vacío'; }
	get family() { return periodicCatalog[this.protons - 1]?.family; }
	get category() { return periodicCatalog[this.protons - 1]?.category; }
	matchesConfiguration(target: Atom) {
		const expected = target.orbitals;
		return subshells.every(({ orbitals }) => {
			const actual = orbitals.map(slot => this.#orbitals[slot]).sort();
			const target = orbitals.map(slot => expected[slot]).sort();
			return actual.every((count, index) => count === target[index]);
		});
	}
	quantumElectron(previous?: Atom) {
		// When the configuration rearranges, choose the last subshell that gained occupancy.
		const group = subshells.findLast(({ orbitals }) =>
			orbitals.reduce((gain, slot) => gain + this.orbitals[slot] - (previous?.orbitals[slot] ?? 0), 0) > 0
		);
		if (!group) return;
		const width = group.orbitals.length;
		const l = (width - 1) / 2;
		const count = group.orbitals.reduce((total, slot) => total + this.orbitals[slot], 0);
		return { subshell: group.name, n: group.shell, l, ml: (count - 1) % width - l, ms: count > width ? -0.5 : 0.5 };
	}

	get configuration() {
		const digits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
		return subshells.map(({ name, orbitals }) => {
			const count = orbitals.reduce<number>((total, slot) => total + this.#orbitals[slot], 0);
			return count ? name + [...String(count)].map(digit => digits[Number(digit)]).join('') : '';
		}).filter(Boolean).join(' ') || 'Sin electrones';
	}

	withParticleCount(particle: Particle, count: number): Atom | string {
		if (!Number.isInteger(count) || count < 0 || count > particleMaximum[particle]) {
			return 'Ese número de partículas queda fuera del modelo del taller.';
		}
		if (this[particle] === count) return this;
		return new Atom(
			particle === 'protons' ? count : this.protons,
			particle === 'neutrons' ? count : this.neutrons,
			particle === 'electrons' ? count : this.#orbitals
		);
	}

	withOrbitalCount(slot: number, count: number): Atom | string {
		if (!Number.isInteger(slot) || slot < 0 || slot >= this.#orbitals.length) return 'Ese orbital queda fuera del modelo.';
		if (!Number.isInteger(count) || count < 0 || count > 2) return 'Un orbital admite 0, 1 o 2 electrones.';
		if (count === this.#orbitals[slot]) return this;
		return new Atom(this.protons, this.neutrons, this.#orbitals.map((value, index) => slot === index ? count : value));
	}

	withFilledSubshellsBefore(name: string) {
		const index = subshells.findIndex(group => group.name === name);
		const earlierSlots = subshells.slice(0, Math.max(0, index)).flatMap(group => group.orbitals);
		if (earlierSlots.every(slot => this.#orbitals[slot] === 2)) return this;

		const orbitals = [...this.#orbitals];
		for (const slot of earlierSlots) orbitals[slot] = 2;
		return new Atom(this.protons, this.neutrons, orbitals);
	}

	decay(): Atom | string {
		if (this.protons !== 6 || this.neutrons !== 8) return 'Construye primero un núcleo de carbono-14.';
		return new Atom(7, 7, this.orbitals);
	}
}

export const neutralCatalog = periodicCatalog.map(element => {
	const groups = new Map(element.subshells.map(group => [group.name, group.orbitals]));
	const orbitals = subshells.flatMap(group => groups.get(group.name)!.map(orbital => orbital.electrons));
	return new Atom(element.protons, element.neutrons, orbitals);
});

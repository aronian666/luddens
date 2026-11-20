import { periodicCatalog, type PeriodicAtom } from './elements.js';

import { ElectronPlayback } from './explorer.svelte.js';

export class AtomComparison {
	readonly limit = 10;
	readonly playback = new ElectronPlayback();
	#atoms = $state.raw<readonly PeriodicAtom[]>([periodicCatalog[2], periodicCatalog[10]]);

	get atoms() { return this.#atoms; }
	get full() { return this.#atoms.length === this.limit; }

	toggle(atom: PeriodicAtom) {
		if (this.#atoms.includes(atom)) this.#atoms = this.#atoms.filter(selected => selected !== atom);
		else if (!this.full) this.#atoms = [...this.#atoms, atom];
	}

	selectGroup(group: number) {
		this.#atoms = periodicCatalog.filter(atom => atom.group === group).slice(0, this.limit);
	}
}

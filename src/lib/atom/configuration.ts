import { Atom, subshells } from './atom.js';

type Term = { name: string; count: number };

export class Configuration {
	constructor(
		readonly core?: Atom | null,
		readonly terms: readonly Term[] = [],
		readonly level = '',
		readonly letter = ''
	) {}

	get prompt() {
		if (this.core === undefined) return 'Gas noble';
		if (!this.level) return 'Nivel';
		return this.letter ? 'Superíndice (electrones)' : 'Subnivel';
	}

	get options() {
		const available = subshells.filter(group =>
			!this.core?.orbitals[group.orbitals[0]] && !this.terms.some(term => term.name === group.name)
		);
		if (!this.level) return [...new Set(available.map(group => String(group.shell)))].sort();
		if (!this.letter) return available.filter(group => String(group.shell) === this.level).map(group => group.name[1]);
		const group = available.find(group => group.name === this.level + this.letter);
		return Array.from({ length: (group?.orbitals.length ?? 0) * 2 }, (_, i) => String(i + 1));
	}

	choose(value: string) {
		if (this.core === undefined || !this.options.includes(value)) return this;
		if (!this.level) return new Configuration(this.core, this.terms, value);
		if (!this.letter) return new Configuration(this.core, this.terms, this.level, value);
		return new Configuration(this.core, [...this.terms, { name: this.level + this.letter, count: Number(value) }]);
	}

	get complete() { return (Boolean(this.core) || this.terms.length > 0) && !this.level; }

	matches(target: Atom) {
		return this.complete && subshells.every(({ name, orbitals }) => {
			const expected = orbitals.reduce((sum, slot) => sum + target.orbitals[slot] - (this.core?.orbitals[slot] ?? 0), 0);
			return expected === (this.terms.find(term => term.name === name)?.count ?? 0);
		});
	}
}

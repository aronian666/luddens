import { periodicData } from './periodic-data.js';

// Single-bond covalent radii in pm, ordered by atomic number (one line per period).
// Pyykkö & Atsumi, https://doi.org/10.1002/chem.200800987
const covalentRadiiPm = [
	32, 46,
	133, 102, 85, 75, 71, 63, 64, 67,
	155, 139, 126, 116, 111, 103, 99, 96,
	196, 171, 148, 136, 134, 122, 119, 116, 111, 110, 112, 118, 124, 121, 121, 116, 114, 117,
	210, 185, 163, 154, 147, 138, 128, 125, 125, 120, 128, 136, 142, 140, 140, 136, 133, 131,
	232, 196, 180, 163, 176, 174, 173, 172, 168, 169, 168, 167, 166, 165, 164, 170, 162, 152, 146, 137, 131, 129, 122, 123, 124, 133, 144, 144, 151, 145, 147, 142,
	223, 201, 186, 175, 169, 170, 171, 172, 166, 166, 168, 168, 165, 167, 173, 176, 161, 157, 149, 143, 141, 134, 129, 128, 121, 122, 136, 143, 162, 175, 165, 157
];

const columnCount = 18;
const span = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, index) => first + index);
const space = (count: number) => Array<number>(count).fill(0);
const periodNumbers = [
	[1, ...space(16), 2],
	[3, 4, ...space(10), ...span(5, 10)],
	[11, 12, ...space(10), ...span(13, 18)],
	span(19, 36),
	span(37, 54),
	[55, 56, 0, ...span(72, 86)],
	[87, 88, 0, ...span(104, 118)]
];
const innerRows = [span(57, 71), span(89, 103)];
const nonmetals = new Set([1, 6, 7, 8, 15, 16, 34]);
const metalloids = new Set([5, 14, 32, 33, 51, 52]);
export const elementCategoryLabels = { metal: 'Metal', metalloid: 'Metaloide', nonmetal: 'No metal' } as const;

export const orbitalLetters = 'spdf';
export type Orbital = Readonly<{ key: string; n: number; l: number; axis: number; label: string; electrons: number }>;
export type LabSubshell = Readonly<{ name: string; n: number; l: number; electrons: number; orbitals: readonly Orbital[] }>;
const orbitalLabels = [
	['Esférico'],
	['x', 'y', 'z'],
	['xy', 'yz', 'z²', 'xz', 'x²−y²'],
	['|m|=3 · sen', '|m|=2 · sen', '|m|=1 · sen', 'm=0', '|m|=1 · cos', '|m|=2 · cos', '|m|=3 · cos']
];
export const subshellNames = '1s 2s 2p 3s 3p 3d 4s 4p 4d 4f 5s 5p 5d 5f 6s 6p 6d 7s 7p'.split(' ');
const superscripts = '⁰¹²³⁴⁵⁶⁷⁸⁹';

export class PeriodicAtom {
	readonly symbol: string;
	readonly name: string;
	readonly mass: number;
	readonly configuration: string;
	readonly subshells: readonly LabSubshell[];

	constructor(readonly protons: number, private readonly expanded: string, readonly charge = 0, massNumber?: number) {
		const [symbol, name, mass] = periodicData[protons - 1];
		this.symbol = symbol;
		this.name = name;
		this.mass = massNumber ?? mass;
		const occupancy = new Map(Array.from(expanded.matchAll(/([1-7][spdf])(\d+)/g), ([, shell, count]) => [shell, Number(count)]));
		if (charge !== 0) {
			const removal = charge > 0;
			const order = [...subshellNames].sort((a, b) => {
				const nA = Number(a[0]), nB = Number(b[0]);
				const lA = orbitalLetters.indexOf(a[1]), lB = orbitalLetters.indexOf(b[1]);
				return removal ? nB - nA || lB - lA : nA + lA - nB - lB || nA - nB;
			});
			let remaining = Math.abs(charge);
			for (const name of order) {
				const count = occupancy.get(name) ?? 0;
				const capacity = 2 * (2 * orbitalLetters.indexOf(name[1]) + 1);
				const change = Math.min(remaining, removal ? count : capacity - count);
				occupancy.set(name, count + (removal ? -change : change));
				remaining -= change;
				if (remaining === 0) break;
			}
		}
		this.subshells = subshellNames.map(name => {
			const n = Number(name[0]);
			const l = orbitalLetters.indexOf(name[1]);
			const electrons = occupancy.get(name) ?? 0;
			const orbitals = orbitalLabels[l].map((label, axis) => ({
				key: name + ':' + axis, label, n, l, axis, electrons: Number(axis < electrons) + Number(axis < electrons - (2 * l + 1))
			}));
			return { name, n, l, electrons, orbitals };
		});
		this.configuration = this.subshells.filter(group => group.electrons > 0)
			.map(group => group.name + [...String(group.electrons)].map(digit => superscripts[Number(digit)]).join('')).join(' ');
	}

	get covalentRadiusPm() { return covalentRadiiPm[this.protons - 1]; }

	get occupiedOrbitals() {
		return this.subshells.flatMap(group => group.orbitals.filter(orbital => orbital.electrons > 0));
	}

	get outerConfiguration() {
		const occupied = this.subshells.filter(group => group.electrons > 0);
		const outerLevel = occupied.at(-1)?.n;
		return occupied.filter(group => group.n === outerLevel).map(group =>
			group.name + [...String(group.electrons)].map(digit => superscripts[Number(digit)]).join('')
		).join(' ');
	}

	get neutrons() { return this.mass - this.protons; }
	get hasAlternateMass() { return this.mass !== periodicData[this.protons - 1][2]; }
	get isIon() { return this.charge !== 0; }
	get electrons() { return this.protons - this.charge; }
	get #ionData() { return periodicData[this.protons - 1]; }

	get minCharge() { return (this.#ionData[4] ?? 0) > 0 ? -1 : 0; }
	get firstCationCharge() { return this.#ionData[5][0]?.[0]; }
	get maxCharge() { return this.#ionData[5].at(-1)?.[1] ?? 0; }

	chargeIssue(charge: number): string | null {
		if (!Number.isInteger(charge)) return 'La carga debe ser un número entero.';
		if (charge === 0) return null;
		if (charge > this.protons) return 'La carga no puede superar el número de protones. Puedes quitar como máximo ' + this.protons + ' electrones.';
		if (charge > 0) {
			return this.#ionData[5].some(([min, max]) => charge >= min && charge <= max)
				? null : 'NIST ASD no registra esta carga positiva para ' + this.name + '.';
		}

		const affinity = this.#ionData[4];
		if (charge < -1) return 'El catálogo no respalda un ion de ' + this.name + ' aislado con dos o más electrones extra.';
		if (affinity === 0) return this.name + ' no liga un electrón extra en su estado fundamental.';
		if (affinity === null) return 'La referencia consultada no aporta una medición que confirme un anión de ' + this.name + ' aislado.';
		return null;
	}

	withComposition(mass: number, charge: number) {
		return mass === this.mass && charge === this.charge ? this : new PeriodicAtom(this.protons, this.expanded, charge, mass);
	}
	get estimated() { return this.protons >= 109; }
	get group() {
		const row = periodNumbers.find(row => row.includes(this.protons));
		return row ? row.indexOf(this.protons) + 1 : undefined;
	}
	get family() {
		const z = this.protons;
		if (z >= 57 && z <= 71) return 'lanthanide';
		if (z >= 89 && z <= 103) return 'actinide';
		if (nonmetals.has(z)) return 'nonmetal';
		if (metalloids.has(z)) return 'metalloid';
		const group = this.group!;
		if (group === 1) return 'alkali';
		if (group === 2) return 'alkaline-earth';
		if (group === 17) return 'halogen';
		if (group === 18) return 'noble-gas';
		return group <= 12 ? 'transition' : 'post-transition';
	}

	get category(): keyof typeof elementCategoryLabels {
		switch (this.family) {
			case 'metalloid': return 'metalloid';
			case 'halogen':
			case 'noble-gas':
			case 'nonmetal': return 'nonmetal';
			default: return 'metal';
		}
	}
}

const expandedConfigurations = new Map<string, string>();
export const periodicCatalog = periodicData.map(([symbol, , , configuration], index) => {
	const expanded = configuration.replace(/\[(\w+)\]/, (_, core) => expandedConfigurations.get(core)!);
	expandedConfigurations.set(symbol, expanded);
	return new PeriodicAtom(index + 1, expanded);
});

export const periodicGroups = span(1, columnCount);
export const periodicRows = [
	...periodNumbers.map((row, index) => ({ label: String(index + 1), numbers: row })),
	{ label: 'Ln', numbers: [0, 0, ...innerRows[0], 0] },
	{ label: 'An', numbers: [0, 0, ...innerRows[1], 0] }
].map(row => ({ label: row.label, atoms: row.numbers.map(number => periodicCatalog[number - 1]) }));

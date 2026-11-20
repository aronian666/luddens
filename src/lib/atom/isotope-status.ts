import { observedIsotopeData } from './isotope-data.js';
import type { PeriodicAtom } from './elements.js';

const observedIsotopes = observedIsotopeData.map(row => row.split(' ').map(entry => ({
	mass: Number(entry.slice(0, -1)),
	status: entry.slice(-1)
})));

export const maxObservedNeutrons = Math.max(...observedIsotopes.map((isotopes, index) =>
	Math.max(...isotopes.map(isotope => isotope.mass - (index + 1)))
));

export function alternateIsotopeMass(atom: PeriodicAtom) {
	const alternatives = observedIsotopes[atom.protons - 1].filter(isotope => isotope.mass !== atom.mass);
	const natural = alternatives.filter(isotope => isotope.status === 's' || isotope.status === 'r');
	const candidates = natural.length ? natural : alternatives;
	return candidates.toSorted((a, b) => Math.abs(a.mass - atom.mass) - Math.abs(b.mass - atom.mass))[0]?.mass;
}

export function isotopeStatus(atom: PeriodicAtom) {
	const isotopes = observedIsotopes[atom.protons - 1];
	const isotope = isotopes.find(entry => entry.mass === atom.mass);
	const name = atom.name + '-' + atom.mass;

	switch (isotope?.status) {
		case 's':
			return null;
		case 'r':
			return { tone: 'warning', message: name + ' es radiactivo y tiene abundancia natural registrada. Su núcleo se desintegra con el tiempo.' } as const;
		case 'u':
			return { tone: 'warning', message: name + ' se ha observado, pero su núcleo pierde partículas y se desintegra rápidamente.' } as const;
		case 'd':
			return { tone: 'warning', message: name + ' es un isótopo radiactivo observado. NUBASE2020 no indica su abundancia natural.' } as const;
		default: {
			const stable = isotopes.filter(entry => entry.status === 's');
			const candidates = stable.length ? stable : isotopes;
			const closest = candidates.reduce((best, entry) =>
				Math.abs(entry.mass - atom.mass) < Math.abs(best.mass - atom.mass) ? entry : best
			);
			return {
				tone: 'error',
				message: name + ' no figura como observado en NUBASE2020. Prueba con ' + (closest.mass - atom.protons)
					+ ' neutrones para ver un isótopo ' + (stable.length ? 'estable' : 'observado') + '.'
			} as const;
		}
	}
}

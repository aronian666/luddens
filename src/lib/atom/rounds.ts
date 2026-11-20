import { Atom, neutralCatalog } from './atom.js';
import { periodicCatalog } from './elements.js';
import { alternateIsotopeMass } from './isotope-status.js';

type Round = {
	title: string;
	lesson: string;
	seconds: number;
	manual: boolean;
	kernel?: boolean;
	quantum?: boolean;
	recipes: readonly Atom[];
};

function recipe(protons: number, neutrons: number, electrons = protons): Atom {
	return new Atom(protons, neutrons, electrons);
}

export const nobleGases = periodicCatalog.filter(element => element.group === 18);
export const kernelCores = nobleGases.filter(gas => gas.protons > 2);
export const starScores = [800, 1700, 3200] as const;

const heavierElements = periodicCatalog.filter(element => element.protons > 36);
const heavierIsotopes = heavierElements.flatMap(element => {
	const mass = alternateIsotopeMass(element);
	return mass === undefined ? [] : [recipe(element.protons, mass - element.protons)];
});
const heavierIons = heavierElements.flatMap(element => {
	const charge = element.family === 'halogen' && element.minCharge === -1 ? -1 : element.firstCationCharge;
	return charge === undefined ? [] : [recipe(element.protons, element.neutrons, element.protons - charge)];
});

const notation = 'El número de abajo a la izquierda (Z) indica los protones. El de arriba a la izquierda (A) suma protones y neutrones. En un átomo neutro hay tantos electrones como protones.';

export const rounds: readonly Round[] = [
	{
		title: 'Átomos neutros',
		lesson: notation + ' Por ejemplo, para preparar carbono con masa 12, añade 6 protones, 6 neutrones y 6 electrones.',
		seconds: 120, manual: false,
		recipes: neutralCatalog
	},
	{
		title: 'Isótopos',
		lesson: 'Calcula los neutrones restando los protones del número de masa. El carbono de masa 13 conserva los seis protones del carbono y tiene siete neutrones. Los pedidos de esta ronda son neutros.',
		seconds: 135, manual: false,
		recipes: [
			recipe(6, 7), recipe(1, 1), recipe(2, 1), recipe(6, 6), recipe(8, 10), recipe(10, 12),
			recipe(12, 14), recipe(14, 16), recipe(17, 20), recipe(18, 18), recipe(18, 22),
			recipe(19, 22), recipe(20, 24), recipe(22, 24), recipe(26, 31), recipe(28, 32),
			recipe(30, 36), recipe(34, 44), recipe(35, 46), recipe(36, 50), ...heavierIsotopes
		]
	},
	{
		title: 'Iones',
		lesson: 'La carga indica cuántos electrones faltan o sobran respecto al número de protones. Con 2+ hay dos electrones menos y con 1− hay uno más. El núcleo se conserva.',
		seconds: 150, manual: false,
		recipes: [
			recipe(6, 6, 5), recipe(1, 0, 0), recipe(2, 2, 1), recipe(8, 8, 9), recipe(9, 10, 10), recipe(10, 10, 9),
			recipe(11, 12, 10), recipe(12, 12, 10), recipe(13, 14, 10),
			recipe(17, 18, 18), recipe(18, 22, 17),
			recipe(19, 20, 18), recipe(20, 20, 18), recipe(24, 28, 21), recipe(26, 30, 24),
			recipe(29, 34, 28), recipe(30, 34, 28), recipe(35, 44, 36), recipe(36, 48, 35), ...heavierIons
		]
	},
	{
		title: 'Configuración electrónica',
		lesson: 'Completa el diagrama desde 1s. Marca primero un espín ↑ por orbital del subnivel y luego empareja los electrones con ↓.',
		seconds: 180, manual: true,
		recipes: neutralCatalog
	},
	{
		title: 'Configuración abreviada (kernel)',
		lesson: 'Antes del neón, escribe la configuración completa desde 1s. Si el pedido es neón u otro gas noble más pesado, elige su propia ficha y envíala. Para los demás elementos, elige el gas noble anterior y completa los subniveles restantes.',
		seconds: 180, manual: true, kernel: true,
		recipes: neutralCatalog
	},
	{
		title: 'Números cuánticos',
		lesson: 'Escribe los cuatro números del último electrón del subnivel indicado. Recorre los orbitales de −ℓ a +ℓ. Coloca primero un electrón de espín +½ en cada orbital y luego emparéjalos con espín −½.',
		seconds: 180, manual: false, quantum: true,
		recipes: neutralCatalog
	}
];

export type Order = { target: Atom; number: number };

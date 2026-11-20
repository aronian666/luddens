import type { CameraView } from './axes.js';
import { orbitalLetters, periodicCatalog, type Orbital } from './elements.js';
import { cloudParticleRange } from './orbital-cloud.js';
import { isotopeStatus } from './isotope-status.js';
import { orbitalHue } from './orbital-colors.js';

export type Representation = 'cloud' | 'shape';

const spanishNumber = new Intl.NumberFormat('es');
const spinMarks = ['', '↑', '↑↓'];
const spinLabels = ['vacío', 'un electrón, espín arriba', 'dos electrones, espines opuestos'];
const fillingOrder = [...periodicCatalog[0].subshells].sort((a, b) => (a.n + a.l) - (b.n + b.l) || a.n - b.n);
const fillingRanks = new Map(fillingOrder.map((group, index) => [group.name, index + 1]));
const diagonalStops = new Set(fillingOrder.filter(group =>
	fillingOrder.some(next => next.n === group.n + 1 && next.l === group.l - 1)
).map(group => group.name));

export class ElectronPlayback {
	#frame = $state(0);
	#playing = $state(false);
	#elapsed = 0;

	get frame() { return this.#frame; }
	get playing() { return this.#playing; }

	toggle() { this.#playing = !this.#playing; }

	step(direction: -1 | 1) {
		this.#playing = false;
		this.#frame = Math.max(0, this.#frame + direction);
		this.#elapsed = 0;
	}

	reset() {
		this.#frame = 0;
		this.#elapsed = 0;
	}

	tick(elapsed: number, speed: number) {
		const frameDuration = 0.65;
		this.#elapsed += elapsed * speed;
		const frames = Math.floor(this.#elapsed / frameDuration);
		if (frames === 0) return;
		this.#elapsed -= frames * frameDuration;
		this.#frame += frames;
	}
}

export class AtomExplorer {
	#atom = $state.raw(periodicCatalog[0]);
	#hidden = $state.raw<ReadonlySet<string>>(new Set());
	#representation = $state<Representation>('shape');
	#electronSpeed = $state(2);
	#cloudParticles: number = $state(cloudParticleRange.initial);
	readonly cloudParticleRange = cloudParticleRange;
	readonly playback = new ElectronPlayback();
	readonly maxProtons = periodicCatalog.length;
	readonly maxMass = 400;
	#cameraRequest = $state.raw<{ view: CameraView }>();
	readonly orbitalTypes = [...orbitalLetters];
	#editError = $state<{ field: string; message: string } | null>(null);
	readonly #isotopeStatus = $derived(isotopeStatus(this.#atom));
	readonly #occupied = $derived(this.#atom.occupiedOrbitals);

	get atom() { return this.#atom; }
	get editError() { return this.#editError; }
	get feedback() {
		return this.#editError ? { tone: 'error' as const, message: this.#editError.message } : this.#isotopeStatus;
	}

	get protons() { return this.#atom.protons; }
	set protons(value: number) {
		if (this.#validCount('Protones', value, 1, this.maxProtons)) this.select(value);
	}

	get mass() { return this.#atom.mass; }
	set mass(value: number) {
		if (this.#validCount('Número de masa', value, this.protons, this.maxMass)) {
			this.#atom = this.#atom.withComposition(value, this.#atom.charge);
		}
	}

	get neutrons() { return this.#atom.neutrons; }
	set neutrons(value: number) {
		if (this.#validCount('Neutrones', value, 0, this.maxMass - this.protons)) {
			this.#atom = this.#atom.withComposition(this.protons + value, this.#atom.charge);
		}
	}

	#validCount(field: string, value: number, min: number, max: number) {
		const valid = Number.isInteger(value) && value >= min && value <= max;
		this.#editError = valid ? null : { field, message: '«' + field + '» debe ser un número entero entre ' + min + ' y ' + max + '.' };
		return valid;
	}

	get charge() { return this.#atom.charge; }
	set charge(value: number) {
		const message = this.#atom.chargeIssue(value);
		this.#editError = message ? { field: 'Carga', message } : null;
		if (message || value === this.#atom.charge) return;
		this.#atom = this.#atom.withComposition(this.mass, value);
		this.#hidden = new Set();
		this.playback.reset();
	}

	get cameraRequest() { return this.#cameraRequest; }
	get representation() { return this.#representation; }
	readonly electronSpeedOptions = [1, 2, 3]
		.map(value => ({ value, label: '×' + value }));

	get cloudParticles() { return this.#cloudParticles; }
	set cloudParticles(value: number) {
		if (!Number.isFinite(value)) return;
		const { min, max, step } = this.cloudParticleRange;
		this.#cloudParticles = Math.max(min, Math.min(max, min + Math.round((value - min) / step) * step));
	}
	get cloudParticleLabel() { return spanishNumber.format(this.#cloudParticles); }
	get cloudParticleTotalLabel() { return spanishNumber.format(this.visibleElectronCount * this.#cloudParticles); }

	get electronSpeed() { return this.#electronSpeed; }
	set electronSpeed(value: number) {
		if (this.electronSpeedOptions.some(option => option.value === value)) this.#electronSpeed = value;
	}

	get diagram() {
		return Array.from({ length: 7 }, (_, index) => {
			const n = index + 1;
			return {
				n,
				cells: this.orbitalTypes.map((letter, l) => {
					const group = this.#atom.subshells.find(group => group.n === n && group.l === l);
					return group && {
						...group,
						hue: orbitalHue(group.l, group.l, group.n),
						rank: fillingRanks.get(n + letter),
						nextDiagonal: diagonalStops.has(group.name),
						slots: group.orbitals.map(orbital => ({
							orbital,
							hue: orbitalHue(group.l, orbital.axis, group.n),
							checked: orbital.electrons > 0 && !this.#hidden.has(orbital.key),
							spin: spinMarks[orbital.electrons],
							label: group.name + ' ' + orbital.label + ', ' + spinLabels[orbital.electrons]
						}))
					};
				})
			};
		});
	}

	get visibleOrbitals(): readonly Orbital[] {
		return this.#occupied.filter(orbital => !this.#hidden.has(orbital.key));
	}

	get visibleElectronCount() {
		return this.visibleOrbitals.reduce((total, orbital) => total + orbital.electrons, 0);
	}

	select(protons: number) {
		const atom = periodicCatalog[protons - 1];
		if (!atom) return;
		this.#editError = null;
		if (atom.protons === this.protons) return;
		const charge = atom.chargeIssue(this.charge) ? 0 : this.charge;
		this.#atom = atom.withComposition(atom.mass, charge);
		this.#hidden = new Set();
		this.playback.reset();
	}

	setOrbitalVisible(orbital: Orbital, visible: boolean) {
		if (!orbital.electrons) return;
		const hidden = new Set(this.#hidden);
		if (visible) hidden.delete(orbital.key);
		else hidden.add(orbital.key);
		this.#hidden = hidden;
	}

	setRepresentation(representation: Representation) { this.#representation = representation; }
	orientCamera(view: CameraView) {
		this.#cameraRequest = { view };
	}
}

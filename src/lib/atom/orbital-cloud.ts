import type { Orbital, PeriodicAtom } from './elements.js';

export const cloudParticleRange = { min: 500, max: 40000, step: 500, initial: 4000 } as const;
const goldenRatioConjugate = (Math.sqrt(5) - 1) / 2;
const radialSamples = 1500;
const displayUnit = 0.22;
const orbitalExtentQuantile = 0.97;

function laguerre(order: number, alpha: number, x: number) {
	let previous = 0;
	let value = 1;
	for (let k = 1; k <= order; k++) {
		const next = ((2 * k - 1 + alpha - x) * value - (k - 1 + alpha) * previous) / k;
		previous = value;
		value = next;
	}
	return value;
}

export function angularAmplitude(orbital: Orbital, x: number, y: number, z: number) {
	const { l, axis } = orbital;
	if (l === 0) return 1;
	if (l === 1) return axis === 0 ? x : axis === 1 ? y : z;

	// Real spherical harmonics, divided by sqrt((2l + 1) / (4π)).
	const m = axis - l;
	const order = Math.abs(m);
	let diagonal = 1;
	const planarRadius = Math.sqrt(Math.max(0, 1 - z * z));
	let normalization = 1;
	for (let k = 1; k <= order; k++) {
		diagonal *= -(2 * k - 1) * planarRadius;
		normalization /= (l - k + 1) * (l + k);
	}
	let previous = 0;
	let value = diagonal;
	for (let degree = order + 1; degree <= l; degree++) {
		const next = ((2 * degree - 1) * z * value - (degree + order - 1) * previous) / (degree - order);
		previous = value;
		value = next;
	}
	if (m === 0) return value;
	const angle = order * Math.atan2(y, x);
	return Math.sqrt(2 * normalization) * value * (m < 0 ? Math.sin(angle) : Math.cos(angle));
}

export function lobeRadius(amplitude: number, peak: number) {
	return (Math.abs(amplitude) / peak) ** 0.8;
}

function insideContour(radius: number, angular: number, extent: number, peak: number) {
	// Leave room for the rendered point or marker at the edge of the surface.
	return radius <= 0.94 * extent * lobeRadius(angular, peak);
}

export function effectiveCharge(atom: PeriodicAtom, orbital: Orbital) {
	const { n, l, electrons } = orbital;
	let screening = 0;
	for (const group of atom.subshells) {
		if (l >= 2) {
			if (group.n < n || (group.n === n && group.l < l)) screening += group.electrons;
			if (group.n === n && group.l === l) screening += 0.35 * group.electrons;
		} else if (group.n === n && group.l < 2) {
			screening += group.electrons * (n === 1 ? 0.3 : 0.35);
		} else if (group.n < n) {
			screening += group.electrons * (group.n === n - 1 ? 0.85 : 1);
		}
	}
	if (electrons > 0) screening -= n === 1 ? 0.3 : 0.35;
	return Math.max(1, atom.protons - screening);
}

class RadialDistribution {
	readonly #cdf = new Float64Array(radialSamples + 1);
	readonly #step: number;
	constructor(readonly n: number, readonly l: number) {
		this.#step = 3.5 * n * n / radialSamples;
		for (let i = 1; i <= radialSamples; i++) {
			const radius = (i - 0.5) * this.#step;
			this.#cdf[i] = this.#cdf[i - 1] + (radius * this.amplitude(radius)) ** 2;
		}
	}

	amplitude(radius: number) {
		const rho = 2 * radius / this.n;
		return rho ** this.l * laguerre(this.n - this.l - 1, 2 * this.l + 1, rho) * Math.exp(-rho / 2);
	}

	quantile(fraction: number) {
		const target = fraction * this.#cdf[radialSamples];
		let low = 0;
		let high = radialSamples;
		while (high - low > 1) {
			const middle = (low + high) >> 1;
			if (this.#cdf[middle] < target) low = middle;
			else high = middle;
		}
		return (low + (target - this.#cdf[low]) / (this.#cdf[high] - this.#cdf[low])) * this.#step;
	}
}

export class OrbitalCloudSampler {
	#seed: number;
	readonly #radial = new Map<string, RadialDistribution>();

	constructor(seed = 57) { this.#seed = seed; }

	#random() {
		this.#seed = (Math.imul(this.#seed, 1664525) + 1013904223) >>> 0;
		return this.#seed / 4294967296;
	}

	extent(orbital: Orbital) {
		return this.#distribution(orbital).quantile(orbitalExtentQuantile) * displayUnit;
	}

	#distribution({ n, l }: Orbital) {
		const key = n + ':' + l;
		let radial = this.#radial.get(key);
		if (!radial) {
			radial = new RadialDistribution(n, l);
			this.#radial.set(key, radial);
		}
		return radial;
	}

	#samplePoint(orbital: Orbital, radial: RadialDistribution, radialFraction = this.#random()) {
		while (true) {
			const z = 2 * this.#random() - 1;
			const angle = this.#random() * Math.PI * 2;
			const planar = Math.sqrt(1 - z * z);
			const x = planar * Math.cos(angle);
			const y = planar * Math.sin(angle);
			const angular = angularAmplitude(orbital, x, y, z);
			if (this.#random() > angular * angular) continue;
			const radius = radial.quantile(radialFraction);
			return { x, y, z, angular, radius };
		}
	}

	framePositions(orbital: Orbital, frame: number, protons: number, peak: number) {
		const orbitalSeed = (protons * 1000) + orbital.n * 100 + orbital.l * 10 + orbital.axis;
		const sampler = new OrbitalCloudSampler(orbitalSeed ^ Math.imul(frame + 1, 0x9e3779b9));
		const radial = this.#distribution(orbital);
		const extent = radial.quantile(orbitalExtentQuantile);
		// Reject samples outside the same contour used for the cloud.
		return Array.from({ length: orbital.electrons }, () => {
			let point = sampler.#samplePoint(orbital, radial);
			while (!insideContour(point.radius, point.angular, extent, peak)) {
				point = sampler.#samplePoint(orbital, radial);
			}
			const { x, y, z, radius } = point;
			return { x, y, z, radius: radius * displayUnit };
		});
	}

	sample(orbital: Orbital, capacity: number, peak: number) {
		const radial = this.#distribution(orbital);
		const extent = radial.quantile(orbitalExtentQuantile);
		const positions = new Float32Array(capacity * 3);
		// A stable seed keeps existing positions when a larger buffer is needed.
		const sampler = new OrbitalCloudSampler(1 + orbital.n * 100 + orbital.l * 10 + orbital.axis);
		const offset = sampler.#random();
		for (let attempt = 0, point = 0; point < capacity; attempt++) {
			// Spread each prefix across the radial distribution so changing the draw count keeps the same profile.
			const fraction = (offset + attempt * goldenRatioConjugate) % 1;
			const { x, y, z, radius, angular } = sampler.#samplePoint(orbital, radial, fraction);
			if (!insideContour(radius, angular, extent, peak)) continue;
			const index = point++ * 3;
			const distance = radius * displayUnit;
			positions[index] = x * distance;
			positions[index + 1] = y * distance;
			positions[index + 2] = z * distance;
		}
		return positions;
	}
}

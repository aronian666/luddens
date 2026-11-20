import {
	BufferAttribute, BufferGeometry, Color, DataTexture, DoubleSide, Group, InstancedMesh, Matrix4,
	LineBasicMaterial, LineLoop, LinearFilter, Mesh, MeshBasicMaterial, MeshStandardMaterial, Points,
	PointsMaterial, SphereGeometry, SRGBColorSpace, Vector3
} from 'three';
import { createSceneAxes } from './axes.js';
import { Atom, subshells } from './atom.js';
import { periodicData } from './periodic-data.js';
import { orbitalHue } from './orbital-colors.js';
import { PeriodicAtom, type Orbital } from './elements.js';
import type { ElectronPlayback, Representation } from './explorer.svelte.js';
import { angularAmplitude, effectiveCharge, OrbitalCloudSampler, cloudParticleRange, lobeRadius } from './orbital-cloud.js';

const shells = [1, 2, 3] as const;
const shellRadii = [1.35, 2.17, 3.03];
const innerOrbitalWorldRadius = 1;
export const referenceFramedRadius = 2.72;
type MarkerSample = ReturnType<OrbitalCloudSampler['framePositions']>[number];
type MarkerFrame = {
	atom: PeriodicAtom;
	orbitals: readonly Orbital[];
	frameScale: number;
	playback: ElectronPlayback;
};
function orbitalColor({ l, axis, n }: Orbital) {
	return new Color().setHSL(orbitalHue(l, axis, n) / 360, 0.74, 0.72, SRGBColorSpace);
}

function cloudSprite() {
	const size = 32;
	const pixels = new Uint8Array(size * size * 4).fill(255);
	for (let i = 0; i < size * size; i++) {
		const x = (i % size + 0.5) / size * 2 - 1;
		const y = (Math.floor(i / size) + 0.5) / size * 2 - 1;
		pixels[i * 4 + 3] = 255 * Math.max(0, 1 - x * x - y * y) ** 2;
	}
	const sprite = new DataTexture(pixels, size, size);
	sprite.magFilter = LinearFilter;
	sprite.minFilter = LinearFilter;
	sprite.needsUpdate = true;
	return sprite;
}

// Geometry and samples of one atom. The owning viewport supplies the camera and renderer.
export class AtomModelVisual {
	readonly #sceneAxes: ReturnType<typeof createSceneAxes>;
	readonly object = new Group();
	readonly #nucleus = new Group();
	readonly #workshop = new Group();
	readonly #electronLayers = shells.map(() => new Group());
	readonly #cloud = new Group();
	readonly #geometry = new SphereGeometry(1, 24, 16);
	readonly #proton = new MeshStandardMaterial({ color: '#ffaa66', roughness: 0.38 });
	readonly #neutron = new MeshStandardMaterial({ color: '#73bcdf', roughness: 0.42 });
	readonly #electron = new MeshStandardMaterial({ color: '#a8f5ce', emissive: '#397564', roughness: 0.3 });
	readonly #line = new LineBasicMaterial({ color: '#5a9b92', transparent: true, opacity: 0.38 });
	readonly #sprite = cloudSprite();
	readonly #cloudMaterial = new PointsMaterial({
		size: 0.052, map: this.#sprite, transparent: true, opacity: 0.43, depthWrite: false
	});
	readonly #rings: LineLoop[];
	readonly #clouds = new Map<string, Points<BufferGeometry, PointsMaterial>>();
	readonly #shapes = new Group();
	readonly #surfaces = new Map<string, Mesh<BufferGeometry, MeshStandardMaterial>>();
	readonly #surfaceGeometries = new Map<string, { geometry: BufferGeometry; peak: number }>();
	readonly #surfaceMaterial = new MeshStandardMaterial({
		roughness: 0.46, side: DoubleSide, transparent: true, depthWrite: false
	});
	readonly #sampler = new OrbitalCloudSampler();
	readonly #markerSampler = new OrbitalCloudSampler(109);
	readonly #markerSamples = new Map<string, MarkerSample[]>();
	readonly #markerDirection = new Vector3();
	readonly #markerMatrix = new Matrix4();
	readonly #markers = new InstancedMesh(
		new SphereGeometry(0.017, 12, 8),
		new MeshBasicMaterial({ color: '#fff1bf', transparent: true, depthTest: false, depthWrite: false }),
		periodicData.length
	);
	#sampleIndex?: number;
	#markerFrame?: MarkerFrame;
	readonly #radii = new Map<string, number>();
	#outerExtent = 1;
	#worldScale = 1;
	#atom?: Atom | PeriodicAtom;

	get extent() { return this.#outerExtent * this.#worldScale; }
	get atom() { return this.#atom; }
	get markerFrame() { return this.#markerFrame; }

	constructor(readonly mode: 'workshop' | 'cloud' | 'comparison') {
		this.object.add(this.#nucleus, this.#workshop, this.#cloud, this.#shapes);
		this.#sceneAxes = mode === 'cloud' ? createSceneAxes() : [];
		if (mode !== 'workshop') this.object.add(this.#markers, ...this.#sceneAxes);
		this.#markers.count = 0;
		this.#markers.frustumCulled = false;
		this.#markers.renderOrder = 10;

		this.#rings = mode !== 'workshop' ? [] : shells.map((shell, index) => {
			const ring = new LineLoop(new BufferGeometry().setFromPoints(
				Array.from({ length: 120 }, (_, i) => {
					const angle = (i / 120) * Math.PI * 2;
					return new Vector3(Math.cos(angle) * shellRadii[index], Math.sin(angle) * shellRadii[index], 0);
				})
			), this.#line);
			ring.rotation.set(shell * 0.54, shell * 0.4, 0);
			ring.add(this.#electronLayers[index]);
			this.#workshop.add(ring);
			return ring;
		});
	}

	update(atom: Atom | PeriodicAtom, orbitals: readonly Orbital[], representation: Representation, playback?: ElectronPlayback, cloudParticles: number = cloudParticleRange.initial) {
		const changed = atom !== this.#atom;
		if (changed) {
			this.#updateAtom(atom);
			if (!(atom instanceof Atom) && (!(this.#atom instanceof PeriodicAtom) || atom.protons !== this.#atom.protons || atom.charge !== this.#atom.charge)) {
				this.#measureOrbitals(atom);
				this.#markerSamples.clear();
			}
			this.#atom = atom;
		}
		this.object.rotation.y = this.mode === 'comparison' ? 0 : 20 * Math.PI / 180;
		if (!(atom instanceof Atom)) {
			this.#shapes.visible = representation === 'shape';
			this.#cloud.visible = representation === 'cloud';
			const frameScale = this.#worldScale;
			if (representation === 'shape') this.#updateSurfaces(orbitals, frameScale);
			else this.#updateCloud(atom, orbitals, frameScale, cloudParticles);
			this.#markerFrame = playback && { atom, orbitals, frameScale, playback };
			// Keep the schematic nucleus inside the innermost occupied orbital, even for heavy atoms.
			const innerExtent = innerOrbitalWorldRadius;
			this.#nucleus.scale.setScalar(Math.min(0.12, 0.16 * innerExtent));
		}
	}

	advanceShells(elapsed: number) {
		this.#electronLayers.forEach((layer, index) => {
			layer.rotation.z = (layer.rotation.z + elapsed * (0.8 - index * 0.15)) % (2 * Math.PI);
		});
	}

	#measureOrbitals(atom: PeriodicAtom) {
		this.#radii.clear();
		this.#outerExtent = 0;
		for (const group of atom.subshells) {
			for (const orbital of group.orbitals) {
				if (!orbital.electrons) continue;
				const radius = this.#sampler.extent(orbital) / effectiveCharge(atom, orbital);
				this.#radii.set(orbital.key, radius);
				this.#outerExtent = Math.max(this.#outerExtent, radius);
			}
		}
		// Keep 1s at a fixed scene radius, while preserving every other orbital's ratio to it.
		const innerRadius = this.#radii.get('1s:0') ?? innerOrbitalWorldRadius;
		this.#worldScale = innerOrbitalWorldRadius / innerRadius;
		this.#outerExtent = Math.max(innerRadius, this.#outerExtent);
		const axisScale = this.#outerExtent * this.#worldScale / referenceFramedRadius;
		for (const axis of this.#sceneAxes) axis.scale.setScalar(axisScale);
	}

	#updateCloud(atom: PeriodicAtom, orbitals: readonly Orbital[], frameScale: number, cloudParticles: number) {
		for (const points of this.#clouds.values()) points.visible = false;
		for (const orbital of orbitals) {
			const count = orbital.electrons * cloudParticles;
			const points = this.#cloudFor(orbital, count);
			points.visible = true;
			points.scale.setScalar(1 / effectiveCharge(atom, orbital));
			const worldRadius = this.#radii.get(orbital.key)! * frameScale;
			points.material.size = this.#cloudMaterial.size * worldRadius;
			points.geometry.setDrawRange(0, count);
		}
		this.#cloud.scale.setScalar(frameScale);
	}

	#updateSurfaces(orbitals: readonly Orbital[], frameScale: number) {
		for (const surface of this.#surfaces.values()) surface.visible = false;

		const opacity = orbitals.length === 1 ? 0.48 : Math.max(0.08, 0.42 / Math.sqrt(orbitals.length));
		for (const orbital of orbitals) {
			let surface = this.#surfaces.get(orbital.key);
			if (!surface) {
				const material = this.#surfaceMaterial.clone();
				material.color.copy(orbitalColor(orbital));
				surface = new Mesh(this.#surfaceGeometry(orbital).geometry, material);
				this.#surfaces.set(orbital.key, surface);
				this.#shapes.add(surface);
			}
			const radius = this.#radii.get(orbital.key)!;
			surface.visible = true;
			surface.material.opacity = opacity;
			surface.scale.setScalar(radius);
			surface.renderOrder = -radius;
		}
		this.#shapes.scale.setScalar(frameScale);
	}

	#cloudFor(orbital: Orbital, count: number) {
		const existing = this.#clouds.get(orbital.key);
		const currentCapacity = existing?.geometry.getAttribute('position').count ?? 0;
		if (existing && currentCapacity >= count) return existing;

		const capacity = Math.min(2 * cloudParticleRange.max, Math.max(count, currentCapacity * 2, 2 * cloudParticleRange.initial));
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new BufferAttribute(this.#sampler.sample(orbital, capacity, this.#surfaceGeometry(orbital).peak), 3));
		if (existing) {
			existing.geometry.dispose();
			existing.geometry = geometry;
			return existing;
		}
		const material = this.#cloudMaterial.clone();
		material.color.copy(orbitalColor(orbital));
		const points = new Points(geometry, material);
		this.#cloud.add(points);
		this.#clouds.set(orbital.key, points);
		return points;
	}

	#surfaceGeometry(orbital: Orbital) {
		const key = orbital.l + ':' + orbital.axis;
		const cached = this.#surfaceGeometries.get(key);
		if (cached) return cached;

		const geometry = new SphereGeometry(1, 64, 40);
		const positions = geometry.getAttribute('position');
		const amplitudes = new Float32Array(positions.count);
		let peak = 0;
		for (let i = 0; i < positions.count; i++) {
			const amplitude = angularAmplitude(orbital, positions.getX(i), positions.getY(i), positions.getZ(i));
			amplitudes[i] = amplitude;
			peak = Math.max(peak, Math.abs(amplitude));
		}
		for (let i = 0; i < positions.count; i++) {
			const amplitude = amplitudes[i];
			const radius = lobeRadius(amplitude, peak);
			positions.setXYZ(i, positions.getX(i) * radius, positions.getY(i) * radius, positions.getZ(i) * radius);
		}
		geometry.computeVertexNormals();
		const surface = { geometry, peak };
		this.#surfaceGeometries.set(key, surface);
		return surface;
	}

	updateMarkers(worldUnitsPerPixel = 0) {
		if (!this.#markerFrame) return;
		const { atom, orbitals, frameScale, playback } = this.#markerFrame;
		this.#markers.count = 0;
		const frame = playback.frame;
		if (this.#sampleIndex !== frame) {
			this.#markerSamples.clear();
			this.#sampleIndex = frame;
		}
		for (const orbital of orbitals) {
			let samples = this.#markerSamples.get(orbital.key);
			if (!samples) {
				samples = this.#markerSampler.framePositions(orbital, frame, atom.protons, this.#surfaceGeometry(orbital).peak);
				this.#markerSamples.set(orbital.key, samples);
			}
			const scale = frameScale / effectiveCharge(atom, orbital);
			const orbitalSize = this.#radii.get(orbital.key)! * frameScale * (orbital.l === 3 ? 0.8 : 1);
			// In the overview even inner-shell samples need a visible point.
			const size = Math.max(orbitalSize, 1.4 * worldUnitsPerPixel / (0.017 * this.object.scale.x));
			for (const { x, y, z, radius } of samples) {
				const direction = this.#markerDirection.set(x, y, z).multiplyScalar(radius * scale);
				this.#markerMatrix.makeScale(size, size, size).setPosition(direction);
				this.#markers.setMatrixAt(this.#markers.count++, this.#markerMatrix);
			}
		}
		this.#markers.instanceMatrix.needsUpdate = true;
	}

	#updateAtom(atom: Atom | PeriodicAtom) {
		this.#nucleus.clear();
		for (const layer of this.#electronLayers) layer.clear();

		for (let index = 0; index < atom.mass; index++) {
			const y = 1 - 2 * (index + 0.5) / atom.mass;
			const angle = index * 2.39996;
			const distance = atom.mass === 1 ? 0 : 0.56 * Math.cbrt((index + 0.5) / atom.mass);
			const radial = Math.sqrt(1 - y * y);
			const proton = Math.floor((index + 1) * atom.protons / atom.mass) !== Math.floor(index * atom.protons / atom.mass);
			const mesh = new Mesh(this.#geometry, proton ? this.#proton : this.#neutron);
			mesh.position.set(Math.cos(angle) * radial * distance, y * distance, Math.sin(angle) * radial * distance);
			mesh.scale.setScalar(0.18);
			this.#nucleus.add(mesh);
		}

		if (!(atom instanceof Atom)) return;

		for (const shell of shells) {
			const count = subshells.filter(group => group.shell === shell)
				.flatMap(group => [...group.orbitals])
				.reduce<number>((total, slot) => total + atom.orbitals[slot], 0);
			const layer = this.#electronLayers[shell - 1];
			const radius = shellRadii[shell - 1];
			for (let index = 0; index < count; index++) {
				const angle = (index / count) * Math.PI * 2 + shell * 0.38;
				const mesh = new Mesh(this.#geometry, this.#electron);
				mesh.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
				mesh.scale.setScalar(0.095);
				layer.add(mesh);
			}
		}
	}

	dispose() {
		for (const axis of this.#sceneAxes) {
			axis.geometry.dispose();
			axis.material.dispose();
		}
		this.#geometry.dispose();
		this.#proton.dispose();
		this.#neutron.dispose();
		this.#electron.dispose();
		this.#line.dispose();
		this.#cloudMaterial.dispose();
		this.#sprite.dispose();
		for (const object of this.#rings) object.geometry.dispose();
		for (const cloud of this.#clouds.values()) {
			cloud.geometry.dispose();
			cloud.material.dispose();
		}
		for (const surface of this.#surfaces.values()) surface.material.dispose();
		for (const { geometry } of this.#surfaceGeometries.values()) geometry.dispose();
		this.#markers.geometry.dispose();
		this.#markers.material.dispose();
		this.#markers.dispose();
		this.#surfaceMaterial.dispose();
	}
}

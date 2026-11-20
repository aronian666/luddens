import { PerspectiveCamera, Quaternion, Scene, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { axisDirection, projectAxisHandles, type AxisHandle, type CameraView } from './axes.js';
import { AtomModelVisual, referenceFramedRadius } from './model-visual.js';
import { addAtomLighting } from './scene-lighting.js';
import type { Atom } from './atom.js';
import { PeriodicAtom, type Orbital } from './elements.js';
import type { ElectronPlayback, Representation } from './explorer.svelte.js';

const cameraDuration = 0.68;

export class AtomVisual {
	readonly #renderer: WebGLRenderer;
	readonly #controls: OrbitControls;
	readonly #observer: ResizeObserver;
	readonly #visibility: IntersectionObserver;
	readonly #motion = window.matchMedia('(prefers-reduced-motion: reduce)');
	readonly #camera: PerspectiveCamera;
	readonly #referenceDistance: number;
	readonly #initialCameraPosition: Vector3;
	readonly #gizmoRotation = new Quaternion();
	readonly #lastGizmoRotation = new Quaternion();
	readonly #scene = new Scene();
	readonly #model: AtomModelVisual;
	#markerSpeed = 1;
	#cameraElapsed = cameraDuration;
	#cameraFactor = 1;
	#onScreen = false;
	#orbiting = false;
	#loopActive = false;
	#lastFrame?: number;

	constructor(
		readonly canvas: HTMLCanvasElement,
		readonly mode: 'workshop' | 'cloud',
		readonly onAxesChange?: (axes: AxisHandle[]) => void
	) {
		this.#renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
		this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.#model = new AtomModelVisual(mode);
		this.#camera = new PerspectiveCamera(40, 1, 0.05, 90);
		if (mode === 'cloud') {
			this.#camera.position.set(6.5, 7, 6);
			this.#camera.near = 0.015;
			this.#camera.updateProjectionMatrix();
		} else {
			this.#camera.position.set(4, 3, 10);
		}
		this.#initialCameraPosition = this.#camera.position.clone();
		this.#referenceDistance = this.#initialCameraPosition.length();
		this.#controls = new OrbitControls(this.#camera, canvas);
		this.#controls.enablePan = false;
		this.#controls.minDistance = mode === 'cloud' ? 0.65 : 2;
		this.#controls.maxDistance = 35;
		this.#controls.addEventListener('change', this.#render);

		this.#scene.add(this.#model.object);
		addAtomLighting(this.#scene);
		this.#observer = new ResizeObserver(() => this.#resize());
		this.#observer.observe(canvas);
		this.#visibility = new IntersectionObserver(([entry]) => {
			this.#onScreen = entry.isIntersecting;
			this.#updateLoop();
		});
		this.#visibility.observe(canvas);
		this.#motion.addEventListener('change', this.#updateLoop);
		this.#resize();
	}

	update(atom: Atom | PeriodicAtom, orbitals: readonly Orbital[], representation: Representation, running: boolean, playback: ElectronPlayback | undefined, electronSpeed: number, cloudParticles?: number) {
		const previous = this.#model.atom;
		this.#model.update(atom, orbitals, representation, playback, cloudParticles);
		if (atom instanceof PeriodicAtom && (!(previous instanceof PeriodicAtom) || atom.protons !== previous.protons || atom.charge !== previous.charge)) {
			this.#cameraFactor = 1;
			this.#camera.position.setLength(this.#fitDistance());
			this.#updateCameraLimits();
			if (previous && !this.#motion.matches) this.#cameraElapsed = 0;
		}
		this.#markerSpeed = electronSpeed;
		this.#orbiting = running && this.mode === 'workshop' && atom.electrons > 0;
		this.#updateLoop();
		this.#render();
	}

	orientCamera(view: CameraView) {
		this.#cameraElapsed = cameraDuration;
		this.#cameraFactor = 1;
		const direction = view === 'default'
			? this.#initialCameraPosition
			: axisDirection(view).applyQuaternion(this.#model.object.quaternion);
		this.#controls.target.set(0, 0, 0);
		this.#camera.position.copy(direction).setLength(this.#fitDistance());
		this.#controls.update();
		this.#updateLoop();
		this.#render();
	}

	magnify(direction: -1 | 1) {
		this.#cameraElapsed = cameraDuration;
		this.#cameraFactor = 1;
		const distance = this.#camera.position.length() * 1.25 ** -direction;
		this.#camera.position.setLength(Math.max(this.#controls.minDistance, Math.min(this.#controls.maxDistance, distance)));
		this.#controls.update();
		this.#updateLoop();
		this.#render();
	}

	#fitDistance() {
		const outerRadius = this.#model.extent;
		const aspectCorrection = Math.max(1, 1 / this.#camera.aspect);
		return this.#referenceDistance * outerRadius * aspectCorrection / referenceFramedRadius;
	}

	#updateCameraLimits() {
		const fitDistance = this.#fitDistance();
		this.#controls.maxDistance = 3 * fitDistance;
		this.#camera.far = Math.max(90, 6 * fitDistance);
		this.#camera.updateProjectionMatrix();
	}

	#updateLoop = () => {
		const reduced = this.#motion.matches;
		if (reduced && this.#cameraElapsed < cameraDuration) {
			this.#cameraElapsed = cameraDuration;
			this.#setCameraFactor(1);
			this.#render();
		}
		const active = this.#onScreen && (
			(!reduced && (this.#orbiting || this.#cameraElapsed < cameraDuration)) ||
			(this.#model.markerFrame?.playback.playing === true && this.#model.markerFrame.orbitals.length > 0)
		);
		if (active === this.#loopActive) return;
		this.#loopActive = active;
		this.#lastFrame = undefined;
		this.#renderer.setAnimationLoop(active ? this.#animate : null);
	};

	#setCameraFactor(factor: number) {
		this.#camera.position.multiplyScalar(factor / this.#cameraFactor);
		this.#cameraFactor = factor;
	}

	#animate = (now: number) => {
		const elapsed = Math.min(0.1, (now - (this.#lastFrame ?? now)) / 1000);
		this.#lastFrame = now;
		let redraw = this.#orbiting;
		if (this.#orbiting) {
			this.#model.advanceShells(elapsed);
		}
		if (this.#cameraElapsed < cameraDuration) {
			this.#cameraElapsed = Math.min(cameraDuration, this.#cameraElapsed + elapsed);
			const progress = this.#cameraElapsed / cameraDuration;
			this.#setCameraFactor(1 - 0.17 * (1 - progress) ** 3);
			redraw = true;
		}
		const playback = this.#model.markerFrame?.playback;
		if (playback?.playing) {
			const frame = playback.frame;
			playback.tick(elapsed, this.#markerSpeed);
			redraw ||= playback.frame !== frame;
		}
		if (redraw) this.#render();
		this.#updateLoop();
	};
	#resize() {
		const { clientWidth: width, clientHeight: height } = this.canvas;
		if (!width || !height) return;
		const previousFit = this.#fitDistance();
		const aspect = width / height;
		this.#camera.aspect = aspect;
		if (this.mode === 'cloud' && this.#model.atom) {
			this.#camera.position.multiplyScalar(this.#fitDistance() / previousFit);
			this.#updateCameraLimits();
			this.#controls.update();
		} else {
			this.#camera.updateProjectionMatrix();
		}
		this.#renderer.setSize(width, height, false);
		this.#render();
	}

	#render = () => {
		if (this.onAxesChange) {
			this.#gizmoRotation.copy(this.#camera.quaternion).invert().multiply(this.#model.object.quaternion);
			if (!this.#gizmoRotation.equals(this.#lastGizmoRotation)) {
				this.#lastGizmoRotation.copy(this.#gizmoRotation);
				this.onAxesChange(projectAxisHandles(this.#gizmoRotation));
			}
		}
		this.#model.updateMarkers();
		this.#renderer.render(this.#scene, this.#camera);
	};

	dispose() {
		this.#observer.disconnect();
		this.#visibility.disconnect();
		this.#motion.removeEventListener('change', this.#updateLoop);
		this.#renderer.setAnimationLoop(null);
		this.#controls.dispose();
		this.#model.dispose();
		this.#renderer.dispose();
	}
}

import {
	BufferGeometry, Group, LineBasicMaterial, LineLoop, OrthographicCamera, Quaternion,
	Scene, Sprite, Vector3, WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { axisDirection, projectAxisHandles, type AxisHandle, type CameraView } from './axes.js';
import { ComparisonGrid, disposeLabel, picometersPerUnit, sceneLabel } from './comparison-grid.js';
import { AtomModelVisual } from './model-visual.js';
import { addAtomLighting } from './scene-lighting.js';
import type { PeriodicAtom } from './elements.js';
import type { ElectronPlayback } from './explorer.svelte.js';

const initialDirection = new Vector3(0.32, -1, 0.54).normalize();
const spacing = 1;
const circle = Array.from({ length: 128 }, (_, i) => {
	const angle = i * 2 * Math.PI / 128;
	return new Vector3(Math.cos(angle), Math.sin(angle), 0);
});

export class ComparisonVisual {
	readonly #renderer: WebGLRenderer;
	readonly #controls: OrbitControls;
	readonly #observer: ResizeObserver;
	readonly #scene = new Scene();
	readonly #grid = new ComparisonGrid();
	readonly #camera = new OrthographicCamera(-5, 5, 3, -3, 0.05, 100);
	readonly #ringGeometry = new BufferGeometry().setFromPoints(circle);
	readonly #ringMaterial = new LineBasicMaterial({ color: '#b0cacf', transparent: true, opacity: 0.54, depthWrite: false });
	readonly #models = new Map<PeriodicAtom, {
		root: Group; model: AtomModelVisual; radius: number; ring: LineLoop; label: Sprite;
	}>();
	readonly #viewDirection = new Vector3();
	readonly #rotation = new Quaternion();
	#rowWidth = 0;

	constructor(readonly canvas: HTMLCanvasElement, readonly onAxesChange: (axes: AxisHandle[]) => void) {
		this.#renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
		this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.#camera.up.set(0, 0, 1);
		this.#camera.position.copy(initialDirection).multiplyScalar(20);
		this.#controls = new OrbitControls(this.#camera, canvas);
		this.#controls.minZoom = 0.4;
		this.#controls.maxZoom = 6;
		this.#scene.add(this.#grid.object);
		addAtomLighting(this.#scene);
		this.#controls.addEventListener('change', this.render);
		this.#observer = new ResizeObserver(() => this.#resize());
		this.#observer.observe(canvas);
		this.#resize();
	}

	#createSpecimen(atom: PeriodicAtom, playback: ElectronPlayback) {
		const root = new Group();
		const model = new AtomModelVisual('comparison');
		model.update(atom, atom.occupiedOrbitals, 'shape', playback);
		const radius = atom.covalentRadiusPm / picometersPerUnit;
		model.object.scale.setScalar(radius / model.extent);
		const ring = new LineLoop(this.#ringGeometry, this.#ringMaterial);
		ring.scale.setScalar(radius);
		const label = sceneLabel(atom.symbol, '#ffffff');
		root.add(model.object, ring, label);
		this.#scene.add(root);
		return { root, model, radius, ring, label };
	}

	setAtoms(atoms: readonly PeriodicAtom[], playback: ElectronPlayback) {
		for (const [atom, item] of this.#models) {
			if (atoms.includes(atom)) continue;
			this.#scene.remove(item.root);
			item.model.dispose();
			disposeLabel(item.label);
			this.#models.delete(atom);
		}
		this.#rowWidth = atoms.reduce((sum, atom) => sum + 2 * atom.covalentRadiusPm / picometersPerUnit, 0)
			+ Math.max(0, atoms.length - 1) * spacing;
		let left = -this.#rowWidth / 2;
		for (const atom of atoms) {
			const item = this.#models.get(atom) ?? this.#createSpecimen(atom, playback);
			this.#models.set(atom, item);
			item.root.position.x = left + item.radius;
			left += 2 * item.radius + spacing;
		}
		this.#resize();
	}

	#resize() {
		const {clientWidth: width, clientHeight: height} = this.canvas;
		if (!width || !height) return;
		const aspect = width / height;
		this.#camera.top = Math.max(3.3, (this.#rowWidth / 2 + 0.7) / aspect);
		this.#camera.bottom = -this.#camera.top;
		this.#camera.right = this.#camera.top * aspect;
		this.#camera.left = -this.#camera.right;
		this.#camera.updateProjectionMatrix();
		this.#renderer.setSize(width, height, false);
		this.render();
	}

	orient(view: CameraView) {
		const direction = view === 'default' ? initialDirection : axisDirection(view);
		this.#controls.target.set(0, 0, 0);
		if (view === 'default') this.#camera.zoom = 1;
		this.#camera.position.copy(direction).multiplyScalar(20);
		this.#camera.updateProjectionMatrix();
		this.#controls.update();
		this.render();
	}

	magnify(direction: -1 | 1) {
		this.#camera.zoom = Math.max(this.#controls.minZoom, Math.min(this.#controls.maxZoom, this.#camera.zoom * 1.25 ** direction));
		this.#camera.updateProjectionMatrix();
		this.render();
	}

	render = () => {
		const units = 2 * this.#camera.top / (this.#camera.zoom * Math.max(1, this.canvas.clientHeight));
		this.#grid.update(units, this.#camera.getWorldDirection(this.#viewDirection));
		for (const { ring, label, radius, model } of this.#models.values()) {
			ring.quaternion.copy(this.#camera.quaternion);
			label.position.set(0, -radius - 11 * units, 0).applyQuaternion(this.#camera.quaternion);
			label.scale.set(72 * units, 18 * units, 1);
			model.updateMarkers(units);
		}
		if (!this.#rotation.equals(this.#camera.quaternion)) {
			this.#rotation.copy(this.#camera.quaternion);
			this.onAxesChange(projectAxisHandles(this.#rotation.clone().invert()));
		}
		this.#renderer.render(this.#scene, this.#camera);
	};

	dispose() {
		this.#observer.disconnect();
		this.#controls.dispose();
		for (const {model, label} of this.#models.values()) {
			model.dispose();
			disposeLabel(label);
		}
		this.#grid.dispose();
		this.#ringGeometry.dispose();
		this.#ringMaterial.dispose();
		this.#renderer.dispose();
		this.#renderer.forceContextLoss();
	}
}

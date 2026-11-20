import { CanvasTexture, GridHelper, Group, Sprite, SpriteMaterial, SRGBColorSpace, type Vector3 } from 'three';
import { createSceneAxes } from './axes.js';

export const picometersPerUnit = 100;

export function sceneLabel(text: string, color: string) {
	const canvas = document.createElement('canvas');
	canvas.width = 192;
	canvas.height = 48;
	const ctx = canvas.getContext('2d')!;
	ctx.font = 'bold 32px monospace';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'center';
	ctx.lineWidth = 6;
	ctx.strokeStyle = '#101e24';
	ctx.strokeText(text, 96, 24);
	ctx.fillStyle = color;
	ctx.fillText(text, 96, 24);
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	const label = new Sprite(new SpriteMaterial({ map: texture, depthTest: false, depthWrite: false }));
	label.renderOrder = 12;
	return label;
}

export function disposeLabel(label: Sprite) {
	label.material.map?.dispose();
	label.material.dispose();
}

export class ComparisonGrid {
	readonly object = new Group();
	readonly #planes = ([
		{ normal: 'z', size: 20, opacity: 0.38 },
		{ normal: 'y', size: 12, opacity: 0.19 },
		{ normal: 'x', size: 8, opacity: 0.19 }
	] as const).map(({ normal, size, opacity }) => {
		const grid = new GridHelper(size, 2 * size, '#8598a4', '#8598a4');
		grid.material.transparent = true;
		grid.material.depthWrite = false;
		grid.renderOrder = -1000;
		return { normal, grid, opacity };
	});
	readonly #axes = createSceneAxes(10);
	readonly #labels: Sprite[] = [];

	constructor() {
		// Z is up. XY is the floor, XZ and YZ are the vertical reference planes.
		this.#planes[0].grid.rotation.x = Math.PI / 2;
		this.#planes[2].grid.rotation.z = Math.PI / 2;
		this.object.add(...this.#planes.map(plane => plane.grid), ...this.#axes);
		for (const [axis, color] of [['x', '#f48e9e'], ['y', '#9bdc84'], ['z', '#8cbbff']] as const) {
			for (const sign of [-1, 1]) {
				const label = sceneLabel((sign > 0 ? '+' : '−') + '200 ' + axis.toUpperCase(), color);
				label.position[axis] = 2 * sign;
				label.center.y = 0;
				this.#labels.push(label);
				this.object.add(label);
			}
		}
	}

	update(unitsPerPixel: number, viewDirection: Vector3) {
		for (const { grid, normal, opacity } of this.#planes) {
			// Grazing views pack parallel lines into a stripe. Fade that plane as it turns edge-on.
			grid.material.opacity = opacity * Math.abs(viewDirection[normal]);
		}
		for (const label of this.#labels) {
			label.visible = Math.abs(label.position.dot(viewDirection)) < 1.95;
			label.scale.set(68 * unitsPerPixel, 17 * unitsPerPixel, 1);
		}
	}

	dispose() {
		for (const plane of this.#planes) plane.grid.dispose();
		for (const axis of this.#axes) {
			axis.geometry.dispose();
			axis.material.dispose();
		}
		this.#labels.forEach(disposeLabel);
	}
}

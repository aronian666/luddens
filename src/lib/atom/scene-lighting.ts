import { AmbientLight, DirectionalLight, type Scene } from 'three';

export function addAtomLighting(scene: Scene) {
	const light = new DirectionalLight('#fff2dd', 2.7);
	light.position.set(4, 6, 8);
	const rim = new DirectionalLight('#5bc7ff', 1.5);
	rim.position.set(-4, 1, -6);
	scene.add(light, rim, new AmbientLight('#d6e9ff', 1.35));
}

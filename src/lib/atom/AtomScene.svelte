<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { AxisHandle, CameraView } from './axes.js';
	import CameraControls from './CameraControls.svelte';
	import { AtomVisual } from './visual.js';
	import type { Atom } from './atom.js';
	import type { Orbital, PeriodicAtom } from './elements.js';
	import type { ElectronPlayback, Representation } from './explorer.svelte.js';

	let { atom, mode = 'workshop', orbitals = [], representation = 'cloud', running = false, playback, electronSpeed = 1, cloudParticles, cameraRequest, onOrientCamera, overlay }: {
		atom: Atom | PeriodicAtom;
		mode?: 'workshop' | 'cloud';
		orbitals?: readonly Orbital[];
		representation?: Representation;
		running?: boolean;
		playback?: ElectronPlayback;
		electronSpeed?: number;
		cloudParticles?: number;
		cameraRequest?: { view: CameraView };
		onOrientCamera?: (view: CameraView) => void;
		overlay?: Snippet;
	} = $props();
	let canvas: HTMLCanvasElement = $state()!;
	let visual = $state.raw<AtomVisual>();
	let unavailable = $state(false);
	let axes = $state.raw<AxisHandle[]>([]);

	$effect(() => {
		if (!canvas) return;
		try {
			const scene = new AtomVisual(canvas, mode, mode === 'cloud' ? (handles) => axes = handles : undefined);
			visual = scene;
			return () => scene.dispose();
		} catch (error) {
			console.error('Could not initialize the atom scene', error);
			unavailable = true;
		}
	});

	$effect(() => {
		visual?.update(atom, orbitals, representation, running, playback, electronSpeed, cloudParticles);
	});
	$effect(() => {
		if (cameraRequest) visual?.orientCamera(cameraRequest.view);
	});
</script>

<div class="relative isolate bg-[radial-gradient(ellipse,#183333_0%,#101e24_55%,#0c151b_100%)]">
	<div role="img" aria-label={mode === 'cloud' ? (representation === 'cloud' ? 'Nube de probabilidad electrónica' : 'Forma tridimensional del orbital') : 'Núcleo y capas electrónicas'}>
		{#if !overlay}
			<div class="pointer-events-none absolute top-3.5 left-4 font-mono text-xs text-[#a9bdc3]">Modelo esquemático · 3D</div>
		{/if}
		{#if mode === 'workshop' && atom.mass === 0}
			<span class="pointer-events-none absolute top-1/2 left-1/2 size-4 -translate-1/2 rounded-full border border-dashed border-[#b9ac8d]" aria-hidden="true"></span>
		{/if}
		<canvas
			bind:this={canvas}
			class={['block w-full cursor-grab active:cursor-grabbing', mode === 'cloud' ? 'h-[clamp(18rem,46vw,32rem)]' : 'h-[clamp(11.5rem,37vw,22rem)]']}
			width="1120"
			height="680"
			aria-hidden="true"
		></canvas>
	</div>
	{#if axes.length && onOrientCamera}
		<CameraControls {axes} orient={onOrientCamera} magnify={direction => visual?.magnify(direction)} />
	{/if}
	{@render overlay?.()}
	{#if unavailable}
		<p class="absolute inset-x-4 top-10 text-muted" role="status">La vista 3D necesita WebGL 2.</p>
	{/if}
</div>

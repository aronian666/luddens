<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import CameraControls from './CameraControls.svelte';
	import { ComparisonVisual } from './comparison-visual.js';
	import type { AxisHandle } from './axes.js';
	import type { PeriodicAtom } from './elements.js';
	import type { ElectronPlayback } from './explorer.svelte.js';

	let { atoms, playback }: { atoms: readonly PeriodicAtom[]; playback: ElectronPlayback } = $props();
	let canvas: HTMLCanvasElement;
	let visual = $state.raw<ComparisonVisual>();
	let axes = $state.raw<AxisHandle[]>([]);
	let unavailable = $state(false);

	onMount(() => {
		try {
			const scene = new ComparisonVisual(canvas, handles => axes = handles);
			visual = scene;
			return () => scene.dispose();
		} catch (error) {
			console.error('Could not initialize the comparison scene', error);
			unavailable = true;
		}
	});

	$effect(() => {
		const scene = visual, selected = atoms, clock = playback;
		untrack(() => scene?.setAtoms(selected, clock));
	});

	$effect(() => {
		playback.frame;
		visual?.render();
	});
</script>

<div class="relative isolate bg-[radial-gradient(ellipse,#183333_0%,#101e24_55%,#0c151b_100%)]">
	<canvas bind:this={canvas} class="block h-[clamp(20rem,40vw,32rem)] w-full cursor-grab active:cursor-grabbing"
		aria-label={'Comparación tridimensional a escala de ' + atoms.map(atom => atom.name).join(', ')}></canvas>
	{#if axes.length}
		<CameraControls {axes} orient={view => visual?.orient(view)} magnify={direction => visual?.magnify(direction)} />
	{/if}
	{#if unavailable}
		<p class="absolute inset-x-4 top-4 text-muted" role="status">La vista 3D necesita WebGL 2.</p>
	{/if}
</div>

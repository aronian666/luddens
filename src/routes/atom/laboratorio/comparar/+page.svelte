<script lang="ts">
	import { onMount } from 'svelte';
	import ComparisonScene from '#lib/atom/ComparisonScene.svelte';
	import PeriodicTable from '#lib/atom/PeriodicTable.svelte';
	import { AtomComparison } from '#lib/atom/comparison.svelte.js';

	const comparison = new AtomComparison();
	const playback = comparison.playback;
	let viewer: HTMLElement;
	let visible = $state(false);

	onMount(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (!motion.matches) playback.toggle();
		const respectMotion = () => {
			if (motion.matches && playback.playing) playback.toggle();
		};
		const observer = new IntersectionObserver(([entry]) => visible = entry.isIntersecting);
		observer.observe(viewer);
		motion.addEventListener('change', respectMotion);
		return () => {
			observer.disconnect();
			motion.removeEventListener('change', respectMotion);
		};
	});

	// One clock advances the scene, regardless of how many atoms are selected.
	$effect(() => {
		if (!visible || !playback.playing || !comparison.atoms.length) return;
		const timer = window.setInterval(() => {
			if (!document.hidden) playback.tick(0.65, 1);
		}, 650);
		return () => window.clearInterval(timer);
	});
</script>

<svelte:head>
	<title>Luddens · Comparar átomos</title>
</svelte:head>

<main class="mx-auto w-full max-w-[78rem] px-4 pt-[clamp(1rem,3vw,2rem)] pb-12">
	<h1 class="text-[clamp(2rem,5vw,3.5rem)] leading-tight tracking-tight">Comparar átomos</h1>
	<p class="mt-2 mb-4 text-muted">Compara el tamaño de los orbitales y observa cómo cambia la capa externa al bajar por un grupo.</p>

	<section bind:this={viewer} aria-label="Modelos a escala común" class="mb-5 overflow-hidden rounded-xl border border-line bg-panel">
		{#if comparison.atoms.length}
			<div class="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2 text-sm">
				<button class="atom-control px-3 py-2" onclick={() => playback.toggle()}>{playback.playing ? 'Pausar electrones' : 'Animar electrones'}</button>
				<button class="atom-control px-3 py-2" onclick={() => playback.step(1)}>Siguiente muestra</button>
			</div>
			<ComparisonScene atoms={comparison.atoms} {playback} />
			<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-px border-t border-line bg-line">
				{#each comparison.atoms as atom (atom.protons)}
					<article class="min-w-0 bg-panel">
						<div class="p-2 sm:p-4">
							<h2 class="element-category flex flex-wrap items-baseline gap-x-2" data-category={atom.category}>
								<strong class="font-mono text-xl text-(--element-color)">{atom.symbol}</strong>
								<span class="text-sm">{atom.name}</span>
							</h2>
							<p class="mt-1 font-mono text-sm">{atom.covalentRadiusPm} pm</p>
							<p class="mt-2 text-xs text-muted">Capa externa{atom.estimated ? ' (estimada)' : ''}</p>
							<p class="font-mono">{atom.outerConfiguration}</p>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<p class="grid min-h-32 place-items-center p-4 text-muted">Marca un elemento de la tabla para ver su modelo.</p>
		{/if}
		<p class="border-t border-line px-4 py-2 text-sm text-muted">Cada cuadro mide 50 × 50 pm en los planos XY, XZ e YZ. Arrastra para girar todos los átomos o pulsa un eje para mirar de frente a su plano. El círculo de cada átomo marca su radio covalente de enlace simple. Los puntos claros muestran posiciones posibles de los electrones en cada muestra. <a class="underline" href="https://doi.org/10.1002/chem.200800987">Datos de Pyykkö y Atsumi</a></p>
	</section>

	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
		<h2 class="text-xl">Tabla periódica</h2>
		<p class="text-sm text-muted" role="status">{comparison.atoms.length} de {comparison.limit} seleccionados{comparison.full ? ' · Desmarca uno para añadir otro.' : ''}</p>
	</div>
	<p class="mb-3 text-sm text-muted">Marca o desmarca elementos. Pulsa el número de un grupo para comparar sus elementos.</p>
	<PeriodicTable>
		{#snippet groupHeader(group)}
			<button class="atom-control w-full py-1 font-semibold text-mint" aria-label={'Comparar grupo ' + group} onclick={() => comparison.selectGroup(group)}>{group}</button>
		{/snippet}
		{#snippet elementCell(atom)}
			{@const checked = comparison.atoms.includes(atom)}
			<label class="element-category grid min-h-12 cursor-pointer rounded-md border border-line bg-control p-1 text-(--element-color) has-checked:border-current has-disabled:cursor-not-allowed has-disabled:opacity-55 has-focus-visible:outline-2 has-focus-visible:outline-focus"
				data-category={atom.category} title={atom.name}>
				<span class="flex items-center justify-between gap-0.5">
					<small class="font-mono text-xs">{atom.protons}</small>
					<input type="checkbox" class="accent-mint" {checked} disabled={!checked && comparison.full}
						aria-label={atom.name + ' (' + atom.symbol + ')'} aria-describedby={'element-category-' + atom.category}
						onchange={() => comparison.toggle(atom)} />
				</span>
				<strong class="font-mono text-lg leading-tight">{atom.symbol}</strong>
			</label>
		{/snippet}
	</PeriodicTable>
</main>

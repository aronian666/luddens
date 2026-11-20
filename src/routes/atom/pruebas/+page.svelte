<script lang="ts">
	import { getContext } from 'svelte';
	import { resolve } from '$app/paths';
	import { AtomSession } from '#lib/atom/session.svelte.js';
	import TrialTerrain from '#lib/atom/TrialTerrain.svelte';
	import ElementLimit from '#lib/atom/ElementLimit.svelte';

	const session = getContext<AtomSession>(AtomSession);

</script>

<svelte:head>
	<title>Luddens · Pruebas de Átomo</title>
	<meta name="description" content="Elige hasta qué elemento practicar y gana tres estrellas en cada prueba de átomos." />
</svelte:head>

<main class="mx-auto w-full max-w-xl px-4 pt-4 pb-7 sm:pt-8">
	<header class="mb-4 flex items-center justify-between gap-3">
		<h1 class="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">Pruebas de Átomo</h1>
		<p class="shrink-0 rounded-full border border-warning/25 bg-warning/10 px-2.5 py-1 font-mono text-sm text-warning">
			<span aria-hidden="true">★</span> <span class="sr-only">Estrellas:</span> {session.totalStars}/{session.ladder.length * session.maxStars}
		</p>
	</header>
	<div class="mb-4"><ElementLimit {session} /></div>

	{#if session.running}
		<p class="mb-3 text-sm text-muted">Puedes retomar la ronda en curso. Elegir otra prueba termina esa ronda y conserva tus estrellas.</p>
	{/if}
	<section class="relative isolate overflow-hidden rounded-3xl border border-line" aria-label="Camino de Pradera">
		<TrialTerrain />
		<ol class="grid min-h-[27rem] list-none auto-rows-fr items-center gap-3 p-4 sm:p-6">
			{#each session.ladder as level, index}
				{@const active = session.running && session.index === index}
				{@const card = 'flex min-h-[5.15rem] items-center gap-2.5 rounded-2xl border p-2.5 shadow-lg sm:gap-3 sm:p-3'}
				<li class={['w-full max-w-[19.5rem]', index % 2 ? 'justify-self-end' : 'justify-self-start']}>
					{#snippet step()}
						<span class={['grid size-11 shrink-0 place-items-center rounded-xl font-mono text-xl leading-none font-bold',
							level.stars === session.maxStars ? 'bg-warning/15 text-warning' : level.locked ? 'bg-control text-muted' : 'bg-selected text-mint']}
							aria-hidden="true">{index + 1}</span>
						<span class="grid min-w-0 gap-0.5">
							<span class="font-semibold leading-tight">{level.title}</span>
							<span class="text-sm leading-none tracking-wider text-warning" aria-hidden="true">{'★'.repeat(level.stars)}<span class="text-muted">{'☆'.repeat(session.maxStars - level.stars)}</span></span>
							<span class="sr-only">{level.stars} de {session.maxStars} estrellas ganadas.</span>
							<span class="text-xs text-muted">
								{#if level.locked}Bloqueada
								{:else}{active ? 'En curso' : level.stars === session.maxStars ? 'Practicar' : 'Estrella ' + level.nextStar} · Elementos 1–{session.limit}{/if}
							</span>
						</span>
					{/snippet}
					{#if !level.locked}
						<a href={resolve('/atom/pruebas/[nivel]', { nivel: String(index + 1) })}
							class={[card, 'border-selection bg-page hover:border-mint']}>
							{@render step()}
							<span class="ml-auto text-xl text-mint" aria-hidden="true">›</span>
						</a>
					{:else}
						<div class={[card, 'border-white/12 bg-page/90 text-muted']}>{@render step()}</div>
					{/if}
				</li>
			{/each}
		</ol>
	</section>

</main>

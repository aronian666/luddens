<script lang="ts">
	import { getContext, onMount, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AtomSession, type OrderSubmission } from '#lib/atom/session.svelte.js';
	import Nuclide from '#lib/atom/Nuclide.svelte';
	import ElementLimit from '#lib/atom/ElementLimit.svelte';
	import { elementCategoryLabels } from '#lib/atom/elements.js';
	import { OrderSounds } from '#lib/atom/order-sounds.js';
	import RoundScore from '#lib/atom/RoundScore.svelte';
	import ParticleTray from '#lib/atom/ParticleTray.svelte';

	const session = getContext<AtomSession>(AtomSession);
	const levelIndex = $derived(Number(page.params.nivel) - 1);
	const level = $derived(session.ladder[levelIndex]);
	let tray = $state<HTMLFieldSetElement>();
	let dragged = $state.raw<{ value: string; draft: AtomSession['configuration'] }>();
	const choices = $derived(session.configuration.core === undefined
		? [
			...(session.round.kernel ? [] : [{ value: '0', label: 'Sin gas noble anterior' }]),
			...session.coreOptions.map(gas => ({ value: String(gas.protons), label: '[' + gas.symbol + ']' }))
		]
		: session.configuration.options.map(value => ({ value, label: value })));

	function choose(value: string) {
		if (session.configuration.core === undefined) session.selectCore(Number(value));
		else session.choosePart(value);
	}

	function drop(event: DragEvent) {
		event.preventDefault();
		if (dragged?.draft === session.configuration && dragged) choose(dragged.value);
		dragged = undefined;
	}
	const quantumFields = [
		['n', 'n · Principal'], ['l', 'ℓ · Azimutal'], ['ml', 'mℓ · Magnético'], ['ms', 'mₛ · Espín']
	] as const;
	let quantumForm = $state<HTMLFormElement>();
	$effect(() => {
		if (session.round.quantum && session.canEdit) quantumForm?.querySelector('input')?.focus({ preventScroll: true });
	});
	let resultAction = $state<HTMLElement>();
	const sounds = new OrderSounds();
	const soundKey = 'luddens.atom.order-sounds';
	let soundsEnabled = $state(true);

	onMount(() => {
		try { soundsEnabled = localStorage.getItem(soundKey) !== 'off'; }
		catch { /* Sound can still be switched off for this visit. */ }
		sounds.enabled = soundsEnabled;
		return () => sounds.dispose();
	});

	function toggleSounds() {
		soundsEnabled = !soundsEnabled;
		sounds.enabled = soundsEnabled;
		try { localStorage.setItem(soundKey, soundsEnabled ? 'on' : 'off'); }
		catch { /* Keep the in-memory setting. */ }
	}

	function playCue(result?: OrderSubmission) {
		if (result) void sounds.play(result);
	}

	$effect(() => {
		const index = levelIndex;
		untrack(() => session.enter(index));
	});

	$effect(() => {
		if (choices.length && session.manual && session.canEdit) tray?.querySelector('button')?.focus({ preventScroll: true });
	});

	$effect(() => {
		if (session.index === levelIndex && session.state === 'finished') resultAction?.focus({ preventScroll: true });
	});
</script>

<svelte:head>
	<title>{level?.title ?? 'Nivel'} · Luddens</title>
</svelte:head>

<main class="min-h-dvh bg-[radial-gradient(ellipse_at_top,#183d35_0%,var(--color-page)_28rem)] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
	<header class="sticky top-0 z-20 border-b border-line bg-page/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
		<div class="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 sm:px-5">
			<a class="atom-control grid size-11 shrink-0 place-items-center bg-transparent p-0 text-xl" href={resolve('/atom/pruebas')} aria-label="Volver a niveles">‹</a>
			<h1 class="min-w-0 flex-1 text-base leading-tight font-bold sm:text-xl">{level?.title ?? 'Nivel no disponible'}</h1>
			<span class="shrink-0 rounded-full bg-selected px-2 py-1 text-xs font-semibold text-mint">Normal</span>
			{#if session.running && session.index === levelIndex}
				<time role="timer" class={['shrink-0 font-mono text-lg font-bold tabular-nums', session.seconds <= 10 ? 'text-[#ffab80]' : 'text-mint']}
					aria-label={session.seconds + ' segundos restantes'}>{session.timeLabel}</time>
			{/if}
		</div>
		{#if session.running && session.index === levelIndex}
			<progress class="block h-1 w-full accent-mint" aria-label="Tiempo restante" max={session.round.seconds} value={session.seconds}></progress>
		{/if}
	</header>

	<div class="mx-auto grid max-w-3xl gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-7">
		{#if !level || level.locked}
			<p class="rounded-xl border border-line bg-panel p-4 text-muted">{level ? 'Supera la prueba anterior para abrir este nivel.' : 'Este nivel no está disponible.'}</p>
			<a class="atom-control w-fit" href={resolve('/atom/pruebas')}>Ver niveles</a>
		{:else if session.index === levelIndex && session.state === 'finished'}
			<section class="grid justify-items-start gap-3 rounded-2xl border border-warning/35 bg-panel p-4 sm:p-6" aria-label="Resultado">
				<h2 class="text-xl font-bold">Tiempo agotado</h2>
				<p class="text-3xl tracking-wider text-warning motion-safe:animate-score-pop">
					<span aria-hidden="true">{'★'.repeat(session.roundStars)}<span class="text-muted">{'☆'.repeat(session.maxStars - session.roundStars)}</span></span>
					<span class="sr-only">{session.roundStars} de {session.maxStars} estrellas en esta ronda</span>
				</p>
				<p>{session.score} puntos <span class="text-sm text-muted">· Mejor marca: {level.stars} de {session.maxStars} estrellas</span></p>
				<p class="text-sm text-muted">Pedidos perdidos: {session.lost}</p>
				<button class="atom-control min-h-12 border-transparent bg-mint px-4 text-page" type="button"
					bind:this={resultAction} onclick={() => session.start()}>Volver a jugar</button>
				{#if level.stars && session.ladder[levelIndex + 1]}
					<a class="atom-control" href={resolve('/atom/pruebas/[nivel]', { nivel: String(levelIndex + 2) })}>{session.ladder[levelIndex + 1].title} →</a>
				{:else if session.round.quantum && session.unlocked}
					<p class="text-mint">Moléculas desbloqueadas</p>
				{/if}
				<a class="inline-flex min-h-11 items-center text-sm text-muted underline" href={resolve('/atom/pruebas')}>Volver al camino</a>
			</section>
		{:else if session.running && session.index === levelIndex}
			<ElementLimit {session} />
			<div class="flex items-start justify-between gap-2">
				<details class="min-w-0 text-sm text-muted">
					<summary class="w-fit cursor-pointer py-3 font-semibold text-ink">Elementos 1–{session.limit} · Cómo jugar</summary>
					<p class="mb-2">{session.round.lesson}</p>
					<p>Gana una estrella para abrir la siguiente prueba. Cada acierto vale {session.baseOrderPoints} puntos.
						La racha activa {#each session.streakMultipliers as tier, index}{index ? ' y ' : ''}×{tier.multiplier} desde {tier.streak} aciertos{/each}. Si fallas, pierdes el pedido y se reinicia la racha.</p>
				</details>
				<button type="button" class="atom-control shrink-0 px-2.5 text-xs aria-pressed:border-selection aria-pressed:bg-selected aria-pressed:text-mint"
					aria-pressed={soundsEnabled} onclick={toggleSounds}>Sonido <span aria-hidden="true">{soundsEnabled ? '♪' : '×'}</span></button>
			</div>
			<RoundScore {session} />

			<ol class="grid list-none" aria-label="Pedido activo">
				{#each session.orders as order, position (order.number)}
					{@const category = order.target.category}
					<li class={[
						'element-category relative grid min-w-0 content-center justify-items-center gap-1 rounded-xl border px-1 py-2 text-center sm:px-3 sm:py-4',
						position === 0
							? 'border-(--element-color) bg-[color-mix(in_oklab,var(--color-panel)_82%,var(--element-color))] [--nuclide-size:clamp(2.75rem,8vw,4.25rem)]'
							: 'border-line bg-panel [--nuclide-size:clamp(1.8rem,6vw,3.4rem)]'
					]} data-category={category}>
						{#key position === 0 ? session.submission : undefined}
							<div class={['grid justify-items-center gap-1', position === 0 && session.submission?.kind === 'incorrect' && 'motion-safe:animate-order-shake']}>
								<span class="text-[.65rem] font-semibold text-muted">Pedido {order.number}</span>
								<Nuclide atom={order.target} showAtomicNumber />
								<strong class="max-w-full text-xs leading-tight sm:text-sm">{order.target.name}</strong>
								{#if category}<small class="text-xs leading-tight text-(--element-color)">{elementCategoryLabels[category]}</small>{/if}
							</div>
							{#if position === 0 && session.submission}
								{@const hit = session.submission}
								<span aria-hidden="true" class={['pointer-events-none absolute inset-0 rounded-xl border-2', hit.kind === 'correct' ? 'border-mint bg-mint/5 motion-safe:animate-order-ring' : 'border-rose-400 bg-rose-400/8']}></span>
								<span aria-hidden="true" class={['pointer-events-none absolute top-2 right-2 rounded-full px-2 py-0.5 font-mono text-sm leading-tight font-bold',
									hit.kind === 'incorrect' ? 'bg-rose-300 text-rose-950 motion-safe:animate-order-shake' :
									hit.goalReached ? 'bg-amber-300 text-amber-950 motion-safe:animate-point-rise' : 'bg-mint text-page motion-safe:animate-point-rise']}>
									{hit.kind === 'incorrect' ? '✕' : (hit.goalReached ? '★' : '✓') + ' +' + hit.points}
								</span>
							{/if}
						{/key}
					</li>
				{/each}
			</ol>

			<section class="grid min-w-0 gap-3 rounded-2xl border border-line bg-panel/70 p-2.5 sm:p-4" aria-label="Preparar pedido">
				{#if session.round.quantum}
					<form class="grid gap-3" bind:this={quantumForm} onsubmit={event => { event.preventDefault(); playCue(session.submitQuantumNumbers()); }}>
						<fieldset class="grid grid-cols-2 gap-2 sm:grid-cols-4" disabled={!session.canEdit}>
							<legend class="mb-2 font-semibold">Último electrón del subnivel {session.quantumElectron?.subshell}</legend>
							{#each quantumFields as [key, label]}
								<label class="grid gap-1 text-sm">{label}
									<input class="atom-control min-w-0" name={key} required autocomplete="off"
										value={session.quantumAnswer[key]} oninput={event => session.setQuantumNumber(key, event.currentTarget.value)} />
								</label>
							{/each}
						</fieldset>
						<p class="text-sm text-muted">Ordena los orbitales de −ℓ a +ℓ. Llena primero con +½ y luego con −½. Puedes escribir el espín como fracción o decimal.</p>
						<button type="submit" class="atom-control w-fit bg-mint text-page" disabled={!session.canEdit}>Enviar</button>
					</form>
				{:else if session.manual}
					{@const draft = session.configuration}
					<div role="region" aria-label="Zona para soltar fichas"
						class={['flex min-h-20 flex-wrap items-baseline gap-2 rounded-xl border-2 border-dashed p-4 font-mono text-xl', dragged ? 'border-mint bg-mint/10' : 'border-line']}
						ondragover={event => { if (dragged?.draft === draft) event.preventDefault(); }}
						ondrop={drop}>
						{#if draft.core}<span>[{draft.core.symbol}]</span>{/if}
						{#each draft.terms as term}<span>{term.name}<sup>{term.count}</sup></span>{/each}
						{#if draft.level}<span>{draft.level}{draft.letter}</span>{/if}
						<span class="rounded border border-line px-2 py-1 text-sm text-muted" aria-live="polite">{draft.prompt}</span>
					</div>
					<fieldset bind:this={tray} disabled={!session.canEdit}>
						<legend class="mb-2 text-sm text-muted">Arrastra una ficha al recuadro o haz clic para añadirla.</legend>
						<div class="flex flex-wrap gap-2">
							{#each choices as choice (choice.value)}
								<button type="button" class="atom-control min-h-11 min-w-11 cursor-grab font-mono active:cursor-grabbing"
									draggable={session.canEdit}
									aria-label={draft.prompt + ' · ' + choice.label}
									ondragstart={event => {
										dragged = { value: choice.value, draft };
										event.dataTransfer?.setData('text/plain', choice.label);
									}}
									ondragend={() => dragged = undefined}
									onclick={() => choose(choice.value)}>{choice.label}</button>
							{/each}
						</div>
					</fieldset>
					<div class="flex flex-wrap items-center gap-2">
						<button class="atom-control bg-transparent" disabled={!session.canUndo} onclick={() => session.undo()}>Deshacer</button>
						<button class="atom-control bg-mint text-page" disabled={!session.canEdit || !draft.complete} onclick={() => playCue(session.submitConfiguration())}>Enviar</button>
					</div>
				{:else}
					<ParticleTray {session} onSubmission={playCue} />
				{/if}
				{#if session.feedback}<p class="text-sm text-warning" role="status">{session.feedback}</p>{/if}
				<p class="sr-only" role="status" aria-atomic="true">
					{#key session.submission}
						{#if session.submission?.kind === 'correct'}
							{session.submission.points} puntos.{session.submission.goalReached ? ' Estrella conseguida.' : ''}
						{:else if session.submission?.kind === 'incorrect'}
							Pedido perdido. Racha reiniciada.
						{/if}
					{/key}
				</p>
			</section>
		{/if}
	</div>
</main>

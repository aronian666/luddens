<script lang="ts">
	import type { AtomSession, OrderSubmission } from './session.svelte.js';

	let { session, onSubmission }: { session: AtomSession; onSubmission?: (result: OrderSubmission) => void } = $props();
	const pieces = [
		{ id: 'protons', plural: 'protones', symbol: 'p⁺' },
		{ id: 'neutrons', plural: 'neutrones', symbol: 'n⁰' },
		{ id: 'electrons', plural: 'electrones', symbol: 'e⁻' }
	] as const;

	const particleColors = { protons: '#ffbc83', neutrons: '#9bd9f3', electrons: 'var(--color-mint)' };
	const disc = 'inline-grid aspect-square w-[1.6rem] place-items-center rounded-full bg-(--particle-color) font-mono text-xs font-bold text-[#122027]';
	const controlId = $props.id();

	let orderForm = $state<HTMLFormElement>();

	function focusProtons(form: HTMLFormElement) {
		const input = form.elements.namedItem('protons');
		if (input instanceof HTMLInputElement) {
			input.focus({ preventScroll: true });
			input.select();
		}
	}

	$effect(() => {
		if (session.canEdit && orderForm) focusProtons(orderForm);
	});

	function handleKey(event: KeyboardEvent, index: number) {
		if (!orderForm || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		if (event.code === 'Space' || event.key === ' ') {
			event.preventDefault();
			if (!event.repeat && session.canEdit) orderForm.requestSubmit();
			return;
		}
		const next = event.key === 'ArrowRight' || event.key === 'ArrowDown';
		if (!next && event.key !== 'ArrowLeft' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		const position = (index + (next ? 1 : -1) + pieces.length) % pieces.length;
		const input = orderForm.elements.namedItem(pieces[position].id);
		if (input instanceof HTMLInputElement) {
			input.focus();
			input.select();
		}
	}

	function submitOrder(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		const form = event.currentTarget;
		const result = session.submitParticleCounts();
		if (result) onSubmission?.(result);
		if (session.canEdit) focusProtons(form);
	}

</script>

<form class="grid gap-2.5" novalidate bind:this={orderForm} onsubmit={submitOrder}>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-2">
		{#each pieces as piece, index}
			<div class="flex min-h-12 items-center gap-2 rounded-lg border border-line px-1.5 py-0.5 sm:py-1.5" style:--particle-color={particleColors[piece.id]}>
				<span class="inline-grid size-11 shrink-0 place-items-center" aria-hidden="true">
					<span class={disc}>{piece.symbol}</span>
				</span>
				<label class="flex-1 capitalize" for={controlId + '-' + piece.id}>{piece.plural}</label>
				<input id={controlId + '-' + piece.id} name={piece.id} type="number" step="any"
					class="min-h-11 w-[4.55rem] rounded-md border border-line bg-control px-2 py-1.5 font-mono text-[.95rem] disabled:opacity-60"
					disabled={!session.canEdit} onkeydown={(event) => handleKey(event, index)}
					bind:value={() => session.particleCounts[piece.id], (count) => session.setParticleCount(piece.id, count ?? null)} />
			</div>
		{/each}
	</div>
	<button type="submit" class="atom-control relative min-h-12 border-transparent bg-mint px-8 text-[#0d2620] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-safe:active:scale-[.98] data-[answer=incorrect]:bg-rose-300 sm:justify-self-start"
		data-answer={session.submission?.kind} disabled={!session.canEdit}>
		Enviar
		{#key session.submission}
			{#if session.submission}
				<span class="absolute ml-1.5 motion-safe:animate-score-pop" aria-hidden="true">{session.submission.kind === 'correct' ? '✓' : '✕'}</span>
			{/if}
		{/key}
	</button>
	<p class="text-xs text-muted">Flechas para cambiar de campo · Espacio para enviar</p>
</form>

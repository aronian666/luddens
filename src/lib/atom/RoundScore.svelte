<script lang="ts">
	import type { AtomSession } from './session.svelte.js';

	let { session }: { session: AtomSession } = $props();
	let flamePaused = $state(false);
</script>

<div class="grid gap-3 rounded-2xl border border-line bg-panel p-3 sm:p-4">
	<dl class="grid grid-cols-[1.2fr_1fr_1fr] items-end gap-2">
		<div>
			<dt class="text-xs text-muted">Puntaje</dt>
			<dd class="font-mono text-2xl leading-tight font-bold tabular-nums text-mint">
				{#key session.score}
					<span class={['inline-block origin-left', session.score > 0 && 'motion-safe:animate-score-pop']}>{session.score}</span>
				{/key}
			</dd>
		</div>
		<div class="border-l border-line pl-2.5">
			<dt class="text-xs text-muted">Racha</dt>
			<dd class="font-mono text-xl font-bold tabular-nums">{session.streak}</dd>
		</div>
		<div class="border-l border-line pl-2.5">
			<dt class="text-xs text-muted">Multiplicador</dt>
			<dd class="flex min-h-7 items-center gap-1 font-mono text-xl leading-none font-bold tabular-nums text-warning
				data-[heat=1]:text-orange-300 data-[heat=2]:text-yellow-300 data-[heat=3]:text-cyan-300" data-heat={session.multiplier}>
				×{session.multiplier}
				{#if session.streak > 0}
					<button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
						aria-label="Animación de la llama" aria-pressed={!flamePaused} title={flamePaused ? 'Animar la llama' : 'Pausar la llama'}
						onclick={() => flamePaused = !flamePaused}>
						<svg viewBox="0 0 24 30" class={['h-6 w-5 origin-bottom drop-shadow-[0_0_3px_currentColor]', !flamePaused && 'motion-safe:animate-flame']} aria-hidden="true">
							<path fill="currentColor" d="M12 1c2 7-3 9-1 14 3-2 4-5 4-8 4 4 8 10 7 15-1 5-5 7-10 7S2 26 2 20c0-5 3-8 5-11-1 4 0 6 1 7 0-7 6-9 4-15Z" />
							<path fill="#fff7dc" d="M12 15c0 4-4 6-4 9 0 2 2 4 4 4 3 0 5-2 5-5 0-2-1-4-2-5 0 2-1 3-2 4 1-3 0-5-1-7Z" />
						</svg>
					</button>
				{/if}
			</dd>
		</div>
	</dl>
	<ol class="grid grid-cols-3 gap-1.5" aria-label="Puntaje por estrella">
		{#each session.starScores as threshold, index}
			{@const previous = session.starScores[index - 1] ?? 0}
			<li class="grid gap-1 text-xs font-semibold tabular-nums text-muted data-[reached=true]:text-warning" data-reached={session.score >= threshold}>
				<span class="h-1.5 overflow-hidden rounded-full bg-control" aria-hidden="true">
					<span class="block h-full origin-left bg-amber-300 motion-safe:transition-transform"
						style:transform={'scaleX(' + Math.min(1, Math.max(0, (session.score - previous) / (threshold - previous))) + ')'}></span>
				</span>
				<span><span aria-hidden="true">{session.score >= threshold ? '★' : '☆'}</span> <span class="sr-only">Estrella {index + 1}, </span>{threshold}<span class="sr-only"> puntos{session.score >= threshold ? ', conseguida' : ''}</span></span>
			</li>
		{/each}
	</ol>
</div>

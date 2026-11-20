<script lang="ts">
	import { nobleGases } from './rounds.js';
	import type { AtomSession } from './session.svelte.js';

	let { session }: { session: AtomSession } = $props();
	const name = $props.id();
</script>

<fieldset class="min-w-0">
	<legend class="mb-1.5 text-sm font-semibold">Número atómico máximo (Z)</legend>
	<div class="grid max-w-md grid-cols-7 gap-1">
		{#each nobleGases as gas (gas.protons)}
			<label class="grid min-h-11 cursor-pointer place-content-center justify-items-center rounded-lg border border-line bg-panel text-muted
				hover:border-selection has-checked:border-selection has-checked:bg-selected has-checked:text-mint has-focus-visible:outline-2 has-focus-visible:outline-focus">
				<input type="radio" disabled={session.running && session.round.kernel && gas.protons <= 2} class="sr-only" {name} value={gas.protons} checked={session.limit === gas.protons}
					aria-label={'Hasta ' + gas.protons + ', ' + gas.name} onchange={() => session.limit = gas.protons} />
				<span class="font-mono text-sm leading-tight font-bold">{gas.protons}</span>
				<span class="text-[.65rem] leading-tight">{gas.symbol}</span>
			</label>
		{/each}
	</div>
</fieldset>

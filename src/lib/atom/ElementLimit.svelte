<script lang="ts">
	import type { AtomSession } from './session.svelte.js';

	let { session }: { session: AtomSession } = $props();
	const name = $props.id();
</script>

<div class="flex flex-wrap items-end gap-x-4 gap-y-1">
	<fieldset class="w-full min-w-0 max-w-md">
		<legend class="mb-1.5 text-sm font-semibold">Número atómico máximo (Z)</legend>
		<div class="grid max-w-md grid-cols-7 gap-1">
			{#each session.limitOptions as gas (gas.protons)}
				<label class="grid min-h-11 cursor-pointer place-content-center justify-items-center rounded-lg border border-line bg-panel text-muted
					hover:border-selection has-checked:border-selection has-checked:bg-selected has-checked:text-mint has-focus-visible:outline-2 has-focus-visible:outline-focus">
					<input type="radio" class="sr-only" {name} value={gas.protons} checked={session.limit === gas.protons}
						aria-label={'Hasta ' + gas.protons + ', ' + gas.name} onchange={() => session.limit = gas.protons} />
					<span class="font-mono text-sm leading-tight font-bold">{gas.protons}</span>
					<span class="text-[.65rem] leading-tight">{gas.symbol}</span>
				</label>
			{/each}
		</div>
	</fieldset>
	<label class="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
		<input type="checkbox" class="size-5 accent-mint" bind:checked={session.showProtons} />
		Ver protones
	</label>
	<label class="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
		<input type="checkbox" class="size-5 accent-mint" bind:checked={session.showMass} />
		Ver masa
	</label>
</div>

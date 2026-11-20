<script lang="ts">
	import type { Atom } from './atom.js';

	let { atom, showAtomicNumber = false, showMass = true }: { atom: Atom; showAtomicNumber?: boolean; showMass?: boolean } = $props();
</script>

<span class="inline-grid w-max grid-cols-[auto_auto_auto] items-start gap-x-[.13em] font-mono text-[length:var(--nuclide-size,1.65rem)] leading-none font-bold text-[color:var(--element-color,var(--color-mint))]"
	role="img" aria-label={atom.name + (showMass ? ', masa ' + atom.mass : '') + ', carga ' + atom.chargeLabel + (showAtomicNumber ? ', número atómico ' + atom.protons : '')}>
	{#if showMass}
		<span class="col-start-1 row-start-1 justify-self-end text-[.51em]" aria-hidden="true">{atom.mass}</span>
	{/if}
	{#if showAtomicNumber}
		<span class="col-start-1 row-start-2 self-end justify-self-end text-[.51em]" aria-hidden="true">{atom.protons}</span>
	{/if}
	<span class={['col-start-2 row-start-1 leading-[1.05]', showAtomicNumber && 'row-span-2']} aria-hidden="true">{atom.symbol}</span>
	<span class="col-start-3 row-start-1 text-[.51em]" aria-hidden="true">{atom.nuclideCharge}</span>
</span>

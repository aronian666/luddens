<script lang="ts">
	import type { Snippet } from 'svelte';
	import { elementCategoryLabels, periodicGroups, periodicRows, type PeriodicAtom } from './elements.js';

	let { elementCell, groupHeader }: {
		elementCell: Snippet<[PeriodicAtom]>;
		groupHeader?: Snippet<[number]>;
	} = $props();
</script>

<ul aria-label="Clasificación de los elementos" class="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
	{#each Object.entries(elementCategoryLabels) as [category, label]}
		<li id={'element-category-' + category} class="element-category flex items-center gap-1.5" data-category={category}>
			<span class="size-3 rounded-sm bg-(--element-color)" aria-hidden="true"></span>{label}
		</li>
	{/each}
</ul>
<!-- svelte-ignore a11y_no_noninteractive_tabindex (The labeled overflow region supports keyboard scrolling.) -->
<div class="rounded-[.9rem] border border-line bg-panel mb-4 max-w-full overflow-auto p-2" role="region" tabindex="0" aria-label="Tabla periódica, 118 elementos">
	<table class="w-full min-w-[50rem] table-fixed sm:min-w-[57rem] border-separate border-spacing-1" aria-label="Los siete períodos, lantánidos y actínidos">
		<thead>
			<tr>
				<th scope="col" class="w-[1.65rem]"><span class="sr-only">Período</span></th>
				{#each periodicGroups as group}
					<th scope="col" class="sticky top-0 bg-panel font-mono text-xs font-normal text-muted">
						{#if groupHeader}{@render groupHeader(group)}{:else}{group}{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each periodicRows as period (period.label)}
				<tr>
					<th scope="row" class="sticky left-0 z-1 bg-panel font-mono text-xs font-normal text-muted">{period.label}</th>
					{#each period.atoms as atom}
						<td>
							{#if atom}
								{@render elementCell(atom)}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

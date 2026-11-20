<script lang="ts">
	let { modeSelected = $bindable() }: { modeSelected: 'Möller' | 'Iguano' } = $props();
	const diagramModes = ['Möller', 'Iguano'] as const;
</script>

<fieldset class="flex flex-wrap gap-2">
	<legend class="mb-1 text-sm font-semibold">Diagrama de orbitales</legend>
	{#each diagramModes as mode}
		<label class="atom-control inline-flex min-h-11 cursor-pointer items-center gap-2 has-checked:bg-selected has-checked:text-mint">
			<input class="accent-mint" type="radio" name="diagram-mode" value={mode} bind:group={modeSelected} />
			{mode}
		</label>
	{/each}
</fieldset>

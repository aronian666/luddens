<script lang="ts">
	import DiagramSelector from './DiagramSelector.svelte';
	import type { AtomSession, OrderSubmission } from './session.svelte.js';
	let { session, onSubmission }: { session: AtomSession; onSubmission: (result?: OrderSubmission) => void } = $props();
	const iguano = $derived(session.diagramMode === 'Iguano');
	const spins = [1, 2] as const;
</script>

<form class="grid min-w-0 gap-3 pb-[calc(4rem+env(safe-area-inset-bottom))]" onsubmit={event => { event.preventDefault(); onSubmission(session.submitConfiguration()); }}>
	<p class="text-sm text-muted">{session.round.lesson}</p>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<output aria-label="Configuración escrita" class="flex flex-wrap items-baseline gap-x-2 font-mono text-lg">
			{#each session.orbitalBoard.terms as term (term.name)}
				<span>{term.name}<sup>{term.count}</sup></span>
			{:else}
				<span class="text-sm text-muted">Sin electrones</span>
			{/each}
		</output>
		<button type="button" class="atom-control" disabled={!session.canUndo} onclick={() => session.undo()}>Deshacer</button>
		<button type="submit" class="atom-control fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 min-h-12 bg-mint px-5 text-page shadow-lg" disabled={!session.canEdit}>Enviar</button>
	</div>
	<DiagramSelector bind:modeSelected={session.diagramMode} />
	<div class="overflow-x-auto">
		<table class="w-full border-separate border-spacing-1 font-mono text-sm">
			<caption class="text-left font-semibold">Diagrama {iguano ? 'Iguano' : 'de Möller'}</caption>
			{#if !iguano}<thead><tr><th scope="col">n</th>{#each session.orbitalBoard.columns as col}<th scope="col">{col}</th>{/each}</tr></thead>{/if}
			<tbody>
				{#each (iguano ? session.orbitalBoard.iguanoRows : session.orbitalBoard.rows) as row}
					<tr>
						{#if !iguano}<th scope="row">{row.level}</th>{/if}
						{#each row.cells as group}
							<td class="align-top">
								{#if group}
									<div class="grid gap-1 rounded-lg border border-line p-1">
										<strong>{group.name}{#if iguano}<sup title="Capacidad del subnivel">{group.orbitals.length * 2}</sup>{/if}</strong>
										<div class="flex flex-wrap gap-1">
											{#each group.orbitals as slot, index}
												<div class="flex rounded border border-line">
													{#each spins as spin}
														<label class="relative grid h-9 w-6 cursor-pointer place-items-center text-muted has-checked:bg-selected has-checked:text-mint has-focus-visible:outline-2 has-focus-visible:outline-focus">
															<input type="checkbox" class="sr-only" disabled={!session.canEdit}
																aria-label={group.name + ', orbital ' + (index + 1) + ', espín ' + (spin === 1 ? 'arriba' : 'abajo')}
																checked={session.orbitalBoard.has(slot, spin)} onchange={() => session.toggleSpin(slot, spin)} />
															<span aria-hidden="true">{spin === 1 ? '↑' : '↓'}</span>
														</label>
													{/each}
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</form>

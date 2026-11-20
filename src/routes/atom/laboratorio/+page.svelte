<script lang="ts">
	import PeriodicTable from '#lib/atom/PeriodicTable.svelte';
	import AtomScene from '#lib/atom/AtomScene.svelte';
	import { elementCategoryLabels } from '#lib/atom/elements.js';
	import { AtomExplorer } from '#lib/atom/explorer.svelte.js';

	const explorer = new AtomExplorer();
</script>

<svelte:head>
	<title>Luddens · Laboratorio de Átomo</title>
	<meta name="description" content="Explora los orbitales de los 118 elementos en un modelo 3D." />
</svelte:head>

<main class="@container/main mx-auto w-full max-w-[78rem] px-4 pt-[clamp(1rem,3vw,2rem)] pb-12">
	<div class="mb-4 sm:mb-6">
		<h1 class="text-balance text-[clamp(2rem,5vw,3.5rem)] leading-[1.06] tracking-[-.045em]">Laboratorio de Átomo</h1>
		<p class="mt-2 text-muted">Elige un elemento y explora dónde es más probable encontrar sus electrones.</p>
	</div>

	<PeriodicTable>
		{#snippet elementCell(atom)}
			<button class="element-category atom-control grid min-h-11 w-full sm:min-h-[3.4rem] justify-items-start gap-0.5 bg-[color-mix(in_oklab,var(--color-panel)_89%,var(--element-color))] px-1.5 py-1 text-left text-(--element-color) sm:px-2 sm:py-1.5 aria-pressed:border-(--element-color) aria-pressed:bg-[color-mix(in_oklab,var(--color-panel)_75%,var(--element-color))] aria-pressed:outline-1 aria-pressed:-outline-offset-3 aria-pressed:outline-(--element-color) focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-focus!" data-category={atom.category} aria-label={atom.name}
				aria-describedby={'element-category-' + atom.category} title={atom.name + ' · ' + elementCategoryLabels[atom.category]}
				aria-pressed={explorer.protons === atom.protons} onclick={() => explorer.select(atom.protons)}>
				<small class="text-xs text-muted">{atom.protons}</small>
				<strong class="font-mono text-xl leading-none sm:text-[1.45rem]">{atom.symbol}</strong>
			</button>
		{/snippet}
	</PeriodicTable>

	<section class="rounded-[.9rem] border border-line bg-panel @container/lab p-[clamp(.75rem,2.5vw,1.35rem)]" aria-labelledby="selected-element">
		<div class="grid min-w-0 gap-4 @min-[52rem]/lab:grid-cols-[minmax(0,1fr)_minmax(26rem,39%)] @min-[52rem]/lab:items-start">
			<div class="min-w-0 overflow-hidden rounded-lg border border-line">
				<AtomScene atom={explorer.atom} mode="cloud" orbitals={explorer.visibleOrbitals} representation={explorer.representation}
					playback={explorer.playback} electronSpeed={explorer.electronSpeed}
					cloudParticles={explorer.cloudParticles} cameraRequest={explorer.cameraRequest}
					onOrientCamera={(view) => explorer.orientCamera(view)}>
					{#snippet overlay()}
						<div class="absolute top-2 left-2 flex gap-1 rounded-lg border border-line bg-panel/95 p-1 text-xs" role="group" aria-label="Representación">
							<button type="button" class="atom-control min-h-9 px-2 aria-pressed:border-selection aria-pressed:bg-selected aria-pressed:text-mint"
								aria-label="Forma del orbital" aria-pressed={explorer.representation === 'shape'}
								onclick={() => explorer.setRepresentation('shape')}>Forma</button>
							<button type="button" class="atom-control min-h-9 px-2 aria-pressed:border-selection aria-pressed:bg-selected aria-pressed:text-mint"
								aria-label="Nube de probabilidad" aria-pressed={explorer.representation === 'cloud'}
								onclick={() => explorer.setRepresentation('cloud')}>Partículas</button>
						</div>
						<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-line bg-panel/95 p-1 shadow-lg"
							role="group" aria-label="Reproducción de electrones">
							<button type="button" class="atom-control size-10 disabled:opacity-50" aria-label="Fotograma anterior" title="Fotograma anterior"
								disabled={explorer.playback.frame === 0 || explorer.visibleElectronCount === 0} onclick={() => explorer.playback.step(-1)}>⏮</button>
							<button type="button" class="atom-control size-10" aria-label={explorer.playback.playing ? 'Pausar' : 'Reproducir'}
								title={explorer.playback.playing ? 'Pausar' : 'Reproducir'} disabled={explorer.visibleElectronCount === 0}
								onclick={() => explorer.playback.toggle()}>{explorer.playback.playing ? 'Ⅱ' : '▶'}</button>
							<button type="button" class="atom-control size-10 disabled:opacity-50" aria-label="Fotograma siguiente" title="Fotograma siguiente"
								disabled={explorer.visibleElectronCount === 0} onclick={() => explorer.playback.step(1)}>⏭</button>
							<span class="sr-only whitespace-nowrap px-1 font-mono text-xs text-muted min-[480px]:not-sr-only">Fotograma {explorer.playback.frame + 1}</span>
							<label for="electron-playback-speed" class="sr-only">Velocidad</label>
							<select id="electron-playback-speed" class="atom-control h-10 cursor-pointer bg-panel px-1 text-sm" bind:value={explorer.electronSpeed}>
								{#each explorer.electronSpeedOptions as { value, label } (value)}
									<option {value}>{label}</option>
								{/each}
							</select>
						</div>
					{/snippet}
				</AtomScene>
			</div>
			<div class="grid min-w-0 content-start gap-1.5">
				<div class="element-category mb-3 rounded-lg border border-line bg-[#101c22] p-3 data-[feedback=error]:border-red-400"
					data-category={explorer.atom.category} data-feedback={explorer.feedback?.tone}>
					{#snippet countField(label: string, value: number, min: number, max: number, update: (value: number) => number)}
						<label class="flex items-center justify-end">
							<span class="sr-only">{label}</span>
							<input class="min-h-9 w-full appearance-none bg-transparent text-right font-mono tabular-nums focus-visible:rounded-sm [&::-webkit-inner-spin-button]:appearance-none"
								type="number" step="1" {min} {max} {value}
								aria-invalid={explorer.editError?.field === label || undefined}
								aria-describedby={explorer.editError?.field === label ? 'nuclide-feedback' : undefined}
								onchange={(event) => event.currentTarget.value = String(update(event.currentTarget.valueAsNumber))} />
						</label>
					{/snippet}
					<div class="mx-auto grid w-max max-w-full grid-cols-[2.75rem_minmax(0,auto)_2.75rem] grid-rows-3 items-center gap-x-1 font-semibold text-(--element-color)">
						<div class="col-start-1 row-start-1 self-start">
							{@render countField('Número de masa', explorer.mass, explorer.protons, explorer.maxMass, (value) => { explorer.mass = value; return explorer.mass; })}
						</div>
						<div class="col-start-1 row-start-2 text-sm text-muted">
							{@render countField('Neutrones', explorer.neutrons, 0, explorer.maxMass - explorer.protons, (value) => { explorer.neutrons = value; return explorer.neutrons; })}
						</div>
						<div class="col-start-1 row-start-3 self-end">
							{@render countField('Protones', explorer.protons, 1, explorer.maxProtons, (value) => { explorer.protons = value; return explorer.protons; })}
						</div>
						<strong class="col-start-2 row-span-3 row-start-1 justify-self-center font-mono text-[clamp(4.75rem,11vw,7rem)] leading-none">{explorer.atom.symbol}</strong>
						<label class="col-start-3 row-start-1 self-start">
							<span class="sr-only">Carga</span>
							<input class="min-h-9 w-full appearance-none bg-transparent font-mono tabular-nums focus-visible:rounded-sm [&::-webkit-inner-spin-button]:appearance-none"
								type="number" step="1" min={explorer.atom.minCharge} max={explorer.atom.maxCharge} value={explorer.charge}
								aria-invalid={explorer.editError?.field === 'Carga' || undefined}
								aria-describedby={explorer.editError?.field === 'Carga' ? 'nuclide-feedback' : undefined}
								onchange={(event) => { explorer.charge = event.currentTarget.valueAsNumber; event.currentTarget.value = String(explorer.charge); }} />
						</label>
					</div>
					<div class="mb-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs">
						{#if explorer.atom.hasAlternateMass}
							<span class="col-start-1 row-start-1 justify-self-end rounded-full border border-line bg-control px-2 py-0.5 text-muted">Isótopo</span>
						{/if}
						<h2 id="selected-element" class="col-start-2 row-start-1 text-center text-(--element-color)">{explorer.atom.name}</h2>
						<span class="col-span-3 row-start-2 text-center text-muted">{elementCategoryLabels[explorer.atom.category]}{explorer.atom.estimated ? ' (por posición en la tabla)' : ''}</span>
						{#if explorer.atom.isIon}
							<span class="col-start-3 row-start-1 justify-self-start rounded-full border border-selection/45 bg-selected px-2 py-0.5 text-mint">Ion</span>
						{/if}
					</div>
					<dl class="flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-line pt-2.5 font-mono text-xs text-muted [&>div]:flex [&>div]:gap-1 [&_dd]:text-ink">
						<div><dt><abbr title="Número de masa">A</abbr></dt><dd>= {explorer.mass}</dd></div>
						<div><dt><abbr title="Protones">Z</abbr></dt><dd>= {explorer.protons}</dd></div>
						<div><dt><abbr title="Electrones">e</abbr></dt><dd>= {explorer.atom.electrons}</dd></div>
						<div><dt><abbr title="Neutrones">n</abbr></dt><dd>= {explorer.neutrons}</dd></div>
					</dl>
					<div id="nuclide-feedback" role="status">
						{#if explorer.feedback}
							<p class="mt-3 rounded-md border px-2.5 py-2 text-sm data-[tone=error]:border-red-400/40 data-[tone=error]:bg-red-950/35 data-[tone=error]:text-red-200 data-[tone=warning]:border-warning/30 data-[tone=warning]:text-warning"
								data-tone={explorer.feedback.tone}>{explorer.feedback.message}</p>
						{/if}
					</div>
				</div>
				<h3 class="font-semibold">Configuración electrónica</h3>
				<code class="text-sm text-mint">{explorer.atom.configuration || 'Sin electrones'}</code>
				{#if explorer.atom.estimated || explorer.atom.charge !== 0}
					<p class="text-xs text-warning">Configuración electrónica aproximada.</p>
				{/if}
				{#if explorer.representation === 'cloud'}
					<label class="mt-1.5 grid max-w-[22rem] gap-0.5 text-muted">
						<span class="flex justify-between gap-2">Partículas por electrón <strong class="font-mono text-mint" aria-hidden="true">{explorer.cloudParticleLabel}</strong></span>
						<input class="min-h-11 w-full accent-mint" type="range" min={explorer.cloudParticleRange.min} max={explorer.cloudParticleRange.max}
							step={explorer.cloudParticleRange.step} bind:value={explorer.cloudParticles} aria-valuetext={explorer.cloudParticleLabel} />
					</label>
					<p class="text-sm text-muted">{explorer.cloudParticleTotalLabel} partículas en la nube.</p>
				{/if}
				<!-- svelte-ignore a11y_no_noninteractive_tabindex (The labeled overflow region supports keyboard scrolling.) -->
				<div class="overflow-auto p-1" role="region" tabindex="0" aria-label="Subniveles y espines">
					<table class="w-full min-w-[25.5rem] table-fixed border-separate border-spacing-[.18rem] [&_th]:font-mono [&_th]:text-xs [&_th]:font-normal [&_th]:text-muted [&_td]:align-top" aria-label="Diagrama de Möller">
						<caption class="py-1 text-left text-sm text-muted">Diagrama de Möller</caption>
						<colgroup>
							<col class="w-[1.15rem]" />
							{#each explorer.orbitalTypes as type}<col class={{ s: 'w-[12%]', p: 'w-[24%]', d: 'w-[27%]', f: '' }[type]} />{/each}
						</colgroup>
						<thead>
							<tr>
								<th scope="col">n</th>
								{#each explorer.orbitalTypes as type}<th scope="col">{type}</th>{/each}
							</tr>
						</thead>
						<tbody>
							{#each explorer.diagram as row (row.n)}
								<tr>
									<th scope="row">{row.n}</th>
									{#each row.cells as cell}
										<td>
											{#if cell}
												<div class={[
													'relative grid gap-0.5 rounded-lg border border-line p-[.19rem] [--orbital-color:hsl(var(--orbital-hue)_74%_72%)]',
													cell.electrons ? 'bg-[color-mix(in_oklab,var(--color-panel)_90%,var(--orbital-color))] text-(--orbital-color)' : 'border-dashed bg-[#0e181e] text-muted',
													cell.nextDiagonal && "after:pointer-events-none after:absolute after:-bottom-2 after:-left-1.5 after:z-1 after:text-xs after:text-muted after:content-['↙']"
												]}
													style:--orbital-hue={cell.hue}>
													<div class="flex items-baseline justify-between gap-0.5 font-mono text-xs [&>small]:text-[.66rem] [&>small]:text-muted">
														<strong>{cell.name}</strong>
														<small title={'Paso ' + cell.rank + ' del orden de llenado'}>{cell.rank}</small>
													</div>
													<div class="flex flex-wrap gap-[.13rem]" role="group" aria-label={'Orbitales ' + cell.name}>
														{#each cell.slots as slot (slot.orbital.key)}
															{#if slot.orbital.electrons}
																<label class={[
																		'relative inline-grid min-h-[1.65rem] w-[1.7rem] cursor-pointer place-content-center gap-px rounded-[.28rem] border p-px text-center font-mono text-xs leading-none [--orbital-color:hsl(var(--orbital-hue)_74%_72%)] has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-focus motion-safe:transition-colors',
																		slot.checked ? 'border-(--orbital-color) bg-[color-mix(in_oklab,var(--color-panel)_82%,var(--orbital-color))] text-(--orbital-color) after:pointer-events-none after:absolute after:top-0.5 after:right-0.5 after:size-1 after:rounded-full after:bg-current' : 'border-line text-muted'
																	]} style:--orbital-hue={slot.hue} title={slot.label}>
																	<input class="absolute inset-0 cursor-pointer opacity-0" type="checkbox" checked={slot.checked} aria-label={slot.label}
																		onchange={(event) => explorer.setOrbitalVisible(slot.orbital, event.currentTarget.checked)} />
																	{#key slot.spin}<span class="motion-safe:animate-spin-entry" aria-hidden="true">{slot.spin}</span>{/key}
																	{#if cell.l > 0}<small class="text-[.56rem]" aria-hidden="true">{cell.l === 3 ? slot.orbital.axis + 1 : slot.orbital.label}</small>{/if}
																</label>
															{:else}
																<span class="inline-grid min-h-[1.65rem] w-[1.7rem] rounded-[.28rem] border border-dashed border-[color-mix(in_oklab,var(--color-line)_72%,hsl(var(--orbital-hue)_74%_72%))]" style:--orbital-hue={slot.hue} role="img" aria-label={slot.label}></span>
															{/if}
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
				<p class="text-xs text-muted">↙ Orden de llenado orientativo. El deslizador muestra la ocupación de cada elemento.</p>
				<p class="text-xs text-muted">↑ Un electrón. ↑↓ Dos electrones con espines opuestos.</p>
			</div>
		</div>

		<details class="mt-3 border-t border-line pt-3">
			<summary class="cursor-pointer text-mint">Cómo se calcula el modelo</summary>
			<p class="mt-2 text-sm text-muted">La forma del orbital representa la amplitud angular con una escala ilustrativa. Las nubes muestran muestras de orbitales hidrogenoides dentro del mismo contorno que la vista de forma. El tamaño se ajusta con una estimación del apantallamiento entre electrones. Las superficies y las nubes usan el 1s como referencia de escala. La cámara se aleja para encuadrar los orbitales exteriores. En el 2s hay una región densa cerca del núcleo y una región externa más extensa que contiene la mayor parte de la probabilidad. Las separa un nodo radial, una superficie esférica donde la probabilidad es cero. Las posiciones de los electrones se mantienen al cambiar entre vistas. El núcleo coloreado representa protones y neutrones de forma esquemática.</p>
		</details>
	</section>
</main>

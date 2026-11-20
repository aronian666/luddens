<script lang="ts">
	import type { AxisHandle, CameraView } from './axes.js';

	let { axes, orient, magnify }: {
		axes: readonly AxisHandle[];
		orient: (view: CameraView) => void;
		magnify: (direction: -1 | 1) => void;
	} = $props();
</script>

<div class="absolute top-2 right-2 grid justify-items-center gap-1" role="group" aria-label="Controles de cámara">
	<div class="relative size-[108px]" role="group" aria-label="Orientación de la cámara">
		{#each axes as axis (axis.view)}
			<span class={[
				'pointer-events-none absolute top-1/2 left-1/2 h-px w-(--axis-length) origin-left rotate-(--axis-angle) bg-(--axis-color)',
				axis.positive ? 'opacity-65' : 'opacity-30'
			]} aria-hidden="true" style:--axis-color={axis.color}
				style:--axis-length={axis.length + 'px'} style:--axis-angle={axis.angle + 'rad'}></span>
		{/each}
		{#each axes as axis (axis.view)}
			<button class={[
				'absolute top-[calc(50%+var(--axis-y))] left-[calc(50%+var(--axis-x))] grid size-6 -translate-1/2 cursor-pointer place-items-center rounded-full border border-(--axis-color) font-mono text-[.7rem] font-bold focus-visible:z-30!',
				axis.positive ? 'bg-(--axis-color) text-[#152227]' : 'bg-[#17272e] text-(--axis-color) after:size-[5px] after:rounded-full after:bg-current'
			]} style:--axis-color={axis.color}
				style:--axis-x={axis.x + 'px'} style:--axis-y={axis.y + 'px'} style:z-index={axis.depth}
				aria-label={'Mirar desde ' + (axis.positive ? '' : '−') + axis.label}
				onclick={() => orient(axis.view)}>
				{#if axis.positive}{axis.label}{/if}
			</button>
		{/each}
	</div>
	<div class="flex gap-1 [&>button]:size-[30px] [&>button]:cursor-pointer [&>button]:rounded-md [&>button]:border [&>button]:border-line [&>button]:bg-[#13232ce6] [&>button:hover]:border-mint">
		<button aria-label="Alejar" onclick={() => magnify(-1)}>−</button>
		<button aria-label="Acercar" onclick={() => magnify(1)}>+</button>
		<button aria-label="Restablecer vista" title="Restablecer vista" onclick={() => orient('default')}>↺</button>
	</div>
</div>

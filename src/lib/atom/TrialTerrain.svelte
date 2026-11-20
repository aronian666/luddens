<script lang="ts">
	const id = $props.id();
	const trail = 'M163 -20 C151 30 42 49 80 112 C106 155 350 145 341 222 C332 286 79 269 80 346 C81 401 194 405 224 464';
	const meadowTrees = [
		[30, 154, 0.75], [366, 129, 0.65], [393, 156, 0.9], [46, 276, 0.8],
		[390, 309, 1.15], [363, 344, 0.8], [35, 401, 0.9], [68, 429, 0.6]
	] as const;
	const grasses = [[38, 224], [316, 124], [393, 228], [34, 332], [241, 350], [344, 386], [125, 415], [286, 428]] as const;
</script>

<svg class="pointer-events-none absolute inset-0 -z-10 size-full" viewBox="0 0 420 444" preserveAspectRatio="none"
	aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={id + '-sky'} x2="0" y2="1">
			<stop stop-color="#8bd9ad" />
			<stop offset="1" stop-color="#eae5a1" />
		</linearGradient>
		<linearGradient id={id + '-land'} x2="0" y2="1">
			<stop stop-color="#477951" />
			<stop offset="1" stop-color="#163f35" />
		</linearGradient>
	</defs>
	<rect width="420" height="444" fill={'url(#' + id + '-sky)'} />

	<circle cx="342" cy="55" r="31" fill="#fff1ae" opacity=".9" />
	<path d="M0 94Q37 72 78 96T166 91Q204 66 257 100T420 84V199H0Z" fill="#7eb281" />
	<path d="M0 129Q50 108 103 118T214 105Q288 83 343 119T420 116V444H0Z" fill={'url(#' + id + '-land)'} />
	<path d="M0 178Q86 134 205 164T420 150V211Q309 228 216 196T0 229Z" fill="#87ae70" opacity=".35" />
	<path d="M0 308Q103 247 196 282T420 269V328Q326 352 229 318T0 354Z" fill="#a4bb78" opacity=".14" />
	<path d="M0 406Q136 363 209 387T420 376V444H0Z" fill="#173b32" opacity=".55" />
	{#each meadowTrees as [x, y, scale]}
		<g transform={'translate(' + x + ' ' + y + ') scale(' + scale + ')'}>
			<path d="M0 4v15" stroke="#c1a56c" stroke-width="3" />
			<path d="M0-19l-9 13h4l-9 12H14L5-6h4Z" fill="#143d32" />
		</g>
	{/each}
	{#each grasses as [x, y]}
		<path d="M-6 0l3-7 3 7 3-9 3 9M7 0l3-5 3 5" transform={'translate(' + x + ' ' + y + ')'}
			fill="none" stroke="#b8c87b" stroke-width="1.5" opacity=".6" />
		<circle cx={x + 15} cy={y - 4} r="2" fill="#f4d588" />
	{/each}

	<path d={trail} fill="none" stroke="#214c3c" stroke-width="38" opacity=".68" />
	<path d={trail} fill="none" stroke="#dab67e" stroke-width="27" />
	<path d={trail} fill="none" stroke="#f6dcaa" stroke-width="2" stroke-dasharray="2 10"
		stroke-linecap="round" opacity=".55" />
</svg>

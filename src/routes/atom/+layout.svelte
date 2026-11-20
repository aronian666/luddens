<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AtomSession } from '#lib/atom/session.svelte.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const session = setContext(AtomSession, new AtomSession());
	const storageKey = 'luddens.atom.orders.v7';
	const playingRoute = $derived(page.route.id === '/atom/pruebas/[nivel]');
	const navLink = 'grid min-h-14 content-center justify-items-center gap-0.5 rounded-xl px-3 text-xs font-semibold text-muted hover:bg-control aria-[current=page]:bg-selected aria-[current=page]:text-mint';
	let ready = $state(false);

	function readSave(key: string): unknown {
		try { return JSON.parse(localStorage.getItem(key) ?? 'null'); }
		catch { return null; }
	}

	onMount(() => {
		const current = readSave(storageKey) ?? readSave('luddens.atom.orders.v6') ?? readSave('luddens.atom.orders.v5');
		if (current) session.restore(current);
		else {
			const older = readSave('luddens.atom.orders.v3') ?? readSave('luddens.atom.orders.v2');
			session.restore(readSave('luddens.atom.orders.v4') ?? older, older);
		}
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		const snapshot = session.snapshot;
		try { localStorage.setItem(storageKey, JSON.stringify(snapshot)); }
		catch { /* The session still retains progress in memory. */ }
	});

	$effect(() => {
		if (!session.running) return;
		const interval = window.setInterval(() => session.tick(), 100);
		return () => window.clearInterval(interval);
	});
</script>

<div class={playingRoute ? '' : 'pt-[env(safe-area-inset-top)] pb-[calc(4.5rem+env(safe-area-inset-bottom))]'}>
	{#if !playingRoute || ready}{@render children()}{/if}
</div>

{#if !playingRoute}
	<nav class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-panel/95 backdrop-blur-md" aria-label="Átomo">
		<div class="mx-auto grid max-w-xl grid-cols-3 gap-2 px-3 pt-1.5 pb-[max(.375rem,env(safe-area-inset-bottom))]">
			<a class={navLink} href={resolve('/atom/laboratorio')} aria-current={page.route.id === '/atom/laboratorio' ? 'page' : undefined}>
				<span class="text-xl leading-none" aria-hidden="true">⌬</span>
				Laboratorio
			</a>
			<a class={navLink} href={resolve('/atom/laboratorio/comparar')} aria-current={page.route.id === '/atom/laboratorio/comparar' ? 'page' : undefined}>
				<span class="text-xl leading-none" aria-hidden="true">⇄</span>
				Comparar
			</a>
			<a class={navLink} href={resolve('/atom/pruebas')} aria-current={page.route.id === '/atom/pruebas' ? 'page' : undefined}>
				<span class="text-xl leading-none" aria-hidden="true">★</span>
				Pruebas
			</a>
		</div>
	</nav>
{/if}

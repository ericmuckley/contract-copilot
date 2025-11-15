<script lang="ts">
	import { page } from '$app/state';
	import Chatbot from './Chatbot.svelte';

	const links = [
		{ href: '/', label: 'Dashboard', icon: 'bi bi-grid' },
		{ href: '/contracts', label: 'Contracts', icon: 'bi bi-file-earmark-text' },
		{ href: '/projects', label: 'Projects', icon: 'bi bi-folder' }
	];

	let isExpanded = $state(false);
	let expandTarget: HTMLElement | null = null;

	function handleMouseDown(e: MouseEvent) {
		if (expandTarget && expandTarget.contains(e.target as Node)) {
			isExpanded = true;
		} else {
			isExpanded = false;
		}
	}
</script>

<svelte:window onmousedown={handleMouseDown} />

<aside
	class="sticky top-0 left-0 bg-white {isExpanded
		? 'w-96'
		: 'w-52'} z-10 flex h-screen flex-col transition-all duration-300"
>
	<div class="cursor-default px-4 py-4 text-xl leading-none font-bold">
		<span
			class="bg-linear-to-r from-sky-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
		>
			ContractCopilot
		</span>
	</div>
	<nav class="mb-2 flex flex-col space-y-1 px-2">
		{#each links as link}
			<a
				href={link.href}
				class="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium {page.url
					.pathname === link.href
					? 'bg-slate-200'
					: 'tex-slate-600 hover:bg-slate-100'}"
			>
				<i class={link.icon}></i>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	<div class="mt-4 min-h-0 flex-1 border-t border-slate-100 pt-2" bind:this={expandTarget}>
		<div class="flex h-full flex-col">
			<Chatbot />
		</div>
	</div>

	{#if isExpanded}
		<div class="px-2 pb-1">
			<button
				class="text-standard w-full rounded-xl py-1 hover:bg-slate-200"
				onclick={() => (isExpanded = false)}
				aria-label="Collapse sidebar"
			>
				<i class="bi bi-chevron-double-left"></i>
			</button>
		</div>
	{/if}
</aside>

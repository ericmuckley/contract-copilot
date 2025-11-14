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
	class="sticky top-0 left-0 bg-slate-100 {isExpanded
		? 'w-84'
		: 'w-52'} z-10 flex h-screen flex-col transition-all duration-300"
>
	<div class="py-4">
		<div class="muted cursor-default px-4 text-xl leading-none font-bold">Contract Copilot</div>
	</div>
	<nav class="mb-2 flex flex-col space-y-1 px-2">
		{#each links as link}
			<a
				href={link.href}
				class="flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium {page.url
					.pathname === link.href
					? 'bg-blue-100 text-gray-900'
					: 'link'}"
			>
				<i class={link.icon}></i>
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>

	{#if isExpanded}
		<div>
			<button
				class="text-standard w-full hover:bg-slate-200"
				onclick={() => (isExpanded = false)}
				aria-label="Collapse sidebar"
			>
				<i class="bi bi-chevron-double-left"></i>
			</button>
		</div>
	{/if}

	<div class="h-full border px-2" bind:this={expandTarget}>
		<Chatbot />
	</div>

	{#if isExpanded}
		<div>
			<button
				class="text-standard w-full hover:bg-slate-200"
				onclick={() => (isExpanded = false)}
				aria-label="Collapse sidebar"
			>
				<i class="bi bi-chevron-double-left"></i>
			</button>
		</div>
	{/if}
</aside>

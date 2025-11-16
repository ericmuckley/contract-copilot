<script lang="ts">
	import Chatbot from './copilot/Chatbot.svelte';

	// TODO: make closed by default
	let isExpanded = $state(true);
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
	bind:this={expandTarget}
	class="sticky top-0 right-0 {isExpanded
		? 'w-full bg-white md:w-[500px]'
		: 'w-12 cursor-pointer bg-white hover:bg-sky-200'} z-10 flex h-screen flex-col transition-all duration-300"
>
	{#if isExpanded}
		<div class="flex h-full w-full flex-col">
			<div class="flex shrink-0 items-center justify-between space-x-6 border-b border-slate-200">
				<div class="cursor-default px-4 py-4 text-xl leading-none font-bold">
					<span class="text-gradient whitespace-nowrap">
						<i class="bi bi-robot mr-1"></i>
						Contract Copilot
					</span>
				</div>

				<div class="items-center px-4">
					<button
						class="link px-1 py-1 text-xl"
						onclick={() => (isExpanded = false)}
						aria-label="Collapse sidebar"
					>
						<i class="bi bi-x-lg"></i>
					</button>
				</div>
			</div>

			<div class="min-h-0 flex-1">
				<Chatbot />
			</div>
		</div>
	{:else}
		<div class="text-gradient mx-auto py-2 text-2xl">
			<i class="bi bi-robot"></i>
		</div>

		<div class="text-standard flex h-full w-full items-center justify-center">
			<i class="bi bi-chevron-double-left block"></i>
		</div>
	{/if}
</aside>

<script lang="ts">
	import Chatbot from './copilot/Chatbot.svelte';

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
	bind:this={expandTarget}
	class="sticky top-0 right-0 border-l border-slate-200/60 shadow-xl backdrop-blur-sm {isExpanded
		? 'w-full bg-white/95 md:w-[500px]'
		: 'w-14 cursor-pointer bg-white/80 hover:bg-indigo-50/80'} z-10 flex h-screen flex-col transition-all duration-300"
>
	<div class="flex h-full w-full flex-col {isExpanded ? '' : 'hidden'}">
		<div
			class="flex shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-5 backdrop-blur-sm"
		>
			<div class="cursor-default">
				<div class="flex items-center gap-2">
					<span
						class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
					>
						<i class="bi bi-robot text-xl"></i>
					</span>
					<span class="text-xl leading-none font-bold">
						<span
							class="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
						>
							Contract Copilot
						</span>
					</span>
				</div>
			</div>

			<button
				class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
				onclick={() => (isExpanded = false)}
				aria-label="Collapse sidebar"
			>
				<i class="bi bi-x-lg text-lg"></i>
			</button>
		</div>

		<div class="min-h-0 flex-1">
			<Chatbot />
		</div>
	</div>

	<div
		class="flex h-full w-full flex-col items-center justify-center gap-3 {isExpanded
			? 'hidden'
			: ''}"
	>
		<div
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
		>
			<i class="bi bi-robot text-xl"></i>
		</div>
		<i class="bi bi-chevron-double-left text-slate-400"></i>
	</div>
</aside>

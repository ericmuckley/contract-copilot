<script lang="ts">
	let {
		chatInputValue = $bindable(''),
		handleSubmit = () => {}
	}: { chatInputValue: string; handleSubmit: () => void } = $props();
	let textareaElement: HTMLTextAreaElement;

	function autoExpandTextarea(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<textarea
	bind:this={textareaElement}
	bind:value={chatInputValue}
	oninput={autoExpandTextarea}
	onkeydown={handleKeyDown}
	placeholder="Type your message..."
	class="placeholder-muted max-h-48 w-full resize-none overflow-y-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-sky-400 focus:outline-none"
></textarea>

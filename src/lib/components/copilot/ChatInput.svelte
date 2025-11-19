<script lang="ts">
	let {
		chatInputValue = $bindable(''),
		handleSubmit = () => {}
	}: { chatInputValue: string; handleSubmit: () => void } = $props();
	let textareaElement: HTMLTextAreaElement;

	function autoExpandTextarea(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		// Reset height to auto to get accurate scrollHeight
		textarea.style.height = 'auto';
		// Set height to scrollHeight, constrained by max-height in CSS
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
	rows="1"
	class="text-input max-h-48 resize-none overflow-hidden"
></textarea>

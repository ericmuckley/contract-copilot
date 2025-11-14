<script lang="ts">
	import type { Message } from '@aws-sdk/client-bedrock-runtime';
	import ChatInput from './ChatInput.svelte';

	let messages: Message[] = [];
	let chatInputValue = $state('');

	const handleSubmit = async () => {
		console.log('User submitted:', chatInputValue);
		// Add your submission logic here
	};
</script>

<ChatInput bind:chatInputValue {handleSubmit} />

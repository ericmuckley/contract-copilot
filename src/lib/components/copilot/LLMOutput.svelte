<script lang="ts">
	import { marked } from 'marked';

	let { text = '' }: { text?: string } = $props();

	let cleanText = (_text: string): string => {
		_text = _text.replace('<thinking>', "<span class='thinking'>");
		_text = _text.replace('</thinking>', '</span>');
		_text = String(marked(_text)).trim();
		_text = _text.replaceAll('<a ', "<a target='_blank' rel='noopener noreferrer' ");
		return _text;
	};
</script>

<div class="boilerplate standard max-w-full overflow-hidden">
	{@html cleanText(text)}
</div>

<style>
	.boilerplate :global(pre) {
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
		max-width: 100%;
		overflow-x: auto;
	}
	.boilerplate :global(code) {
		white-space: pre-wrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
	.boilerplate :global(table) {
		display: block;
		max-width: 100%;
		overflow-x: auto;
	}
	.boilerplate :global(p),
	.boilerplate :global(div),
	.boilerplate :global(span) {
		word-wrap: break-word;
		overflow-wrap: break-word;
		max-width: 100%;
	}
</style>

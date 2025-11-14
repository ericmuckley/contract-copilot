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

<div class="boilerplate standard">
	{@html cleanText(text)}
</div>

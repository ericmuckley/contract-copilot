<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { Agreement } from '$lib/schema';
	import jsPDF from 'jspdf';
	import { Document, Paragraph, Packer, TextRun } from 'docx';

	let { agreement }: { agreement: Agreement } = $props();

	let showEmailWidget = $state(false);
	let emailAddress = $state('');
	let sendingEmail = $state(false);
	let emailSent = $state(false);

	// Export to PDF
	function exportToPDF() {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;
		const maxWidth = pageWidth - 2 * margin;

		// Add title
		doc.setFontSize(16);
		doc.text(agreement.agreement_name, margin, margin);

		// Add content
		doc.setFontSize(10);
		const lines = doc.splitTextToSize(agreement.text_content, maxWidth);
		let y = margin + 10;

		for (let i = 0; i < lines.length; i++) {
			if (y > pageHeight - margin) {
				doc.addPage();
				y = margin;
			}
			doc.text(lines[i], margin, y);
			y += 7;
		}

		doc.save(`${agreement.agreement_name}.pdf`);
	}

	// Export to DOCX
	async function exportToDOCX() {
		const doc = new Document({
			sections: [
				{
					properties: {},
					children: [
						new Paragraph({
							children: [
								new TextRun({
									text: agreement.agreement_name,
									bold: true,
									size: 32
								})
							]
						}),
						new Paragraph({
							children: [
								new TextRun({
									text: '',
									break: 1
								})
							]
						}),
						...agreement.text_content.split('\n').map(
							(line) =>
								new Paragraph({
									children: [new TextRun(line)]
								})
						)
					]
				}
			]
		});

		const blob = await Packer.toBlob(doc);
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${agreement.agreement_name}.docx`;
		link.click();
		window.URL.revokeObjectURL(url);
	}

	// Send for signature
	function toggleEmailWidget() {
		showEmailWidget = !showEmailWidget;
		if (!showEmailWidget) {
			emailAddress = '';
			emailSent = false;
		}
	}

	async function sendForSignature() {
		if (!emailAddress) return;

		sendingEmail = true;

		// Simulate sending email
		await new Promise((resolve) => setTimeout(resolve, 2000));

		sendingEmail = false;
		emailSent = true;

		// Reset after showing success message
		setTimeout(() => {
			showEmailWidget = false;
			emailAddress = '';
			emailSent = false;
		}, 1000);
	}
</script>

<div class="flex items-center gap-3 border-b border-slate-200 py-4">
	<button onclick={exportToPDF} class="btn btn-primary flex items-center gap-2">
		<i class="bi-file-earmark-pdf"></i>
		Export to PDF
	</button>

	<button onclick={exportToDOCX} class="btn btn-primary flex items-center gap-2">
		<i class="bi-file-earmark-word"></i>
		Export to DOCX
	</button>

	<div class="relative">
		<button onclick={toggleEmailWidget} class="btn btn-outline flex items-center gap-2">
			<i class="bi-envelope"></i>
			Send for Signature
		</button>

		{#if showEmailWidget}
			<div
				class="card absolute top-full right-0 z-10 mt-2 w-80 border border-slate-200 shadow-lg"
				in:slide
				out:slide
			>
				{#if emailSent}
					<div class="flex items-center gap-2 text-green-600">
						<i class="bi-check-circle-fill"></i>
						<span class="font-medium">Email sent!</span>
					</div>
				{:else}
					<div class="space-y-3">
						<div>
							<label for="email" class="mb-1 block text-sm font-medium text-gray-700">
								Recipient Email Address
							</label>
							<input
								id="email"
								type="email"
								bind:value={emailAddress}
								placeholder="Enter email address"
								class="text-input"
							/>
						</div>
						<button
							onclick={sendForSignature}
							disabled={!emailAddress || sendingEmail}
							class="btn btn-primary flex w-full items-center justify-center gap-2"
						>
							{#if sendingEmail}
								<i class="bi-hourglass-split animate-spin"></i>
								Sending...
							{:else}
								<i class="bi-send"></i>
								Submit
							{/if}
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>

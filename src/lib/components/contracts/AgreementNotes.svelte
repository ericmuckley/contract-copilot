<script lang="ts">
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { invalidate } from '$app/navigation';
	import type { Agreement } from '$lib/schema';

	let { agreement }: { agreement: Agreement } = $props();

	let isAdding = $state(false);
	let newNote = $state('');
	let editingIndex = $state<number | null>(null);
	let editingText = $state('');
	let isSaving = $state(false);

	async function addNote() {
		if (!newNote.trim() || isSaving) return;

		isSaving = true;
		try {
			const notes = [...(agreement.notes || []), newNote.trim()];
			const response = await fetch(`/api/agreements/${agreement.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notes })
			});

			if (response.ok) {
				await invalidate('agreement:data');
				newNote = '';
				isAdding = false;
			} else {
				alert('Failed to add note');
			}
		} catch (error) {
			console.error('Error adding note:', error);
			alert('Failed to add note');
		} finally {
			isSaving = false;
		}
	}

	async function updateNote(index: number) {
		if (!editingText.trim() || isSaving) return;

		isSaving = true;
		try {
			const notes = [...(agreement.notes || [])];
			notes[index] = editingText.trim();

			const response = await fetch(`/api/agreements/${agreement.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notes })
			});

			if (response.ok) {
				await invalidate('agreement:data');
				editingIndex = null;
				editingText = '';
			} else {
				alert('Failed to update note');
			}
		} catch (error) {
			console.error('Error updating note:', error);
			alert('Failed to update note');
		} finally {
			isSaving = false;
		}
	}

	async function deleteNote(index: number) {
		if (isSaving) return;

		isSaving = true;
		try {
			const notes = (agreement.notes || []).filter((_, i) => i !== index);

			const response = await fetch(`/api/agreements/${agreement.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ notes })
			});

			if (response.ok) {
				await invalidate('agreement:data');
			} else {
				alert('Failed to delete note');
			}
		} catch (error) {
			console.error('Error deleting note:', error);
			alert('Failed to delete note');
		} finally {
			isSaving = false;
		}
	}

	function startEdit(index: number) {
		editingIndex = index;
		editingText = agreement.notes[index];
	}

	function cancelEdit() {
		editingIndex = null;
		editingText = '';
	}

	function cancelAdd() {
		isAdding = false;
		newNote = '';
	}
</script>

<h2>Notes</h2>

{#if isAdding}
	<div class="mb-4">
		<textarea
			bind:value={newNote}
			placeholder="Enter your note..."
			rows="3"
			class="text-input max-w-96"
			disabled={isSaving}
		></textarea>
		<div class="mt-2 flex max-w-96 gap-2">
			<button class="btn btn-primary" onclick={addNote} disabled={isSaving || !newNote.trim()}>
				{isSaving ? 'Saving...' : 'Save'}
			</button>
			<button class="btn btn-outline" onclick={cancelAdd} disabled={isSaving}> Cancel </button>
		</div>
	</div>
{/if}

{#if agreement.notes && agreement.notes.length > 0}
	<div class="space-y-3">
		{#each agreement.notes as note, index (index)}
			<div
				class="rounded-2xl border border-slate-200 bg-white px-6 py-2 shadow-sm"
				animate:flip
				in:slide
				out:slide
			>
				{#if editingIndex === index}
					<textarea
						bind:value={editingText}
						rows="3"
						class="text-input max-w-96"
						disabled={isSaving}
					></textarea>
					<div class="mt-2 flex max-w-96 gap-2">
						<button
							class="btn btn-primary"
							onclick={() => updateNote(index)}
							disabled={isSaving || !editingText.trim()}
						>
							{isSaving ? 'Saving...' : 'Save'}
						</button>
						<button class="btn btn-outline" onclick={cancelEdit} disabled={isSaving}>
							Cancel
						</button>
					</div>
				{:else}
					<div class="flex items-center justify-between">
						<p class="mb-0 flex-1 text-sm whitespace-pre-wrap">{note}</p>
						<div class="ml-4 flex gap-2">
							<button
								class="btn btn-bg"
								onclick={() => startEdit(index)}
								disabled={isSaving}
								title="Edit note"
							>
								<i class="bi-pencil"></i>
							</button>
							<button
								class="btn btn-bg"
								onclick={() => deleteNote(index)}
								disabled={isSaving}
								title="Delete note"
							>
								<i class="bi-trash"></i>
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else if !isAdding}
	<p class="muted text-sm">No notes yet. Click "Add Note" to get started.</p>
{/if}

{#if !isAdding}
	<div class="mt-2 w-min">
		<button
			class="btn btn-primary whitespace-nowrap"
			onclick={() => (isAdding = true)}
			disabled={isSaving}
		>
			<i class="bi-plus-lg"></i>
			Add Note
		</button>
	</div>
{/if}

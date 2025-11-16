<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import Navbar from '$lib/components/Navbar.svelte';
	import { allProjects } from '$lib/stores';

	let { children, data } = $props();
	
	$effect(() => {
		allProjects.set(data.projects);
		console.log($allProjects)
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen">
	<Navbar />
	<main class="flex-1 px-6 py-6">
		{@render children()}
	</main>
</div>

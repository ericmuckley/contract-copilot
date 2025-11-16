<script lang='ts'>
    import type { Project } from '$lib/schema';
    let { projects = [] }: { projects?: Project[] } = $props();
</script>


<div class="flex items-center justify-between">
    <div class="flex space-x-2">
        <h1>Project Estimates</h1>
        {#if projects.length > 0}
            <div>
                <div class="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-xl">
                    {projects.length}
                </div>
            </div>
        {/if}
    </div>
    <div>
        <a href="/projects/new" class="btn btn-primary hover:bg-sky-700!">
            <i class="bi bi-plus-lg"></i>
            New Project
        </a>            
    </div>
</div>
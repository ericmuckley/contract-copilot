<script lang='ts'>
    import type { Contract } from '$lib/schema';
    let { contracts = [] }: { contracts?: Contract[] } = $props();
</script>


<div class="flex items-center justify-between">
    <div class="flex space-x-2">
        <h1>Contracts</h1>
        {#if contracts.length > 0}
            <div>
                <div class="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-xl">
                    {contracts.length}
                </div>
            </div>
        {/if}
    </div>
    <div>
        <a href="/contracts/new" class="btn btn-primary hover:bg-sky-700!">
            <i class="bi bi-plus-lg"></i>
            New Contract
        </a>            
    </div>
</div>
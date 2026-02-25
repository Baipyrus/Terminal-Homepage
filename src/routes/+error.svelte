<script lang="ts">
	import { page } from '$app/state';
	import { CATPPUCCIN_MOCHA } from '$lib/config/terminal';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<div
	class="flex h-screen w-screen items-center justify-center"
	style:background-color={CATPPUCCIN_MOCHA.background}
>
	<p class="text-lg font-bold" style:color={CATPPUCCIN_MOCHA.red}>
		[{page.status}] {data?.httpMethod ?? ''}
		{page.url.pathname}
	</p>
</div>

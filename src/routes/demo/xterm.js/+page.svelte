<script lang="ts">
	import { Xterm, XtermAddon } from '@battlefieldduck/xterm-svelte';
	import type {
		ITerminalOptions,
		ITerminalInitOnlyOptions,
		Terminal
	} from '@battlefieldduck/xterm-svelte';

	let terminal = $state<Terminal>();

	const options: ITerminalOptions & ITerminalInitOnlyOptions = {
		// fontFamily: 'Consolas'
	};

	async function onLoad() {
		const fitAddon = new (await XtermAddon.FitAddon()).FitAddon();
		terminal?.loadAddon(fitAddon);
		fitAddon.fit();

		terminal?.write('Welcome to \x1B[1;3;34mSvelteKit Terminal\x1B[0m');
	}
</script>

<Xterm class="h-screen bg-black" bind:terminal {options} {onLoad} />

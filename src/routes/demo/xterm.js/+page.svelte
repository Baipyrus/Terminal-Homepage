<script lang="ts">
	import { Xterm } from '@battlefieldduck/xterm-svelte';
	import type {
		ITerminalOptions,
		ITerminalInitOnlyOptions,
		Terminal
	} from '@battlefieldduck/xterm-svelte';
	import { FitAddon } from '@xterm/addon-fit';

	let terminal = $state<Terminal>();

	const options: ITerminalOptions & ITerminalInitOnlyOptions = {
		// fontFamily: 'Consolas'
	};

	async function onLoad() {
		const fitAddon = new FitAddon();
		terminal?.loadAddon(fitAddon);
		fitAddon.fit();

		terminal?.write('Welcome to \x1B[1;3;34mSvelteKit Terminal\x1B[0m');
	}
</script>

<Xterm class="h-screen w-screen" bind:terminal {options} {onLoad} />

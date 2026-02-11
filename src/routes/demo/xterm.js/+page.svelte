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
		fontFamily: '"CaskaydiaCove Nerd Font", monospace',
		fontSize: 16,
	};

	async function onLoad() {
		await document.fonts.ready;

		const fitAddon = new FitAddon();
		terminal?.loadAddon(fitAddon);
		fitAddon.fit();

		terminal?.writeln('Welcome to \x1B[1;3;34mSvelteKit Terminal\x1B[0m!');
		terminal?.writeln('Ligature and icon test: => ');
	}
</script>

<Xterm class="h-screen w-screen" bind:terminal {options} {onLoad} />

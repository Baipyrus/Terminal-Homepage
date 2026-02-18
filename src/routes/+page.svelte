<script lang="ts">
	import { CATPPUCCIN_MOCHA } from '$lib/config/terminal';
	import {
		Xterm,
		type ITerminalOptions,
		type ITerminalInitOnlyOptions,
		type Terminal
	} from '@battlefieldduck/xterm-svelte';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebLinksAddon } from '@xterm/addon-web-links';

	let terminal = $state<Terminal>();

	const options: ITerminalOptions & ITerminalInitOnlyOptions = {
		fontFamily: '"CaskaydiaCove Nerd Font", monospace',
		fontSize: 16,
		theme: CATPPUCCIN_MOCHA
	};

	async function onLoad() {
		if (!terminal) return;
		await document.fonts.ready;

		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		fitAddon.fit();

		const webLinksAddon = new WebLinksAddon();
		terminal.loadAddon(webLinksAddon);

		terminal.writeln('Welcome to \x1B[1;3;34mSvelteKit Terminal\x1B[0m!');
		terminal.writeln('Ligature and icon test: => ');
		terminal.writeln('Link test: https://www.google.com/');
	}
</script>

<Xterm class="h-screen w-screen" bind:terminal {options} {onLoad} />

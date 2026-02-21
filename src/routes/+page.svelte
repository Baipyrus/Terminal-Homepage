<script lang="ts">
	import { CATPPUCCIN_MOCHA } from '$lib/config/terminal';
	import { ANSI_COLOR_RESET, ANSI_COLOR_BLUE, ANSI_COLOR_RED, Shell } from '$lib/shell/Shell';
	import {
		Xterm,
		type ITerminalOptions,
		type ITerminalInitOnlyOptions,
		type Terminal
	} from '@battlefieldduck/xterm-svelte';
	import { FitAddon } from '@xterm/addon-fit';
	import { WebLinksAddon } from '@xterm/addon-web-links';

	const { data } = $props();

	let shell: Shell | null = null;
	let terminal = $state<Terminal>();
	const fitAddon = new FitAddon();

	const options: ITerminalOptions & ITerminalInitOnlyOptions = {
		fontFamily: '"CaskaydiaCove Nerd Font", monospace',
		fontSize: 16,
		theme: CATPPUCCIN_MOCHA
	};

	async function onLoad() {
		if (!terminal) return;
		await document.fonts.ready;

		terminal.loadAddon(fitAddon);
		fitAddon.fit();

		const webLinksAddon = new WebLinksAddon();
		terminal.loadAddon(webLinksAddon);

		// Display website banner
		terminal.write(ANSI_COLOR_RED);
		terminal.writeln('██████╗  █████╗ ██╗██████╗ ██╗   ██╗██████╗    ██╗   ██╗███████╗');
		terminal.writeln('██╔══██╗██╔══██╗██║██╔══██╗╚██╗ ██╔╝██╔══██╗   ██║   ██║██╔════╝');
		terminal.writeln('██████╔╝███████║██║██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║███████╗');
		terminal.writeln('██╔══██╗██╔══██║██║██╔═══╝   ╚██╔╝  ██╔══██╗   ██║   ██║╚════██║');
		terminal.writeln('██████╔╝██║  ██║██║██║        ██║   ██║  ██║██╗╚██████╔╝███████║');
		terminal.writeln('╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝');
		terminal.writeln(ANSI_COLOR_RESET);

		// Display welcome message
		terminal.writeln('Welcome to my terminal homepage!');
		terminal.writeln(
			`Type ${ANSI_COLOR_BLUE}"help"${ANSI_COLOR_RESET} to see available commands.\r\n`
		);

		// Initialize custom shell for xterm.js
		shell = new Shell(terminal);
		shell.Initialize({
			username: data.username
		});

		terminal.focus();
	}

	$effect(() => {
		return () => {
			if (shell) shell.tryDestroySSE(true);
		};
	});
</script>

<svelte:window onresize={() => fitAddon?.fit()} />

<div class="h-screen w-screen" style:background-color={CATPPUCCIN_MOCHA.background}>
	<Xterm class="h-full w-full" bind:terminal {options} {onLoad} />
</div>

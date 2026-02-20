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
		const shell = new Shell(terminal);
		shell.Initialize({
			// // To add a custom prompt for the shell, you can set something like the following.
			// // It will set a white text starting with the username that is currently logged in
			// // ('root' while logged out), a fixed hostname you can define once, and the current
			// // "path" (the chat you are in). All static strings and the formatting as a whole
			// // are all completely up to your customization!
			// prompt: "$user@hostname $pwd$ ",
			//
			// // Also, add custom commands like so:
			// commands: [
			// 	{
			// 		name: 'example',
			// 		description: 'Example of a custom command',
			// 		action: ({ terminal, args }) => {
			// 			terminal.writeln(
			// 				"Any custom command can easily access this shell's corresponding terminal."
			// 			);
			// 			terminal.writeln(
			// 				'They can also accept any number of positional arguments, separated by spaces.'
			// 			);
			// 			terminal.writeln(
			// 				`Custom command's arguments are: [${args.map((str) => `'${str}'`).join(', ')}]`
			// 			);
			// 		}
			// 	}
			// ]
		});
	}
</script>

<svelte:window onresize={() => fitAddon?.fit()} />

<div class="h-screen w-screen" style:background-color={CATPPUCCIN_MOCHA.background}>
	<Xterm class="h-full w-full" bind:terminal {options} {onLoad} />
</div>

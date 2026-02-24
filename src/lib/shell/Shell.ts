import type { Terminal } from '@battlefieldduck/xterm-svelte';
import {
	COMMAND_MIN_LENGTH,
	COMMAND_MAX_LENGTH,
	type ShellCommand,
	type ShellCommandProps
} from './Command';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { normalize, dirsToPath } from './path';

const EMPTY = 0;
const SINGLE_ARGUMENT = 1;

const CURRENT_LINE_TRIM_END = -1;
const CURRENT_LINE_START = 0;

const RIGHT_ARROW_KEY = '\x1b[C';
const LEFT_ARROW_KEY = '\x1b[D';

// ANSI Escape Sequences for terminal control
const ANSI_SAVE_CURSOR = '\x1b[s';
const ANSI_RESTORE_CURSOR = '\x1b[u';
const ANSI_CLEAR_LINE_AFTER = '\x1b[K';

// ANSI Escape Sequences for terminal coloring using builtin theme
export const ANSI_COLOR_YELLOW = '\x1b[33m';
export const ANSI_COLOR_GREEN = '\x1b[32m';
export const ANSI_COLOR_RESET = '\x1b[0m';
export const ANSI_COLOR_BLUE = '\x1b[34m';
export const ANSI_COLOR_RED = '\x1b[31m';

export type ShellProps = { commands?: ShellCommand[]; prompt?: string; username?: string };

export class Shell {
	private _PROMPT: string;
	private _TERMINAL: Terminal;
	private _COMMANDS: Map<string, ShellCommand> = new Map();
	private _EVENTSOURCE: EventSource | null = null;

	private currentLine: string = '';
	private currentPath: string[] = ['~'];
	private cursorPosition: number = 0;
	private username: string = 'root';

	constructor(terminal: Terminal) {
		this._TERMINAL = terminal;
		this._PROMPT = `${ANSI_COLOR_GREEN}$user@${ANSI_COLOR_BLUE}baipyr.us ${ANSI_COLOR_YELLOW}$pwd${ANSI_COLOR_RESET}$ `;

		// Register default commands
		this.loadBuiltinCommands();
	}

	public Initialize(props: ShellProps) {
		// Set username if login successful
		if (props.username) {
			this.username = props.username;
			this.connectSSE();
		}

		// Accept custom prompt, if specified
		if (props.prompt) this._PROMPT = props.prompt;

		// Register custom commands for this shell instance, if any
		if (props.commands?.length) this.registerCommands(...props.commands);

		// Initialize terminal with shell prompt and input handler
		this.displayPrompt();
		this._TERMINAL.onData((data) => this.handleInput(data));
	}

	public tryDestroySSE(notify?: boolean) {
		// Ignore if not set
		if (!this._EVENTSOURCE) return;

		// Destroy if exists
		this._EVENTSOURCE.close();
		this._EVENTSOURCE = null;

		// Optionally notify user in terminal
		if (notify) this._TERMINAL.writeln('\r\nError: Readable stream disconnected from server');
	}

	// Connect `ReadableStream` for client to server if authenticated
	private connectSSE() {
		// Discard old event listener before switching channel
		this.tryDestroySSE();

		const channel = dirsToPath(this.currentPath);
		this._EVENTSOURCE = new EventSource(`/api/connect?channel=${encodeURIComponent(channel)}`);

		this._EVENTSOURCE.onmessage = (event) => {
			const message = JSON.parse(event.data);
			if (!message.user || !message.content) return;

			// Move to the beginning of the line and clear everything the user sees (prompt + input)
			this._TERMINAL.write(`${ANSI_SAVE_CURSOR}\r${ANSI_CLEAR_LINE_AFTER}`);

			// Print the broadcasted message
			this._TERMINAL.writeln(
				`${ANSI_COLOR_YELLOW}[${message.user}]:${ANSI_COLOR_RESET} ${message.content}`
			);

			// Redraw the prompt and restore whatever the user was typing
			this.displayPrompt();
			this._TERMINAL.write(this.currentLine);

			// If the cursor was not at the end of the line, move it back to the correct position
			this._TERMINAL.write(`${ANSI_RESTORE_CURSOR}\n`);
		};

		// Generic error handling and disconnect
		this._EVENTSOURCE.onerror = (error) => {
			console.error('EventSource Error:', error);
			this.tryDestroySSE(true);
		};
	}

	private loadBuiltinCommands() {
		this.registerCommands(
			{
				name: 'about',
				description: 'About this page',
				action: ({ terminal }) => {
					terminal.writeln("Hi! I'm Baipyrus and I am the owner and developer of this homepage.");
					terminal.writeln('I have written this web app using the SvelteKit framework and some');
					terminal.writeln('other handy tools to make the development process a bit easier.');
					terminal.writeln('Feel free to check out the code yourself! To get started on here,');
					terminal.writeln("first type 'help'!\n");
					terminal.writeln('Lastly, here are some helpful links to learn more about me:');
					terminal.writeln('https://github.com/Baipyrus');
					terminal.writeln('https://git.baipyr.us/Terminal-Homepage');
					terminal.writeln('https://github.com/Baipyrus/Terminal-Homepage');
				}
			},
			{
				name: 'help',
				description: 'Display this help message',
				action: ({ terminal }) => {
					terminal.writeln('Available commands:');

					this._COMMANDS.forEach((command, name) => {
						terminal.writeln(`  ${name.padEnd(COMMAND_MAX_LENGTH)} - ${command.description}`);
					});
				}
			},
			{
				name: 'clear',
				description: 'Clear the terminal',
				action: ({ terminal }) => terminal.clear()
			},
			{
				name: 'login',
				description: 'Login with GitHub',
				action: async ({ terminal }) => {
					terminal.writeln('Redirecting to login with GitHub...');
					await goto(resolve('/api/login'));
				}
			},
			{
				name: 'logout',
				description: 'Logout from session',
				action: async ({ terminal }) => {
					terminal.writeln('Logging out...');
					await goto(resolve('/api/logout'));
				}
			},
			{
				name: 'ls',
				description: 'List directories',
				action: (props) => this.cmd_ls(this, props)
			},
			{
				name: 'mkdir',
				description: 'Create a new directory',
				action: (props) => this.cmd_mkdir(this, props)
			},
			{
				name: 'cd',
				description: 'Change directory',
				action: (props) => this.cmd_cd(this, props)
			},
			{
				name: 'echo',
				description: 'Write arguments to the terminal',
				action: (props) => this.cmd_echo(this, props)
			}
		);
	}

	private registerCommands(...commands: ShellCommand[]) {
		for (const command of commands) {
			const cnl = command.name.length;
			if (cnl <= COMMAND_MIN_LENGTH || cnl > COMMAND_MAX_LENGTH) {
				console.error(
					`Command "${command.name}" does not conform to name length specification of ${COMMAND_MIN_LENGTH}-${COMMAND_MAX_LENGTH} characters.`
				);
				continue;
			}

			this._COMMANDS.set(command.name, command);
		}
	}

	// Handle shell prompt preparation with custom variables
	private displayPrompt() {
		// Lowercase conversion because of custom prompt variable sensitivity
		let prompt = this._PROMPT.toLowerCase();

		// Prepare prompt by replacing custom variables
		prompt = prompt.replace('$pwd', dirsToPath(this.currentPath));
		// Prepare prompt by replacing username from GitHub login
		prompt = prompt.replace('$user', this.username);

		this._TERMINAL.write(prompt);
	}

	private async handleInput(data: string) {
		// Boolean check to prevent out-of-bounds operations when the cursor is at the start
		const isAtStart = this.cursorPosition <= CURRENT_LINE_START;
		// The portion of the current line before the character immediately preceding the cursor
		const leftSplit = isAtStart
			? ''
			: this.currentLine.slice(CURRENT_LINE_START, this.cursorPosition + CURRENT_LINE_TRIM_END);
		// The portion of the current line from the cursor position to the very end
		const rightSplit = this.currentLine.slice(this.cursorPosition);
		// The specific character immediately preceding the cursor (the target for backspace)
		const pivotCharacter = isAtStart
			? ''
			: this.currentLine[this.cursorPosition + CURRENT_LINE_TRIM_END];
		// The user input as formed inside of the `currentLine`
		const userInput = this.currentLine.trim();

		switch (data) {
			// ENTER
			case '\r':
				this._TERMINAL.write('\r\n');
				this.currentLine = '';
				this.cursorPosition = CURRENT_LINE_START;
				await this.executeCommand(userInput);
				this.displayPrompt();

				break;
			// BACKSPACE
			case '\u007f':
				// Ignore if cursor already at start
				if (isAtStart) break;

				// Remove character at cursor position from `currentLine` string
				this.currentLine = leftSplit + rightSplit;
				this.cursorPosition--;

				// Optimization: Move back, save the current cursor position, clear everything
				// after it, write the shifted tail, then restore the cursor to the saved spot.
				// Simply spamming arrow keys will cause flickering of the cusor.
				this._TERMINAL.write(
					`\b${ANSI_SAVE_CURSOR}${ANSI_CLEAR_LINE_AFTER}${rightSplit}${ANSI_RESTORE_CURSOR}`
				);

				break;
			// ARROW KEY LEFT
			case LEFT_ARROW_KEY:
				if (this.cursorPosition <= CURRENT_LINE_START) break;

				this.cursorPosition--;
				this._TERMINAL.write(data);
				break;
			// ARROW KEY RIGHT
			case RIGHT_ARROW_KEY:
				if (this.cursorPosition >= this.currentLine.length) break;

				this.cursorPosition++;
				this._TERMINAL.write(data);
				break;
			default:
				// Check if input data is in printable range before writing to terminal
				if (data < ' ' || data > '~') break;

				// Support inserting characters at cursor position
				this.currentLine = leftSplit + pivotCharacter + data + rightSplit;
				this.cursorPosition += data.length;

				// Redraw logic: Write the new character(s), save the cursor position,
				// write the remaining tail of the line, then restore cursor to the saved spot.
				// Simply spamming arrow keys will cause flickering of the cusor.
				this._TERMINAL.write(data + ANSI_SAVE_CURSOR + rightSplit + ANSI_RESTORE_CURSOR);
				break;
		}
	}

	private async executeCommand(command: string) {
		// No command was supplied
		if (command === '') return;

		// Extract command syntax and try to find command
		const [cmd, ...args] = command.split(' ');
		const registeredCommand = this._COMMANDS.get(cmd);

		// Command not found error:
		if (!registeredCommand) {
			this._TERMINAL.writeln(`Command not found: ${cmd}`);
			return;
		}

		await registeredCommand.action({ terminal: this._TERMINAL, args });
	}

	// This method is used as the `ShellCommandAction` for the builtin `ls` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_ls(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length > SINGLE_ARGUMENT) {
			terminal.writeln('Error: Invalid number of arguments');
			return;
		}

		const target = args[0] || dirsToPath(self.currentPath);
		const absolutePath = dirsToPath(normalize(target, dirsToPath(self.currentPath)));

		const response = await fetch(`/api/ls?path=${encodeURIComponent(absolutePath)}`);

		// Since we get both error messages and directory data via JSON and
		// do not check other outcomes of our request, we simply catch all
		// unexpected behavior and print an error to the terminal.
		try {
			const data: string[] | { error: string } = await response.json();
			if (!response.ok && !Array.isArray(data)) {
				terminal.writeln(`ls: ${data.error}`);
				return;
			}

			if (Array.isArray(data) && data.length > EMPTY) terminal.writeln(data.join('  '));
		} catch {
			terminal.writeln(`ls: Unexpected error during execution (Status: ${response.status})`);
		}
	}

	// This method is used as the `ShellCommandAction` for the builtin `mkdir` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_mkdir(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length !== SINGLE_ARGUMENT) {
			terminal.writeln('Error: Invalid number of arguments');
			return;
		}

		const [target] = args;
		const absolutePath = dirsToPath(normalize(target, dirsToPath(self.currentPath)));

		const response = await fetch('/api/mkdir', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: absolutePath })
		});

		if (response.ok) return;

		// As in the `ls` command, we expect an error message or any
		// number of unaccounted errors or different response codes.
		try {
			const data: { error: string } = await response.json();
			if (!data.error) throw new Error('Panic');
			terminal.writeln(`mkdir: ${data.error}`);
		} catch {
			terminal.writeln(`mkdir: Unexpected error during execution (Status: ${response.status})`);
		}
	}

	// This method is used as the `ShellCommandAction` for the builtin `cd` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_cd(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length > SINGLE_ARGUMENT) {
			terminal.writeln('Error: Invalid number of arguments');
			return;
		}

		const target = args[0] || '~';
		const directories = normalize(target, dirsToPath(self.currentPath));
		const absolutePath = dirsToPath(directories);

		if (absolutePath === '~') {
			self.currentPath = ['~'];
			self.connectSSE();
			return;
		}

		// Check if directory exists via `ls` endpoint
		const response = await fetch(`/api/ls?path=${encodeURIComponent(absolutePath)}`);

		// Same error handling as in `ls` command
		try {
			const data: string[] | { error: string } = await response.json();
			if (!response.ok && !Array.isArray(data) && data.error) {
				terminal.writeln(`cd: ${data.error} (Path resolved as: '${absolutePath}')`);
				return;
			}
		} catch {
			terminal.writeln(`cd: Unexpected error during execution (Status: ${response.status})`);
			return;
		}

		// If everything succeeded according to plan, save path to current
		// Note that we disable the ESLint rule here because `cd` is the only
		// command that should ever be allowed to change the current path (directory)
		/* eslint-disable-next-line require-atomic-updates */
		self.currentPath = directories;
		self.connectSSE();
	}

	// This method is used as the `ShellCommandAction` for the builtin `echo` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_echo(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length < SINGLE_ARGUMENT) return;

		const response = await fetch('/api/echo', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				message: args.join(' '),
				channel: dirsToPath(self.currentPath)
			})
		});

		if (response.ok) return;

		// As in the `ls` command, we expect an error message or any
		// number of unaccounted errors or different response codes.
		try {
			const data: { error: string } = await response.json();
			if (!data.error) throw new Error('Panic');
			terminal.writeln(`echo: ${data.error}`);
		} catch {
			terminal.writeln(`echo: Unexpected error during execution (Status: ${response.status})`);
		}
	}
}

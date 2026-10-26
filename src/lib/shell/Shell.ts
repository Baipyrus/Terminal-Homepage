import type { Terminal } from '@battlefieldduck/xterm-svelte';
import {
	COMMAND_MIN_LENGTH,
	COMMAND_MAX_LENGTH,
	type ShellCommand,
	type ShellCommandProps
} from './Command';
import { resolve } from '$app/paths';
import { normalize, dirsToPath } from './path';
import { authClient } from '#lib/auth-client.ts';

const EMPTY = 0;
const SINGLE_ARGUMENT = 1;

const CURRENT_LINE_TRIM_END = -1;
const CURRENT_LINE_START = 0;

const HISTORY_LIMIT = 100;
const HISTORY_INDEX_DEFAULT = -1;
const HISTORY_INDEX_STEP = 1;
const HISTORY_STORAGE_KEY = 'shell_history';

const RIGHT_ARROW_KEY = '\x1b[C';
const LEFT_ARROW_KEY = '\x1b[D';
const UP_ARROW_KEY = '\x1b[A';
const DOWN_ARROW_KEY = '\x1b[B';

// ANSI Escape Sequences for terminal control
const ANSI_LINE_START_IDX = 1;
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
	private history: string[] = [];
	private historyIndex: number = -1;
	private historyCache: string = '';

	constructor(terminal: Terminal) {
		this._TERMINAL = terminal;
		this._PROMPT = `$user@baipyr.us $pwd$ `;

		// Register default commands
		this.loadBuiltinCommands();
	}

	private ANSI_CURSOR_ABS = (idx = ANSI_LINE_START_IDX) =>
		`\x1b[${idx + this.preparePrompt(false).length}G`;

	public Initialize(props: ShellProps) {
		// Set username if login successful
		if (props.username) {
			this.username = props.username;
			this.connectSSE();
		}

		// Persistently save command history
		this.loadLocalHistory();

		// Accept custom prompt, if specified
		if (props.prompt) this._PROMPT = props.prompt;

		// Register custom commands for this shell instance, if any
		if (props.commands?.length) this.registerCommands(...props.commands);

		// Initialize terminal with shell prompt and input handler
		this.displayPrompt();
		this._TERMINAL.onData((data) => this.handleInput(data));
	}

	public loadLocalHistory() {
		try {
			const storage = localStorage.getItem(HISTORY_STORAGE_KEY);
			if (!storage) return;

			const history = JSON.parse(storage);
			if (!history || !Array.isArray(history)) return;

			this.history = history;
			// Explicitly reset index in case of reloading history
			this.historyIndex = -1;
		} catch (error) {
			console.error(error);
		}
	}

	public saveLocalHistory() {
		try {
			const serialized = JSON.stringify(this.history);
			localStorage.setItem(HISTORY_STORAGE_KEY, serialized);
		} catch (error) {
			console.error(error);
		}
	}

	public tryDestroySSE(notify?: boolean) {
		// Ignore if not set
		if (!this._EVENTSOURCE) return;

		// Destroy if exists
		this._EVENTSOURCE.close();
		this._EVENTSOURCE = null;

		// Optionally notify user in terminal
		if (!notify) return;

		// Interrupt user input, write error message to terminal instead
		this.interruptMessage('Error: Readable stream disconnected from server');
	}

	private interruptMessage(message: string) {
		// Move to the beginning of the line and clear everything the user sees (prompt + input)
		this._TERMINAL.write(`${ANSI_SAVE_CURSOR}\r${ANSI_CLEAR_LINE_AFTER}`);

		// Print the broadcasted message
		this._TERMINAL.writeln(message);

		// Redraw the prompt and restore whatever the user was typing
		this.displayPrompt();
		this._TERMINAL.write(this.currentLine);

		// If the cursor was not at the end of the line, move it back to the correct position
		this._TERMINAL.write(`${ANSI_RESTORE_CURSOR}\n`);
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

			// Interrupt user input, write received message to terminal instead
			this.interruptMessage(
				`${ANSI_COLOR_YELLOW}[${message.user}]:${ANSI_COLOR_RESET} ${message.content}`
			);
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
				action: ({ terminal }) => {
					terminal.writeln('Redirecting to login with GitHub...');
					authClient.signIn.social({
						provider: 'github',
						callbackURL: '/api/login/success',
						errorCallbackURL: '/api/login/error'
					});
				}
			},
			{
				name: 'logout',
				description: 'Logout from session',
				action: ({ terminal }) => {
					terminal.writeln('Logging out...');
					// NOTE: We log out server-side here so we can log it properly
					location.href = resolve('api/logout');
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
				name: 'rmdir',
				description: 'Remove an empty directory',
				action: (props) => this.cmd_rmdir(this, props)
			},
			{
				name: 'cd',
				description: 'Change directory',
				action: (props) => this.cmd_cd(this, props)
			},
			{
				name: 'echo',
				description: 'Send messsage in directory',
				action: (props) => this.cmd_echo(this, props)
			},
			{
				name: 'history',
				description: 'Display command history',
				action: ({ terminal }) => {
					if (this.history.length === EMPTY) {
						terminal.writeln('No command history available.');
					} else {
						this.history.slice(-HISTORY_LIMIT).forEach((cmd, index) => {
							terminal.writeln(`${index + HISTORY_INDEX_STEP}: ${cmd}`);
						});
					}
				}
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
	private preparePrompt(colorize = true) {
		// Lowercase conversion because of custom prompt variable sensitivity
		let prompt = this._PROMPT.toLowerCase();

		// Prepare prompt by replacing username from GitHub login
		prompt = prompt.replace('$user', (colorize ? ANSI_COLOR_GREEN : '') + this.username);
		// Prepare prompt by colorizing hostname
		prompt = prompt.replace('baipyr.us', `${colorize ? ANSI_COLOR_BLUE : ''}baipyr.us`);
		// Prepare prompt by replacing custom variables
		prompt = prompt.replace(
			'$pwd',
			(colorize ? ANSI_COLOR_YELLOW : '') + dirsToPath(this.currentPath)
		);
		// Prepare prompt by resetting color at the end
		prompt = prompt.replace(/\$ $/, `${colorize ? ANSI_COLOR_RESET : ''}$ `);

		return prompt;
	}

	private displayPrompt = () => this._TERMINAL.write(this.preparePrompt());

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
				this.historyIndex = HISTORY_INDEX_DEFAULT;
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
			// HOME KEY
			case '\x1b[H':
				this.cursorPosition = 0;
				this._TERMINAL.write(this.ANSI_CURSOR_ABS());
				break;
			// END KEY
			case '\x1b[F':
				this.cursorPosition = this.currentLine.length;
				this._TERMINAL.write(this.ANSI_CURSOR_ABS(this.currentLine.length + ANSI_LINE_START_IDX));
				break;
			// ARROW KEY UP
			case UP_ARROW_KEY: {
				if (this.history.length === EMPTY) break;

				// ONLY FIRST up arrow skips to latest history entry (no wrap)
				if (this.historyIndex === HISTORY_INDEX_DEFAULT) {
					this.historyIndex = this.history.length - HISTORY_INDEX_STEP;
					this.historyCache = this.currentLine;
					// Afterwards, only decrement until reached oldest entry
				} else if (this.historyIndex >= HISTORY_INDEX_STEP) this.historyIndex--;

				const selected = this.history[this.historyIndex];
				this.currentLine = selected;
				this.cursorPosition = selected.length;

				// Move cursor to start of line, clear it, write command
				this._TERMINAL.write(`${this.ANSI_CURSOR_ABS()}${ANSI_CLEAR_LINE_AFTER}${selected}`);
				break;
			}
			// ARROW KEY DOWN
			case DOWN_ARROW_KEY: {
				// Ignore if already at most recent entry in history
				if (this.history.length === EMPTY || this.historyIndex === HISTORY_INDEX_DEFAULT) break;

				// Keep incrementing through history
				if (this.historyIndex < this.history.length - HISTORY_INDEX_STEP) this.historyIndex++;
				// Or if at the end of array, reset to cached item and default position
				else {
					this.historyIndex = HISTORY_INDEX_DEFAULT;
					this.currentLine = this.historyCache;
					this.cursorPosition = this.historyCache.length;
					this._TERMINAL.write(
						`${this.ANSI_CURSOR_ABS()}${ANSI_CLEAR_LINE_AFTER}${this.currentLine}`
					);
					break;
				}

				const selected = this.history[this.historyIndex];
				this.currentLine = selected;
				this.cursorPosition = selected.length;

				// Move cursor to start of line, clear it, write command
				this._TERMINAL.write(`${this.ANSI_CURSOR_ABS()}${ANSI_CLEAR_LINE_AFTER}${selected}`);
				break;
			}
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
		const trimCmd = command.trim();
		if (trimCmd === '') return;

		// Enforce history limit:
		this.history.push(trimCmd);
		if (this.history.length > HISTORY_LIMIT) this.history.shift();

		// Persistently save command history
		this.saveLocalHistory();

		// Extract command syntax and try to find command
		const [cmd, ...args] = trimCmd.split(' ');
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

	// This method is used as the `ShellCommandAction` for the builtin `rmdir` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_rmdir(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length !== SINGLE_ARGUMENT) {
			terminal.writeln('Error: Invalid number of arguments');
			return;
		}

		const [target] = args;
		const absolutePath = dirsToPath(normalize(target, dirsToPath(self.currentPath)));

		const response = await fetch('/api/rmdir', {
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
			terminal.writeln(`rmdir: ${data.error}`);
		} catch {
			terminal.writeln(`rmdir: Unexpected error during execution (Status: ${response.status})`);
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

		// Try changing directory, if exists
		const response = await fetch(`/api/cd?path=${encodeURIComponent(absolutePath)}`);

		// If everything succeeded according to plan, save path to current
		// Note that we disable the ESLint rule here because `cd` is the only
		// command that should ever be allowed to change the current path (directory)
		if (response.ok) {
			/* eslint-disable-next-line require-atomic-updates */
			self.currentPath = directories;
			return;
		}

		// As in the `ls` command, we expect an error message or any
		// number of unaccounted errors or different response codes.
		try {
			const data: { error: string } = await response.json();
			if (!data.error) throw new Error('Panic');
			terminal.writeln(`cd: ${data.error}`);
		} catch {
			terminal.writeln(`cd: Unexpected error during execution (Status: ${response.status})`);
		}
	}

	// This method is used as the `ShellCommandAction` for the builtin `echo` command.
	// This ESLint rule is disabled because `cmd_` is only a prefix in this case.
	/* eslint-disable-next-line camelcase */
	private async cmd_echo(self: Shell, { terminal, args }: ShellCommandProps) {
		if (args.length < SINGLE_ARGUMENT) return;
		const message = args.join(' ');

		const response = await fetch('/api/echo', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message, channel: dirsToPath(self.currentPath) })
		});

		if (response.ok) {
			terminal.writeln(`${ANSI_COLOR_YELLOW}[${self.username}]:${ANSI_COLOR_RESET} ${message}`);
			return;
		}

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

import type { Terminal } from '@battlefieldduck/xterm-svelte';
import { COMMAND_MIN_LENGTH, COMMAND_MAX_LENGTH, type ShellCommand } from './Command';

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

export type ShellProps = { commands?: ShellCommand[]; prompt?: string };

export class Shell {
	private _PROMPT: string;
	private _TERMINAL: Terminal;
	private _COMMANDS: Map<string, ShellCommand> = new Map();

	private currentLine: string = '';
	private currentPath: string = '~';
	private cursorPosition: number = 0;

	constructor(terminal: Terminal) {
		this._TERMINAL = terminal;
		this._PROMPT = `${ANSI_COLOR_GREEN}root@${ANSI_COLOR_BLUE}baipyr.us ${ANSI_COLOR_YELLOW}$pwd${ANSI_COLOR_RESET}$ `;

		// Register default commands
		this.registerCommands(
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
			}
		);
	}

	public Initialize(props: ShellProps) {
		if (props.prompt) this._PROMPT = props.prompt;

		// Register custom commands for this shell instance, if any
		if (props.commands?.length) this.registerCommands(...props.commands);

		// Initialize terminal with shell prompt and input handler
		this.displayPrompt();
		this._TERMINAL.onData((data) => this.handleInput(data));
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
		prompt = prompt.replace('$pwd', this.currentPath);
		// TODO: Implement username from GitHub login for messaging
		// prompt = prompt.replace('$user', this.username);

		this._TERMINAL.write(prompt);
	}

	private handleInput(data: string) {
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

		switch (data) {
			// ENTER
			case '\r':
				this._TERMINAL.write('\r\n');
				this.executeCommand(this.currentLine.trim());
				this.currentLine = '';
				this.cursorPosition = CURRENT_LINE_START;
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

	private executeCommand(command: string) {
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

		registeredCommand.action({ terminal: this._TERMINAL, args });
	}
}

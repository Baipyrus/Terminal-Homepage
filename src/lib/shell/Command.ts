import type { Terminal } from '@battlefieldduck/xterm-svelte';

export const COMMAND_MIN_LENGTH = 0;
export const COMMAND_MAX_LENGTH = 7;

export type ShellCommandProps = { terminal: Terminal; args: string[] };
export type ShellCommandAction = (props: ShellCommandProps) => Promise<void> | void;

export interface ShellCommand {
	name: string;
	description: string;
	action: ShellCommandAction;
}

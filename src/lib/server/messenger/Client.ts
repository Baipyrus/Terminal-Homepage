import type { User } from 'better-auth';
import type { SlimMessage } from '.';

// Representation of a single client connected via `ReadableStream`
export type Client = {
	user: User;
	channel: string;
	send: (data: SlimMessage) => void;
};

import type { User } from 'better-auth';
import type { Message } from '.';

// Representation of a single client connected via `ReadableStream`
export type Client = {
	user: User;
	send: (data: Message) => void;
};

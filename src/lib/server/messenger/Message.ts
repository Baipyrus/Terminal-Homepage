import type { User } from 'better-auth';

// Representation of a message sent by a specific user
export type Message = {
	user: User;
	content: string;
};
};

import type { User } from 'better-auth';

// Representation of a message sent by a specific user
export class Message {
	user: User;
	content: string;

	constructor(user: User, content: string) {
		this.user = user;
		this.content = content;
	}

	toSlim(): SlimMessage {
		return { username: this.user.name, content: this.content };
	}
}

// Representation of a message with only basic user information
export type SlimMessage = {
	username: string;
	content: string;
};

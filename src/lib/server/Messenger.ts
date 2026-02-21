// Representation of a single client connected via `ReadableStream`
export type Client = {
	id: string;
	send: (data: Message) => void;
};

export type Message = {
	user: string;
	content: string;
};

const EMPTY = 0;

// Hub for client management and messaging system categorized by channels
class Messenger {
	private channels: Map<string, Set<Client>> = new Map();

	add(channel: string, client: Client) {
		// If channel does not exist, create it
		if (!this.channels.has(channel)) this.channels.set(channel, new Set());

		// Add user to channel
		this.channels.get(channel)!.add(client);
	}

	remove(channel: string, client: Client) {
		// Try getting clients from channel
		const clients = this.channels.get(channel);

		// Ignore if channel does not exist
		if (!clients) return;

		// Remove client from list
		clients.delete(client);

		// Delete channel if empty
		if (clients.size === EMPTY) this.channels.delete(channel);
	}

	send(channel: string, message: Message) {
		// Try getting clients from channel
		const clients = this.channels.get(channel);

		// Ignore if channel does not exist
		if (!clients) return;

		// Try sending message to all clients in channel
		for (const client of clients)
			try {
				client.send(message);
				/* eslint-disable-next-line no-empty */
			} catch {}
	}
}

// Single server-wide instance of the messenger hub
export const messenger = new Messenger();
